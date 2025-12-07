import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const guestId = cookieStore.get("guestId")?.value;

        // Allow both authenticated users and guests
        if (!session?.user?.email && !guestId) {
            return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
        }

        const { id: routeId } = await params;

        // Get all participants with their stats
        const participants = await prisma.participant.findMany({
            where: { routeId },
            include: {
                user: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        // Get rounds per participant
        const rounds = await prisma.round.groupBy({
            by: ['userId'],
            where: {
                stop: {
                    routeId
                }
            },
            _count: {
                id: true
            }
        });

        // Get ratings per participant
        const ratings = await prisma.barRating.groupBy({
            by: ['userId'],
            where: {
                routeId
            },
            _avg: {
                rating: true
            }
        });

        // Build rankings
        const rankings = participants.map((p: any) => {
            const userId = p.userId || p.guestId || '';
            const roundsCount = rounds.find((r: any) => r.userId === userId)?._count.id || 0;
            const avgRating = ratings.find((r: any) => r.userId === userId)?._avg.rating || 0;

            // Calculate spent based on rounds
            const spent = roundsCount * 1.5;

            // Bars visited - simplified for now
            const barsVisited = 0;

            return {
                userId,
                name: p.user?.name || p.name || 'Invitado',
                image: p.user?.image || p.avatar,
                rounds: roundsCount,
                spent,
                barsVisited,
                avgRating: Number(avgRating.toFixed(1))
            };
        });

        return NextResponse.json({ ok: true, rankings });
    } catch (error) {
        console.error("Error en GET /api/routes/[id]/rankings:", error);
        return NextResponse.json({ ok: false, error: "Error al obtener rankings" }, { status: 500 });
    }
}
