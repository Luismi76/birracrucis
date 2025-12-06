import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params es una promesa en Next 15+
) {
    try {
        const token = await getToken({ req });
        if (!token?.sub) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { rating, comment } = body;

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Valoración inválida (1-5)" }, { status: 400 });
        }

        // Upsert: Crear o actualizar la valoración
        const savedRating = await prisma.routeRating.upsert({
            where: {
                routeId_userId: {
                    routeId: id,
                    userId: token.sub,
                }
            },
            update: {
                rating,
                comment,
                createdAt: new Date(), // Actualizamos la fecha al editar
            },
            create: {
                routeId: id,
                userId: token.sub,
                rating,
                comment,
            }
        });

        // Calcular nuevo promedio para devolverlo (opcional, pero útil)
        const aggregations = await prisma.routeRating.aggregate({
            where: { routeId: id },
            _avg: { rating: true },
            _count: { rating: true },
        });

        return NextResponse.json({
            ok: true,
            rating: savedRating,
            newAverage: aggregations._avg.rating || 0,
            newCount: aggregations._count.rating || 0,
        });

    } catch (error) {
        console.error("Error saving rating:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await getToken({ req });
        const { id } = await params;

        // Si hay usuario logueado, buscamos su voto
        let userRating = null;
        if (token?.sub) {
            userRating = await prisma.routeRating.findUnique({
                where: {
                    routeId_userId: {
                        routeId: id,
                        userId: token.sub,
                    }
                }
            });
        }

        // Agregados globales
        const aggregations = await prisma.routeRating.aggregate({
            where: { routeId: id },
            _avg: { rating: true },
            _count: { rating: true },
        });

        return NextResponse.json({
            ok: true,
            userRating,
            average: aggregations._avg.rating || 0,
            count: aggregations._count.rating || 0,
        });

    } catch (error) {
        console.error("Error fetching rating:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
