"use client";

import { useState, useCallback } from "react";
import type { PlaceResult, BarConfig } from "../types";

interface UseManualBarCreationProps {
    defaultStayDuration: number;
    onBarAdded: (place: PlaceResult, config: BarConfig) => void;
}

export function useManualBarCreation({ defaultStayDuration, onBarAdded }: UseManualBarCreationProps) {
    const [manualAddMode, setManualAddMode] = useState(false);
    const [pendingManualBar, setPendingManualBar] = useState<{ lat: number; lng: number } | null>(null);
    const [manualBarName, setManualBarName] = useState("");
    const [manualBarAddress, setManualBarAddress] = useState("");

    // Handler para clic en el mapa (modo manual)
    const handleMapClick = useCallback((lat: number, lng: number) => {
        console.log("Map clicked at:", lat, lng);
        setPendingManualBar({ lat, lng });
        setManualBarName("");
        setManualBarAddress("");
    }, []);

    // Confirmar la creación del bar manual
    const handleConfirmManualBar = useCallback(() => {
        if (!pendingManualBar || !manualBarName.trim()) return;

        // Crear un ID único para el bar manual
        const manualPlaceId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const manualPlace: PlaceResult = {
            placeId: manualPlaceId,
            name: manualBarName.trim(),
            address: manualBarAddress.trim() || `${pendingManualBar.lat.toFixed(6)}, ${pendingManualBar.lng.toFixed(6)}`,
            lat: pendingManualBar.lat,
            lng: pendingManualBar.lng,
            rating: null,
            userRatingsTotal: 0,
        };

        const config: BarConfig = {
            placeId: manualPlaceId,
            bar: manualPlace,
            plannedRounds: 1,
            maxRounds: undefined,
            isStart: false, // Se determinará en el componente padre
            stayDuration: defaultStayDuration,
        };

        // Llamar al callback
        onBarAdded(manualPlace, config);

        // Limpiar estado
        setPendingManualBar(null);
        setManualBarName("");
        setManualBarAddress("");
        setManualAddMode(false);
    }, [pendingManualBar, manualBarName, manualBarAddress, defaultStayDuration, onBarAdded]);

    // Cancelar la creación del bar manual
    const handleCancelManualBar = useCallback(() => {
        setPendingManualBar(null);
        setManualBarName("");
        setManualBarAddress("");
    }, []);

    return {
        manualAddMode,
        setManualAddMode,
        pendingManualBar,
        manualBarName,
        setManualBarName,
        manualBarAddress,
        setManualBarAddress,
        handleMapClick,
        handleConfirmManualBar,
        handleCancelManualBar,
    };
}
