import { PrismaClient } from '@/lib/generated/prisma';
import { withAccelerate } from '@prisma/extension-accelerate';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis;

function withStablePgParams(connectionString) {
    if (!connectionString) return connectionString;

    try {
        const parsed = new URL(connectionString);
        const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);

        const defaultParams = {
            connect_timeout: '5',
            keepalives: '1',
            keepalives_idle: '30',
            statement_timeout: '15000',
            application_name: 'consmel-app',
        };

        Object.entries(defaultParams).forEach(([key, value]) => {
            if (!parsed.searchParams.has(key)) {
                parsed.searchParams.set(key, value);
            }
        });

        if (!parsed.searchParams.has('sslmode')) {
            parsed.searchParams.set('sslmode', isLocalHost ? 'disable' : 'require');
        }

        return parsed.toString();
    } catch {
        return connectionString;
    }
}

function makePrisma() {
    const databaseUrl = process.env.DATABASE_URL;
    
    // Check if using Prisma Accelerate (prisma+postgres:// protocol)
    if (databaseUrl?.includes('accelerate.prisma-data.net')) {
        // Extract the actual postgres URL from the prisma+postgres format
        const actualUrl = databaseUrl.replace('prisma+postgres://', 'postgres://');
        return new PrismaClient({
            datasourceUrl: actualUrl,
        }).$extends(withAccelerate());
    }

    const directUrl = withStablePgParams(process.env.DIRECT_DATABASE_URL);

    if (directUrl) {
        // Use driver adapter for direct Postgres connection (Prisma 7 pattern)
        const adapter = new PrismaPg({ connectionString: directUrl });
        return new PrismaClient({ adapter });
    }

    // Fallback to Accelerate proxy
    return new PrismaClient({
        datasourceUrl: databaseUrl,
    }).$extends(withAccelerate());
}

const prisma = globalForPrisma.prisma2 ?? makePrisma();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma2 = prisma;
}

export default prisma;
