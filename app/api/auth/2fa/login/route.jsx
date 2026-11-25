import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPendingSession, startSession } from '@/lib/auth';
import { verifyToken } from '@/lib/otp';
import { decrypt } from '@/lib/encryption';
import { consumeAttempt, resetRateLimit, consumeTotpCode } from '@/lib/rate-limit';
import { checkIpBlocked, blockIpAndAlert } from '@/lib/security';
import { cookies } from 'next/headers';
import { safeLogError } from '@/lib/safe-log';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, isJsonRequest, logSecurityAttempt } from '@/lib/request-security';

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
            logSecurityAttempt('blocked-ip-2fa', { ip, userAgent, route: '/api/auth/2fa/login', reason: 'IP already blocked', severity: 'critical' });
            return NextResponse.json(
                { error: 'Acesso negado. Seu IP foi bloqueado por motivos de segurança.', isHackerAttempt: true },
                { status: 403 }
            );
        }

        if (!(await consumeAttempt(ip))) {
            logSecurityAttempt('rate-limit-2fa', { ip, userAgent, route: '/api/auth/2fa/login', reason: 'Too many invalid 2FA attempts', severity: 'critical' });
            await blockIpAndAlert(ip, 'Fouça bruta detectada no 2FA', '2fa-login', { userAgent });
            return NextResponse.json(
                { error: 'Muitas tentativas falhas. Acesso bloqueado.', isHackerAttempt: true },
                { status: 403 }
            );
        }

        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Código 2FA obrigatório.' }, { status: 400 });
        }

        const pendingPayload = await verifyPendingSession();

        if (!pendingPayload || pendingPayload.stage !== '2fa_pending') {
            return NextResponse.json({ error: 'Sessão inválida ou expirada. Faça login novamente.' }, { status: 401 });
        }

        // Mesmo contador do 2FA no login com senha. Só chega aqui quem já passou o 1º fator.
        const codeKey = `2fa:${pendingPayload.userId}`;
        if (!(await consumeAttempt(codeKey, 20))) {
            return NextResponse.json({ error: 'Muitas tentativas para esta conta. Tente novamente em 1 hora.' }, { status: 429 });
        }

        const user = await prisma.user.findUnique({
            where: { id: pendingPayload.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                twoFactorEnabled: true,
                twoFactorSecret: true,
                sessionVersion: true,
            }
        });

        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return NextResponse.json({ error: 'Erro de configuração de segurança.' }, { status: 400 });
        }

        let secret;
        try {
            secret = decrypt(user.twoFactorSecret);
        } catch (decErr) {
            throw decErr;
        }

        let isValidResult;
        try {
            isValidResult = await verifyToken({ token, secret, window: 1 });
        } catch (verErr) {
            throw verErr;
        }

        if (!isValidResult?.valid || !(await consumeTotpCode(user.id, token))) {
            return NextResponse.json({ error: 'Código 2FA incorreto.' }, { status: 401 });
        }

        await resetRateLimit(ip);
        await resetRateLimit(codeKey);
        await startSession(user);

        const cookieStore = await cookies();
        cookieStore.delete('pending_2fa');

        return NextResponse.json({
            success: true,
            redirectUrl: user.role === 'ADMIN' ? '/admin' : '/'
        });

    } catch (error) {
        safeLogError('2FA Login Error', error);
        return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
    }
}
