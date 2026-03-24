import prisma from '../lib/prisma.js';

async function main() {
    await prisma.property.create({
        data: {
            id: "MOCKPROP0001",
            title: 'Casa Luxuosa no Centro',
            description: 'Linda casa com 3 quartos...',
            transactionType: 'Venda',
            category: 'Casa',
            price: 850000,
            bedrooms: 3,
            bathrooms: 2,
            usableArea: 150,
            totalArea: 250,
            city: 'Guaraci',
            state: 'SP',
            neighborhood: 'Centro',
            latitude: -20.4851,
            longitude: -48.9712,
            images: {
                create: [
                    {
                        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
                        order: 0,
                    }
                ]
            }
        }
    });

    await prisma.property.create({
        data: {
            id: "MOCKPROP0002",
            title: 'Terreno Amplo para Construção',
            description: 'Ótima oportunidade de investimento',
            transactionType: 'Aluguel',
            category: 'Terreno',
            price: 2500,
            totalArea: 500,
            city: 'Guaraci',
            state: 'SP',
            neighborhood: 'Jardim das Flores',
            latitude: -20.4900,
            longitude: -48.9600,
            images: {
                create: [
                    {
                        url: 'https://images.unsplash.com/photo-1524813686514-a57563d77965',
                        order: 0,
                    }
                ]
            }
        }
    });

    console.log('Mock properties created!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
