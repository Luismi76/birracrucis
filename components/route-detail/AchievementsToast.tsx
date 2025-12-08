"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Trophy, Camera, Target, Zap, Award } from "lucide-react";

type AchievementType =
    | "first_round"
    | "punctual"
    | "photographer"
    | "beer_expert"
    | "completionist"
    | "speed_demon"
    | "social_butterfly";

type Achievement = {
    type: AchievementType;
    title: string;
    description: string;
    userName: string;
    icon: string;
};

type AchievementsToastProps = {
    achievements: Achievement[];
    onDismiss?: (index: number) => void;
};

export default function AchievementsToast({
    achievements,
    onDismiss,
}: AchievementsToastProps) {
    const shownAchievementsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        achievements.forEach((achievement, index) => {
            // Crear ID único para el logro
            const achievementId = `${achievement.type}-${achievement.userName}`;

            // Solo mostrar si no se ha mostrado antes
            if (!shownAchievementsRef.current.has(achievementId)) {
                shownAchievementsRef.current.add(achievementId);

                toast.success(
                    <div className="flex items-start gap-3">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex-1">
                            <p className="font-bold text-amber-800">{achievement.title}</p>
                            <p className="text-sm text-amber-600">{achievement.userName}</p>
                            <p className="text-xs text-slate-600 mt-1">
                                {achievement.description}
                            </p>
                        </div>
                    </div>,
                    {
                        duration: 5000,
                        className: "bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300",
                        action: onDismiss
                            ? {
                                label: "OK",
                                onClick: () => onDismiss(index),
                            }
                            : undefined,
                    }
                );
            }
        });
    }, [achievements]); // Removido onDismiss para evitar re-renders

    return null;
}

function getIconComponent(type: AchievementType) {
    switch (type) {
        case "first_round":
            return Trophy;
        case "punctual":
            return Target;
        case "photographer":
            return Camera;
        case "beer_expert":
            return Award;
        case "completionist":
            return Trophy;
        case "speed_demon":
            return Zap;
        case "social_butterfly":
            return Award;
        default:
            return Trophy;
    }
}

// Hook para detectar logros
export function useAchievements({
    rounds,
    photos,
    arrivalTime,
    plannedTime,
    beersCount,
    completedBars,
    totalBars,
    userName,
}: {
    rounds: number;
    photos: number;
    arrivalTime?: Date;
    plannedTime?: Date;
    beersCount: number;
    completedBars: number;
    totalBars: number;
    userName: string;
}): Achievement[] {
    const achievements: Achievement[] = [];

    // Primera ronda
    if (rounds === 1) {
        achievements.push({
            type: "first_round",
            title: "🏆 Primera Ronda",
            description: "¡Ha pedido la primera ronda!",
            userName,
            icon: "🍺",
        });
    }

    // Puntual (llegó exactamente a la hora)
    if (arrivalTime && plannedTime) {
        const diff = Math.abs(arrivalTime.getTime() - plannedTime.getTime());
        if (diff < 5 * 60 * 1000) {
            // 5 minutos
            achievements.push({
                type: "punctual",
                title: "🎯 Puntual",
                description: "Llegó exactamente a la hora planificada",
                userName,
                icon: "⏰",
            });
        }
    }

    // Fotógrafo (5 fotos)
    if (photos >= 5) {
        achievements.push({
            type: "photographer",
            title: "📸 Fotógrafo Oficial",
            description: "Ha tomado 5 fotos en la ruta",
            userName,
            icon: "📷",
        });
    }

    // Cervecero experto (10 cervezas)
    if (beersCount >= 10) {
        achievements.push({
            type: "beer_expert",
            title: "🍺 Cervecero Experto",
            description: "¡10 cervezas y contando!",
            userName,
            icon: "🍻",
        });
    }

    // Completista (terminó todos los bares)
    if (completedBars === totalBars && totalBars > 0) {
        achievements.push({
            type: "completionist",
            title: "🏁 Completista",
            description: "¡Completó toda la ruta!",
            userName,
            icon: "🎉",
        });
    }

    return achievements;
}
