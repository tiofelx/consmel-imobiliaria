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
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB

// POST /api/properties/upload-token
// Emite tokens de upload presignados para o cliente subir vídeos direto
// pro Vercel Blob (contornando o cap de ~4.5MB de payload das Functions).
//
// Fluxo:
//   1. Cliente chama upload() de @vercel/blob/client com este endpoint
//   2. @vercel/blob/client envia POST com payload de "generateClientToken"
//   3. handleUpload valida e devolve token presignado
//   4. Cliente sobe direto pro Blob com o token
//   5. Vercel chama de volta este endpoint com payload "completed" (best-effort)
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
                // Tudo aqui já roda autenticado (verificamos session acima).
                // Restringimos tipos e tamanho no nível do token presignado:
                // a Vercel rejeita o upload no servidor de Blob se o cliente
                // tentar subir algo fora dessas restrições.
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
                // Callback informativo. A persistência da URL no DB acontece
                // depois, quando o cliente envia o POST/PUT da property.
                // Aqui só logamos pra rastreabilidade.
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
