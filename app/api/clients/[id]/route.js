import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { parsePositiveIntId, getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

// GET /api/clients/[id]
export async function GET(request, { params }) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-client-read', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/clients/[id]',
                reason: 'Non-admin access attempt',
            });
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const { id } = await params;
        const parsedId = parsePositiveIntId(id);
        if (!parsedId) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const client = await prisma.client.findUnique({
            where: { id: parsedId },
        });

        if (!client) {
            return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
    }
}

// PUT /api/clients/[id]
export async function PUT(request, { params }) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-client-update', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/clients/[id]',
                reason: 'Non-admin update attempt',
            });
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const { id } = await params;
        const parsedId = parsePositiveIntId(id);
        if (!parsedId) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const data = await request.json();

        const client = await prisma.client.update({
            where: { id: parsedId },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone || null,
                interest: data.interest,
                status: data.status,
                notes: data.notes || null,
            },
        });

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
    }
}

// DELETE /api/clients/[id]
export async function DELETE(request, { params }) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-client-delete', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/clients/[id]',
                reason: 'Non-admin delete attempt',
            });
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const { id } = await params;
        const parsedId = parsePositiveIntId(id);
        if (!parsedId) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        await prisma.client.delete({
            where: { id: parsedId },
        });

        return NextResponse.json({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao excluir cliente' }, { status: 500 });
    }
}
