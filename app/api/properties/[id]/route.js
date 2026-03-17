import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';

function toPublicCoordinate(value) {
    if (!Number.isFinite(value)) return null;
    return Number(value.toFixed(3));
}

function toPublicProperty(property) {
    return {
        id: property.id,
        title: property.title,
        description: property.description,
        transactionType: property.transactionType,
        category: property.category,
        type: property.category,
        price: property.price,
        condoFee: property.condoFee,
        iptu: property.iptu,
        bedrooms: property.bedrooms,
        suites: property.suites,
        bathrooms: property.bathrooms,
        parkingSpaces: property.parkingSpaces,
        usableArea: property.usableArea,
        totalArea: property.totalArea,
        area: property.usableArea || property.totalArea,
        features: property.features,
        neighborhood: property.neighborhood,
        city: property.city,
        state: property.state,
        location: `${property.neighborhood ? `${property.neighborhood}, ` : ''}${property.city || ''} - ${property.state || ''}`,
        image: property.images?.[0]?.url || null,
        images: property.images,
        lat: toPublicCoordinate(property.latitude),
        lng: toPublicCoordinate(property.longitude),
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
    };
}

// GET /api/properties/[id]
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const session = await verifySession();
        const property = await prisma.property.findUnique({
            where: { id },
            include: { images: { orderBy: { order: 'asc' } } },
        });

        if (!property) {
            return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
        }

        if (session?.role === 'ADMIN') {
            return NextResponse.json(property);
        }

        return NextResponse.json(toPublicProperty(property));
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar imóvel' }, { status: 500 });
    }
}

// PUT /api/properties/[id]
export async function PUT(request, { params }) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-property-update', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/properties/[id]',
                reason: 'Non-admin property update attempt',
            });
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const data = await request.json();

        const parseBrazilianCurrency = (value) => {
            if (value === null || value === undefined || value === '') return null;
            if (typeof value === 'number') return value;
            const str = value.toString();
            if (/^\d+\.\d+$/.test(str)) return parseFloat(str);
            const cleaned = str.replace(/[^\d,-]/g, '').replace(',', '.');
            return parseFloat(cleaned) || null;
        };

        const updateData = {
            title: data.title,
            description: data.description || null,
            transactionType: data.transactionType,
            category: data.category,
            price: parseBrazilianCurrency(data.price) || 0,
            condoFee: parseBrazilianCurrency(data.condoFee),
            iptu: parseBrazilianCurrency(data.iptu),
            bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
            suites: data.suites ? parseInt(data.suites) : null,
            bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
            parkingSpaces: data.parkingSpaces ? parseInt(data.parkingSpaces) : null,
            usableArea: data.usableArea ? parseFloat(data.usableArea) : null,
            totalArea: data.totalArea ? parseFloat(data.totalArea) : null,
            features: data.features || [],
            cep: data.cep || null,
            street: data.street || null,
            number: data.number || null,
            complement: data.complement || null,
            neighborhood: data.neighborhood || null,
            city: data.city || null,
            state: data.state || null,
        };

        if (data.latitude !== undefined) {
            updateData.latitude = data.latitude ? parseFloat(data.latitude) : null;
        }
        if (data.longitude !== undefined) {
            updateData.longitude = data.longitude ? parseFloat(data.longitude) : null;
        }

        const property = await prisma.property.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(property);
    } catch (error) {
        console.error('Error updating property:', error);
        return NextResponse.json({ error: 'Erro ao atualizar imóvel' }, { status: 500 });
    }
}

// DELETE /api/properties/[id]
export async function DELETE(request, { params }) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            logSecurityAttempt('unauthorized-property-delete', {
                ip: getClientIpFromHeaders(request.headers),
                userAgent: getClientUserAgentFromHeaders(request.headers),
                route: '/api/properties/[id]',
                reason: 'Non-admin property delete attempt',
            });
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 403 }
            );
        }

        const { id } = await params;
        await prisma.property.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Imóvel excluído com sucesso' });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao excluir imóvel' }, { status: 500 });
    }
}
