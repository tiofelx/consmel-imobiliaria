import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';
import { safeLogError } from '@/lib/safe-log';

import { authenticator, generateURI } from '@/lib/otp';

// GET /api/auth/2fa/generate
// 1. Generate Secret
// 2. Generate OTP Auth URL
// 3. Generate QR Code Data URL
// 4. Store Encrypted Secret in DB (but don't enable yet)
export async function GET(request) {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ 
            where: { id: session.userId },
            select: { id: true, email: true } 
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Generate Secret
        const secret = authenticator.generateSecret();
        const otpauth = generateURI({
            issuer: 'Consmel',
            label: user.email,
            secret,
        });

        // Generate QR
        const qrCodeUrl = await QRCode.toDataURL(otpauth);

        // Save secret (Encrypted) to DB
        // keeping twoFactorEnabled = false until they verify
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorSecret: encrypt(secret),
            },
        });

        const includeSecret = request.nextUrl.searchParams.get('manualEntry') === 'true';

        const responseBody = {
            qrCodeUrl,
            manualEntry: includeSecret,
        };

        if (includeSecret) {
            responseBody.secret = secret;
        }

        return NextResponse.json(responseBody, {
            headers: {
                'Cache-Control': 'no-store',
            },
        });

    } catch (error) {
        safeLogError('2FA Generate Error', error);
        return NextResponse.json({ error: 'Failed to generate 2FA' }, { status: 500 });
    }
}
