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

// POST /api/auth/login
export async function POST(request) {
    try {
        const requestHeaders = request.headers;
        const ip = getClientIpFromHeaders(requestHeaders);
        const userAgent = getClientUserAgentFromHeaders(requestHeaders);

        // 1. Permanent DB Block Check
        const isBlocked = await checkIpBlocked(ip);
        if (isBlocked) {
            logSecurityAttempt('blocked-ip-login', { ip, userAgent, route: '/api/auth/login', reason: 'IP already blocked', severity: 'critical' });
            return NextResponse.json(
                { error: 'Acesso negado. Seu IP foi bloqueado por motivos de segurança.', isHackerAttempt: true },
                { status: 403 }
            );
        }

        // 2. Fast-path Rate Limiting (LRU cache)
        if (!checkRateLimit(ip)) {
            // Upgrade temporary limit to permanent IP block on repeated abuse
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

        // 3. WAF: Detecção de SQL Injection / Injeção de Código
        // Verifica se o email tem características anômalas (aspas, OR, AND, hashes)
        const sqliPattern = /(\b(OR|AND|UNION|SELECT|DROP)\b)|([';*])/i;
        if (typeof email !== 'string' || sqliPattern.test(email)) {
            logSecurityAttempt('sqli-login-payload', { ip, userAgent, route: '/api/auth/login', reason: 'Detected SQLi/NoSQL payload in email field', severity: 'critical' });
            await blockIpAndAlert(ip, `Tentativa de SQL/NoSQL Injection no login. Payload: ${JSON.stringify(email)}`, 'login', { userAgent });
            return NextResponse.json(
                { error: 'Formato de e-mail inválido ou tentativa de injeção detectada.', isHackerAttempt: true },
                { status: 403 }
            );
        }

        // Find user
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
            // Perform dummy validation to mitigate timing attacks identifying existing emails
            await verifyPassword(password, '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGj14s4RzGpq98w1C');
            incrementRateLimit(ip);
            return NextResponse.json(
                { error: 'Credenciais inválidas.' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
            incrementRateLimit(ip);
            return NextResponse.json(
                { error: 'Credenciais inválidas.' },
                { status: 401 }
            );
        }

        // --- 2FA Logic ---
        if (user.twoFactorEnabled) {
            if (!token) {
                // 2FA required but not provided
                // Do NOT reset rate limit yet (keep counting if they fail 2fa repeatedly?)
                // Actually, password was correct, so maybe don't block IP?
                // But preventing brute force on 2FA is also good.
                // For now, return specific code.
                return NextResponse.json(
                    { require2fa: true, message: 'Digite o código de verificação 2FA.' },
                    { status: 200 } // using 200 to indicate "Phase 1 success, waiting for Phase 2" - Client handles this.
                );
            }

            // Verify Token
            const secret = decrypt(user.twoFactorSecret);
            const { valid } = await verifyToken({ token, secret, window: 2 });

            if (!valid) {
                incrementRateLimit(ip); // Treat 2FA failure as auth failure
                return NextResponse.json(
                    { error: 'Código 2FA inválido.' },
                    { status: 401 }
                );
            }
        }

        // Success
        resetRateLimit(ip);

        // Create session
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
