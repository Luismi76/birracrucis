import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

function generateInviteCode(): string {
    return nanoid(8).toUpperCase();
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        let userId = session?.user?.id || null;

        // Ensure user exists if session is present (ignoring complex auth logic for now, similar to create route)
        if (session?.user?.email) {
            const user = await prisma.user.upsert({
                where: { email: session.user.email },
                update: {},
                create: {
                    email: session.user.email,
                    name: session.user.name,
                    image: session.user.image,
                },
            });
            userId = user.id;
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Parse body for optional overrides
        const body = await req.json().catch(() => ({}));

        const originalRoute = await prisma.route.findUnique({
            where: { id },
            include: { stops: true }
        });

        if (!originalRoute) {
            return NextResponse.json({ error: "Route not found" }, { status: 404 });
        }

        // Generate unique invite code
        let inviteCode = generateInviteCode();
        let attempts = 0;
        while (attempts < 5) {
            const existing = await prisma.route.findUnique({ where: { inviteCode } });
            if (!existing) break;
            inviteCode = generateInviteCode();
            attempts++;
        }

        // Prepare date
        const newDate = body.date ? new Date(body.date) : new Date();
        // Reset time to start of day for the route date logic usually
        newDate.setHours(0, 0, 0, 0);

        const newRoute = await prisma.route.create({
            data: {
                name: body.name || `Copia de ${originalRoute.name}`,
                date: newDate,
                inviteCode,
                creatorId: userId,
                isPublic: body.isPublic ?? false,
                originalRouteId: originalRoute.id,
                description: originalRoute.description,
                // Copy timing config but reset actual times
                startMode: originalRoute.startMode,
                hasEndTime: originalRoute.hasEndTime,
                // If original had start/end times separate from date, we might want to adjust them to the new date
                // For simplicity, we'll nullify specific times unless provided or complex logic is added
                // Generally better to reset schedule for a new edition
                startTime: null,
                endTime: null,

                stops: {
                    create: originalRoute.stops.map(stop => ({
                        name: stop.name,
                        address: stop.address,
                        lat: stop.lat,
                        lng: stop.lng,
                        order: stop.order,
                        plannedRounds: stop.plannedRounds,
                        maxRounds: stop.maxRounds,
                        googlePlaceId: stop.googlePlaceId,
                        stayDuration: stop.stayDuration,
                        // Recalculate or reset runtime data
                        actualRounds: 0,
                    }))
                },
                participants: {
                    create: {
                        userId
                    }
                }
            },
            include: { stops: true }
        });

        return NextResponse.json({ ok: true, route: newRoute }, { status: 201 });

    } catch (error) {
        console.error("Error cloning route:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
