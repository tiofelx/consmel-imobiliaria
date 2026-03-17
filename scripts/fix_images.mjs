import { PrismaClient } from '../lib/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
    await prisma.property.update({
        where: {
            id: "OQW8EBY8V81H"
        },
        data: {
            images: {
                create: [
                    {
                        url: '/imoveis/images/Terreno1.jpeg',
                        order: 0,
                    },
                    {
                        url: '/imoveis/images/Terreno2.jpeg',
                        order: 1,
                    }
                ]
            }
        }
    });

    console.log('Restored original images to the property!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
