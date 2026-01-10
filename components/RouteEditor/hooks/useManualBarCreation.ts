"use client";

import { useState, useCallback } from "react";
import type { PlaceResult, BarConfig } from "../types";

interface UseManualBarCreationProps {
    defaultStayDuration: number;
    onBarAdded: (place: PlaceResult, config: BarConfig) => void;
}

/**
 * Hook para añadir bares manualmente con dos pasos:
 * 1. Activar modo de posicionamiento (el usuario mueve el mapa)
 * 2. Confirmar posición y abrir modal para el nombre
 */
export function useManualBarCreation({ defaultStayDuration, onBarAdded }: UseManualBarCreationProps) {
    const [isPositioning, setIsPositioning] = useState(false); // Paso 1: posicionando
    const [isModalOpen, setIsModalOpen] = useState(false);     // Paso 2: modal abierto
    const [barName, setBarName] = useState("");
    const [barAddress, setBarAddress] = useState("");

    // Paso 1: Activar modo de posicionamiento
    const startPositioning = useCallback(() => {
        setIsPositioning(true);
        setIsModalOpen(false);
    }, []);

    // Cancelar posicionamiento
    const cancelPositioning = useCallback(() => {
        setIsPositioning(false);
        setIsModalOpen(false);
        setBarName("");
        setBarAddress("");
    }, []);

    // Paso 2: Confirmar posición y abrir modal
    const confirmPosition = useCallback(() => {
        setIsPositioning(false);
        setBarName("");
        setBarAddress("");
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setBarName("");
        setBarAddress("");
    }, []);

    // Confirmar creación del bar con las coordenadas del centro del mapa
    const handleConfirm = useCallback((lat: number, lng: number) => {
        if (!barName.trim()) return;

        const manualPlaceId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const manualPlace: PlaceResult = {
            placeId: manualPlaceId,
            name: barName.trim(),
            address: barAddress.trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat,
            lng,
            rating: null,
            userRatingsTotal: 0,
        };

        const config: BarConfig = {
            placeId: manualPlaceId,
            bar: manualPlace,
            plannedRounds: 1,
            maxRounds: undefined,
            isStart: false,
            stayDuration: defaultStayDuration,
        };

        onBarAdded(manualPlace, config);
        closeModal();
    }, [barName, barAddress, defaultStayDuration, onBarAdded, closeModal]);

    return {
        // Estados
        isPositioning,
        isModalOpen,
        barName,
        setBarName,
        barAddress,
        setBarAddress,
        // Acciones
        startPositioning,
        cancelPositioning,
        confirmPosition,
        closeModal,
        handleConfirm,
    };
}
