import prisma from '@/lib/prisma';

// Lido no pedido: o build não consulta o banco.
export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
// Boleto, extrato e informe ficam de fora enquanto forem demonstração.
const PAGES = ['', '/imoveis', '/lancamento', '/cadastro-imovel', '/despachante', '/sobre', '/contato', '/politica-de-privacidade'];

export default async function sitemap() {
    const properties = await prisma.property.findMany({ select: { id: true, updatedAt: true } });

    return [
        ...PAGES.map((path) => ({ url: `${BASE_URL}${path}` })),
        ...properties.map((property) => ({ url: `${BASE_URL}/imoveis/${property.id}`, lastModified: property.updatedAt })),
    ];
}
