"use client";

import { useMemo } from "react";
import type { BarConfig } from "../types";

export function useRouteCalculations(
    orderedIds: string[],
    selectedBars: Map<string, BarConfig>,
    routeDuration: number | null,
    startTime: string,
    date: string
) {
    // Función para formatear distancia
    const formatDistance = (meters: number): string => {
        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        }
        return `${(meters / 1000).toFixed(1)} km`;
    };

    // Calcular tiempo total de la ruta (estancia + caminata)
    const totalTimes = useMemo(() => {
        const totalStayTime = orderedIds.reduce((sum, id) => {
            const config = selectedBars.get(id);
            return sum + (config?.stayDuration || 30);
        }, 0);

        const walkTime = routeDuration ? Math.round(routeDuration / 60) : 0;
        return { totalStayTime, walkTime, total: totalStayTime + walkTime };
    }, [orderedIds, selectedBars, routeDuration]);

    // Calcular hora estimada de llegada a cada bar
    const arrivalTimes = useMemo(() => {
        if (!startTime || !date || orderedIds.length === 0) return [];

        // Combinar fecha y hora de inicio
        const dateOnly = date.split("T")[0]; // YYYY-MM-DD
        const fullStartDateTime = new Date(`${dateOnly}T${startTime}`);

        // Verificar que la fecha sea válida
        if (isNaN(fullStartDateTime.getTime())) return [];

        const times: { id: string; arrivalTime: Date; departureTime: Date }[] = [];
        let currentTime = fullStartDateTime;

        orderedIds.forEach((id) => {
            const config = selectedBars.get(id);
            if (!config) return;

            // El primer bar es el punto de partida
            const arrivalTime = new Date(currentTime);
            const departureTime = new Date(currentTime.getTime() + config.stayDuration * 60 * 1000);

            times.push({ id, arrivalTime, departureTime });

            // Añadir tiempo de caminata al siguiente bar (estimación)
            // Por ahora usamos un promedio de 5 min entre bares si no tenemos datos exactos
            const walkTimeToNext = 5; // minutos (podría mejorarse con datos reales de la API)
            currentTime = new Date(departureTime.getTime() + walkTimeToNext * 60 * 1000);
        });

        return times;
    }, [orderedIds, selectedBars, startTime, date]);

    return {
        totalTimes,
        arrivalTimes,
        formatDistance,
    };
}
