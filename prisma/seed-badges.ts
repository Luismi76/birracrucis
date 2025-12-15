import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Pre-check: Badges in DB:')
    const existing = await prisma.badge.findMany()
    existing.forEach(b => console.log(`[${b.code}] ${b.name}: ${b.description}`))

    const badges = [
        {
            code: "FIRST_ROUND",
            name: "Novato",
            description: "Has registrado tu primera ronda. ¡Salud!",
            icon: "🍺"
        },
        {
            code: "FIRST_ROUTE",
            name: "Caminante",
            description: "Has completado tu primera ruta.",
            icon: "🚶"
        },
        {
            code: "FIRST_PHOTO",
            name: "Paparazzi",
            description: "Has subido tu primera foto.",
            icon: "📸"
        },
        {
            code: "TEN_ROUTES",
            name: "Rey de la Fiesta",
            description: "Has completado 10 rutas. ¡Eres una leyenda!",
            icon: "👑"
        },
        {
            code: "NIGHT_OWL",
            name: "Búho Nocturno",
            description: "Registrar una ronda después de las 2:00 AM",
            icon: "🦉"
        },
        {
            code: "EARLY_BIRD",
            name: "Madrugador",
            description: "Empezar una ruta antes de las 12:00 PM",
            icon: "☀️"
        }
    ]

    console.log('🌱 Seeding badges...')

    try {
        await prisma.badge.createMany({
            data: badges,
            skipDuplicates: true,
        })
        console.log(`✅ Created ${badges.length} badges (skipping duplicates)`)

        // Verificar
        const count = await prisma.badge.count()
        console.log(`Total badges in DB: ${count}`)
    } catch (error) {
        console.error("Error seeding badges detailed:", JSON.stringify(error, null, 2))
        throw error
    }
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
