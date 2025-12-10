import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/email";

// GET - Obtener invitaciones de la ruta (solo creador)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const { id: routeId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar que es el creador de la ruta
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      select: { creatorId: true },
    });

    if (!route || route.creatorId !== user.id) {
      return NextResponse.json({ ok: false, error: "No tienes permiso" }, { status: 403 });
    }

    const invitations = await prisma.invitation.findMany({
      where: { routeId },
      include: {
        invitedUser: { select: { id: true, name: true, email: true, image: true } },
        invitedBy: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, invitations });
  } catch (error) {
    console.error("Error en GET /api/routes/[id]/invitations:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener invitaciones" }, { status: 500 });
  }
}

// POST - Enviar una invitación
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const { id: routeId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar que es el creador o participante de la ruta
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        participants: { where: { userId: user.id } },
      },
    });

    if (!route) {
      return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
    }

    const isCreator = route.creatorId === user.id;
    const isParticipant = route.participants.length > 0;

    if (!isCreator && !isParticipant) {
      return NextResponse.json({ ok: false, error: "No tienes permiso para invitar" }, { status: 403 });
    }

    const body = await req.json();
    const { email, message } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Email invalido" }, { status: 400 });
    }

    // Buscar si el usuario ya existe
    const invitedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Verificar si ya esta invitado o es participante
    if (invitedUser) {
      const existingParticipant = await prisma.participant.findUnique({
        where: { routeId_userId: { routeId, userId: invitedUser.id } },
      });

      if (existingParticipant) {
        return NextResponse.json({ ok: false, error: "Este usuario ya es participante" }, { status: 400 });
      }

      const existingInvitation = await prisma.invitation.findUnique({
        where: { routeId_invitedUserId: { routeId, invitedUserId: invitedUser.id } },
      });

      if (existingInvitation) {
        return NextResponse.json({ ok: false, error: "Ya hay una invitacion pendiente para este usuario" }, { status: 400 });
      }
    } else {
      // Verificar si ya hay invitacion por email
      const existingInvitation = await prisma.invitation.findUnique({
        where: { routeId_invitedEmail: { routeId, invitedEmail: email.toLowerCase() } },
      });

      if (existingInvitation) {
        return NextResponse.json({ ok: false, error: "Ya hay una invitacion pendiente para este email" }, { status: 400 });
      }
    }

    // Crear la invitación
    const invitation = await prisma.invitation.create({
      data: {
        routeId,
        invitedById: user.id,
        invitedUserId: invitedUser?.id || null,
        invitedEmail: invitedUser ? null : email.toLowerCase(),
        message: message || null,
        status: "pending",
      },
      include: {
        invitedUser: { select: { id: true, name: true, email: true, image: true } },
        invitedBy: { select: { id: true, name: true, image: true } },
        route: { select: { name: true, date: true } },
      },
    });

    // Enviar email de notificación
    const recipientEmail = invitedUser?.email || email.toLowerCase();
    const inviterName = user.name || "Alguien";

    await sendInvitationEmail({
      to: recipientEmail,
      inviterName,
      routeName: invitation.route.name,
      routeDate: invitation.route.date || new Date(),
      message: message || null,
      routeId,
    });

    return NextResponse.json({ ok: true, invitation }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/routes/[id]/invitations:", error);
    return NextResponse.json({ ok: false, error: "Error al enviar invitacion" }, { status: 500 });
  }
}

// DELETE - Cancelar una invitación (solo creador)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const { id: routeId } = await params;
    const { searchParams } = new URL(req.url);
    const invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      return NextResponse.json({ ok: false, error: "invitationId requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar que es el creador
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      select: { creatorId: true },
    });

    if (!route || route.creatorId !== user.id) {
      return NextResponse.json({ ok: false, error: "No tienes permiso" }, { status: 403 });
    }

    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en DELETE /api/routes/[id]/invitations:", error);
    return NextResponse.json({ ok: false, error: "Error al cancelar invitacion" }, { status: 500 });
  }
}
