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

    // Get transactions
    const transactions = await prisma.potTransaction.findMany({
      where: { routeId: id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 transactions
    });

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
        transactions,
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
    const { id } = await params;
    const body = await request.json();
    const { action, amountPerPerson, userName } = body;

    const session = await getServerSession(authOptions);
    let currentUser: { id: string | null; name: string | null; email: string | null } | null = null;
    let isGuest = false;

    // 1. Intentar autenticar usuario
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true },
      });
      if (user) currentUser = user;
    }

    // 2. Intentar autenticar invitado
    if (!currentUser) {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const guestId = cookieStore.get("guestId")?.value;

      if (guestId) {
        // Buscar participante invitado en esta ruta
        // Necesitamos saber si este guestId está en la ruta
        const participant = await prisma.participant.findUnique({
          // @ts-ignore
          where: { routeId_guestId: { routeId: id, guestId } }
        });

        if (participant) {
          currentUser = {
            id: null, // No tiene ID de User
            name: participant.name,
            email: null
          };
          isGuest = true;
        }
      }
    }

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

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

    // Verificar si es el creador
    const isCreator = (currentUser.id && route.creatorId === currentUser.id) ||
      (currentUser.email && route.creator?.email === currentUser.email);

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
      let existing = null;
      if (currentUser.id) {
        existing = await prisma.potContribution.findUnique({
          where: {
            routeId_userId: {
              routeId: id,
              userId: currentUser.id,
            },
          },
        });
      } else if (currentUser.name) {
        // Para invitados, buscamos por nombre (menos seguro pero funcional para este MVP)
        existing = await prisma.potContribution.findFirst({
          where: {
            routeId: id,
            userId: null,
            userName: currentUser.name
          }
        });
      }

      if (existing) {
        return NextResponse.json({ ok: false, error: "Ya has contribuido al bote" }, { status: 400 });
      }

      // Registrar contribucion
      await prisma.$transaction([
        prisma.potContribution.create({
          data: {
            routeId: id,
            userId: currentUser.id || undefined, // undefined si es null para que no falle si Prisma espera valor? No, es opcional.
            userName: currentUser.name || "Invitado",
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
      // ... (Logica existente, se mantiene igual porque es manual)
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
      const description = body.description || "Gasto";

      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({ ok: false, error: "Cantidad invalida" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.route.update({
          where: { id },
          data: {
            potTotalSpent: {
              increment: amount,
            },
          },
        }),
        prisma.potTransaction.create({
          data: {
            routeId: id,
            amount,
            description,
          },
        }),
      ]);

      return NextResponse.json({ ok: true, message: "Gasto registrado" });
    }

    return NextResponse.json({ ok: false, error: "Accion no valida" }, { status: 400 });
  } catch (error) {
    console.error("Error managing pot:", error);
    return NextResponse.json({ ok: false, error: "Error al gestionar el bote" }, { status: 500 });
  }
}
