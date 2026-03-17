import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtKey } from '@/lib/jwt-key';

const key = getJwtKey();

async function verifySessionFromRequest(request) {
    const session = request.cookies.get('session')?.value;

    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, key);
        return payload;
    } catch {
        return null;
    }
}

export async function proxy(request) {
    // Only run on /admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const session = await verifySessionFromRequest(request);

        if (!session) {
            // Redirect to login if not authenticated
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Enforce RBAC: Only ADMINs can access /admin
        if (session.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
