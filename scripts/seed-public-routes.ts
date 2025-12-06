import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de rutas públicas...');

    // 1. Obtener un usuario creador (o el primero que encontremos)
    let creator = await prisma.user.findFirst({
        orderBy: { rounds: { _count: 'desc' } } // Preferimos un usuario activo
    });

    if (!creator) {
        console.log('⚠️ No se encontraron usuarios. Creando usuario "System"...');
        creator = await prisma.user.create({
            data: {
                name: 'Birracrucis Team',
                email: 'team@birracrucis.com',
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BirraTeam',
            }
        });
    }

    console.log(`👤 Creador asignado: ${creator.name} (${creator.id})`);

    const routes = [
        // --- MADRID: La Latina ---
        {
            name: '🇪🇸 Madrid: Clásicos de La Latina',
            description: 'La ruta definitiva por la Cava Baja y Plaza de la Paja. Tortillas, huevos rotos y vermut.',
            city: 'Madrid',
            stops: [
                { name: 'Juana La Loca', address: 'Plaza de Puerta de Moros, 4', lat: 40.4116, lng: -3.7125, order: 0 },
                { name: 'Casa Lucio', address: 'C. de la Cava Baja, 35', lat: 40.4132, lng: -3.7095, order: 1 },
                { name: 'El Viajero', address: 'Plaza de la Cebada, 11', lat: 40.4111, lng: -3.7108, order: 2 },
                { name: 'Lamiak', address: 'C. de la Cava Baja, 42', lat: 40.4135, lng: -3.7092, order: 3 },
            ]
        },
        // --- BARCELONA: El Born ---
        {
            name: '🇪🇸 BCN: Tapeo en El Born',
            description: 'Historia y gastronomía en las callejuelas del Born. Desde el Xampanyet hasta Cal Pep.',
            city: 'Barcelona',
            stops: [
                { name: 'El Xampanyet', address: 'Carrer de Montcada, 22', lat: 41.3843, lng: 2.1818, order: 0 },
                { name: 'Bar del Pla', address: 'Carrer de Montcada, 2', lat: 41.3851, lng: 2.1799, order: 1 },
                { name: 'Cal Pep', address: 'Plaça de les Olles, 8', lat: 41.3835, lng: 2.1832, order: 2 },
                { name: 'La Vinya del Senyor', address: 'Plaça de Santa Maria, 5', lat: 41.3837, lng: 2.1821, order: 3 },
            ]
        },
        // --- SEVILLA: Alameda ---
        {
            name: '🇪🇸 Sevilla: Alameda de Hércules',
            description: 'El corazón alternativo de Sevilla. Bares con terraza, sol y cruzcampo bien fría.',
            city: 'Sevilla',
            stops: [
                { name: 'Las Columnas', address: 'Alameda de Hércules, 19', lat: 37.3995, lng: -5.9935, order: 0 },
                { name: 'Duo Tapas', address: 'Calle Calatrava, 10', lat: 37.4012, lng: -5.9942, order: 1 },
                { name: 'Eslava', address: 'Calle Eslava, 3', lat: 37.3998, lng: -5.9965, order: 2 }, // Un poco fuera pero imprescindible
                { name: 'Casa Paco', address: 'Alameda de Hércules, 23', lat: 37.3991, lng: -5.9933, order: 3 },
            ]
        },
        // --- ZARAGOZA: El Tubo ---
        {
            name: '🇪🇸 Zaragoza: El Tubo Mítico',
            description: 'Perderse por el Tubo es obligatorio. Migas, champiñones y ambiente maño.',
            city: 'Zaragoza',
            stops: [
                { name: 'El Champi', address: 'Calle Libertad, 16', lat: 41.6525, lng: -0.8785, order: 0 },
                { name: 'Bodegas Almau', address: 'Calle Estébanes, 10', lat: 41.6521, lng: -0.8782, order: 1 },
                { name: 'La Miguería', address: 'Calle Estébanes, 4', lat: 41.6520, lng: -0.8780, order: 2 },
                { name: 'Doña Casta', address: 'Calle Estébanes, 6', lat: 41.6520, lng: -0.8781, order: 3 },
            ]
        }
    ];

    for (const routeData of routes) {
        // Verificar si ya existe por nombre approx
        const existing = await prisma.route.findFirst({
            where: { name: routeData.name, isPublic: true }
        });

        if (existing) {
            console.log(`⏩ Saltando ${routeData.name} (ya existe)`);
            continue;
        }

        // Crear Ruta
        const route = await prisma.route.create({
            data: {
                name: routeData.name,
                description: routeData.description,
                date: new Date(), // Fecha actual como referencia
                startMode: 'manual',
                status: 'pending',
                isPublic: true,
                potEnabled: false,
                creatorId: creator.id,
                stops: {
                    create: routeData.stops.map(stop => ({
                        name: stop.name,
                        address: stop.address,
                        lat: stop.lat,
                        lng: stop.lng,
                        order: stop.order,
                        plannedRounds: 2, // Default
                        stayDuration: 45, // 45 min por bar
                    }))
                }
            }
        });

        // FIX: routeData.city instead of route.city
        console.log(`✅ Creada ruta: ${route.name} (${routeData.city})`);
    }

    console.log('🏁 Seed completado.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
