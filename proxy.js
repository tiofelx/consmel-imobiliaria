import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtKey } from '@/lib/jwt-key';

const key = getJwtKey();

async function verifySessionFromRequest(request) {
    const session = request.cookies.get('session')?.value;

    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, key);
        // Token intermediário (2FA, e-mail, navegador conhecido) não vale como sessão.
        return payload.stage ? null : payload;
    } catch {
        return null;
    }
}

// Script só roda com o nonce desta resposta; o Next o aplica às próprias tags
// (por isso todas as páginas são renderizadas a cada pedido).
function contentSecurityPolicy(nonce) {
    const devEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';
    return [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devEval}`,
        "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
        "img-src 'self' data: blob: *.openstreetmap.org images.unsplash.com *.public.blob.vercel-storage.com *.google.com *.googleapis.com *.gstatic.com",
        "media-src 'self' blob: *.public.blob.vercel-storage.com",
        "font-src 'self' data: fonts.gstatic.com",
        "connect-src 'self' *.openstreetmap.org *.public.blob.vercel-storage.com blob.vercel-storage.com viacep.com.br",
        "frame-src 'self' https://*.google.com",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; ');
}

export async function proxy(request) {
    // Primeira barreira do /admin; a revogação é conferida em verifySession (lib/auth.js).
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const session = await verifySessionFromRequest(request);

        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        if (session.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const csp = contentSecurityPolicy(nonce);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('Content-Security-Policy', csp);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Security-Policy', csp);
    return response;
}

export const config = {
    // O /admin entra sempre; o resto, tudo que não for API nem arquivo estático.
    matcher: ['/admin/:path*', '/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
