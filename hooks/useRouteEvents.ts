"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher";
import { toast } from "sonner";

type RouteEventParams = {
    routeId: string;
    onLocationUpdate?: (data: any) => void;
    onNudge?: (data: any) => void;
    onCheckIn?: (data: any) => void;
};

export function useRouteEvents({ routeId, onLocationUpdate, onNudge, onCheckIn }: RouteEventParams) {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!routeId) return;

        // 1. Suscribirse al canal de la ruta
        // Usamos 'presence-' si queremos saber quién está online (requiere auth endpoint)
        // Por ahora usamos canal público/privado simple para eventos
        const channelName = `route-${routeId}`;
        const channel = pusherClient.subscribe(channelName);

        // 2. Bind events
        channel.bind("pusher:subscription_succeeded", () => {
            setIsConnected(true);
            console.log("✅ Conectado a Pusher:", channelName);
        });

        channel.bind("location-update", (data: any) => {
            onLocationUpdate?.(data);
        });

        channel.bind("nudge", (data: any) => {
            // Mostrar toast automático para nudges si no se maneja externamente
            if (onNudge) {
                onNudge(data);
            } else {
                toast(`🔔 ${data.senderName || 'Alguien'} dice:`, {
                    description: data.message,
                    duration: 5000,
                });
                if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
            }
        });

        channel.bind("check-in", (data: any) => {
            onCheckIn?.(data);
        });

        channel.bind("badge-earned", async (data: any) => {
            // Importación dinámica para evitar problemas de SSR si fuera necesario
            const confetti = (await import('canvas-confetti')).default;

            // Sonido de logro (si el navegador lo permite)
            // const audio = new Audio('/sounds/achievement.mp3');
            // audio.play().catch(() => {});

            // Confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 9999
            });

            toast.success(`¡Logro Desbloqueado! 🏆`, {
                description: `${data.badgeName}: ${data.badgeDescription}`,
                duration: 5000,
                className: "bg-amber-100 border-amber-300 text-amber-900"
            });
        });

        // 3. Cleanup
        return () => {
            pusherClient.unsubscribe(channelName);
            channel.unbind_all();
            setIsConnected(false);
        };
    }, [routeId]);

    return { isConnected };
}
