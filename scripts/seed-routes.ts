
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROUTES = [
    {
        name: "Clásicos del Centro 🏛️",
        description: "La esencia de Sevilla. Solera, chacina y lugares con siglos de historia.",
        city: "Sevilla",
        isPublic: true,
        isTemplate: true,
        startMode: "manual",
        stops: [
            {
                name: "Bodeguita Antonio Romero",
                address: "C. Antonia Díaz, 19, 41001 Sevilla",
                lat: 37.3872,
                lng: -5.9982,
                order: 0,
                plannedRounds: 3,
                stayDuration: 45,
                googlePlaceId: "ChIJO-yTPDFTEg0RJ_E7_EwzZ_0", // Optional but good if we had it
            },
            {
                name: "Flor de Toranzo",
                address: "C. Jimios, 1, 41001 Sevilla",
                lat: 37.3876,
                lng: -5.9956,
                order: 1,
                plannedRounds: 2,
                stayDuration: 30,
            },
            {
                name: "Casa Morales",
                address: "C. García de Vinuesa, 11, 41001 Sevilla",
                lat: 37.3866,
                lng: -5.9947,
                order: 2,
                plannedRounds: 2,
                stayDuration: 40,
            },
            {
                name: "Bodega Santa Cruz 'Las Columnas'",
                address: "C. Rodrigo Caro, 1, 41004 Sevilla",
                lat: 37.3860,
                lng: -5.9908,
                order: 3,
                plannedRounds: 3,
                stayDuration: 50,
            },
            {
                name: "El Rinconcillo",
                address: "C. Gerona, 40, 41003 Sevilla",
                lat: 37.3941,
                lng: -5.9872,
                order: 4,
                plannedRounds: 2,
                stayDuration: 45,
            },
        ],
    },
    {
        name: "Triana Pura 💃",
        description: "Cruza el puente y vive el barrio. Pescaíto, mercado y arte.",
        city: "Sevilla",
        isPublic: true,
        isTemplate: true,
        startMode: "manual",
        stops: [
            {
                name: "Las Golondrinas",
                address: "C. Pagés del Corro, 76, 41010 Sevilla",
                lat: 37.3841,
                lng: -6.0056,
                order: 0,
                plannedRounds: 3,
                stayDuration: 45,
            },
            {
                name: "Blanca Paloma",
                address: "C. San Jacinto, 49, 41010 Sevilla",
                lat: 37.3831,
                lng: -6.0058,
                order: 1,
                plannedRounds: 3,
                stayDuration: 50,
            },
            {
                name: "Mercado de Triana",
                address: "C. San Jorge, 6, 41010 Sevilla",
                lat: 37.3857,
                lng: -6.0036,
                order: 2,
                plannedRounds: 2,
                stayDuration: 40,
            },
            {
                name: "Taberna Miami",
                address: "C. San Jacinto, 21, 41010 Sevilla",
                lat: 37.3843,
                lng: -6.0043,
                order: 3,
                plannedRounds: 2,
                stayDuration: 40,
            },
            {
                name: "Casa Ruperto",
                address: "Av. Santa Cecilia, 2, 41010 Sevilla",
                lat: 37.3819,
                lng: -6.0086,
                order: 4,
                plannedRounds: 2,
                stayDuration: 30,
            },
        ],
    },
    {
        name: "Alameda Vibes 🕶️",
        description: "Fusión y modernidad en la zona más alternativa de la ciudad.",
        city: "Sevilla",
        isPublic: true,
        isTemplate: true,
        startMode: "manual",
        stops: [
            {
                name: "Eslava",
                address: "C. Eslava, 3, 41002 Sevilla",
                lat: 37.3965, // Approximated
                lng: -5.9965, // Approximated
                order: 0,
                plannedRounds: 3,
                stayDuration: 50,
            },
            {
                name: "Bar Antojo",
                address: "C. Calatrava, 44, 41002 Sevilla",
                lat: 37.4029,
                lng: -5.9949,
                order: 1,
                plannedRounds: 2,
                stayDuration: 45,
            },
            {
                name: "Duo Tapas",
                address: "C. Calatrava, 10, 41002 Sevilla",
                lat: 37.4014,
                lng: -5.9939,
                order: 2,
                plannedRounds: 2,
                stayDuration: 45,
            },
            {
                name: "La Niña Bonita",
                address: "C. Calatrava, 5, 41002 Sevilla",
                lat: 37.3986, // Approximated based on C. Calatrava standard numbering
                lng: -5.9961, // Approximated
                order: 3,
                plannedRounds: 2,
                stayDuration: 40,
            },
            {
                name: "Hops & Dreams",
                address: "C. Jesús del Gran Poder, 83, 41002 Sevilla",
                lat: 37.3995,
                lng: -5.9950, // Corrected from search
                order: 4,
                plannedRounds: 2,
                stayDuration: 60,
            },
        ],
    },
];

async function main() {
    console.log("🚀 Starting seeding routes...");

    for (const routeData of ROUTES) {
        // Check if exists
        const existing = await prisma.route.findFirst({
            where: {
                name: routeData.name,
                isTemplate: true,
                isPublic: true,
            },
        });

        if (existing) {
            console.log(`⚠️ Route "${routeData.name}" already exists. Skipping.`);
            continue;
        }

        // Create route
        const createdRoute = await prisma.route.create({
            data: {
                name: routeData.name,
                description: routeData.description,
                isPublic: routeData.isPublic,
                isTemplate: routeData.isTemplate,
                startMode: routeData.startMode,
                // city: routeData.city, // If schema doesn't have city, remove this. Checked schema, no 'city' field on Route.
                // We will add city to description or just omit since Discovery filters by location or text.
                stops: {
                    create: routeData.stops.map((stop) => ({
                        name: stop.name,
                        address: stop.address,
                        lat: stop.lat,
                        lng: stop.lng,
                        order: stop.order,
                        plannedRounds: stop.plannedRounds,
                        stayDuration: stop.stayDuration,
                        actualRounds: 0,
                    })),
                },
            },
        });

        console.log(`✅ Created route: ${createdRoute.name} (${createdRoute.id})`);
    }

    console.log("🏁 Seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
