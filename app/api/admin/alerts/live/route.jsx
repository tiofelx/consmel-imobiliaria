import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getLiveAlerts } from '@/lib/alert-store';
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

        const { searchParams } = new URL(request.url);
        const since = searchParams.get('since');

        const alerts = getLiveAlerts(since);

        return NextResponse.json({ alerts });
    } catch (error) {
        console.error('Error fetching live alerts:', error);
        return NextResponse.json({ error: 'Erro ao buscar alertas' }, { status: 500 });
    }
}
