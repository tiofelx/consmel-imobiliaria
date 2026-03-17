import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { z } from 'zod';
import rateLimit from '@/lib/rate-limit';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

export const dynamic = 'force-dynamic';

const limiter = rateLimit({ uniqueTokenPerInterval: 500, interval: 60000 }); // 1 min window

const alertSchema = z.object({
    type: z.enum(["fraud", "suspicious_password", "ddd_mismatch", "location_mismatch"]).optional(),
    severity: z.enum(["low", "medium", "high", "critical"]).optional(),
    source: z.string().min(1).max(100),
    name: z.string().max(150).optional().nullable(),
    email: z.string().email().max(150).optional().nullable(),
    phone: z.string().max(30).optional().nullable(),
    address: z.string().max(300).optional().nullable(),
    reasons: z.array(z.string()).optional()
});

// GET — Listar alertas
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

// POST — Criar alerta (Interno do sistema, porém acessado via HTTP Client side actions)
export async function POST(request) {
    try {
        const requestHeaders = request.headers;
        const ip = getClientIpFromHeaders(requestHeaders);
        const userAgent = getClientUserAgentFromHeaders(requestHeaders);
        const resForHeaders = new NextResponse();

        try {
            // max 10 alerts per minute per IP
            await limiter.check(resForHeaders, 10, `RATE_LIMIT_ALERTS_${ip}`);
        } catch {
            logSecurityAttempt('rate-limit-alerts', { ip, userAgent, route: '/api/alerts', reason: 'Alert endpoint abuse detected' });
            return NextResponse.json({ error: 'Muitas requisições. Tente novamente mais tarde.' }, { status: 429 });
        }

        const data = await request.json();

        const parsedData = alertSchema.safeParse(data);
        if (!parsedData.success) {
            return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
        }

        const validData = parsedData.data;

        const alert = await prisma.alert.create({
            data: {
                type: validData.type || 'fraud',
                severity: validData.severity || 'medium',
                source: validData.source,
                name: validData.name || null,
                email: validData.email || null,
                phone: validData.phone || null,
                address: validData.address || null,
                reasons: validData.reasons || [],
            },
        });

        const response = NextResponse.json(alert, { status: 201 });
        resForHeaders.headers.forEach((value, key) => response.headers.set(key, value));

        return response;
    } catch (error) {
        console.error('Error creating alert:', error);
        return NextResponse.json({ error: 'Erro ao criar alerta.' }, { status: 500 });
    }
}
