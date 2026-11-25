import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession, createPendingSession, verifyPendingEmail } from '@/lib/auth';
import { codeMatches, confirmAccount } from '@/lib/email-verification';
import { consumeAttempt, resetRateLimit } from '@/lib/rate-limit';
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

        const { token } = await request.json();
        const pending = await verifyPendingEmail();

        if (!pending) return fail('Sessão expirada. Comece novamente.', 401);

        if (!(await consumeAttempt(`code:${pending.codeMac}`, MAX_GUESSES_PER_CODE))) {
            return fail('Muitas tentativas para este código. Comece novamente para receber outro.', 429);
        }

        if (!codeMatches(pending, String(token ?? ''))) return fail('Código incorreto.', 401);

        const user = await confirmAccount(pending);
        (await cookies()).delete('pending_email');

        if (!user) return fail('Não foi possível confirmar. Entre com sua conta.', 409);

        await resetRateLimit(ip);

        const session = { userId: user.id, email: user.email, role: user.role, name: user.name };

        // No login com senha o 2FA já foi conferido; nos outros caminhos ele vem agora.
        if (pending.via !== 'password' && user.twoFactorEnabled) {
            await createPendingSession({ ...session, stage: '2fa_pending' });
            return NextResponse.json({ redirectUrl: '/login?action=2fa' });
        }

        await createSession(session);
        return NextResponse.json({ redirectUrl: user.role === 'ADMIN' ? '/admin' : '/' });
    } catch (error) {
        safeLogError('Verify email error', error);
        return fail('Erro interno.', 500);
    }
}
