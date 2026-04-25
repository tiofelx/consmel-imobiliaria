import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/encryption';
import { safeLogError } from '@/lib/safe-log';
import { verifyToken, authenticator, generateURI } from '@/lib/otp';
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

// GET /api/auth/2fa/generate
// Apenas para enrollment INICIAL (quando 2FA ainda não está habilitado).
// Se 2FA já está ativo, recusa — usar POST com currentToken para regenerar.
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

        // Defesa contra bypass: se 2FA já está habilitado, qualquer regeneração
        // precisa provar posse do TOTP atual via POST. GET nunca pode sobrescrever
        // um secret ativo.
        if (user.twoFactorEnabled) {
            logSecurityAttempt('2fa-regenerate-without-token', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/auth/2fa/generate',
                reason: 'GET attempted on already-enrolled account',
                severity: 'high',
            });
            return NextResponse.json(
                { error: '2FA já está ativo. Para regenerar, use POST com o código atual.' },
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

// POST /api/auth/2fa/generate
// Regenera o secret 2FA exigindo o código TOTP atual.
// Body: { currentToken: string, manualEntry?: boolean }
export async function POST(request) {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const currentToken = body?.currentToken;
        const includeSecret = body?.manualEntry === true;

        if (!currentToken || typeof currentToken !== 'string') {
            return NextResponse.json(
                { error: 'currentToken é obrigatório para regenerar 2FA.' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true, email: true, twoFactorEnabled: true, twoFactorSecret: true },
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            return NextResponse.json(
                { error: '2FA não está ativo nesta conta. Use GET para configurar pela primeira vez.' },
                { status: 400 }
            );
        }

        const existingSecret = decrypt(user.twoFactorSecret);
        const { valid } = await verifyToken({ token: currentToken, secret: existingSecret, window: 1 });

        if (!valid) {
            logSecurityAttempt('2fa-regenerate-invalid-token', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/auth/2fa/generate',
                reason: 'Regeneration attempt with invalid current token',
                severity: 'high',
            });
            return NextResponse.json({ error: 'Código atual inválido.' }, { status: 401 });
        }

        return await buildEnrollmentResponse(user, includeSecret);

    } catch (error) {
        safeLogError('2FA Regenerate Error', error);
        return NextResponse.json({ error: 'Failed to regenerate 2FA' }, { status: 500 });
    }
}
