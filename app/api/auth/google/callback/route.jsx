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

    // Clear state cookie
    cookieStore.delete('oauth_state');

    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

        // Exchange code for tokens
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

        // Get User Info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userResponse.json();

        if (!userResponse.ok) {
            return NextResponse.redirect(new URL('/login?error=user_info_error', request.url));
        }

        // Database Logic
        // Check if user exists
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

        // 1. If user doesn't exist, create one
        if (!user) {
            // Transaction to create User and Client
            const result = await prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        name: googleUser.name,
                        email: googleUser.email,
                        password: '', // OAuth users have no password initially
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

                // Create Client entry if it doesn't exist
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

        // 2. Create Session or Pending Session
        if (user.twoFactorEnabled) {
            // User has 2FA enabled, so we DON'T create a full session yet.
            // Instead, we create a short-lived "pending" session.
            
            // We need to import createPendingSession at the top, but since we can't easily add imports with clean edits sometimes,
            // let's assume I'll add the import in a separate block or updated the import line.
            // Wait, I should have updated the imports first. Let me do that carefully.
            
            // Actually, I can use the existing import line update strategy. 
            // For this block, I will use the new createPendingSession.
            
            await createPendingSession({
                userId: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                stage: '2fa_pending'
            });

            return NextResponse.redirect(new URL('/login?action=2fa', request.url));
        }

        // Standard Login (No 2FA)
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
