import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

type RouteParams = {
    params: {
        id: string;
    };
};

// GET - Get all predictions for route
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

        const predictions = await prisma.prediction.findMany({
            where: { routeId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const formattedPredictions = predictions.map(prediction => ({
            id: prediction.id,
            userId: prediction.userId,
            userName: prediction.user.name || 'Usuario',
            userImage: prediction.user.image,
            type: prediction.type,
            prediction: JSON.parse(prediction.prediction),
            result: prediction.result ? JSON.parse(prediction.result) : null,
            isCorrect: prediction.isCorrect,
            points: prediction.points,
            createdAt: prediction.createdAt.toISOString(),
            resolvedAt: prediction.resolvedAt?.toISOString() || null,
        }));

        return NextResponse.json({ predictions: formattedPredictions });

    } catch (error) {
        console.error('Error fetching predictions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch predictions' },
            { status: 500 }
        );
    }
}

// POST - Create prediction
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
        const { userId, type, prediction } = body;

        if (!userId || !type || !prediction) {
            return NextResponse.json(
                { error: 'Missing userId, type, or prediction' },
                { status: 400 }
            );
        }

        // Valid prediction types
        const validTypes = ['finish_time', 'total_beers', 'mvp', 'slowest_drinker', 'most_social'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Invalid prediction type' },
                { status: 400 }
            );
        }

        // Create prediction
        const newPrediction = await prisma.prediction.create({
            data: {
                userId,
                routeId,
                type,
                prediction: JSON.stringify(prediction),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        return NextResponse.json({ prediction: newPrediction }, { status: 201 });

    } catch (error) {
        console.error('Error creating prediction:', error);
        return NextResponse.json(
            { error: 'Failed to create prediction' },
            { status: 500 }
        );
    }
}
