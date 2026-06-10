import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { verifyPassword } from '@/lib/hash';
import { checkRateLimit, incrementRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { checkIpBlocked, blockIpAndAlert } from '@/lib/security';
import { verifyToken } from '@/lib/otp';
import { decrypt } from '@/lib/encryption';
import { safeLogError } from '@/lib/safe-log';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

export async function POST(request) {
    try {
        const requestHeaders = request.headers;
        const ip = getClientIpFromHeaders(requestHeaders);
        const userAgent = getClientUserAgentFromHeaders(requestHeaders);

        const isBlocked = await checkIpBlocked(ip);
        if (isBlocked) {
            logSecurityAttempt('blocked-ip-login', { ip, userAgent, route: '/api/auth/login', reason: 'IP already blocked', severity: 'critical' });
            return NextResponse.json(
                { error: 'Acesso negado. Seu IP foi bloqueado por motivos de segurança.', isHackerAttempt: true },
                { status: 403 }
            );
        }

        if (!(await checkRateLimit(ip))) {
            logSecurityAttempt('rate-limit-login', { ip, userAgent, route: '/api/auth/login', reason: 'Too many failed login attempts', severity: 'critical' });
            await blockIpAndAlert(ip, 'Múltiplas tentativas de login falhas (Possível ataque de força bruta)', 'login', { userAgent });
            return NextResponse.json(
                { error: 'Muitas tentativas de login. Seu acesso foi bloqueado.', isHackerAttempt: true },
                { status: 403 }
            );
        }

        const { email, password, token } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email e senha são obrigatórios.' },
                { status: 400 }
            );
        }

        const sqliPattern = /(\b(OR|AND|UNION|SELECT|DROP)\b)|([';*])/i;
        if (typeof email !== 'string' || sqliPattern.test(email)) {
            logSecurityAttempt('sqli-login-payload', { ip, userAgent, route: '/api/auth/login', reason: 'Detected SQLi/NoSQL payload in email field', severity: 'high' });
            await incrementRateLimit(ip);
            return NextResponse.json(
                { error: 'Formato de e-mail inválido.' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                name: true,
                role: true,
                twoFactorEnabled: true,
                twoFactorSecret: true,
            }
        });

        if (!user) {
            await verifyPassword(password, '$2b$12$tOaocb5.XUNqtmhNYnSSduy18O7AIR8RpytvlpnoAv7YtLvraZ0Gu');
            await incrementRateLimit(ip);
            return NextResponse.json(
                { error: 'Credenciais inválidas.' },
                { status: 401 }
            );
        }

        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
            await incrementRateLimit(ip);
            return NextResponse.json(
                { error: 'Credenciais inválidas.' },
                { status: 401 }
            );
        }

        if (user.twoFactorEnabled) {
            if (!token) {
                return NextResponse.json(
                    { require2fa: true, message: 'Digite o código de verificação 2FA.' },
                    { status: 200 }
                );
            }

            const secret = decrypt(user.twoFactorSecret);
            const { valid } = await verifyToken({ token, secret, window: 1 });

            if (!valid) {
                await incrementRateLimit(ip);
                return NextResponse.json(
                    { error: 'Código 2FA inválido.' },
                    { status: 401 }
                );
            }
        }

        await resetRateLimit(ip);

        await createSession({
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        });

        return NextResponse.json(
            { message: 'Login realizado com sucesso!', user: { name: user.name, email: user.email, role: user.role } },
            { status: 200 }
        );

    } catch (error) {
        safeLogError('Login error', error);
        return NextResponse.json(
            { error: 'Erro interno ao realizar login.' },
            { status: 500 }
        );
    }
}
