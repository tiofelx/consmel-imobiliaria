import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/otp';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';
import { safeLogError } from '@/lib/safe-log';

// POST /api/auth/2fa/verify
// Verifies the token and enables 2FA for the user
export async function POST(request) {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ 
            where: { id: session.userId },
            select: { id: true, twoFactorSecret: true } 
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (!user.twoFactorSecret) {
            return NextResponse.json({ error: '2FA setup not initiated' }, { status: 400 });
        }

        // Decrypt secret
        const secret = decrypt(user.twoFactorSecret);

        // Verify token with a secure window of 2 periods (1 min) 
        // to handle slight PC-to-Phone time synchronization drifts
        const { valid } = await verifyToken({ token, secret, window: 2 });

        if (!valid) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        // Enable 2FA
        await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorEnabled: true },
        });

        return NextResponse.json({ success: true, message: '2FA enabled successfully' });

    } catch (error) {
        safeLogError('2FA Verify Error', error);
        return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 });
    }
}
