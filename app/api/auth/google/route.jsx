import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
    const state = crypto.randomBytes(16).toString('hex');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    if (!clientId) {
        return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 });
    }

    const scope = 'openid email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

    const response = NextResponse.redirect(authUrl);

    // Store state in cookie to verify later (CSRF protection)
    response.cookies.set('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
        sameSite: 'lax',
    });

    return response;
}
