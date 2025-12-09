"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

type Achievement = {
    id: string;
    userId: string;
    userName: string;
    userImage: string | null;
    type: string;
    title: string;
    description: string;
    points: number;
    earnedAt: string;
};

type AchievementsToastProps = {
    routeId: string;
    enabled?: boolean;
};

export default function AchievementsToast({
    routeId,
    enabled = true,
}: AchievementsToastProps) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const shownAchievementsRef = useRef<Set<string>>(new Set());
    const lastCheckRef = useRef<string | null>(null);

    useEffect(() => {
        if (!enabled) return;

        async function fetchAchievements() {
            try {
                const response = await fetch(`/api/routes/${routeId}/achievements`);

                if (!response.ok) {
                    throw new Error('Failed to fetch achievements');
                }

                const data = await response.json();
                const newAchievements = data.achievements || [];

                // Filtrar solo logros nuevos (no mostrados antes)
                const unseenAchievements = newAchievements.filter(
                    (achievement: Achievement) => !shownAchievementsRef.current.has(achievement.id)
                );

                // Mostrar toasts para logros nuevos
                unseenAchievements.forEach((achievement: Achievement) => {
                    shownAchievementsRef.current.add(achievement.id);

                    toast.success(
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">{getAchievementIcon(achievement.type)}</div>
                            <div className="flex-1">
                                <p className="font-bold text-amber-800">{achievement.title}</p>
                                <p className="text-sm text-amber-600">{achievement.userName}</p>
                                <p className="text-xs text-slate-600 mt-1">
                                    {achievement.description}
                                </p>
                                <p className="text-xs font-bold text-amber-700 mt-1">
                                    +{achievement.points} puntos
                                </p>
                            </div>
                        </div>,
                        {
                            duration: 5000,
                            className: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-700",
                        }
                    );
                });

                setAchievements(newAchievements);

                // Actualizar último check
                if (newAchievements.length > 0) {
                    lastCheckRef.current = newAchievements[0].id;
                }
            } catch (error) {
                console.error('Error fetching achievements:', error);
            }
        }

        // Fetch inicial
        fetchAchievements();

        // Polling cada 10 segundos
        const interval = setInterval(fetchAchievements, 10000);

        return () => clearInterval(interval);
    }, [routeId, enabled]);

    return null;
}

function getAchievementIcon(type: string): string {
    const icons: Record<string, string> = {
        first_beer: "🍺",
        speed_demon: "⚡",
        social_butterfly: "🦋",
        night_owl: "🦉",
        early_bird: "🐦",
        marathon_runner: "🏃",
        bar_hopper: "🍻",
    };

    return icons[type] || "🏆";
}
