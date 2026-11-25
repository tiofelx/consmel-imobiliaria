import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logout, verifySession } from '@/lib/auth';
import { safeLogError } from '@/lib/safe-log';

export async function POST() {
    // Sair invalida o token mesmo fora deste navegador: encerra a conta em todos os aparelhos.
    try {
        const session = await verifySession();
        if (session) {
            await prisma.user.update({ where: { id: session.userId }, data: { sessionVersion: { increment: 1 } } });
        }
    } catch (error) {
        safeLogError('Logout error', error);
    }
    await logout();
    return NextResponse.json({ message: 'Logged out successfully' });
}
