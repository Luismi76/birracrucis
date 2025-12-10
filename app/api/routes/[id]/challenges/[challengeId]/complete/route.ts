import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// POST - Complete a challenge
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; challengeId: string }> }
) {
    try {
        const auth = await getAuthenticatedUser(req);
        if (!auth.ok) {
            return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
        }

        const { id: routeId, challengeId } = await params;
        const body = await req.json();
        const { photoUrl } = body;
        const userId = auth.user.id;

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
                photoUrl: photoUrl || null,
            },
        });

        // If photo provided, create Photo record linked to challenge
        if (photoUrl) {
            await prisma.photo.create({
                data: {
                    routeId,
                    stopId: challenge.stopId,
                    userId,
                    url: photoUrl,
                    caption: `Desafío: ${challenge.title}`,
                    challengeId: challengeId,
                },
            });
        }

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
