import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Calculate level based on total points
function calculateLevel(totalPoints: number): number {
    // Level formula: level = floor(sqrt(points / 100)) + 1
    // Level 1: 0-99 points
    // Level 2: 100-399 points
    // Level 3: 400-899 points
    // etc.
    return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
}

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthenticatedUser(request);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'all'; // 'all', 'month', 'week'

        // Calculate date filter based on period
        let dateFilter: Date | undefined;
        if (period === 'month') {
            dateFilter = new Date();
            dateFilter.setMonth(dateFilter.getMonth() - 1);
        } else if (period === 'week') {
            dateFilter = new Date();
            dateFilter.setDate(dateFilter.getDate() - 7);
        }

        // Get users with participation stats
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                image: true,
                totalPoints: true,
                level: true,
                participations: {
                    where: {
                        route: {
                            status: 'completed',
                            actualEndTime: dateFilter ? {
                                gte: dateFilter,
                            } : undefined,
                        },
                    },
                    select: {
                        routeId: true,
                    },
                },
            },
            orderBy: {
                totalPoints: 'desc',
            },
            take: 100, // Top 100 users
        });

        // Build leaderboard
        const leaderboard = users.map(user => {
            // Get unique routes completed
            const routesCompleted = new Set(user.participations.map(p => p.routeId)).size;

            return {
                userId: user.id,
                userName: user.name || 'Usuario',
                userImage: user.image,
                totalPoints: user.totalPoints,
                level: calculateLevel(user.totalPoints),
                routesCompleted,
            };
        })
            .filter(user => user.totalPoints > 0 || user.routesCompleted > 0) // Only users with activity
            .sort((a, b) => b.totalPoints - a.totalPoints || b.routesCompleted - a.routesCompleted)

        return NextResponse.json({ leaderboard });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}
