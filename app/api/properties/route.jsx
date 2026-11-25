import { randomInt } from 'crypto';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { safeLogError } from '@/lib/safe-log';
import { uploadImageToBlob, UploadValidationError } from '@/lib/upload-blob';
import { geocodeAddress } from '@/lib/geocode';
import { parseBrazilianNumber } from '@/lib/validations';
import { toPublicProperty } from '@/lib/public-property';
import { deleteBlobs } from '@/lib/upload-blob';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

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

        const data = {};
        const keys = [
            'title', 'description', 'transactionType', 'category',
            'cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'features',
            'latitude', 'longitude', 'videos'
        ];

        keys.forEach(key => {
            const value = formData.get(key);
            if (value) data[key] = value.toString();
        });

        const parseInteger = (key) => {
            const parsed = parseInt(formData.get(key), 10);
            return Number.isNaN(parsed) ? null : parsed;
        };
        const parseNumber = (key) => parseBrazilianNumber(formData.get(key));

        // Valida tudo antes de enviar arquivos: erro depois do upload deixaria órfãos no Blob.
        if (!data.title?.trim()) {
            return NextResponse.json({ error: 'Informe o título do imóvel.' }, { status: 400 });
        }

        const images = formData.getAll('images').filter((f) => f && typeof f.arrayBuffer === 'function');
        const customId = Array.from({ length: 12 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(randomInt(36))).join('');

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

        const savedImages = [];
        try {
            for (const file of images) {
                const { url } = await uploadImageToBlob(file);
                savedImages.push(url);
            }
        } catch (uploadError) {
            await deleteBlobs(savedImages);
            if (uploadError instanceof UploadValidationError) {
                return NextResponse.json({ error: uploadError.message }, { status: uploadError.status });
            }
            throw uploadError;
        }

        let coords = null;
        const manualLat = parseFloat(data.latitude);
        const manualLng = parseFloat(data.longitude);
        if (Number.isFinite(manualLat) && Number.isFinite(manualLng)) {
            coords = { latitude: manualLat, longitude: manualLng };
        } else {
            coords = await geocodeAddress({
                street: data.street,
                number: data.number,
                neighborhood: data.neighborhood,
                city: data.city,
                state: data.state,
                cep: data.cep,
            });
        }

        const property = await prisma.property.create({
            data: {
                id: customId,
                title: data.title,
                description: data.description || null,
                transactionType: data.transactionType || 'Venda',
                category: data.category || 'Casa',

                price: parseNumber('price') || 0,
                condoFee: parseNumber('condoFee'),
                iptu: parseNumber('iptu'),

                bedrooms: parseInteger('bedrooms'),
                suites: parseInteger('suites'),
                bathrooms: parseInteger('bathrooms'),
                parkingSpaces: parseInteger('parkingSpaces'),
                usableArea: parseNumber('usableArea'),
                totalArea: parseNumber('totalArea'),

                features: parsedFeatures,

                cep: data.cep || null,
                street: data.street || null,
                number: data.number || null,
                complement: data.complement || null,
                neighborhood: data.neighborhood || null,
                city: data.city || null,
                state: data.state || null,

                latitude: coords?.latitude ?? null,
                longitude: coords?.longitude ?? null,

                videos: parsedVideos,

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
