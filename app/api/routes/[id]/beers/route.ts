import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserIds } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// GET - Get beer consumption stats for route (usando modelo Drink)
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const auth = await getCurrentUser(request);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { id: routeId } = await context.params;

        // Get all drinks for this route (consolidado desde BeerConsumption)
        const drinks = await prisma.drink.findMany({
            where: { routeId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                stop: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Aggregate by user (usuarios registrados)
        const userStats: Record<string, {
            odId: string;
            odType: 'user' | 'guest';
            userName: string;
            userImage: string | null;
            totalBeers: number;
            beersByStop: Record<string, { stopId: string; stopName: string; count: number }>;
        }> = {};

        for (const drink of drinks) {
            // Identificador único: odId (owner ID) puede ser odId o guestId
            const odId = drink.userId || drink.guestId || 'unknown';
            const odType = drink.userId ? 'user' : 'guest';

            if (!userStats[odId]) {
                userStats[odId] = {
                    odId,
                    odType,
                    userName: drink.user?.name || `Invitado ${odId.slice(0, 4)}`,
                    userImage: drink.user?.image || null,
                    totalBeers: 0,
                    beersByStop: {},
                };
            }

            userStats[odId].totalBeers += 1;

            if (!userStats[odId].beersByStop[drink.stopId]) {
                userStats[odId].beersByStop[drink.stopId] = {
                    stopId: drink.stopId,
                    stopName: drink.stop.name,
                    count: 0,
                };
            }

            userStats[odId].beersByStop[drink.stopId].count += 1;
        }

        // Convert to array and sort by total beers
        const participants = Object.values(userStats)
            .map((stat) => ({
                ...stat,
                // Mantener compatibilidad con el frontend que espera odId
                userId: stat.odId,
                beersByStop: Object.values(stat.beersByStop),
            }))
            .sort((a, b) => b.totalBeers - a.totalBeers);

        return NextResponse.json({ participants });

    } catch (error) {
        console.error('Error fetching beer consumption:', error);
        return NextResponse.json(
            { error: 'Failed to fetch beer consumption' },
            { status: 500 }
        );
    }
}

// POST - Record beer consumption (usando modelo Drink)
export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const auth = await getCurrentUser(request);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { userId, guestId } = getUserIds(auth.user);

        // Para requests del cliente que envían userId explícitamente
        const { id: routeId } = await context.params;
        const body = await request.json();
        const { userId: bodyUserId, stopId, count = 1 } = body;

        // Usar el userId del body si viene (para gamificación desde el cliente)
        // o el de la sesión si no
        const effectiveUserId = bodyUserId || userId;

        if (!stopId) {
            return NextResponse.json(
                { error: 'Missing stopId' },
                { status: 400 }
            );
        }

        // Verificar que el stop pertenece a la ruta
        const stop = await prisma.routeStop.findFirst({
            where: { id: stopId, routeId },
        });

        if (!stop) {
            return NextResponse.json({ error: 'Stop not found in route' }, { status: 404 });
        }

        // Verificar que el usuario es participante
        const participant = await prisma.participant.findFirst({
            where: { routeId, userId: effectiveUserId },
        });

        if (!participant) {
            return NextResponse.json(
                { error: 'User is not a participant' },
                { status: 403 }
            );
        }

        // Crear registros de bebida (uno por cada count)
        // Esto mantiene compatibilidad con el modelo Drink que no tiene campo count
        const drinks = [];
        for (let i = 0; i < count; i++) {
            const drink = await prisma.drink.create({
                data: {
                    routeId,
                    stopId,
                    userId: effectiveUserId,
                    type: 'beer',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                    stop: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            drinks.push(drink);
        }

        // Devolver el último drink creado para compatibilidad
        return NextResponse.json({
            consumption: drinks[drinks.length - 1],
            count: drinks.length
        }, { status: 201 });

    } catch (error) {
        console.error('Error recording beer consumption:', error);
        return NextResponse.json(
            { error: 'Failed to record beer consumption' },
            { status: 500 }
        );
    }
}
