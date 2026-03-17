import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { safeLogError } from '@/lib/safe-log';

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

        // Extract and process images
        const images = formData.getAll('images');
        const savedImages = [];

        // Validations
        const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

        if (images && images.length > 0) {
            const { writeFile, mkdir } = await import('fs/promises');
            const path = await import('path');

            // Ensure uploads directory exists
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            await mkdir(uploadDir, { recursive: true });

            for (const file of images) {
                if (file && typeof file.arrayBuffer === 'function') {
                    // 1. Validate File Size
                    if (file.size > MAX_FILE_SIZE) {
                        return NextResponse.json(
                            { error: `O arquivo ${file.name} ultrapassa o limite de 5MB.` },
                            { status: 400 }
                        );
                    }

                    // 2. Validate MIME Type
                    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                        return NextResponse.json(
                            { error: `Tipo de arquivo não permitido para a imagem ${file.name}. Apenas JPEG, PNG ou WEBP são aceitos.` },
                            { status: 400 }
                        );
                    }

                    // Hardcode extension based on verified MIME type to prevent arbitrary execution
                    let safeExtension = '.jpg';
                    if (file.type === 'image/png') safeExtension = '.png';
                    if (file.type === 'image/webp') safeExtension = '.webp';

                    const buffer = Buffer.from(await file.arrayBuffer());

                    // 3. Magic Bytes Validation
                    const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
                    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
                    const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
                        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

                    if ((file.type === 'image/jpeg' && !isJpg) ||
                        (file.type === 'image/png' && !isPng) ||
                        (file.type === 'image/webp' && !isWebp)) {
                        return NextResponse.json(
                            { error: `O conteúdo do arquivo ${file.name} não corresponde a uma imagem válida.` },
                            { status: 400 }
                        );
                    }

                    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
                    const filename = `${uniqueSuffix}${safeExtension}`;
                    const filepath = path.join(uploadDir, filename);

                    await writeFile(filepath, buffer);
                    savedImages.push(`/uploads/${filename}`);
                }
            }
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
