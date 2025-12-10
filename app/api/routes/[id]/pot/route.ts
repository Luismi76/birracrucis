import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserIds } from "@/lib/auth-helpers";
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

    // Get transactions with who registered them
    const transactions = await prisma.potTransaction.findMany({
      where: { routeId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        amount: true,
        description: true,
        createdAt: true,
        registeredByName: true,
        registeredBy: {
          select: { id: true, name: true, image: true }
        }
      }
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

    const auth = await getCurrentUser(request);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const { userId, guestId } = getUserIds(auth.user);
    const isGuest = auth.user.type === "guest";

    // Crear objeto currentUser para compatibilidad con el resto del código
    const currentUser = {
      id: userId || null,
      name: auth.user.name,
      email: auth.user.type === "user" ? auth.user.email : null
    };

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

    // Accion: Gastar del bote (solo participantes)
    if (action === "spend") {
      if (!route.potEnabled) {
        return NextResponse.json({ ok: false, error: "El bote no está activado" }, { status: 400 });
      }

      // Verificar que es participante de la ruta
      let isParticipant = false;
      if (userId) {
        const participant = await prisma.participant.findUnique({
          where: { routeId_userId: { routeId: id, userId } }
        });
        isParticipant = !!participant;
      } else if (guestId) {
        const participant = await prisma.participant.findUnique({
          where: { routeId_guestId: { routeId: id, guestId } }
        });
        isParticipant = !!participant;
      }

      if (!isParticipant) {
        return NextResponse.json({ ok: false, error: "Solo los participantes pueden registrar gastos" }, { status: 403 });
      }

      const amount = parseFloat(body.amount);
      const description = body.description || "Gasto";

      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({ ok: false, error: "Cantidad invalida" }, { status: 400 });
      }

      // Verificar que hay saldo suficiente
      const currentRoute = await prisma.route.findUnique({
        where: { id },
        select: { potTotalCollected: true, potTotalSpent: true }
      });

      if (!currentRoute) {
        return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
      }

      const balance = currentRoute.potTotalCollected - currentRoute.potTotalSpent;
      if (amount > balance) {
        return NextResponse.json({
          ok: false,
          error: `Saldo insuficiente. Disponible: ${balance.toFixed(2)}€`
        }, { status: 400 });
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
            registeredById: userId || undefined,
            registeredByName: auth.user.name || (isGuest ? "Invitado" : "Usuario"),
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
