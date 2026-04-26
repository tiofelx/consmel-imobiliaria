// Backfill de latitude/longitude para imóveis cadastrados antes do
// geocoding automático no POST/PUT. Percorre todos com lat ou lng nulos,
// monta o endereço e consulta o Nominatim respeitando 1 req/s.
//
// Uso: node scripts/backfill-coordinates.mjs
//      node scripts/backfill-coordinates.mjs --dry-run
//
// Idempotente: rodar de novo só toca em quem ainda está sem coordenada.

import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { withAccelerate } from '@prisma/extension-accelerate';
import { geocodeAddress } from '../lib/geocode.js';

function buildPrisma() {
    const directUrl = process.env.DIRECT_DATABASE_URL;
    if (directUrl) {
        const adapter = new PrismaPg({ connectionString: directUrl });
        return new PrismaClient({ adapter });
    }

    const accelerateUrl = process.env.DATABASE_URL;
    if (!accelerateUrl) {
        throw new Error('Defina DIRECT_DATABASE_URL ou DATABASE_URL no .env antes de rodar.');
    }
    return new PrismaClient({ accelerateUrl }).$extends(withAccelerate());
}

const prisma = buildPrisma();

const DRY_RUN = process.argv.includes('--dry-run');
const SLEEP_MS = 1100; // política pública do Nominatim: máx. 1 req/s

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function describe(property) {
    const parts = [property.street, property.neighborhood, property.city, property.state]
        .filter(Boolean)
        .join(', ');
    return `${property.id} — ${parts || '(sem endereço)'}`;
}

async function main() {
    const pending = await prisma.property.findMany({
        where: {
            OR: [{ latitude: null }, { longitude: null }],
        },
        orderBy: { createdAt: 'asc' },
    });

    if (pending.length === 0) {
        console.log('Nada a fazer — todos os imóveis já têm coordenadas.');
        return;
    }

    console.log(`Encontrados ${pending.length} imóveis sem coordenadas.`);
    if (DRY_RUN) console.log('[dry-run] nenhum UPDATE será executado.');

    const stats = { ok: 0, miss: 0, skipped: 0 };

    for (let i = 0; i < pending.length; i += 1) {
        const property = pending[i];
        const hasAddress = property.street || property.neighborhood || property.city || property.cep;

        if (!hasAddress) {
            stats.skipped += 1;
            console.log(`[${i + 1}/${pending.length}] SKIP  ${describe(property)} — sem endereço`);
            continue;
        }

        const coords = await geocodeAddress({
            street: property.street,
            number: property.number,
            neighborhood: property.neighborhood,
            city: property.city,
            state: property.state,
            cep: property.cep,
        });

        if (!coords) {
            stats.miss += 1;
            console.log(`[${i + 1}/${pending.length}] MISS  ${describe(property)} — Nominatim sem resultado`);
        } else {
            stats.ok += 1;
            const tag = DRY_RUN ? 'WOULD' : 'OK   ';
            console.log(
                `[${i + 1}/${pending.length}] ${tag} ${describe(property)} → ${coords.latitude}, ${coords.longitude}`
            );
            if (!DRY_RUN) {
                await prisma.property.update({
                    where: { id: property.id },
                    data: { latitude: coords.latitude, longitude: coords.longitude },
                });
            }
        }

        if (i < pending.length - 1) await sleep(SLEEP_MS);
    }

    console.log('\nResumo:');
    console.log(`  atualizados: ${stats.ok}`);
    console.log(`  sem resultado no Nominatim: ${stats.miss}`);
    console.log(`  pulados (sem endereço): ${stats.skipped}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
