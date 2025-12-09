import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

        // Get users with their achievements count
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                image: true,
                totalPoints: true,
                level: true,
                achievements: {
                    where: dateFilter ? {
                        earnedAt: {
                            gte: dateFilter,
                        },
                    } : undefined,
                    select: {
                        points: true,
                    },
                },
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

        // Calculate period-specific points if needed
        const leaderboard = users.map(user => {
            const periodPoints = period === 'all'
                ? user.totalPoints
                : user.achievements.reduce((sum, ach) => sum + ach.points, 0);

            // Get unique routes completed
            const routesCompleted = new Set(user.participations.map(p => p.routeId)).size;

            return {
                userId: user.id,
                userName: user.name || 'Usuario',
                userImage: user.image,
                totalPoints: periodPoints,
                level: calculateLevel(periodPoints),
                achievementsCount: user.achievements.length,
                routesCompleted,
            };
        })
            .filter(user => user.totalPoints > 0) // Only users with points
            .sort((a, b) => b.totalPoints - a.totalPoints); // Re-sort by period points

        return NextResponse.json({ leaderboard });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}
