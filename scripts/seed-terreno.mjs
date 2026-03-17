import { PrismaClient } from '../lib/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
    const property = await prisma.property.create({
        data: {
            title: 'Terreno Espaçoso em Curva da Galinha',
            description: 'Excelente terreno com 1.338,65 m² de área total.',
            transactionType: 'Venda',
            category: 'Terreno',
            price: 1500000,
            usableArea: 1338.65,
            totalArea: 1338.65,
            neighborhood: 'Curva da Galinha',
            city: 'Desconhecido',
            images: {
                create: [
                    { url: '/imoveis/images/Terreno1.jpeg', order: 1 },
                    { url: '/imoveis/images/Terreno2.jpeg', order: 2 }
                ]
            }
        }
    });

    console.log('Imóvel cadastrado com sucesso:', property);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
