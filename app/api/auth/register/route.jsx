import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startEmailVerification } from '@/lib/email-verification';
import { hashPassword } from '@/lib/hash';
import { consumeAttempt } from '@/lib/rate-limit';
import { checkIpBlocked, blockIpAndAlert } from '@/lib/security';
import xss from 'xss';
import { z } from 'zod';
import { safeLogError, sanitizeForLog } from '@/lib/safe-log';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, isJsonRequest, logSecurityAttempt } from '@/lib/request-security';

const registerSchema = z.object({
    name: z.string().trim().min(3, "Nome completo é obrigatório").max(100)
        .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, "O nome contém caracteres inválidos"),
    email: z.string().trim().email("E-mail inválido").max(150),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(100),
    phone: z.string().trim().max(20).optional().nullable()
});

export async function POST(request) {
    try {
        const requestHeaders = request.headers;
        // Antes de contar tentativa ou bloquear: senão outro site faz isso pelo navegador da vítima.
        if (!isJsonRequest(requestHeaders)) {
            return NextResponse.json({ error: 'Content-Type deve ser application/json.' }, { status: 415 });
        }
        const ip = getClientIpFromHeaders(requestHeaders);
        const userAgent = getClientUserAgentFromHeaders(requestHeaders);

        const isBlocked = await checkIpBlocked(ip);
        if (isBlocked) {
            logSecurityAttempt('blocked-ip-register', { ip, userAgent, route: '/api/auth/register', reason: 'IP already blocked', severity: 'critical' });
            return NextResponse.json(
                { error: 'Acesso negado. Seu IP foi bloqueado por motivos de segurança.', isHackerAttempt: true },
                { status: 403 }
            );
        }

        if (!(await consumeAttempt(ip))) {
            logSecurityAttempt('rate-limit-register', { ip, userAgent, route: '/api/auth/register', reason: 'Too many registration attempts', severity: 'critical' });
            await blockIpAndAlert(ip, 'Múltiplas tentativas abusivas de acesso', 'register', { userAgent });
            return NextResponse.json(
                { error: 'Muitas tentativas. Seu acesso foi bloqueado.', isHackerAttempt: true },
                { status: 429 }
            );
        }

        const data = await request.json();

        const parsedData = registerSchema.safeParse(data);
        if (!parsedData.success) {
            const zodErrors = parsedData.error?.errors || parsedData.error?.issues || [];
            console.warn('Tentativa de injeção ou dados inválidos de IP: %s', ip, sanitizeForLog(zodErrors));

            return NextResponse.json({
                error: 'Dados de cadastro inválidos',
                details: zodErrors
            }, { status: 400 });
        }

        const validData = parsedData.data;
        const email = xss(validData.email);
        const name = xss(validData.name);
        const password = validData.password;
        const phone = validData.phone ? xss(validData.phone) : null;

        const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 'icloud.com', 'live.com'];
        const emailDomain = email.split('@')[1]?.toLowerCase();

        if (!emailDomain || !allowedDomains.includes(emailDomain)) {
            logSecurityAttempt('invalid-email-domain-register', { ip, userAgent, route: '/api/auth/register', reason: 'Disallowed email provider', severity: 'high' });
            return NextResponse.json(
                { error: 'Por favor, utilize um e-mail de um provedor válido (ex: Gmail, Outlook, Yahoo).' },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { emailVerified: true },
        });

        // Gera o hash nos dois casos para o tempo de resposta não revelar contas.
        const passwordHash = await hashPassword(password);

        // A conta só é criada (ou alterada) depois que o código for confirmado.
        const { error, status } = await startEmailVerification(
            { email, via: 'register', name, phone, passwordHash },
            { accountExists: Boolean(existingUser?.emailVerified) }
        );
        if (error) return NextResponse.json({ error }, { status });

        return NextResponse.json({ requireEmailVerification: true });
    } catch (error) {
        safeLogError('Error registering user in API', error);
        return NextResponse.json({ error: 'Erro ao realizar cadastro' }, { status: 500 });
    }
}

