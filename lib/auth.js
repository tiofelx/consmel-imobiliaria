import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getJwtKey } from '@/lib/jwt-key';

const key = getJwtKey();

export async function createSession(payload, duration = '24h', cookieName = 'session') {
    // Parse duration to milliseconds (approximate for simple strings like '24h', '1h')
    let expTime = 24 * 60 * 60 * 1000;
    if (duration === '1h') expTime = 60 * 60 * 1000;
    if (duration === '5m') expTime = 5 * 60 * 1000;

    const expires = new Date(Date.now() + expTime);

    const session = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(duration)
        .sign(key);

    const cookieStore = await cookies();
    cookieStore.set(cookieName, session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires,
        sameSite: 'strict',
        path: '/',
    });

    return session;
}

export async function createPendingSession(payload) {
    return await createSession(payload, '5m', 'pending_2fa');
}

export async function verifyPendingSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('pending_2fa')?.value;

    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, key);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function verifySession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, key);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}
