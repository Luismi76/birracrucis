"use client";

import { useState } from "react";

export function useGeolocation() {
    const [centerLat, setCenterLat] = useState("");
    const [centerLng, setCenterLng] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUseMyLocation = () => {
        if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
            setError("Este navegador no soporta geolocalización.");
            return;
        }

        setError(null);
        setIsLoading(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude.toString();
                const lng = pos.coords.longitude.toString();
                setCenterLat(lat);
                setCenterLng(lng);
                setIsLoading(false);
            },
            (err) => {
                // console.error("Error geolocation:", err);
                setError("No se pudo obtener la ubicación.");
                setIsLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    return {
        centerLat,
        centerLng,
        setCenterLat,
        setCenterLng,
        handleUseMyLocation,
        isLoading,
        error,
    };
}
