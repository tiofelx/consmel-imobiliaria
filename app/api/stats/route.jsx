import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

export const dynamic = 'force-dynamic';

// GET /api/stats — Dashboard statistics
export async function GET(request) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-stats-access', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/stats',
                reason: 'Non-admin stats access attempt',
            });
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const [totalProperties, saleProperties, rentProperties, totalClients, recentProperties] = await Promise.all([
            prisma.property.count(),
            prisma.property.count({ where: { transactionType: 'Venda' } }),
            prisma.property.count({ where: { transactionType: 'Aluguel' } }),
            prisma.client.count(),
            prisma.property.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { images: { take: 1, orderBy: { order: 'asc' } } },
            }),
        ]);

        return NextResponse.json({
            totalProperties,
            saleProperties,
            rentProperties,
            totalClients,
            recentProperties,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
    }
}
