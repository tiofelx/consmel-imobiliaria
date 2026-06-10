import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { verifySession } from '@/lib/auth';
import { safeLogError } from '@/lib/safe-log';
import {
    getClientIpFromHeaders,
    getClientUserAgentFromHeaders,
    logSecurityAttempt,
} from '@/lib/request-security';

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;

export async function POST(request) {
    const session = await verifySession();
    if (!session || session.role !== 'ADMIN') {
        logSecurityAttempt('unauthorized-upload-token', {
            ip: getClientIpFromHeaders(request.headers),
            userAgent: getClientUserAgentFromHeaders(request.headers),
            route: '/api/properties/upload-token',
            reason: 'Non-admin upload token request',
            severity: 'high',
        });
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                return {
                    allowedContentTypes: ALLOWED_VIDEO_TYPES,
                    maximumSizeInBytes: MAX_VIDEO_SIZE_BYTES,
                    addRandomSuffix: true,
                    tokenPayload: JSON.stringify({
                        userId: session.userId,
                        pathname,
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log('[Blob] Upload completed', {
                    url: blob.url,
                    contentType: blob.contentType,
                    tokenPayload: tokenPayload ? JSON.parse(tokenPayload) : null,
                });
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        safeLogError('Upload token error', error);
        return NextResponse.json(
            { error: 'Erro ao gerar token de upload.' },
            { status: 400 }
        );
    }
}
