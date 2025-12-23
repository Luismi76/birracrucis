
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding screenshot data...')

    // 1. Create Test User
    const user = await prisma.user.upsert({
        where: { email: 'test@birracrucis.com' },
        update: {},
        create: {
            email: 'test@birracrucis.com',
            name: 'Usuario Demo',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        },
    })

    // 1b. Create Friend User
    const friend = await prisma.user.upsert({
        where: { email: 'friend@birracrucis.com' },
        update: {},
        create: {
            email: 'friend@birracrucis.com',
            name: 'Ana Amiga',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
        },
    })

    // 2. Create "Mis Rutas" Route
    const route = await prisma.route.create({
        data: {
            name: 'Ruta Legendaria 🍻',
            description: 'La ruta anual con el grupo. Tapas, risas y anécdotas.',
            creatorId: user.id,
            date: new Date(), // Today
            isPublic: false,
            status: 'ACTIVE',
            potEnabled: true,
            potAmountPerPerson: 20,
            stops: {
                create: [
                    {
                        name: 'La Taberna del Sur',
                        address: 'Calle Falsa 123',
                        lat: 40.4168,
                        lng: -3.7038,
                        order: 0,
                        plannedRounds: 2,
                        actualRounds: 1, // In progress
                        stayDuration: 60,
                    },
                    {
                        name: 'El Patio de los Olivos',
                        address: 'Plaza Mayor 1',
                        lat: 40.4170,
                        lng: -3.7040,
                        order: 1,
                        plannedRounds: 2,
                        stayDuration: 45,
                    },
                ]
            },
            participants: {
                create: [
                    {
                        user: { connect: { id: user.id } },
                        status: 'ACCEPTED',
                        role: 'OWNER'
                    },
                    {
                        user: { connect: { id: friend.id } },
                        status: 'ACCEPTED',
                        role: 'MEMBER'
                    }
                ]
            },
            potContributions: {
                create: [
                    {
                        user: { connect: { id: user.id } },
                        userName: user.name,
                        amount: 20
                    }
                ]
            }
        }
    })

    console.log('✅ Created Route:', route.name)
    console.log('🏁 Seeding complete.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
