import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession, startSession } from '@/lib/auth';
import { verifyToken } from '@/lib/otp';
import { decrypt } from '@/lib/encryption';
import { consumeAttempt, resetRateLimit, consumeTotpCode } from '@/lib/rate-limit';
import { safeLogError } from '@/lib/safe-log';
import { isJsonRequest } from '@/lib/request-security';

const fail = (error, status) => NextResponse.json({ error }, { status });

// Desativar exige um código atual: sessão roubada sozinha não basta.
export async function POST(request) {
    try {
        if (!isJsonRequest(request.headers)) return fail('Content-Type deve ser application/json.', 415);

        const session = await verifySession();
        if (!session) return fail('Não autorizado', 401);

        const { token } = await request.json();
        if (!token) return fail('Informe o código de 6 dígitos.', 400);

        // Mesmo contador do 2FA no login.
        const codeKey = `2fa:${session.userId}`;
        if (!(await consumeAttempt(codeKey, 20))) return fail('Muitas tentativas. Tente novamente em 1 hora.', 429);

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true, twoFactorEnabled: true, twoFactorSecret: true },
        });
        if (!user?.twoFactorEnabled) return fail('2FA não está ativo.', 409);

        const { valid } = await verifyToken({ token, secret: decrypt(user.twoFactorSecret), window: 1 });
        if (!valid || !(await consumeTotpCode(user.id, token))) return fail('Código incorreto.', 400);

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorEnabled: false, twoFactorSecret: null, sessionVersion: { increment: 1 } },
            select: { id: true, email: true, role: true, name: true, sessionVersion: true },
        });
        await resetRateLimit(codeKey);
        // As outras sessões caem; esta é reemitida com a versão nova.
        await startSession(updated);

        return NextResponse.json({ success: true });
    } catch (error) {
        safeLogError('2FA Disable Error', error);
        return fail('Erro interno.', 500);
    }
}
