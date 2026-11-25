import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { startEmailVerification } from '@/lib/email-verification';
import { consumeAttempt } from '@/lib/rate-limit';
import { checkIpBlocked, blockIpAndAlert } from '@/lib/security';
import { safeLogError } from '@/lib/safe-log';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, isJsonRequest, logSecurityAttempt } from '@/lib/request-security';

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(150) });

const fail = (error, status) => NextResponse.json({ error }, { status });

// Pede a redefinição de senha: manda um código ao e-mail. A senha nova vai em /api/auth/verify-email.
export async function POST(request) {
    try {
        if (!isJsonRequest(request.headers)) return fail('Content-Type deve ser application/json.', 415);

        const ip = getClientIpFromHeaders(request.headers);
        const userAgent = getClientUserAgentFromHeaders(request.headers);

        if (await checkIpBlocked(ip)) {
            return fail('Acesso negado. Seu IP foi bloqueado por motivos de segurança.', 403);
        }

        if (!(await consumeAttempt(ip))) {
            logSecurityAttempt('rate-limit-password-reset', { ip, userAgent, route: '/api/auth/forgot-password', reason: 'Too many reset requests', severity: 'critical' });
            await blockIpAndAlert(ip, 'Abuso na redefinição de senha', 'forgot-password', { userAgent });
            return fail('Muitas tentativas. Seu acesso foi bloqueado.', 403);
        }

        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) return fail('Informe um e-mail válido.', 400);

        const { email } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

        // Mesma resposta com ou sem conta. Sem conta nada é enviado (senão a rota vira disparador de e-mail).
        const { error, status } = await startEmailVerification(
            { email, via: 'reset' },
            { ip, background: true, deliver: Boolean(user) }
        );
        if (error) return fail(error, status);

        return NextResponse.json({ requireEmailVerification: true });
    } catch (error) {
        safeLogError('Forgot password error', error);
        return fail('Erro interno.', 500);
    }
}
