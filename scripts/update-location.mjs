import { PrismaClient } from '../lib/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.property.updateMany({
        where: { neighborhood: 'Curva da Galinha' },
        data: {
            latitude: -20.5065555,
            longitude: -48.9160555,
            city: 'Guaraci',
            state: 'SP'
        }
    });

    console.log(`Propriedades atualizadas: ${result.count}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
