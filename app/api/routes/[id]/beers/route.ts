import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

type RouteParams = {
    params: {
        id: string;
    };
};

// GET - Get beer consumption stats for route
export async function GET(
    request: Request,
    { params }: RouteParams
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: routeId } = params;

        // Get all beer consumptions for this route
        const consumptions = await prisma.beerConsumption.findMany({
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
                timestamp: 'desc',
            },
        });

        // Aggregate by user
        const userStats = consumptions.reduce((acc, consumption) => {
            const userId = consumption.userId;

            if (!acc[userId]) {
                acc[userId] = {
                    userId,
                    userName: consumption.user.name || 'Usuario',
                    userImage: consumption.user.image,
                    totalBeers: 0,
                    beersByStop: {},
                };
            }

            acc[userId].totalBeers += consumption.count;

            if (!acc[userId].beersByStop[consumption.stopId]) {
                acc[userId].beersByStop[consumption.stopId] = {
                    stopId: consumption.stopId,
                    stopName: consumption.stop.name,
                    count: 0,
                };
            }

            acc[userId].beersByStop[consumption.stopId].count += consumption.count;

            return acc;
        }, {} as Record<string, any>);

        // Convert to array and sort by total beers
        const participants = Object.values(userStats)
            .map((stat: any) => ({
                ...stat,
                beersByStop: Object.values(stat.beersByStop),
            }))
            .sort((a: any, b: any) => b.totalBeers - a.totalBeers);

        return NextResponse.json({ participants });

    } catch (error) {
        console.error('Error fetching beer consumption:', error);
        return NextResponse.json(
            { error: 'Failed to fetch beer consumption' },
            { status: 500 }
        );
    }
}

// POST - Record beer consumption
export async function POST(
    request: Request,
    { params }: RouteParams
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: routeId } = params;
        const body = await request.json();
        const { userId, stopId, count = 1 } = body;

        if (!userId || !stopId) {
            return NextResponse.json(
                { error: 'Missing userId or stopId' },
                { status: 400 }
            );
        }

        // Verify route exists and user is participant
        const route = await prisma.route.findUnique({
            where: { id: routeId },
            include: {
                participants: {
                    where: { userId },
                },
            },
        });

        if (!route) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        if (route.participants.length === 0) {
            return NextResponse.json(
                { error: 'User is not a participant' },
                { status: 403 }
            );
        }

        // Create beer consumption record
        const consumption = await prisma.beerConsumption.create({
            data: {
                userId,
                routeId,
                stopId,
                count,
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

        return NextResponse.json({ consumption }, { status: 201 });

    } catch (error) {
        console.error('Error recording beer consumption:', error);
        return NextResponse.json(
            { error: 'Failed to record beer consumption' },
            { status: 500 }
        );
    }
}
