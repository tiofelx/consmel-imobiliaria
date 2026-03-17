import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { z } from 'zod';
import rateLimit from '@/lib/rate-limit';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

export const dynamic = 'force-dynamic';

// GET /api/clients — List all clients
export async function GET(request) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-client-list', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/clients',
                reason: 'Non-admin list attempt',
            });
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(clients);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
    }
}

// Rate limiter (5 requests per 10 minutes per IP)
const limiter = rateLimit({ uniqueTokenPerInterval: 500, interval: 600000 });

// Strict validation schema
const clientSchema = z.object({
    name: z.string().trim().min(2, "Nome muito curto").max(100, "Nome muito longo")
        .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, "Nome contém caracteres inválidos"),
    email: z.string().trim().email("E-mail inválido").max(150),
    phone: z.string().trim().max(20).optional().nullable(),
    interest: z.enum(["Compra", "Aluguel", "Cadastro de Imóvel"]).optional().nullable(),
    status: z.enum(["Novo", "Em Negociação", "Visita Agendada", "Arquivado"]).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable()
});

// POST /api/clients — Create a new client (Public Endpoint for Leads)
export async function POST(request) {
    try {
        // Rate Limiting by IP
        const ip = getClientIpFromHeaders(request.headers);
        const userAgent = getClientUserAgentFromHeaders(request.headers);
        const resForHeaders = new NextResponse();

        try {
            await limiter.check(resForHeaders, 5, `RATE_LIMIT_CLIENT_${ip}`);
        } catch {
            logSecurityAttempt('rate-limit-client-lead', { ip, userAgent, route: '/api/clients', reason: 'Lead submission flood detected' });
            return NextResponse.json({ error: 'Muitas requisições. Tente novamente mais tarde.' }, { status: 429 });
        }

        const data = await request.json();

        // 1. Zod Validation (Defense in Depth)
        const parsedData = clientSchema.safeParse(data);
        if (!parsedData.success) {
            console.warn(`Tentativa de injeção ou dados inválidos de IP: ${ip}`, parsedData.error.errors);
            return NextResponse.json({
                error: 'Dados inválidos',
                details: parsedData.error.errors
            }, { status: 400 });
        }

        const validData = parsedData.data;

        const client = await prisma.client.create({
            data: {
                name: validData.name,
                email: validData.email,
                phone: validData.phone || null,
                interest: validData.interest || 'Compra',
                status: validData.status || 'Novo',
                notes: validData.notes || null,
            },
        });

        // Copiamos os headers de rate limit para a resposta final
        const response = NextResponse.json(client, { status: 201 });
        resForHeaders.headers.forEach((value, key) => response.headers.set(key, value));

        return response;
    } catch (error) {
        console.error('Error creating client:', error);
        return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
    }
}
