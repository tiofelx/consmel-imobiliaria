import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { safeLogError } from '@/lib/safe-log';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

export async function GET(request) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-live-alerts-access', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/admin/alerts/live',
                reason: 'Non-admin live alerts access attempt',
            });
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        // Lê do banco: fila em memória não é compartilhada entre instâncias.
        const now = new Date();
        const requested = new Date(new URL(request.url).searchParams.get('since') || NaN);
        const since = Number.isNaN(requested.getTime()) ? new Date(now.getTime() - 60_000) : requested;

        const events = await prisma.securityEvent.findMany({
            where: { severity: 'critical', createdAt: { gt: since, lte: now } },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        return NextResponse.json({
            now: now.toISOString(),
            alerts: events.map((event) => ({
                id: event.id,
                timestamp: event.createdAt,
                ip: event.ip,
                source: event.route,
                reason: event.reason,
                severity: event.severity,
                message: `Evento crítico detectado: ${event.event}`,
            })),
        });
    } catch (error) {
        safeLogError('Error fetching live alerts', error);
        return NextResponse.json({ error: 'Erro ao buscar alertas' }, { status: 500 });
    }
}
