
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");
        const search = searchParams.get("search") || "";

        const routes = await prisma.route.findMany({
            where: {
                isPublic: true,
                name: {
                    contains: search,
                    mode: "insensitive",
                },
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
