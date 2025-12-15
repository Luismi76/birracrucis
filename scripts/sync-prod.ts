
import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env (Local/Dev)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
    const prodUrl = process.env.PROD_DATABASE_URL;

    if (!prodUrl) {
        console.error("❌ Por favor, define PROD_DATABASE_URL en tus variables de entorno o pásalo al script.");
        console.error("Ejemplo: PROD_DATABASE_URL='postgresql://...' npx tsx scripts/sync-prod.ts");
        process.exit(1);
    }

    console.log("🔌 Conectando a Base de Datos de Producción...");
    const client = new Client({
        connectionString: prodUrl,
        ssl: prodUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined // Auto-detect SSL need
    });

    try {
        await client.connect();
        console.log("✅ Conexión a Producción establecida.");

        // 1. Fetch Users (Creators)
        console.log("📥 Descargando Usuarios (Creadores)...");
        const resUsers = await client.query('SELECT * FROM "User"'); // Fetch essential fields or all? All is safer for integrity.
        const users = resUsers.rows;
        console.log(`   -> Encontrados ${users.length} usuarios.`);

        // 2. Fetch Routes
        console.log("📥 Descargando Rutas...");
        const resRoutes = await client.query('SELECT * FROM "Route"');
        const routes = resRoutes.rows;
        console.log(`   -> Encontradas ${routes.length} rutas.`);

        // 3. Fetch RouteStops
        console.log("📥 Descargando Paradas (Stops)...");
        const resStops = await client.query('SELECT * FROM "RouteStop"');
        const stops = resStops.rows;
        console.log(`   -> Encontradas ${stops.length} paradas.`);

        console.log("💾 Escribiendo en Base de Datos LOCAL (Dev)...");

        // UPSERT USERS
        let usersUpserted = 0;
        for (const u of users) {
            await prisma.user.upsert({
                where: { id: u.id },
                update: {
                    name: u.name,
                    image: u.image,
                    email: u.email,
                    // Don't overwrite critical local auth fields if they exist, but here we clone.
                },
                create: {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    image: u.image,
                    emailVerified: u.emailVerified ? new Date(u.emailVerified) : null,
                    // Defaults for others
                }
            });
            usersUpserted++;
        }
        console.log(`   ✅ ${usersUpserted} usuarios sincronizados.`);

        // UPSERT ROUTES
        let routesUpserted = 0;
        for (const r of routes) {
            // Handle FK: creatorId must exist (handled above).
            // Check if originalRouteId or templateId exist. If they refer to routes not yet inserted, this might fail.
            // Best approach: Insert routes without self-relations first, then update them?
            // Or simply Ignore self-relations for now if they cause issues, OR rely on ordering (if creation date order is respected).
            // Since we fetch all, we can try robust upsert.

            // Clean fields
            const { id, creatorId, ...data } = r;

            // Ensure date fields are Dates
            if (data.date) data.date = new Date(data.date);
            if (data.createdAt) data.createdAt = new Date(data.createdAt);
            // ... handled by Prisma driver mostly

            await prisma.route.upsert({
                where: { id: r.id },
                update: {
                    ...data,
                    creatorId: r.creatorId, // Link creator
                },
                create: {
                    ...data,
                    id: r.id, // Keep same ID
                    creatorId: r.creatorId,
                }
            });
            routesUpserted++;
        }
        console.log(`   ✅ ${routesUpserted} rutas sincronizadas.`);

        // UPSERT STOPS
        let stopsUpserted = 0;
        for (const s of stops) {
            const { id, routeId, ...data } = s;
            await prisma.routeStop.upsert({
                where: { id: s.id },
                update: { ...data, routeId },
                create: { ...data, id: s.id, routeId }
            });
            stopsUpserted++;
        }
        console.log(`   ✅ ${stopsUpserted} paradas sincronizadas.`);

        console.log("\n🎉 Sincronización COMPLETADA con éxito.");

    } catch (err) {
        console.error("❌ Error durante la sincronización:", err);
    } finally {
        await client.end();
        await prisma.$disconnect();
    }
}

main();
