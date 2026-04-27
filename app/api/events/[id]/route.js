import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

const CUID_RE = /^c[a-z0-9]{20,30}$/;

function isValidEventId(id) {
    return typeof id === 'string' && CUID_RE.test(id);
}

// PUT /api/events/[id]
export async function PUT(request, { params }) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-event-update', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/events/[id]',
                reason: 'Non-admin update attempt',
            });
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const { id } = await params;
        if (!isValidEventId(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const data = await request.json();

        const duration = Number.isInteger(data.duration) && data.duration > 0
            ? Math.min(data.duration, 24 * 60)
            : 60;

        const event = await prisma.event.update({
            where: { id },
            data: {
                title: data.title,
                date: new Date(data.date),
                time: data.time,
                duration,
                type: data.type,
                description: data.description || null,
            },
        });

        return NextResponse.json({
            id: event.id,
            title: event.title,
            date: event.date.toISOString().split('T')[0],
            time: event.time,
            duration: event.duration,
            type: event.type,
            description: event.description || '',
        });
    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json({ error: 'Erro ao atualizar evento' }, { status: 500 });
    }
}

// DELETE /api/events/[id]
export async function DELETE(request, { params }) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-event-delete', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/events/[id]',
                reason: 'Non-admin delete attempt',
            });
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const { id } = await params;
        if (!isValidEventId(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        await prisma.event.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Evento excluído com sucesso' });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao excluir evento' }, { status: 500 });
    }
}
