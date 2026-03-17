import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export async function GET(request) {
  try {
    const session = await verifySession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    const severity = searchParams.get('severity');
    const ip = searchParams.get('ip');
    const route = searchParams.get('route');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const pageSize = Math.min(parsePositiveInt(searchParams.get('pageSize'), 20), 100);

    const where = {};

    if (severity && severity !== 'all') {
      where.severity = severity;
    }

    if (ip) {
      where.ip = { contains: ip.trim() };
    }

    if (route) {
      where.route = { contains: route.trim(), mode: 'insensitive' };
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) {
          where.createdAt.gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) {
          where.createdAt.lte = toDate;
        }
      }
      if (!where.createdAt.gte && !where.createdAt.lte) {
        delete where.createdAt;
      }
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.securityEvent.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar eventos de seguranca' }, { status: 500 });
  }
}
