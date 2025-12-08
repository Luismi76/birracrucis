"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Bell, Clock, Target, DollarSign } from "lucide-react";

type NotificationType =
    | "participant_nearby"
    | "time_exceeded"
    | "objective_complete"
    | "pot_reminder";

type SmartNotification = {
    type: NotificationType;
    message: string;
    participantName?: string;
    distance?: number;
};

type SmartNotificationsProps = {
    notifications: SmartNotification[];
    onDismiss?: (index: number) => void;
};

export default function SmartNotifications({
    notifications,
    onDismiss,
}: SmartNotificationsProps) {
    useEffect(() => {
        notifications.forEach((notification, index) => {
            const icon = getIcon(notification.type);
            const duration = getDuration(notification.type);

            toast(notification.message, {
                icon,
                duration,
                action: onDismiss
                    ? {
                        label: "OK",
                        onClick: () => onDismiss(index),
                    }
                    : undefined,
            });
        });
    }, [notifications, onDismiss]);

    return null; // Este componente solo maneja toasts
}

function getIcon(type: NotificationType): string {
    switch (type) {
        case "participant_nearby":
            return "👋";
        case "time_exceeded":
            return "⏰";
        case "objective_complete":
            return "🎯";
        case "pot_reminder":
            return "💰";
        default:
            return "🔔";
    }
}

function getDuration(type: NotificationType): number {
    switch (type) {
        case "participant_nearby":
            return 4000;
        case "time_exceeded":
            return 6000;
        case "objective_complete":
            return 5000;
        case "pot_reminder":
            return 7000;
        default:
            return 5000;
    }
}

// Hook para generar notificaciones inteligentes
export function useSmartNotifications({
    participants,
    currentBarId,
    timeInBar,
    plannedDuration,
    roundsCompleted,
    plannedRounds,
    potPaid,
    potTotal,
}: {
    participants: Array<{
        id: string;
        name: string | null;
        distance: number;
        isAtBar: boolean;
    }>;
    currentBarId: string;
    timeInBar: number; // minutos
    plannedDuration: number; // minutos
    roundsCompleted: number;
    plannedRounds: number;
    potPaid: number;
    potTotal: number;
}): SmartNotification[] {
    const notifications: SmartNotification[] = [];

    // Notificación: Participante cerca
    participants.forEach((p) => {
        if (!p.isAtBar && p.distance < 50 && p.distance > 0) {
            notifications.push({
                type: "participant_nearby",
                message: `${p.name || "Alguien"} está a ${p.distance}m del bar`,
                participantName: p.name || undefined,
                distance: p.distance,
            });
        }
    });

    // Notificación: Tiempo excedido
    if (timeInBar > plannedDuration && plannedDuration > 0) {
        const excess = timeInBar - plannedDuration;
        notifications.push({
            type: "time_exceeded",
            message: `Lleváis ${timeInBar} min en este bar (planificado: ${plannedDuration} min)`,
        });
    }

    // Notificación: Objetivo cumplido
    if (roundsCompleted >= plannedRounds && roundsCompleted > 0) {
        notifications.push({
            type: "objective_complete",
            message: "¡Objetivo cumplido! Podéis avanzar al siguiente bar",
        });
    }

    // Notificación: Recordatorio de bote
    const potDifference = potTotal - potPaid;
    if (potDifference > 5 && potTotal > 0) {
        notifications.push({
            type: "pot_reminder",
            message: `Falta recoger ${potDifference.toFixed(2)}€ del bote común`,
        });
    }

    return notifications;
}
