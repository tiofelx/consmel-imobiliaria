import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { getClientIpFromHeaders, getClientUserAgentFromHeaders, logSecurityAttempt } from '@/lib/request-security';
import { uploadImageToBlob, UploadValidationError } from '@/lib/upload-blob';
import { safeLogError } from '@/lib/safe-log';
import { geocodeAddress } from '@/lib/geocode';

function toPublicCoordinate(value) {
    if (!Number.isFinite(value)) return null;
    return Number(value.toFixed(3));
}

function buildLocationLabel(property) {
    const cityState = [property.city, property.state].filter(Boolean).join(' - ');
    return [property.neighborhood, cityState].filter(Boolean).join(', ');
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
        location: buildLocationLabel(property),
        image: property.images?.[0]?.url || null,
        images: property.images,
        videos: property.videos || [],
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

function safeJsonParse(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function parseBrazilianCurrency(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;
    const str = value.toString();
    if (/^\d+\.\d+$/.test(str)) return parseFloat(str);
    const cleaned = str.replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || null;
}

// Aceita "1338,65" e "1338.65" pra área e similares
function parseDecimal(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;
    const cleaned = value.toString().replace(',', '.');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
}

const VERCEL_BLOB_URL_PATTERN = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

function sanitizeVideoUrls(input) {
    if (!Array.isArray(input)) return [];
    return input
        .filter((u) => typeof u === 'string')
        .filter((u) => VERCEL_BLOB_URL_PATTERN.test(u))
        .slice(0, 10);
}

function buildUpdateDataFromObject(data) {
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
        usableArea: parseDecimal(data.usableArea),
        totalArea: parseDecimal(data.totalArea),
        features: Array.isArray(data.features) ? data.features : [],
        cep: data.cep || null,
        street: data.street || null,
        number: data.number || null,
        complement: data.complement || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        state: data.state || null,
    };

    if (data.videos !== undefined) {
        const raw = typeof data.videos === 'string' ? safeJsonParse(data.videos) : data.videos;
        updateData.videos = sanitizeVideoUrls(raw);
    }

    if (data.latitude !== undefined && data.latitude !== null && data.latitude !== '') {
        updateData.latitude = parseFloat(data.latitude);
    }
    if (data.longitude !== undefined && data.longitude !== null && data.longitude !== '') {
        updateData.longitude = parseFloat(data.longitude);
    }

    return updateData;
}

// Geocoding via Nominatim quando o admin altera o endereço mas não envia
// lat/lng explícitos — assim o pin no mapa de busca acompanha a edição.
async function applyGeocodingIfNeeded(updateData) {
    const hasManualCoords =
        Number.isFinite(updateData.latitude) && Number.isFinite(updateData.longitude);
    if (hasManualCoords) return;

    const hasAddress =
        updateData.street || updateData.neighborhood || updateData.city || updateData.cep;
    if (!hasAddress) return;

    const coords = await geocodeAddress({
        street: updateData.street,
        number: updateData.number,
        neighborhood: updateData.neighborhood,
        city: updateData.city,
        state: updateData.state,
        cep: updateData.cep,
    });
    if (coords) {
        updateData.latitude = coords.latitude;
        updateData.longitude = coords.longitude;
    }
}

// PUT /api/properties/[id]
// Aceita JSON (somente metadados) OU multipart/form-data quando há
// imagens novas para enviar. No multipart, o cliente envia:
//   - campos de texto da propriedade
//   - existingImageUrls: JSON array com URLs das imagens já salvas que
//     devem ser mantidas (qualquer outra é deletada)
//   - images: arquivos novos para subir ao Blob
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
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const { id } = await params;
        const contentType = request.headers.get('content-type') || '';

        // Caminho 1 — JSON (sem upload de arquivos novos, mas pode reconciliar
        // remoções se existingImageUrls estiver presente)
        if (contentType.includes('application/json')) {
            const data = await request.json();
            const updateData = buildUpdateDataFromObject(data);
            await applyGeocodingIfNeeded(updateData);

            const hasImageReconciliation = Array.isArray(data.existingImageUrls);

            if (!hasImageReconciliation) {
                const property = await prisma.property.update({ where: { id }, data: updateData });
                return NextResponse.json(property);
            }

            const keepUrls = data.existingImageUrls.filter((u) => typeof u === 'string');
            const property = await prisma.$transaction(async (tx) => {
                await tx.propertyImage.deleteMany({
                    where: {
                        propertyId: id,
                        NOT: { url: { in: keepUrls.length > 0 ? keepUrls : ['__none__'] } },
                    },
                });
                for (let i = 0; i < keepUrls.length; i += 1) {
                    await tx.propertyImage.updateMany({
                        where: { propertyId: id, url: keepUrls[i] },
                        data: { order: i },
                    });
                }
                return tx.property.update({
                    where: { id },
                    data: updateData,
                    include: { images: { orderBy: { order: 'asc' } } },
                });
            });
            return NextResponse.json(property);
        }

        // Caminho 2 — multipart com imagens
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json(
                { error: 'Content-Type deve ser application/json ou multipart/form-data.' },
                { status: 415 }
            );
        }

        const formData = await request.formData();

        const dataFromForm = {};
        const fieldKeys = [
            'title', 'description', 'transactionType', 'category',
            'price', 'condoFee', 'iptu',
            'bedrooms', 'suites', 'bathrooms', 'parkingSpaces',
            'usableArea', 'totalArea',
            'cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state',
            'latitude', 'longitude',
        ];
        for (const key of fieldKeys) {
            const value = formData.get(key);
            if (value !== null) dataFromForm[key] = value.toString();
        }

        const featuresRaw = formData.get('features');
        if (typeof featuresRaw === 'string' && featuresRaw.length > 0) {
            try {
                const parsed = JSON.parse(featuresRaw);
                if (Array.isArray(parsed)) {
                    dataFromForm.features = parsed.filter((item) => typeof item === 'string').slice(0, 50);
                }
            } catch {
                return NextResponse.json({ error: 'Campo features inválido.' }, { status: 400 });
            }
        }

        // Lista de URLs já existentes que o cliente quer manter
        let keepUrls = [];
        const existingRaw = formData.get('existingImageUrls');
        if (typeof existingRaw === 'string' && existingRaw.length > 0) {
            try {
                const parsed = JSON.parse(existingRaw);
                if (Array.isArray(parsed)) {
                    keepUrls = parsed.filter((u) => typeof u === 'string');
                }
            } catch {
                return NextResponse.json({ error: 'Campo existingImageUrls inválido.' }, { status: 400 });
            }
        }

        const newFiles = formData.getAll('images').filter((f) => f && typeof f.arrayBuffer === 'function');

        // Sobe arquivos novos primeiro — se algum falhar a validação, o DB
        // ainda não foi tocado e nada é perdido.
        const newUrls = [];
        try {
            for (const file of newFiles) {
                const { url } = await uploadImageToBlob(file);
                newUrls.push(url);
            }
        } catch (uploadError) {
            if (uploadError instanceof UploadValidationError) {
                return NextResponse.json({ error: uploadError.message }, { status: uploadError.status });
            }
            throw uploadError;
        }

        const updateData = buildUpdateDataFromObject(dataFromForm);
        await applyGeocodingIfNeeded(updateData);

        // Reconcilia images dentro de uma transação:
        // - apaga todos os PropertyImage cuja url NÃO está em keepUrls
        // - cria novos para newUrls
        // - mantém ordem: existing (na ordem fornecida) + novos
        const property = await prisma.$transaction(async (tx) => {
            await tx.propertyImage.deleteMany({
                where: {
                    propertyId: id,
                    NOT: { url: { in: keepUrls.length > 0 ? keepUrls : ['__none__'] } },
                },
            });

            // Atualiza order dos existentes para refletir o array recebido
            for (let i = 0; i < keepUrls.length; i += 1) {
                await tx.propertyImage.updateMany({
                    where: { propertyId: id, url: keepUrls[i] },
                    data: { order: i },
                });
            }

            // Cria os novos com order continuando a sequência
            const startOrder = keepUrls.length;
            for (let i = 0; i < newUrls.length; i += 1) {
                await tx.propertyImage.create({
                    data: { propertyId: id, url: newUrls[i], order: startOrder + i },
                });
            }

            return tx.property.update({
                where: { id },
                data: updateData,
                include: { images: { orderBy: { order: 'asc' } } },
            });
        });

        return NextResponse.json(property);
    } catch (error) {
        safeLogError('Error updating property', error);
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
