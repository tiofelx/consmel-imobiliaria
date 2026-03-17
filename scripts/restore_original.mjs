import { PrismaClient } from '../lib/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
    await prisma.property.deleteMany({});

    await prisma.property.create({
        data: {
            id: "OQW8EBY8V81H",
            title: 'Terreno Espaçoso em Curva da Galinha',
            description: 'Amplo terreno, oportunidade de negócio para o seu lazer ou construção.',
            transactionType: 'Venda',
            category: 'Terreno',
            price: 300000,
            totalArea: 1350,
            city: 'Guaraci',
            state: 'SP',
            neighborhood: 'Curva da Galinha',
            latitude: -20.4851,
            longitude: -48.9712,
        }
    });

    console.log('Restored original property and cleaned mocks!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
