"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type GeolocationPosition = {
    lat: number;
    lng: number;
};

type GeolocationOptions = {
    enableHighAccuracy?: boolean;
    maximumAge?: number;
    timeout?: number;
    onPositionChange?: (position: GeolocationPosition) => void;
};

type GeolocationState = {
    position: GeolocationPosition | null;
    accuracy: number | null;
    error: string | null;
    isWatching: boolean;
    isSimulated: boolean;
};

const DEFAULT_OPTIONS: GeolocationOptions = {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000,
};

export function useGeolocation(options: GeolocationOptions = {}) {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    const [state, setState] = useState<GeolocationState>({
        position: null,
        accuracy: null,
        error: null,
        isWatching: false,
        isSimulated: false,
    });

    const watchIdRef = useRef<number | null>(null);

    // Iniciar seguimiento de ubicación
    const startWatching = useCallback(() => {
        if (!("geolocation" in navigator)) {
            setState(prev => ({ ...prev, error: "Geolocalización no soportada" }));
            return;
        }

        setState(prev => ({ ...prev, error: null, isWatching: true }));

        const id = navigator.geolocation.watchPosition(
            (pos) => {
                const newPosition = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                setState(prev => ({
                    ...prev,
                    position: newPosition,
                    accuracy: pos.coords.accuracy ?? null,
                    isSimulated: false,
                    error: null,
                }));
                mergedOptions.onPositionChange?.(newPosition);
            },
            (err) => {
                console.warn("Error geolocation:", err.message);
                setState(prev => ({ ...prev, error: err.message }));
            },
            {
                enableHighAccuracy: mergedOptions.enableHighAccuracy,
                maximumAge: mergedOptions.maximumAge,
                timeout: mergedOptions.timeout,
            }
        );

        watchIdRef.current = id;
    }, [mergedOptions]);

    // Detener seguimiento
    const stopWatching = useCallback(() => {
        if (watchIdRef.current != null && "geolocation" in navigator) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setState(prev => ({ ...prev, isWatching: false }));
    }, []);

    // Simular posición (para debug)
    const simulatePosition = useCallback((lat: number, lng: number) => {
        const newPosition = { lat, lng };
        setState(prev => ({
            ...prev,
            position: newPosition,
            accuracy: null,
            isSimulated: true,
        }));
        mergedOptions.onPositionChange?.(newPosition);
    }, [mergedOptions]);

    // Limpiar al desmontar
    useEffect(() => {
        return () => {
            if (watchIdRef.current != null && "geolocation" in navigator) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    // Auto-iniciar al montar
    useEffect(() => {
        if ("geolocation" in navigator) {
            startWatching();
        }
    }, []);

    return {
        ...state,
        startWatching,
        stopWatching,
        simulatePosition,
    };
}

// Función utilitaria para calcular distancia (Haversine)
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) return Infinity;
    if ((lat1 === 0 && lng1 === 0) || (lat2 === 0 && lng2 === 0)) return Infinity;

    const R = 6371000; // Radio de la Tierra en metros
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Constantes útiles
export const GEOLOCATION_CONSTANTS = {
    CHECKIN_RADIUS: 75, // metros para check-in
    AUTO_CHECKIN_RADIUS: 50, // metros para auto check-in
    ACCURACY_THRESHOLD: 150, // precisión mínima aceptable
};
