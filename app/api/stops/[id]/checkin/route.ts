import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const stop = await prisma.routeStop.findUnique({
            where: { id },
        });

        if (!stop) {
            return NextResponse.json(
                { ok: false, error: "Parada no encontrada" },
                { status: 404 }
            );
        }

        const updatedStop = await prisma.routeStop.update({
            where: { id },
            data: {
                actualRounds: { increment: 1 },
            },
        });

        return NextResponse.json({ ok: true, stop: updatedStop });
    } catch (error) {
        console.error("Error Check-in stop:", error);
        return NextResponse.json(
            { ok: false, error: "Error al registrar ronda" },
            { status: 500 }
        );
    }
}
