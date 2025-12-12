import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserIds } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

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
    const auth = await getCurrentUser(req);
    if (!auth.ok) {
        return new NextResponse(auth.error, { status: auth.status });
    }

    const { userId: currentUserId, guestId: currentGuestId } = getUserIds(auth.user);
    const { id: routeId } = await params;

    // Verify user/guest is a participant of this route
    let isParticipant = false;

    if (currentUserId) {
        const participant = await prisma.participant.findUnique({
            where: { routeId_userId: { routeId, userId: currentUserId } }
        });
        isParticipant = !!participant;
    } else if (currentGuestId) {
        const participant = await prisma.participant.findUnique({
            where: { routeId_guestId: { routeId, guestId: currentGuestId } }
        });
        isParticipant = !!participant;
    }

    if (!isParticipant) {
        return new NextResponse("No eres participante de esta ruta", { status: 403 });
    }

    // Verificar que la ruta existe
    const route = await prisma.route.findUnique({
        where: { id: routeId },
        select: { id: true },
    });

    if (!route) {
        return new NextResponse("Ruta no encontrada", { status: 404 });
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
            let lastNudgeId = "";

            // Init lastNudgeId
            const lastNudgeIdParam = req.nextUrl.searchParams.get("lastNudgeId");
            if (lastNudgeIdParam) {
                lastNudgeId = lastNudgeIdParam;
            } else {
                try {
                    const lastNudge = await prisma.nudge.findFirst({
                        where: { routeId },
                        orderBy: { createdAt: "desc" },
                        select: { id: true }
                    });
                    if (lastNudge) lastNudgeId = lastNudge.id;
                } catch (e) {
                    // ignore
                }
            }

            let isUpdating = false;

            const sendUpdate = async () => {
                if (req.signal.aborted || isUpdating) return;
                isUpdating = true;

                try {
                    // Obtener participantes (Query 1)
                    const participants = await prisma.participant.findMany({
                        where: { routeId, isActive: true },
                        include: {
                            user: {
                                select: { id: true, name: true, image: true },
                            },
                        },
                        orderBy: { joinedAt: "asc" },
                    });

                    // Map participants for O(1) lookup
                    const guestMap = new Map();
                    participants.forEach(p => {
                        if (p.guestId) {
                            guestMap.set(p.guestId, {
                                name: p.name || "Invitado",
                                image: p.avatar
                            });
                        }
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
                        if (!req.signal.aborted) {
                            controller.enqueue(
                                encoder.encode(
                                    `event: participants\ndata: ${JSON.stringify(participantsData)}\n\n`
                                )
                            );
                        }
                    }

                    // Obtener mensajes nuevos (Query 2)
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

                        // Enrich guest messages using the map (No extra DB calls)
                        const messagesWithGuestInfo = messages.map((msg: any) => {
                            if (msg.guestId) {
                                const guestInfo = guestMap.get(msg.guestId);
                                return {
                                    ...msg,
                                    user: {
                                        id: msg.guestId,
                                        name: guestInfo?.name || "Invitado",
                                        image: guestInfo?.image || null,
                                    }
                                };
                            }
                            return msg;
                        });

                        if (!req.signal.aborted) {
                            controller.enqueue(
                                encoder.encode(
                                    `event: messages\ndata: ${JSON.stringify(messagesWithGuestInfo)}\n\n`
                                )
                            );
                        }
                    }

                    // Check for new Nudges (Query 3)
                    const nudges = await prisma.nudge.findMany({
                        where: {
                            routeId,
                            ...(lastNudgeId && { id: { gt: lastNudgeId } }),
                        },
                        include: {
                            sender: { select: { name: true } }
                        },
                        orderBy: { createdAt: "asc" }
                    });

                    if (nudges.length > 0) {
                        lastNudgeId = nudges[nudges.length - 1].id;

                        // Filter nudges for this user
                        const relevantNudges = nudges.filter((n: any) => {
                            // If no target, it's global -> for everyone
                            if (!n.targetUserId && !n.targetGuestId) return true;

                            // If targeted, check if matches current user/guest
                            if (currentUserId && n.targetUserId === currentUserId) return true;
                            if (currentGuestId && n.targetGuestId === currentGuestId) return true;

                            return false;
                        });

                        if (relevantNudges.length > 0 && !req.signal.aborted) {
                            controller.enqueue(
                                encoder.encode(
                                    `event: nudges\ndata: ${JSON.stringify(relevantNudges)}\n\n`
                                )
                            );
                        }
                    }

                    // Heartbeat para mantener conexión
                    if (!req.signal.aborted) {
                        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
                    }
                } catch (error) {
                    // Ignore disconnect errors to keep logs clean
                    if (req.signal.aborted) return;
                    console.error("[SSE] Error fetching data:", error);
                } finally {
                    isUpdating = false;
                }
            };

            // Enviar actualización inmediata
            sendUpdate();

            // Usar setInterval con bloqueo para mantener la conexión viva
            const interval = setInterval(sendUpdate, 3000);

            // Vercel Hobby/Pro timeout workaround:
            // Close stream gracefully before the hard timeout (usually 10s or 60s)
            // preventing "Task timed out" error logs.
            // Client (EventSource) will automatically reconnect.
            const closeTimer = setTimeout(() => {
                try {
                    controller.close();
                } catch (e) {
                    // ignore if already closed
                }
                clearInterval(interval);
            }, 25000); // 25 seconds (safe for Vercel default 30-60s limit)

            // Cleanup
            req.signal.addEventListener("abort", () => {
                clearInterval(interval);
                clearTimeout(closeTimer);
            });
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    });
}
