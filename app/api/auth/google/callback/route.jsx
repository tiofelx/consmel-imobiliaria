import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startSession, createPendingSession } from '@/lib/auth';
import { startEmailVerification } from '@/lib/email-verification';
import { cookies } from 'next/headers';
import { safeLogError, sanitizeForLog } from '@/lib/safe-log';

export async function GET(request) {
    // Atrás de proxy próprio, request.url aponta para localhost: usa o endereço público.
    const base = process.env.NEXT_PUBLIC_BASE_URL || request.url;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/login?error=oauth_error', base));
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL('/login?error=missing_params', base));
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;

    if (!storedState || state !== storedState) {
        return NextResponse.redirect(new URL('/login?error=invalid_state', base));
    }

    cookieStore.delete('oauth_state');

    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Google Token Error', sanitizeForLog(tokens));
            return NextResponse.redirect(new URL('/login?error=token_error', base));
        }

        const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userResponse.json();

        if (!userResponse.ok) {
            return NextResponse.redirect(new URL('/login?error=user_info_error', base));
        }

        if (googleUser.email_verified !== true || !googleUser.email) {
            return NextResponse.redirect(new URL('/login?error=email_unverified', base));
        }

        let user = await prisma.user.findUnique({
            where: { email: googleUser.email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                twoFactorEnabled: true,
                emailVerified: true,
                sessionVersion: true,
            }
        });

        // Conta nova ou nunca verificada: confirma o e-mail antes de qualquer sessão.
        if (!user?.emailVerified) {
            const { error, status } = await startEmailVerification({
                email: googleUser.email,
                via: 'google',
                name: googleUser.name || googleUser.email.split('@')[0],
            });
            const target = error
                ? `/login?error=${status === 429 ? 'email_limit' : 'email_send_error'}`
                : '/login?action=verify';
            return NextResponse.redirect(new URL(target, base));
        }

        if (user.twoFactorEnabled) {
            
            
            
            await createPendingSession({
                userId: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                stage: '2fa_pending'
            });

            return NextResponse.redirect(new URL('/login?action=2fa', base));
        }

        await startSession(user);

        if (user.role === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin', base));
        } else {
            return NextResponse.redirect(new URL('/', base));
        }

    } catch (error) {
        safeLogError('OAuth Callback Error', error);
        return NextResponse.redirect(new URL('/login?error=server_error', base));
    }
}
