import { PrismaClient } from '../lib/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
    await prisma.property.updateMany({
        data: {
            latitude: -20.5065555,
            longitude: -48.9160555,
        }
    });

    console.log('Updated property coordinates to be centered!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
