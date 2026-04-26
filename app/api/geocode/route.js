import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { geocodeAddress } from '@/lib/geocode';

export const dynamic = 'force-dynamic';

// POST /api/geocode — chamado pelo painel admin durante o cadastro/edição
// para sugerir o pin no mapa antes de salvar. Restrito a ADMIN para evitar
// abuso do Nominatim a partir do site público.
export async function POST(request) {
    const session = await verifySession();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    let payload;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const coords = await geocodeAddress({
        street: payload.street,
        number: payload.number,
        neighborhood: payload.neighborhood,
        city: payload.city,
        state: payload.state,
        cep: payload.cep,
    });

    if (!coords) {
        return NextResponse.json({ error: 'Endereço não localizado' }, { status: 404 });
    }

    return NextResponse.json(coords);
}
