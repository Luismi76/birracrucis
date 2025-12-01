import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener estado del bote
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const route = await prisma.route.findUnique({
      where: { id },
      select: {
        potEnabled: true,
        potAmountPerPerson: true,
        potTotalCollected: true,
        potTotalSpent: true,
        potContributions: {
          select: {
            id: true,
            userId: true,
            userName: true,
            amount: true,
            paidAt: true,
          },
          orderBy: { paidAt: "desc" },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!route) {
      return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
    }

    const potBalance = route.potTotalCollected - route.potTotalSpent;

    return NextResponse.json({
      ok: true,
      pot: {
        enabled: route.potEnabled,
        amountPerPerson: route.potAmountPerPerson,
        totalCollected: route.potTotalCollected,
        totalSpent: route.potTotalSpent,
        balance: potBalance,
        contributions: route.potContributions,
        participantCount: route._count.participants,
      },
    });
  } catch (error) {
    console.error("Error getting pot:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener el bote" }, { status: 500 });
  }
}

// POST - Configurar bote o registrar contribucion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, amountPerPerson, userName } = body;

    const route = await prisma.route.findUnique({
      where: { id },
      select: {
        creatorId: true,
        potEnabled: true,
        potAmountPerPerson: true,
        creator: {
          select: { email: true }
        }
      },
    });

    if (!route) {
      return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
    }

    // Verificar si es el creador (por ID o por email)
    const isCreator = route.creatorId === session.user.id ||
                      (session.user.email && route.creator?.email === session.user.email);

    // Accion: Configurar bote (solo creador)
    if (action === "configure") {
      if (!isCreator) {
        return NextResponse.json({ ok: false, error: "Solo el creador puede configurar el bote" }, { status: 403 });
      }

      const amount = parseFloat(amountPerPerson);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({ ok: false, error: "Cantidad invalida" }, { status: 400 });
      }

      await prisma.route.update({
        where: { id },
        data: {
          potEnabled: true,
          potAmountPerPerson: amount,
        },
      });

      return NextResponse.json({ ok: true, message: "Bote configurado" });
    }

    // Accion: Desactivar bote (solo creador)
    if (action === "disable") {
      if (!isCreator) {
        return NextResponse.json({ ok: false, error: "Solo el creador puede desactivar el bote" }, { status: 403 });
      }

      await prisma.route.update({
        where: { id },
        data: {
          potEnabled: false,
        },
      });

      return NextResponse.json({ ok: true, message: "Bote desactivado" });
    }

    // Accion: Registrar contribucion
    if (action === "contribute") {
      if (!route.potEnabled || !route.potAmountPerPerson) {
        return NextResponse.json({ ok: false, error: "El bote no esta activado" }, { status: 400 });
      }

      // Verificar si ya contribuyo
      const existing = await prisma.potContribution.findUnique({
        where: {
          routeId_userId: {
            routeId: id,
            userId: session.user.id,
          },
        },
      });

      if (existing) {
        return NextResponse.json({ ok: false, error: "Ya has contribuido al bote" }, { status: 400 });
      }

      // Registrar contribucion con nombre
      await prisma.$transaction([
        prisma.potContribution.create({
          data: {
            routeId: id,
            userId: session.user.id,
            userName: session.user.name || session.user.email || "Usuario",
            amount: route.potAmountPerPerson,
          },
        }),
        prisma.route.update({
          where: { id },
          data: {
            potTotalCollected: {
              increment: route.potAmountPerPerson,
            },
          },
        }),
      ]);

      return NextResponse.json({ ok: true, message: "Contribucion registrada" });
    }

    // Accion: Registrar contribucion de participante externo (sin cuenta)
    if (action === "contribute_external") {
      if (!route.potEnabled || !route.potAmountPerPerson) {
        return NextResponse.json({ ok: false, error: "El bote no esta activado" }, { status: 400 });
      }

      if (!userName || typeof userName !== "string" || userName.trim().length === 0) {
        return NextResponse.json({ ok: false, error: "Nombre requerido" }, { status: 400 });
      }

      // Registrar contribucion externa
      await prisma.$transaction([
        prisma.potContribution.create({
          data: {
            routeId: id,
            userName: userName.trim(),
            amount: route.potAmountPerPerson,
          },
        }),
        prisma.route.update({
          where: { id },
          data: {
            potTotalCollected: {
              increment: route.potAmountPerPerson,
            },
          },
        }),
      ]);

      return NextResponse.json({ ok: true, message: "Contribucion registrada" });
    }

    // Accion: Gastar del bote
    if (action === "spend") {
      const amount = parseFloat(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({ ok: false, error: "Cantidad invalida" }, { status: 400 });
      }

      await prisma.route.update({
        where: { id },
        data: {
          potTotalSpent: {
            increment: amount,
          },
        },
      });

      return NextResponse.json({ ok: true, message: "Gasto registrado" });
    }

    return NextResponse.json({ ok: false, error: "Accion no valida" }, { status: 400 });
  } catch (error) {
    console.error("Error managing pot:", error);
    return NextResponse.json({ ok: false, error: "Error al gestionar el bote" }, { status: 500 });
  }
}
