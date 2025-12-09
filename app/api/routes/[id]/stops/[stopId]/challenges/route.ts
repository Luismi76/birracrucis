import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChallengesForStop } from '@/lib/challenge-templates';

// GET - Get challenges for a specific stop
// Generates challenges dynamically if they don't exist yet
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; stopId: string }> }
) {
    try {
        const { id: routeId, stopId } = await params;

        // Check if challenges already exist for this stop
        let challenges = await prisma.barChallenge.findMany({
            where: {
                routeId,
                stopId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        // If no challenges exist, generate them dynamically
        if (challenges.length === 0) {
            const challengeData = generateChallengesForStop(routeId, stopId, 2);

            // Create challenges in database
            for (const data of challengeData) {
                const challenge = await prisma.barChallenge.create({
                    data: {
                        routeId: data.routeId,
                        stopId: data.stopId,
                        type: data.type,
                        title: data.title,
                        description: data.description,
                        points: data.points,
                    },
                });
                challenges.push(challenge);
            }
        }

        return NextResponse.json({
            ok: true,
            challenges,
        });
    } catch (error) {
        console.error('Error fetching/generating challenges:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to get challenges' },
            { status: 500 }
        );
    }
}
