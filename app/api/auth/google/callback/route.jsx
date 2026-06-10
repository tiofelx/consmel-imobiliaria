import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSession, createPendingSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { safeLogError, sanitizeForLog } from '@/lib/safe-log';

export async function GET(request) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL('/login?error=missing_params', request.url));
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;

    if (!storedState || state !== storedState) {
        return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
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
            return NextResponse.redirect(new URL('/login?error=token_error', request.url));
        }

        const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userResponse.json();

        if (!userResponse.ok) {
            return NextResponse.redirect(new URL('/login?error=user_info_error', request.url));
        }

        if (googleUser.email_verified !== true || !googleUser.email) {
            return NextResponse.redirect(new URL('/login?error=email_unverified', request.url));
        }

        let user = await prisma.user.findUnique({
            where: { email: googleUser.email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                twoFactorEnabled: true,
            }
        });

        if (!user) {
            const result = await prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        name: googleUser.name,
                        email: googleUser.email,
                        password: '',
                        role: 'CLIENT',
                    },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        twoFactorEnabled: true,
                    }
                });

                const existingClient = await tx.client.findFirst({
                    where: { email: googleUser.email }
                });

                if (!existingClient) {
                    await tx.client.create({
                        data: {
                            name: googleUser.name,
                            email: googleUser.email,
                            interest: 'Compra',
                            status: 'Novo',
                        },
                    });
                }
                return newUser;
            });
            user = result;
        }

        if (user.twoFactorEnabled) {
            
            
            
            await createPendingSession({
                userId: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                stage: '2fa_pending'
            });

            return NextResponse.redirect(new URL('/login?action=2fa', request.url));
        }

        await createSession({
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        });

        if (user.role === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin', request.url));
        } else {
            return NextResponse.redirect(new URL('/', request.url));
        }

    } catch (error) {
        safeLogError('OAuth Callback Error', error);
        return NextResponse.redirect(new URL('/login?error=server_error', request.url));
    }
}
