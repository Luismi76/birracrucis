import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: routeId } = await params;

        // Get all beer consumptions for this route
        const beerConsumptions = await prisma.beerConsumption.findMany({
            where: {
                stop: {
                    routeId,
                },
            },
            select: {
                id: true,
                userId: true,
            },
        });

        // Get participants to map user info
        const participants = await prisma.participant.findMany({
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
        });

        // Count beers per participant
        const stats = participants.map((p) => {
            const userId = p.user?.id || p.guestId;
            const beersCount = beerConsumptions.filter(
                (bc) => bc.userId === userId
            ).length;

            return {
                id: userId || p.id,
                name: p.user?.name || p.name,
                image: p.user?.image || null,
                beersCount,
            };
        });

        return NextResponse.json({
            ok: true,
            stats,
        });
    } catch (error) {
        console.error("Error fetching participant stats:", error);
        return NextResponse.json(
            { ok: false, error: "Error fetching stats" },
            { status: 500 }
        );
    }
}
