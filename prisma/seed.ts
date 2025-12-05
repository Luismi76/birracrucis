import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.upsert({
        where: { email: 'test@birracrucis.com' },
        update: {},
        create: {
            email: 'test@birracrucis.com',
            name: 'Usuario de Prueba',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        },
    })
    console.log({ user })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
