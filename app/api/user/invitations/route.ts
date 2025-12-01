import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - Obtener mis invitaciones pendientes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Buscar invitaciones para este usuario (por ID o por email)
    const invitations = await prisma.invitation.findMany({
      where: {
        OR: [
          { invitedUserId: user.id },
          { invitedEmail: session.user.email.toLowerCase() },
        ],
        status: "pending",
      },
      include: {
        route: {
          select: {
            id: true,
            name: true,
            date: true,
            creator: { select: { name: true, image: true } },
            _count: { select: { participants: true, stops: true } },
          },
        },
        invitedBy: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, invitations });
  } catch (error) {
    console.error("Error en GET /api/user/invitations:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener invitaciones" }, { status: 500 });
  }
}

// POST - Responder a una invitación (aceptar/rechazar)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { invitationId, action } = body;

    if (!invitationId || !["accept", "reject"].includes(action)) {
      return NextResponse.json({ ok: false, error: "invitationId y action (accept/reject) requeridos" }, { status: 400 });
    }

    // Buscar la invitación
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        OR: [
          { invitedUserId: user.id },
          { invitedEmail: session.user.email.toLowerCase() },
        ],
        status: "pending",
      },
      include: {
        route: { select: { id: true, name: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json({ ok: false, error: "Invitacion no encontrada o ya respondida" }, { status: 404 });
    }

    if (action === "accept") {
      // Actualizar invitación y crear participante en una transacción
      await prisma.$transaction([
        prisma.invitation.update({
          where: { id: invitationId },
          data: {
            status: "accepted",
            respondedAt: new Date(),
            invitedUserId: user.id, // Vincular al usuario si estaba por email
          },
        }),
        prisma.participant.create({
          data: {
            routeId: invitation.routeId,
            userId: user.id,
            isActive: true,
          },
        }),
      ]);

      return NextResponse.json({
        ok: true,
        message: "Invitacion aceptada",
        routeId: invitation.routeId,
        routeName: invitation.route.name,
      });
    } else {
      // Rechazar
      await prisma.invitation.update({
        where: { id: invitationId },
        data: {
          status: "rejected",
          respondedAt: new Date(),
          invitedUserId: user.id,
        },
      });

      return NextResponse.json({
        ok: true,
        message: "Invitacion rechazada",
      });
    }
  } catch (error) {
    console.error("Error en POST /api/user/invitations:", error);
    return NextResponse.json({ ok: false, error: "Error al responder invitacion" }, { status: 500 });
  }
}
