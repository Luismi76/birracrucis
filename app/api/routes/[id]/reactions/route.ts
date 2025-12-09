import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// GET - Get all reactions for route
export async function GET(
    request: Request,
    context: RouteContext
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: routeId } = await context.params;

        const reactions = await prisma.barReaction.findMany({
            where: { routeId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
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

        // Group by stop and type
        const reactionsByStop = reactions.reduce((acc: Record<string, Record<string, number>>, reaction) => {
            const stopId = reaction.stopId;

            if (!acc[stopId]) {
                acc[stopId] = {};
            }

            if (!acc[stopId][reaction.type]) {
                acc[stopId][reaction.type] = 0;
            }

            acc[stopId][reaction.type]++;

            return acc;
        }, {});

        return NextResponse.json({ reactions: reactionsByStop });

    } catch (error) {
        console.error('Error fetching reactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reactions' },
            { status: 500 }
        );
    }
}

// POST - Add reaction to stop
export async function POST(
    request: Request,
    context: RouteContext
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: routeId } = await context.params;
        const body = await request.json();
        const { userId, stopId, type } = body;

        if (!userId || !stopId || !type) {
            return NextResponse.json(
                { error: 'Missing userId, stopId, or type' },
                { status: 400 }
            );
        }

        // Valid reaction types
        const validTypes = ['fire', 'heart', 'thumbs_up', 'party', 'star'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Invalid reaction type' },
                { status: 400 }
            );
        }

        // Create or update reaction (upsert)
        const reaction = await prisma.barReaction.upsert({
            where: {
                userId_routeId_stopId_type: {
                    userId,
                    routeId,
                    stopId,
                    type,
                },
            },
            update: {
                createdAt: new Date(), // Update timestamp
            },
            create: {
                userId,
                routeId,
                stopId,
                type,
            },
        });

        return NextResponse.json({ reaction }, { status: 201 });

    } catch (error) {
        console.error('Error creating reaction:', error);
        return NextResponse.json(
            { error: 'Failed to create reaction' },
            { status: 500 }
        );
    }
}
