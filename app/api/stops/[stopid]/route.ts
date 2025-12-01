// app/api/stops/[stopid]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PatchBody = {
  delta: number; // +1 o -1 (o cualquier delta)
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ stopid: string }> }
) {
  try {
    const { stopid } = await params;
    if (!stopid) {
      return NextResponse.json({ ok: false, error: "stopid es obligatorio en la ruta" }, { status: 400 });
    }

    const body = (await req.json()) as PatchBody;
    if (typeof body.delta !== "number" || !Number.isInteger(body.delta)) {
      return NextResponse.json({ ok: false, error: "El body debe contener 'delta' entero" }, { status: 400 });
    }

    // Obtenemos el stop actual
    const stop = await prisma.routeStop.findUnique({
      where: { id: stopid },
    });

    if (!stop) {
      return NextResponse.json({ ok: false, error: "Stop no encontrado" }, { status: 404 });
    }

    const newRounds = stop.actualRounds + body.delta;

    if (newRounds < 0) {
      return NextResponse.json({ ok: false, error: "Las rondas no pueden ser negativas" }, { status: 400 });
    }

    if (stop.maxRounds != null && newRounds > stop.maxRounds) {
      return NextResponse.json({ ok: false, error: `No se puede superar el máximo de rondas (${stop.maxRounds})` }, { status: 400 });
    }

    const updated = await prisma.routeStop.update({
      where: { id: stopid },
      data: { actualRounds: newRounds },
    });

    return NextResponse.json({ ok: true, stop: updated });
  } catch (error) {
    console.error("Error en PATCH /api/stops/[stopId]:", error);
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
