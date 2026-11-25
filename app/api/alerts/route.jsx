import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

export const dynamic = 'force-dynamic';

// Alertas são criados só no servidor (flagSuspiciousSignup); aqui há apenas leitura.
export async function GET(request) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-alert-list', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/alerts',
                reason: 'Non-admin alert list attempt',
            });
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const alerts = await prisma.alert.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(alerts);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar alertas.' }, { status: 500 });
    }
}
