import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPendingSession, createSession } from '@/lib/auth';
import { verifyToken } from '@/lib/otp';
import { decrypt } from '@/lib/encryption';
import { checkRateLimit, incrementRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { checkIpBlocked, blockIpAndAlert } from '@/lib/security';
import { cookies } from 'next/headers';
import { safeLogError } from '@/lib/safe-log';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

export async function POST(request) {
    try {
        const requestHeaders = request.headers;
        const ip = getClientIpFromHeaders(requestHeaders);
        const userAgent = getClientUserAgentFromHeaders(requestHeaders);

        // 1. Permanent DB Block Check
        const isBlocked = await checkIpBlocked(ip);
        if (isBlocked) {
            logSecurityAttempt('blocked-ip-2fa', { ip, userAgent, route: '/api/auth/2fa/login', reason: 'IP already blocked', severity: 'critical' });
            return NextResponse.json(
                { error: 'Acesso negado. Seu IP foi bloqueado por motivos de segurança.', isHackerAttempt: true },
                { status: 403 }
            );
        }

        // 2. Validate Rate Limit against 2FA brute force attacks
        if (!checkRateLimit(ip)) {
            logSecurityAttempt('rate-limit-2fa', { ip, userAgent, route: '/api/auth/2fa/login', reason: 'Too many invalid 2FA attempts', severity: 'critical' });
            await blockIpAndAlert(ip, 'Fouça bruta detectada no 2FA', '2fa-login', { userAgent });
            return NextResponse.json(
                { error: 'Muitas tentativas falhas. Acesso bloqueado.', isHackerAttempt: true },
                { status: 403 }
            );
        }

        const { token } = await request.json();

        if (!token) {
            // Always increment when invalid data reaches us
            incrementRateLimit(ip);
            return NextResponse.json({ error: 'Código 2FA obrigatório.' }, { status: 400 });
        }

        // 1. Verify "Pending" Session
        const pendingPayload = await verifyPendingSession();

        if (!pendingPayload || pendingPayload.stage !== '2fa_pending') {
            return NextResponse.json({ error: 'Sessão inválida ou expirada. Faça login novamente.' }, { status: 401 });
        }

        // 2. Get User Secret
        const user = await prisma.user.findUnique({
            where: { id: pendingPayload.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                twoFactorEnabled: true,
                twoFactorSecret: true,
            }
        });

        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return NextResponse.json({ error: 'Erro de configuração de segurança.' }, { status: 400 });
        }

        // 3. Verify TOTP

        let secret;
        try {
            secret = decrypt(user.twoFactorSecret);
        } catch (decErr) {
            throw decErr;
        }

        let isValidResult;
        try {
            // Mitigate drift but limit strictly to 3 windows (1.5 mins) instead of 10 to prevent large attack surfaces
            isValidResult = await verifyToken({ token, secret, window: 3 });
        } catch (verErr) {
            throw verErr;
        }

        if (!isValidResult?.valid) {
            incrementRateLimit(ip);
            return NextResponse.json({ error: 'Código 2FA incorreto.' }, { status: 401 });
        }

        // 4. Upgrade to Full Session
        resetRateLimit(ip);
        await createSession({
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        });

        // 5. Delete Pending Cookie
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
