import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthenticatedUser(request);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");
        const search = searchParams.get("search") || "";

        const routes = await prisma.route.findMany({
            where: {
                isPublic: true,
                ...(search ? {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { stops: { some: { address: { contains: search, mode: "insensitive" } } } }
                    ]
                } : {})
            },
            take: limit,
            skip: offset,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                creator: {
                    select: {
                        name: true,
                        image: true,
                    },
                },
                stops: {
                    take: 1,
                    select: {
                        address: true,
                        lat: true,
                        lng: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                _count: {
                    select: {
                        stops: true,
                        participants: true,
                    },
                },
            },
        });

        return NextResponse.json(routes);
    } catch (error) {
        console.error("Error fetching community routes:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
