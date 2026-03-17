import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { hashPassword } from '@/lib/hash';
import { checkRateLimit, incrementRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { checkIpBlocked, blockIpAndAlert } from '@/lib/security';
import xss from 'xss';
import { z } from 'zod';
import { safeLogError, sanitizeForLog } from '@/lib/safe-log';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

const registerSchema = z.object({
    name: z.string().trim().min(3, "Nome completo é obrigatório").max(100)
        .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, "O nome contém caracteres inválidos"),
    email: z.string().trim().email("E-mail inválido").max(150),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(100),
    phone: z.string().trim().max(20).optional().nullable()
});

// POST /api/auth/register — Register a new user
export async function POST(request) {
    try {
        const requestHeaders = request.headers;
        const ip = getClientIpFromHeaders(requestHeaders);
        const userAgent = getClientUserAgentFromHeaders(requestHeaders);

        // Increment rate limit immediately to protect against all spam (success or failure)
        incrementRateLimit(ip);

        // 1. Permanent DB Block Check
        const isBlocked = await checkIpBlocked(ip);
        if (isBlocked) {
            logSecurityAttempt('blocked-ip-register', { ip, userAgent, route: '/api/auth/register', reason: 'IP already blocked', severity: 'critical' });
            return NextResponse.json(
                { error: 'Acesso negado. Seu IP foi bloqueado por motivos de segurança.', isHackerAttempt: true },
                { status: 403 }
            );
        }

        // 2. Fast-path Rate Limiting check (prevent SPAM bots creating multiple accounts)
        // Check rateLimit logic uses increment inside logic, preventing > 30 requests an hour
        if (!checkRateLimit(ip)) {
            logSecurityAttempt('rate-limit-register', { ip, userAgent, route: '/api/auth/register', reason: 'Too many registration attempts', severity: 'critical' });
            await blockIpAndAlert(ip, 'Múltiplas tentativas abusivas de acesso', 'register', { userAgent });
            return NextResponse.json(
                { error: 'Muitas tentativas. Seu acesso foi bloqueado.', isHackerAttempt: true },
                { status: 429 }
            );
        }

        const data = await request.json();

        // 3. Strict Zod Validation (Defense in Depth)
        const parsedData = registerSchema.safeParse(data);
        if (!parsedData.success) {
            const zodErrors = parsedData.error?.errors || parsedData.error?.issues || [];
            console.warn(`Tentativa de injeção ou dados inválidos de IP: ${ip}`, sanitizeForLog(zodErrors));

            // If the name failed the strict regex, it might be an XSS/SQLi attempt. Log it.
            const hasInvalidName = zodErrors.some(e => e?.path?.includes('name') && e?.code === 'invalid_string' && e?.validation === 'regex');
            if (hasInvalidName) {
                logSecurityAttempt('xss-register-name', { ip, userAgent, route: '/api/auth/register', reason: 'Invalid name payload matched injection pattern', severity: 'critical' });
                await blockIpAndAlert(ip, `Tentativa XSS/Injeção bloqueada pelo Zod no nome: ${data?.name}`, 'register', { userAgent });
                return NextResponse.json(
                    { error: 'O nome contém caracteres inválidos. Apenas letras e espaços são permitidos.' },
                    { status: 400 }
                );
            }

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

        // Validate allowed email domains
        const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 'icloud.com', 'live.com'];
        const emailDomain = email.split('@')[1]?.toLowerCase();

        if (!emailDomain || !allowedDomains.includes(emailDomain)) {
            logSecurityAttempt('invalid-email-domain-register', { ip, userAgent, route: '/api/auth/register', reason: 'Disallowed email provider', severity: 'high' });
            await blockIpAndAlert(ip, `Tentativa de cadastro com e-mail inválido/falso: ${email}`, 'register', { userAgent });
            return NextResponse.json(
                { error: 'Por favor, utilize um e-mail de um provedor válido (ex: Gmail, Outlook, Yahoo).' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Este e-mail já está cadastrado.' },
                { status: 409 }
            );
        }

        const hashedPassword = await hashPassword(password);

        // Transaction to create User and Client (to keep CRM working)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User for Authentication
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'CLIENT',
                },
                select: { id: true, name: true, email: true, role: true },
            });

            // 2. Create Client for CRM/Admin Dashboard
            // Check if client exists to avoid unique constraint error if email is unique in Client (it's not unique in schema but Logic checked it? Schema says unique? No, schema didn't say Client email is unique, but code checked `findFirst`).
            // Let's check `Client` schema. `email String`. Not unique.
            // But good to check.
            const existingClient = await tx.client.findFirst({
                where: { email }
            });

            let client;
            if (!existingClient) {
                client = await tx.client.create({
                    data: {
                        name,
                        email,
                        phone,
                        interest: 'Compra',
                        status: 'Novo',
                    },
                });
            }

            return { user, client };
        });

        // Auto-login after register
        await createSession({
            userId: result.user.id,
            email: result.user.email,
            role: result.user.role,
            name: result.user.name
        });

        return NextResponse.json(
            { message: 'Cadastro realizado com sucesso!', user: { name: result.user.name, email: result.user.email } },
            { status: 201 }
        );
    } catch (error) {
        safeLogError('Error registering user in API', error);
        return NextResponse.json({ error: 'Erro ao realizar cadastro' }, { status: 500 });
    }
}

