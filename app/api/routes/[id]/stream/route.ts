import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SSE endpoint para actualizaciones en tiempo real
 * Reemplaza el polling de participantes, mensajes, etc.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guestId")?.value;

    // Allow both authenticated users and guests
    if (!session?.user?.email && !guestId) {
        return new Response("No autenticado", { status: 401 });
    }

    const { id: routeId } = await params;

    // Verify user/guest is a participant of this route
    let isParticipant = false;

    if (session?.user?.email) {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });
        if (user) {
            const participant = await prisma.participant.findUnique({
                where: { routeId_userId: { routeId, userId: user.id } }
            });
            isParticipant = !!participant;
        }
    } else if (guestId) {
        const participant = await prisma.participant.findUnique({
            where: { routeId_guestId: { routeId, guestId } }
        });
        isParticipant = !!participant;
    }

    if (!isParticipant) {
        return new Response("No eres participante de esta ruta", { status: 403 });
    }

    // Verificar que la ruta existe
    const route = await prisma.route.findUnique({
        where: { id: routeId },
        select: { id: true },
    });

    if (!route) {
        return new Response("Ruta no encontrada", { status: 404 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Enviar evento inicial de conexión
            controller.enqueue(
                encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "ok" })}\n\n`)
            );

            let lastParticipantsHash = "";
            let lastMessageId = "";

            const sendUpdate = async () => {
                try {
                    // Obtener participantes
                    const participants = await prisma.participant.findMany({
                        where: { routeId, isActive: true },
                        include: {
                            user: {
                                select: { id: true, name: true, image: true },
                            },
                        },
                        orderBy: { joinedAt: "asc" },
                    });

                    const participantsData = participants.map((p) => ({
                        id: p.user?.id || p.guestId || "unknown", // Priorizar ID de usuario, sino guestId
                        odId: p.id,
                        name: p.user?.name || p.name || "Invitado", // Nombre de usuario o del participante (guest)
                        image: p.user?.image || p.avatar, // Avatar de usuario o del participante
                        isGuest: !p.userId, // Flag útil para el frontend
                        lat: p.lastLat || 0,
                        lng: p.lastLng || 0,
                        lastSeenAt: p.lastSeenAt?.toISOString() || null,
                        isActive: p.isActive,
                    }));

                    // Solo enviar si hay cambios
                    const newHash = JSON.stringify(participantsData);
                    if (newHash !== lastParticipantsHash) {
                        lastParticipantsHash = newHash;
                        controller.enqueue(
                            encoder.encode(
                                `event: participants\ndata: ${JSON.stringify(participantsData)}\n\n`
                            )
                        );
                    }

                    // Obtener mensajes nuevos
                    const messages = await prisma.message.findMany({
                        where: {
                            routeId,
                            ...(lastMessageId && { id: { gt: lastMessageId } }),
                        },
                        include: {
                            user: { select: { id: true, name: true, image: true } },
                        },
                        orderBy: { createdAt: "asc" },
                        take: 50,
                    });

                    if (messages.length > 0) {
                        lastMessageId = messages[messages.length - 1].id;
                        controller.enqueue(
                            encoder.encode(
                                `event: messages\ndata: ${JSON.stringify(messages)}\n\n`
                            )
                        );
                    }

                    // Heartbeat para mantener conexión
                    controller.enqueue(encoder.encode(`: heartbeat\n\n`));
                } catch (error) {
                    console.error("[SSE] Error fetching data:", error);
                }
            };

            // Enviar actualización inmediata
            await sendUpdate();

            // Actualizar cada 3 segundos (más eficiente que polling desde cliente)
            const interval = setInterval(sendUpdate, 3000);

            // Cleanup cuando se cierra la conexión
            req.signal.addEventListener("abort", () => {
                clearInterval(interval);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no", // Para nginx
        },
    });
}
