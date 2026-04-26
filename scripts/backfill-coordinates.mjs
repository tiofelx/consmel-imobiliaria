// Backfill de latitude/longitude para imóveis cadastrados antes do
// geocoding automático no POST/PUT. Percorre todos com lat ou lng nulos,
// monta o endereço e consulta o Nominatim respeitando 1 req/s.
//
// Uso:
//   node scripts/backfill-coordinates.mjs
//   node scripts/backfill-coordinates.mjs --dry-run
//   node scripts/backfill-coordinates.mjs --verbose
//   node scripts/backfill-coordinates.mjs --default-state=SP
//
// Flags:
//   --dry-run             apenas simula, não toca no banco
//   --verbose             imprime cada query enviada ao Nominatim
//   --default-state=UF    preenche o `state` quando o imóvel não tem
//                         (ajuda a desambiguar cidades homônimas)
//
// Idempotente: rodar de novo só toca em quem ainda está sem coordenada.

import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { withAccelerate } from '@prisma/extension-accelerate';
import { buildQueryCandidates, queryNominatim } from '../lib/geocode.js';

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
const VERBOSE = process.argv.includes('--verbose');
const DEFAULT_STATE = (() => {
    const flag = process.argv.find((arg) => arg.startsWith('--default-state='));
    return flag ? flag.split('=')[1].trim().toUpperCase() : '';
})();

const NOMINATIM_INTERVAL_MS = 1100;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function describe(property) {
    const parts = [property.street, property.neighborhood, property.city, property.state]
        .filter(Boolean)
        .join(', ');
    return `${property.id} — ${parts || '(sem endereço)'}`;
}

async function geocodeWithLogging(address) {
    const candidates = buildQueryCandidates(address);
    if (VERBOSE) {
        console.log(`    queries (${candidates.length}):`);
        candidates.forEach((q) => console.log(`      - ${q}`));
    }

    for (const query of candidates) {
        const result = await queryNominatim(query);
        if (result) {
            return { ...result, matched: query };
        }
        await sleep(NOMINATIM_INTERVAL_MS);
    }
    return null;
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
    if (DEFAULT_STATE) console.log(`[default-state] usando "${DEFAULT_STATE}" quando o imóvel não tem UF.`);
    if (VERBOSE) console.log('[verbose] imprimindo cada query.');

    const stats = { ok: 0, miss: 0, skipped: 0 };

    for (let i = 0; i < pending.length; i += 1) {
        const property = pending[i];
        const hasAddress = property.street || property.neighborhood || property.city || property.cep;

        console.log(`[${i + 1}/${pending.length}] ${describe(property)}`);

        if (!hasAddress) {
            stats.skipped += 1;
            console.log('    SKIP  — sem endereço');
            continue;
        }

        const effectiveState = property.state || DEFAULT_STATE || null;
        if (!property.state && DEFAULT_STATE && VERBOSE) {
            console.log(`    state vazio no DB, aplicando default "${DEFAULT_STATE}"`);
        }

        const result = await geocodeWithLogging({
            street: property.street,
            number: property.number,
            neighborhood: property.neighborhood,
            city: property.city,
            state: effectiveState,
            cep: property.cep,
        });

        if (!result) {
            stats.miss += 1;
            console.log('    MISS  — Nominatim sem resultado');
        } else {
            stats.ok += 1;
            const tag = DRY_RUN ? 'WOULD' : 'OK   ';
            console.log(`    ${tag} → ${result.latitude}, ${result.longitude}`);
            if (VERBOSE) console.log(`    matched: "${result.matched}"`);
            if (!DRY_RUN) {
                await prisma.property.update({
                    where: { id: property.id },
                    data: { latitude: result.latitude, longitude: result.longitude },
                });
            }
        }

        if (i < pending.length - 1) await sleep(NOMINATIM_INTERVAL_MS);
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
