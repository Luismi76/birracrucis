import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteParams = {
    params: {
        id: string;
    };
};

// Achievement types and their point values
const ACHIEVEMENT_TYPES = {
    first_beer: { title: 'Primera Cerveza', description: 'Primera cerveza de la ruta', points: 10 },
    speed_demon: { title: 'Demonio de la Velocidad', description: 'Llegaste primero a 3 bares', points: 50 },
    social_butterfly: { title: 'Mariposa Social', description: 'Enviaste 10 mensajes', points: 30 },
    night_owl: { title: 'Ave Nocturna', description: 'Ruta después de las 10 PM', points: 20 },
    early_bird: { title: 'Madrugador', description: 'Ruta antes de las 12 PM', points: 20 },
    marathon_runner: { title: 'Maratonista', description: 'Completaste ruta de 5+ bares', points: 100 },
    bar_hopper: { title: 'Saltador de Bares', description: 'Visitaste 10 bares diferentes', points: 75 },
};

// GET - Get all achievements for a route
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

        const achievements = await prisma.achievement.findMany({
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
                earnedAt: 'desc',
            },
        });

        const formattedAchievements = achievements.map(achievement => ({
            id: achievement.id,
            userId: achievement.userId,
            userName: achievement.user.name || 'Usuario',
            userImage: achievement.user.image,
            type: achievement.type,
            title: achievement.title,
            description: achievement.description,
            points: achievement.points,
            earnedAt: achievement.earnedAt.toISOString(),
        }));

        return NextResponse.json({ achievements: formattedAchievements });

    } catch (error) {
        console.error('Error fetching achievements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch achievements' },
            { status: 500 }
        );
    }
}

// POST - Award achievement to user
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
        const { userId, type, metadata } = body;

        if (!userId || !type) {
            return NextResponse.json(
                { error: 'Missing userId or type' },
                { status: 400 }
            );
        }

        // Check if achievement type is valid
        const achievementConfig = ACHIEVEMENT_TYPES[type as keyof typeof ACHIEVEMENT_TYPES];
        if (!achievementConfig) {
            return NextResponse.json(
                { error: 'Invalid achievement type' },
                { status: 400 }
            );
        }

        // Check if user already has this achievement for this route
        const existing = await prisma.achievement.findUnique({
            where: {
                userId_routeId_type: {
                    userId,
                    routeId,
                    type,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Achievement already earned' },
                { status: 409 }
            );
        }

        // Create achievement
        const achievement = await prisma.achievement.create({
            data: {
                userId,
                routeId,
                type,
                title: achievementConfig.title,
                description: achievementConfig.description,
                points: achievementConfig.points,
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

        // Update user's total points
        await prisma.user.update({
            where: { id: userId },
            data: {
                totalPoints: {
                    increment: achievementConfig.points,
                },
            },
        });

        return NextResponse.json({ achievement }, { status: 201 });

    } catch (error) {
        console.error('Error creating achievement:', error);
        return NextResponse.json(
            { error: 'Failed to create achievement' },
            { status: 500 }
        );
    }
}
