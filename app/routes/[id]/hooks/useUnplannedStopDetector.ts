"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Location {
    lat: number;
    lng: number;
}

interface UseUnplannedStopDetectorProps {
    routeId: string;
    isCreator: boolean;
    currentLocation: Location | null;
    isRouteActive: boolean;
    existingStopPlaceIds: Set<string>; // To avoid adding known stops
}

// Configuración
const CONSTANTS = {
    STATIONARY_THRESHOLD_METERS: 30, // 30 metros de margen
    MIN_TIME_MS: 10 * 60 * 1000, // 10 minutos (Prudence Time)
    // MIN_TIME_MS: 30 * 1000, // 30s para pruebas rápidas - CAMBIAR ANTES DE PROD
    CHECK_RADIUS_METERS: 40,
};

export function useUnplannedStopDetector({
    routeId,
    isCreator,
    currentLocation,
    isRouteActive,
    existingStopPlaceIds
}: UseUnplannedStopDetectorProps) {
    const router = useRouter();
    const [stationaryStart, setStationaryStart] = useState<Date | null>(null);
    const lastLocationRef = useRef<Location | null>(null);
    const hasCheckedRef = useRef<boolean>(false);

    useEffect(() => {
        if (!isRouteActive || !isCreator || !currentLocation) return;

        // Si no hay última ubicación, iniciar tracking
        if (!lastLocationRef.current) {
            lastLocationRef.current = currentLocation;
            setStationaryStart(new Date());
            hasCheckedRef.current = false;
            return;
        }

        // Calcular distancia desde el último punto de referencia
        const dist = calculateDistance(
            lastLocationRef.current.lat,
            lastLocationRef.current.lng,
            currentLocation.lat,
            currentLocation.lng
        );

        if (dist > CONSTANTS.STATIONARY_THRESHOLD_METERS) {
            // Se ha movido, resetear temporizador
            // console.log("Movimiento detectado, reseteando timer de parada.");
            lastLocationRef.current = currentLocation;
            setStationaryStart(new Date());
            hasCheckedRef.current = false;
        } else {
            // Sigue "quieto" (dentro del radio)
            if (stationaryStart && !hasCheckedRef.current) {
                const elapsed = new Date().getTime() - stationaryStart.getTime();

                if (elapsed > CONSTANTS.MIN_TIME_MS) {
                    // Ha pasado el tiempo prudencial, chequear si hay un bar
                    hasCheckedRef.current = true; // Marcar como chequeado para esta sesión estática
                    checkAndAddBar(currentLocation);
                }
            }
        }
    }, [currentLocation, isCreator, isRouteActive, stationaryStart]); // Dependencias clave

    const checkAndAddBar = async (location: Location) => {
        try {
            // 1. Buscar bares cercanos
            const searchRes = await fetch(
                `/api/places?lat=${location.lat}&lng=${location.lng}&radius=${CONSTANTS.CHECK_RADIUS_METERS}`
            );
            const searchData = await searchRes.json();

            if (!searchData.ok || !searchData.bars || searchData.bars.length === 0) {
                // No hay bares cerca
                return;
            }

            // Tomar el más cercano o el primero (la API suele devolver ordenado por relevancia/distancia si no se especifica, pero aquí es nearby)
            // Asumimos el primero es el mejor candidato
            const candidate = searchData.bars[0];

            // 2. Verificar que NO esté ya en la ruta (usando placeId)
            // Nota: existingStopPlaceIds debe contener los IDs de Google de los stops actuales
            if (existingStopPlaceIds.has(candidate.placeId)) {
                // Ya estamos en un bar de la ruta, todo correcto.
                return;
            }

            // 3. Añadir a la ruta
            toast.info(`Detectado nuevo bar: ${candidate.name}. Añadiéndolo a la ruta...`);

            const addRes = await fetch(`/api/routes/${routeId}/stops`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: candidate.name,
                    address: candidate.address,
                    lat: candidate.lat,
                    lng: candidate.lng,
                    googlePlaceId: candidate.placeId,
                    plannedRounds: 1, // Por defecto 1 ronda
                    order: 999, // El backend debería ponerlo al final
                }),
            });

            if (addRes.ok) {
                toast.success(`¡${candidate.name} añadido automáticamente!`);
                router.refresh();
            } else {
                const errorData = await addRes.json().catch(() => ({ error: "Error desconocido" }));
                console.error("Error añadiendo bar automático:", errorData.error || addRes.statusText);
                toast.error(`Error al añadir bar: ${errorData.error || "Error desconocido"}`);
            }

        } catch (error) {
            console.error("Error en detección automática de bares:", error);
        }
    };
}

// Helpers
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}
