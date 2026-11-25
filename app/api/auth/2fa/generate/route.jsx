import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';
import { safeLogError } from '@/lib/safe-log';
import { authenticator, generateURI } from '@/lib/otp';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

async function buildEnrollmentResponse(user, includeSecret) {
    const secret = authenticator.generateSecret();
    const otpauth = generateURI({
        issuer: 'Consmel',
        label: user.email,
        secret,
    });

    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: encrypt(secret) },
    });

    const responseBody = { qrCodeUrl, manualEntry: includeSecret };
    if (includeSecret) responseBody.secret = secret;

    return NextResponse.json(responseBody, {
        headers: { 'Cache-Control': 'no-store' },
    });
}

export async function GET(request) {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true, email: true, twoFactorEnabled: true },
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (user.twoFactorEnabled) {
            logSecurityAttempt('2fa-regenerate-without-token', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/auth/2fa/generate',
                reason: 'GET attempted on already-enrolled account',
                severity: 'high',
            });
            return NextResponse.json(
                { error: '2FA já está ativo.' },
                { status: 409 }
            );
        }

        const includeSecret = request.nextUrl.searchParams.get('manualEntry') === 'true';
        return await buildEnrollmentResponse(user, includeSecret);

    } catch (error) {
        safeLogError('2FA Generate Error', error);
        return NextResponse.json({ error: 'Failed to generate 2FA' }, { status: 500 });
    }
}
