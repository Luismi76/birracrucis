import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// Helper to verify admin access
async function checkAdmin(req: NextRequest) {
    const user = await getAuthenticatedUser(req);
    if (!user || !user.email) return null;

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    if (!adminEmails.includes(user.email)) {
        return null;
    }
    return user;
}

export async function GET(req: NextRequest) {
    const user = await checkAdmin(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const url = new URL(req.url);
        const search = url.searchParams.get('search') || '';
        const page = parseInt(url.searchParams.get('page') || '0');
        const limit = 50;

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const routes = await prisma.route.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: page * limit,
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                stops: {
                    take: 1,
                    select: {
                        address: true,
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

        const total = await prisma.route.count({ where });

        return NextResponse.json({ routes, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error("Admin Routes Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const user = await checkAdmin(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id, isPublic, description } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const updated = await prisma.route.update({
            where: { id },
            data: {
                isPublic,
                description,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Admin Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const user = await checkAdmin(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        // Hard delete for cleanup purposes
        await prisma.route.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin Delete Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
