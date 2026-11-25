import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { startSession, createPendingSession, verifyPendingEmail, getKnownDevice } from '@/lib/auth';
import { hashPassword } from '@/lib/hash';
import { codeMatches, confirmAccount } from '@/lib/email-verification';
import { consumeAttempt, resetRateLimit, resetAccountAttempts } from '@/lib/rate-limit';
import { checkIpBlocked, blockIpAndAlert } from '@/lib/security';
import { safeLogError } from '@/lib/safe-log';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, isJsonRequest, logSecurityAttempt } from '@/lib/request-security';

const MAX_GUESSES_PER_CODE = 5;

const fail = (error, status) => NextResponse.json({ error }, { status });

export async function POST(request) {
    try {
        if (!isJsonRequest(request.headers)) return fail('Content-Type deve ser application/json.', 415);

        const ip = getClientIpFromHeaders(request.headers);
        const userAgent = getClientUserAgentFromHeaders(request.headers);

        if (await checkIpBlocked(ip)) {
            return fail('Acesso negado. Seu IP foi bloqueado por motivos de segurança.', 403);
        }

        if (!(await consumeAttempt(ip))) {
            logSecurityAttempt('rate-limit-email-code', { ip, userAgent, route: '/api/auth/verify-email', reason: 'Too many email code attempts', severity: 'critical' });
            await blockIpAndAlert(ip, 'Força bruta no código de e-mail', 'verify-email', { userAgent });
            return fail('Muitas tentativas. Seu acesso foi bloqueado.', 403);
        }

        const { token, password } = await request.json();
        const pending = await verifyPendingEmail();

        if (!pending) return fail('Sessão expirada. Comece novamente.', 401);

        const isReset = pending.via === 'reset';
        // Antes de gastar uma tentativa do código: senha fraca não deve consumir o limite.
        if (isReset && (typeof password !== 'string' || password.length < 8 || password.length > 100)) {
            return fail('A senha deve ter entre 8 e 100 caracteres.', 400);
        }

        if (!(await consumeAttempt(`code:${pending.codeMac}`, MAX_GUESSES_PER_CODE))) {
            return fail('Muitas tentativas para este código. Comece novamente para receber outro.', 429);
        }

        if (!codeMatches(pending, String(token ?? ''))) return fail('Código incorreto.', 401);

        const user = await confirmAccount(isReset ? { ...pending, passwordHash: await hashPassword(password) } : pending);
        (await cookies()).delete('pending_email');

        if (!user) return fail('Não foi possível confirmar. Entre com sua conta.', 409);

        await resetRateLimit(ip);
        if (isReset) await resetAccountAttempts(user.email, ip, await getKnownDevice(user.email));

        // No login com senha o 2FA já foi conferido; nos outros caminhos ele vem agora.
        if (pending.via !== 'password' && user.twoFactorEnabled) {
            await createPendingSession({ userId: user.id, email: user.email, role: user.role, name: user.name, stage: '2fa_pending' });
            return NextResponse.json({ redirectUrl: '/login?action=2fa' });
        }

        await startSession(user);
        return NextResponse.json({ redirectUrl: user.role === 'ADMIN' ? '/admin' : '/' });
    } catch (error) {
        safeLogError('Verify email error', error);
        return fail('Erro interno.', 500);
    }
}
