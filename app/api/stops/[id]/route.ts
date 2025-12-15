// app/api/stops/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PatchBody = {
  delta?: number; // +1 o -1 (o cualquier delta) para actualizar rondas
  arrivedAt?: string; // ISO string para actualizar tiempo de llegada
  beerPrice?: number; // Precio de la cerveza
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "id es obligatorio en la ruta" }, { status: 400 });
    }

    const body = (await req.json()) as PatchBody;

    // Si viene arrivedAt, solo actualizamos ese campo
    if (body.arrivedAt !== undefined) {
      const updated = await prisma.routeStop.update({
        where: { id },
        data: { arrivedAt: new Date(body.arrivedAt) },
      });
      return NextResponse.json({ ok: true, stop: updated });
    }

    // Si viene delta, actualizamos rondas
    if (body.delta !== undefined) {
      if (typeof body.delta !== "number" || !Number.isInteger(body.delta)) {
        return NextResponse.json({ ok: false, error: "El 'delta' debe ser un entero" }, { status: 400 });
      }

      // Obtenemos el stop actual
      const stop = await prisma.routeStop.findUnique({
        where: { id },
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
        where: { id },
        data: { actualRounds: newRounds },
      });

      return NextResponse.json({ ok: true, stop: updated });
    }

    // Si viene beerPrice, actualizamos el precio
    if (body.beerPrice !== undefined) {
      if (typeof body.beerPrice !== "number") {
        return NextResponse.json({ ok: false, error: "El precio debe ser un número" }, { status: 400 });
      }
      const updated = await prisma.routeStop.update({
        where: { id },
        data: { beerPrice: body.beerPrice },
      });
      return NextResponse.json({ ok: true, stop: updated });
    }

    return NextResponse.json({ ok: false, error: "Debe proporcionar 'delta', 'arrivedAt' o 'beerPrice'" }, { status: 400 });
  } catch (error) {
    console.error("Error en PATCH /api/stops/[id]:", error);
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
