import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    const badges = await prisma.badge.findMany()
    console.log(`Found ${badges.length} badges`)
    fs.writeFileSync('prisma/badges-dump.json', JSON.stringify(badges, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
