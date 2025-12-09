"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Participant = {
    id: string;
    odId: string;
    name: string | null;
    image: string | null;
    lat: number;
    lng: number;
    lastSeenAt: string | null;
    isActive: boolean;
};

type Message = {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
};

type Nudge = {
    id: string;
    message: string;
    sender: { name: string | null };
};

type UseRouteStreamOptions = {
    routeId: string;
    enabled?: boolean;
    onParticipants?: (participants: Participant[]) => void;
    onMessages?: (messages: Message[]) => void;
    onNudges?: (nudges: Nudge[]) => void;
    onError?: (error: Error) => void;
};

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

/**
 * Hook para recibir actualizaciones en tiempo real via SSE
 * Reemplaza el polling de participantes y mensajes
 */
export function useRouteStream({
    routeId,
    enabled = true,
    onParticipants,
    onMessages,
    onNudges,
    onError,
}: UseRouteStreamOptions) {
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);

    // Use refs for callbacks to avoid re-connecting when they change
    const onParticipantsRef = useRef(onParticipants);
    const onMessagesRef = useRef(onMessages);
    const onNudgesRef = useRef(onNudges);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onParticipantsRef.current = onParticipants;
        onMessagesRef.current = onMessages;
        onNudgesRef.current = onNudges;
        onErrorRef.current = onError;
    });

    // Track last nudge ID for resumption
    const lastNudgeIdRef = useRef<string | null>(null);

    const disconnect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        setStatus("disconnected");
    }, []);

    const connect = useCallback(() => {
        if (!enabled || !routeId) return;

        // Limpiar conexión anterior
        disconnect();

        setStatus("connecting");

        // Append lastNudgeId if we have one (for resumption)
        const url = new URL(`/api/routes/${routeId}/stream`, window.location.origin);
        if (lastNudgeIdRef.current) {
            url.searchParams.set("lastNudgeId", lastNudgeIdRef.current);
        }

        const eventSource = new EventSource(url.toString());
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setStatus("connected");
            reconnectAttempts.current = 0;
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };

        eventSource.addEventListener("connected", () => {
            // Connection confirmed
        });

        eventSource.addEventListener("participants", (event) => {
            try {
                const data = JSON.parse(event.data) as Participant[];
                setParticipants(data);
                onParticipantsRef.current?.(data);
            } catch (e) {
                console.error("[SSE] Error parsing participants:", e);
            }
        });

        eventSource.addEventListener("messages", (event) => {
            try {
                const newMessages = JSON.parse(event.data) as Message[];
                setMessages((prev) => {
                    // Evitar duplicados
                    const existingIds = new Set(prev.map((m) => m.id));
                    const uniqueNew = newMessages.filter((m) => !existingIds.has(m.id));
                    return [...prev, ...uniqueNew];
                });
                onMessagesRef.current?.(newMessages);
            } catch (e) {
                console.error("[SSE] Error parsing messages:", e);
            }
        });

        eventSource.addEventListener("nudges", (event) => {
            try {
                const newNudges = JSON.parse(event.data) as Nudge[];

                // Update lastNudgeIdRef with the newest one
                if (newNudges.length > 0) {
                    const last = newNudges[newNudges.length - 1];
                    lastNudgeIdRef.current = last.id;
                }

                onNudgesRef.current?.(newNudges);
            } catch (e) {
                console.error("[SSE] Error parsing nudges:", e);
            }
        });

        eventSource.onerror = (e) => {
            console.error(`[useRouteStream] SSE Error (ReadyState: ${eventSource.readyState})`, e);
            setStatus("error");
            eventSource.close();

            // Reconexión exponencial con máximo de 30 segundos
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            reconnectAttempts.current++;

            console.log(`[SSE] Scheduling reconnect in ${delay}ms`);

            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, delay);

            onErrorRef.current?.(new Error("SSE connection error"));
        };
    }, [routeId, enabled, disconnect]);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    // remove separate disconnect export logic since it is defined above
    // ...

    return {
        status,
        participants,
        messages,
        disconnect,
        reconnect: connect,
    };
}
