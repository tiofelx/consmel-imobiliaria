import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

export const dynamic = 'force-dynamic';

// GET /api/events — List all events
export async function GET(request) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-event-list', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/events',
                reason: 'Non-admin list attempt',
            });
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const events = await prisma.event.findMany({
            orderBy: { date: 'asc' },
        });

        // Format events to match the frontend expected format
        const formatted = events.map(event => ({
            id: event.id,
            title: event.title,
            date: event.date.toISOString().split('T')[0], // "YYYY-MM-DD"
            time: event.time,
            type: event.type,
            description: event.description || '',
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 });
    }
}

// POST /api/events — Create a new event
export async function POST(request) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-event-create', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/events',
                reason: 'Non-admin create attempt',
            });
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const data = await request.json();

        const event = await prisma.event.create({
            data: {
                title: data.title,
                date: new Date(data.date),
                time: data.time,
                type: data.type,
                description: data.description || null,
            },
        });

        return NextResponse.json({
            id: event.id,
            title: event.title,
            date: event.date.toISOString().split('T')[0],
            time: event.time,
            type: event.type,
            description: event.description || '',
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating event:', error);
        return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 });
    }
}
