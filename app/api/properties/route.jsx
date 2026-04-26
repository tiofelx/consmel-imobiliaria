import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { safeLogError } from '@/lib/safe-log';
import { uploadImageToBlob, UploadValidationError } from '@/lib/upload-blob';
import { geocodeAddress } from '@/lib/geocode';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

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
        videos: property.videos || [],
        lat: toPublicCoordinate(property.latitude),
        lng: toPublicCoordinate(property.longitude),
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
    };
}

// GET /api/properties — List all properties
export async function GET() {
    const startedAt = Date.now();
    try {
        const properties = await prisma.property.findMany({
            include: { images: { orderBy: { order: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });
        const formattedProperties = properties.map(toPublicProperty);
        const elapsedMs = Date.now() - startedAt;
        const response = NextResponse.json(formattedProperties);
        response.headers.set('x-properties-count', String(formattedProperties.length));
        response.headers.set('x-db-latency-ms', String(elapsedMs));

        if (formattedProperties.length === 0) {
            console.warn('GET /api/properties returned empty list', {
                elapsedMs,
                hasDirectDatabaseUrl: Boolean(process.env.DIRECT_DATABASE_URL),
            });
        }

        return response;
    } catch (error) {
        safeLogError('GET /api/properties error', error);
        return NextResponse.json({ error: 'Erro ao buscar imóveis' }, { status: 500 });
    }
}

// POST /api/properties — Create a new property
export async function POST(request) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Não autorizado. Apenas administradores podem cadastrar imóveis.' },
                { status: 403 }
            );
        }

        const formData = await request.formData();

        // Extract basic data
        const data = {};
        const keys = [
            'title', 'description', 'transactionType', 'category',
            'cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'features'
        ];

        keys.forEach(key => {
            const value = formData.get(key);
            if (value) data[key] = value.toString();
        });

        // Helper to parse numbers safely
        const parseNum = (key, isFloat = false) => {
            const val = formData.get(key);
            if (!val) return null;
            const parsed = isFloat ? parseFloat(val.toString()) : parseInt(val.toString());
            return isNaN(parsed) ? null : parsed;
        };

        const parseBrazilianCurrency = (key) => {
            const val = formData.get(key);
            if (!val) return null;
            const str = val.toString();
            if (/^\d+\.\d+$/.test(str)) return parseFloat(str);
            const cleaned = str.replace(/[^\d,-]/g, '').replace(',', '.');
            return parseFloat(cleaned) || null;
        };

        // Extract and upload images to Vercel Blob
        const images = formData.getAll('images').filter((f) => f && typeof f.arrayBuffer === 'function');
        const savedImages = [];

        try {
            for (const file of images) {
                const { url } = await uploadImageToBlob(file);
                savedImages.push(url);
            }
        } catch (uploadError) {
            if (uploadError instanceof UploadValidationError) {
                return NextResponse.json({ error: uploadError.message }, { status: uploadError.status });
            }
            throw uploadError;
        }

        // Generate 12-char random alphanumeric ID
        const customId = Array.from({ length: 12 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36))).join('');

        let parsedFeatures = [];
        if (data.features) {
            try {
                const candidate = JSON.parse(data.features);
                if (Array.isArray(candidate)) {
                    parsedFeatures = candidate.filter((item) => typeof item === 'string').slice(0, 50);
                }
            } catch {
                return NextResponse.json({ error: 'Campo de características inválido.' }, { status: 400 });
            }
        }

        // Vídeos chegam como array de URLs (já uploaded direto pro Blob via
        // /api/properties/upload-token). Validamos que são URLs do nosso Blob.
        let parsedVideos = [];
        if (data.videos) {
            try {
                const candidate = JSON.parse(data.videos);
                if (Array.isArray(candidate)) {
                    parsedVideos = candidate
                        .filter((item) => typeof item === 'string')
                        .filter((url) => /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url))
                        .slice(0, 10);
                }
            } catch {
                return NextResponse.json({ error: 'Campo de vídeos inválido.' }, { status: 400 });
            }
        }

        // Geocode address (Nominatim) so the imóvel aparece como pin no mapa
        // de busca. Falha silenciosa: se não der pra resolver, salva sem
        // coordenadas — o cadastro continua valendo.
        const coords = await geocodeAddress({
            street: data.street,
            number: data.number,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            cep: data.cep,
        });

        // Create Property in DB
        const property = await prisma.property.create({
            data: {
                id: customId,
                title: data.title,
                description: data.description || null,
                transactionType: data.transactionType || 'Venda',
                category: data.category || 'Casa',

                // Values
                price: parseBrazilianCurrency('price') || 0,
                condoFee: parseBrazilianCurrency('condoFee'),
                iptu: parseBrazilianCurrency('iptu'),

                // Features
                bedrooms: parseNum('bedrooms'),
                suites: parseNum('suites'),
                bathrooms: parseNum('bathrooms'),
                parkingSpaces: parseNum('parkingSpaces'),
                usableArea: parseNum('usableArea', true),
                totalArea: parseNum('totalArea', true),

                // Features List
                features: parsedFeatures,

                // Address
                cep: data.cep || null,
                street: data.street || null,
                number: data.number || null,
                complement: data.complement || null,
                neighborhood: data.neighborhood || null,
                city: data.city || null,
                state: data.state || null,

                latitude: coords?.latitude ?? null,
                longitude: coords?.longitude ?? null,

                // Vídeos (URLs do Blob)
                videos: parsedVideos,

                // Images relation
                images: {
                    create: savedImages.map((url, index) => ({
                        url,
                        order: index
                    }))
                }
            },
        });

        return NextResponse.json(property, { status: 201 });
    } catch (error) {
        safeLogError('Error creating property', error);
        return NextResponse.json({ error: 'Erro ao criar imóvel' }, { status: 500 });
    }
}
