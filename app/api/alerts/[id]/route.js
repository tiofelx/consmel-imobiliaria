import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { parsePositiveIntId, getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

// PUT — Marcar alerta como resolvido
export async function PUT(request, { params }) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-alert-update', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/alerts/[id]',
                reason: 'Non-admin alert update attempt',
            });
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const { id } = await params;
        const parsedId = parsePositiveIntId(id);
        if (!parsedId) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const body = await request.json();

        const alert = await prisma.alert.update({
            where: { id: parsedId },
            data: { resolved: body.resolved ?? true },
        });

        return NextResponse.json(alert);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao atualizar alerta.' }, { status: 500 });
    }
}
