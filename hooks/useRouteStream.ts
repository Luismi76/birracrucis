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

type UseRouteStreamOptions = {
    routeId: string;
    enabled?: boolean;
    onParticipants?: (participants: Participant[]) => void;
    onMessages?: (messages: Message[]) => void;
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
    onError,
}: UseRouteStreamOptions) {
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);

    const connect = useCallback(() => {
        if (!enabled || !routeId) return;

        // Limpiar conexión anterior
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setStatus("connecting");

        const eventSource = new EventSource(`/api/routes/${routeId}/stream`);
        eventSourceRef.current = eventSource;

        eventSource.addEventListener("connected", () => {
            setStatus("connected");
            reconnectAttempts.current = 0;
        });

        eventSource.addEventListener("participants", (event) => {
            try {
                const data = JSON.parse(event.data) as Participant[];
                setParticipants(data);
                onParticipants?.(data);
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
                onMessages?.(newMessages);
            } catch (e) {
                console.error("[SSE] Error parsing messages:", e);
            }
        });

        eventSource.onerror = () => {
            setStatus("error");
            eventSource.close();

            // Reconexión exponencial con máximo de 30 segundos
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            reconnectAttempts.current++;

            console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, delay);

            onError?.(new Error("SSE connection error"));
        };
    }, [routeId, enabled, onParticipants, onMessages, onError]);

    useEffect(() => {
        connect();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

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

    return {
        status,
        participants,
        messages,
        disconnect,
        reconnect: connect,
    };
}
