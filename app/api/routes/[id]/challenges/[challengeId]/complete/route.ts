import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST - Complete a challenge
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; challengeId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id: routeId, challengeId } = await params;

        // Get user ID
        let userId: string | undefined;
        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
            });
            userId = user?.id;
        }

        if (!userId) {
            return NextResponse.json(
                { ok: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Get the challenge
        const challenge = await prisma.barChallenge.findUnique({
            where: { id: challengeId },
        });

        if (!challenge) {
            return NextResponse.json(
                { ok: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        if (challenge.completed) {
            return NextResponse.json(
                { ok: false, error: 'Challenge already completed' },
                { status: 400 }
            );
        }

        // Mark challenge as completed
        const updatedChallenge = await prisma.barChallenge.update({
            where: { id: challengeId },
            data: {
                completed: true,
                completedAt: new Date(),
                completedBy: userId,
            },
        });

        // Award points to user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                totalPoints: {
                    increment: challenge.points,
                },
            },
        });

        // Create achievement for completing challenge
        try {
            await prisma.achievement.create({
                data: {
                    userId,
                    routeId,
                    type: `challenge_${challenge.type}`,
                    title: `Desafío completado: ${challenge.title}`,
                    description: challenge.description,
                    points: challenge.points,
                },
            });
        } catch (achievementError) {
            // Achievement might already exist, that's ok
            console.log('Achievement creation skipped (might already exist)');
        }

        return NextResponse.json({
            ok: true,
            challenge: updatedChallenge,
            pointsEarned: challenge.points,
            totalPoints: updatedUser.totalPoints,
        });
    } catch (error) {
        console.error('Error completing challenge:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to complete challenge' },
            { status: 500 }
        );
    }
}
