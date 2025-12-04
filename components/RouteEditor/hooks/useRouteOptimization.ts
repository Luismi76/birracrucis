"use client";

import { useState, useCallback } from "react";
import type { BarConfig } from "../types";

export function useRouteOptimization(
    orderedIds: string[],
    selectedBars: Map<string, BarConfig>,
    routeDistance: number | null
) {
    const [preOptimizeDistance, setPreOptimizeDistance] = useState<number | null>(null);

    // Función para calcular distancia entre dos puntos (Haversine)
    const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distancia en metros
    }, []);

    // Algoritmo Nearest Neighbor para optimizar ruta
    const handleOptimizeRoute = useCallback((): string[] | null => {
        if (orderedIds.length < 2) return null; // Necesitamos al menos 2 bares

        const startBarId = orderedIds.find((id) => selectedBars.get(id)?.isStart);
        if (!startBarId) {
            return null; // Necesitamos un bar de inicio
        }

        // Guardar distancia pre-optimización
        if (routeDistance !== null) {
            setPreOptimizeDistance(routeDistance);
        }

        const optimizedOrder: string[] = [startBarId];
        const remainingIds = orderedIds.filter((id) => id !== startBarId);

        let currentBarId = startBarId;

        while (remainingIds.length > 0) {
            const currentBar = selectedBars.get(currentBarId)!.bar;

            let nearestId = remainingIds[0];
            let minDistance = Infinity;

            for (const id of remainingIds) {
                const candidate = selectedBars.get(id)!.bar;
                const dist = Math.sqrt(
                    Math.pow(candidate.lat - currentBar.lat, 2) + Math.pow(candidate.lng - currentBar.lng, 2)
                );

                if (dist < minDistance) {
                    minDistance = dist;
                    nearestId = id;
                }
            }

            optimizedOrder.push(nearestId);
            remainingIds.splice(remainingIds.indexOf(nearestId), 1);
            currentBarId = nearestId;
        }

        return optimizedOrder;
    }, [orderedIds, selectedBars, routeDistance]);

    return {
        handleOptimizeRoute,
        preOptimizeDistance,
        calculateDistance,
    };
}
