import prisma from '@/lib/prisma';
import { toPublicProperty } from '@/lib/public-property';
import { safeLogError } from '@/lib/safe-log';
import HomeContent from './HomeContent';

export default async function Home() {
    let properties = [];
    try {
        const rows = await prisma.property.findMany({
            include: { images: { orderBy: { order: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });
        // Só os campos públicos vão para o navegador.
        properties = rows.map(toPublicProperty);
    } catch (error) {
        safeLogError('Home properties error', error);
    }

    return <HomeContent properties={properties} />;
}
