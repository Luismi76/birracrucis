// src/app/api/test-db/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      include: { stops: true },
    });

    return NextResponse.json({
      ok: true,
      count: routes.length,
      routes,
    });
  } catch (error) {
    console.error("Error en /api/test-db:", error);
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
