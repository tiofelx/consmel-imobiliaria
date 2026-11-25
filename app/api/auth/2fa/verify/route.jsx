import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/otp';
import prisma from '@/lib/prisma';
import { verifySession, startSession } from '@/lib/auth';
import { verifyPassword } from '@/lib/hash';
import { consumeAttempt, resetRateLimit } from '@/lib/rate-limit';
import { isJsonRequest } from '@/lib/request-security';
import { decrypt } from '@/lib/encryption';
import { safeLogError } from '@/lib/safe-log';

export async function POST(request) {
    try {
        if (!isJsonRequest(request.headers)) {
            return NextResponse.json({ error: 'Content-Type deve ser application/json.' }, { status: 415 });
        }

        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { token, password } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ 
            where: { id: session.userId },
            select: { id: true, password: true, twoFactorSecret: true, twoFactorEnabled: true }
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Esta rota só ativa o 2FA; depois disso viraria teste de código sem limite.
        if (user.twoFactorEnabled) {
            return NextResponse.json({ error: '2FA já está ativo.' }, { status: 409 });
        }

        if (!user.twoFactorSecret) {
            return NextResponse.json({ error: '2FA setup not initiated' }, { status: 400 });
        }

        // Sessão roubada sozinha não basta para trancar o dono com um 2FA alheio.
        // Conta criada só com Google não tem senha.
        const passwordKey = `2fa-enable:${user.id}`;
        if (user.password) {
            if (!(await consumeAttempt(passwordKey, 10))) {
                return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 });
            }
            if (typeof password !== 'string' || !(await verifyPassword(password, user.password))) {
                return NextResponse.json({ error: 'Senha incorreta.' }, { status: 400 });
            }
        }

        const secret = decrypt(user.twoFactorSecret);

        const { valid } = await verifyToken({ token, secret, window: 1 });

        if (!valid) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorEnabled: true, sessionVersion: { increment: 1 } },
            select: { id: true, email: true, role: true, name: true, sessionVersion: true },
        });
        await resetRateLimit(passwordKey);
        // As outras sessões caem; esta é reemitida com a versão nova.
        await startSession(updated);

        return NextResponse.json({ success: true, message: '2FA enabled successfully' });

    } catch (error) {
        safeLogError('2FA Verify Error', error);
        return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 });
    }
}
