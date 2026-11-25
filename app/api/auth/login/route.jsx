import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/hash';
import { randomUUID } from 'crypto';
import { consumeAttempt, resetRateLimit } from '@/lib/rate-limit';
import { startEmailVerification } from '@/lib/email-verification';
import { checkIpBlocked, blockIpAndAlert } from '@/lib/security';
import { verifyToken } from '@/lib/otp';
import { decrypt } from '@/lib/encryption';
import { safeLogError } from '@/lib/safe-log';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, isJsonRequest, logSecurityAttempt } from '@/lib/request-security';

// Hash de valor aleatório só para igualar o tempo de resposta quando o usuário não existe.
let dummyHashPromise;
const getDummyHash = () => (dummyHashPromise ??= hashPassword(randomUUID()));

// Limite por conta, além do limite por IP: segura força bruta distribuída.
const ACCOUNT_MAX_ATTEMPTS = 20;

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
            logSecurityAttempt('blocked-ip-login', { ip, userAgent, route: '/api/auth/login', reason: 'IP already blocked', severity: 'critical' });
            return NextResponse.json(
                { error: 'Acesso negado. Seu IP foi bloqueado por motivos de segurança.', isHackerAttempt: true },
                { status: 403 }
            );
        }

        if (!(await consumeAttempt(ip))) {
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
            return NextResponse.json(
                { error: 'Formato de e-mail inválido.' },
                { status: 400 }
            );
        }

        const accountKey = `acct:${email.toLowerCase()}`;
        if (!(await consumeAttempt(accountKey, ACCOUNT_MAX_ATTEMPTS))) {
            logSecurityAttempt('rate-limit-account', { ip, userAgent, route: '/api/auth/login', reason: 'Too many attempts for one account', severity: 'high' });
            return NextResponse.json(
                { error: 'Muitas tentativas para esta conta. Tente novamente em 1 hora.' },
                { status: 429 }
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
                emailVerified: true,
            }
        });

        if (!user) {
            await verifyPassword(password, await getDummyHash());
            return NextResponse.json(
                { error: 'Credenciais inválidas.' },
                { status: 401 }
            );
        }

        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
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
                return NextResponse.json(
                    { error: 'Código 2FA inválido.' },
                    { status: 401 }
                );
            }
        }

        await resetRateLimit(ip);
        await resetRateLimit(accountKey);

        if (!user.emailVerified) {
            const { error, status } = await startEmailVerification({ email: user.email, via: 'password' });
            if (error) return NextResponse.json({ error }, { status });
            return NextResponse.json({ requireEmailVerification: true });
        }

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
