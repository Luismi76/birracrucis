"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PlaceResult } from "../types";

interface UseBarSearchProps {
    centerLat: string;
    centerLng: string;
    radius: string;
    isLoaded: boolean;
    selectedBars: Map<string, any>; // Para mantener bares seleccionados
}

export function useBarSearch({ centerLat, centerLng, radius, isLoaded, selectedBars }: UseBarSearchProps) {
    const [places, setPlaces] = useState<PlaceResult[]>([]);
    const [placesLoading, setPlacesLoading] = useState(false);
    const [placesError, setPlacesError] = useState<string | null>(null);

    // Estado de búsqueda por nombre
    const [placeSearchQuery, setPlaceSearchQuery] = useState("");
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
        google.maps.places.AutocompletePrediction[]
    >([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

    // Inicializar AutocompleteService
    useEffect(() => {
        if (isLoaded && !autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        }
    }, [isLoaded]);

    // Buscar bares cercanos usando la API
    const handleSearchPlaces = useCallback(async (overrideLat?: string, overrideLng?: string) => {
        setPlacesError(null);

        const lat = overrideLat ?? centerLat;
        const lng = overrideLng ?? centerLng;

        if (!lat || !lng) {
            setPlacesError("Necesitamos una ubicación central para buscar.");
            return;
        }

        setPlacesLoading(true);
        try {
            const params = new URLSearchParams({
                lat,
                lng,
                radius: radius,
            });

            const res = await fetch(`/api/places?${params.toString()}`);
            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.error ?? "Error al buscar bares.");
            }

            // Reemplazar resultados, pero mantener los bares ya seleccionados
            const newPlaces = (data.bars as PlaceResult[]) || [];
            setPlaces((prev) => {
                // Solo mantener los lugares que están seleccionados
                const selectedPlaces = prev.filter((p) => selectedBars.has(p.placeId));
                const selectedMap = new Map(selectedPlaces.map((p) => [p.placeId, p]));

                // Agregar los nuevos resultados
                newPlaces.forEach((p) => selectedMap.set(p.placeId, p));
                return Array.from(selectedMap.values());
            });
        } catch (err) {
            setPlacesError((err as Error).message ?? "Error al buscar bares.");
        } finally {
            setPlacesLoading(false);
        }
    }, [centerLat, centerLng, radius, selectedBars]);

    // Buscar por nombre de lugar usando Geocoding
    const handleSearchByPlaceName = useCallback(async () => {
        if (!placeSearchQuery.trim()) {
            setPlacesError("Escribe un lugar para buscar.");
            return;
        }

        setIsGeocoding(true);
        setPlacesError(null);

        try {
            // Usar Google Geocoding API
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                placeSearchQuery
            )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;

            const res = await fetch(geocodeUrl);
            const data = await res.json();

            if (data.status === "OK" && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                const latStr = location.lat.toString();
                const lngStr = location.lng.toString();

                // Buscar bares automáticamente con las coordenadas obtenidas
                return { lat: latStr, lng: lngStr };
            } else {
                setPlacesError(`No se encontró "${placeSearchQuery}". Intenta con otro nombre.`);
                return null;
            }
        } catch (err) {
            setPlacesError("Error al buscar el lugar. Inténtalo de nuevo.");
            // console.error(err);
            return null;
        } finally {
            setIsGeocoding(false);
        }
    }, [placeSearchQuery]);

    // Manejar cambios en el input de búsqueda con autocomplete
    const handlePlaceSearchChange = useCallback((value: string) => {
        setPlaceSearchQuery(value);

        if (!value.trim() || !autocompleteServiceRef.current) {
            setAutocompleteSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        // Obtener sugerencias
        autocompleteServiceRef.current.getPlacePredictions(
            {
                input: value,
                language: "es",
            },
            (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setAutocompleteSuggestions(predictions);
                    setShowSuggestions(true);
                } else {
                    setAutocompleteSuggestions([]);
                    setShowSuggestions(false);
                }
            }
        );
    }, []);

    // Seleccionar una sugerencia
    const handleSelectSuggestion = useCallback((placeId: string, description: string) => {
        setPlaceSearchQuery(description);
        setShowSuggestions(false);
        setAutocompleteSuggestions([]);

        // Obtener detalles del lugar y geocodificar
        if (!isLoaded) return null;

        const placesService = new google.maps.places.PlacesService(document.createElement("div"));

        return new Promise<{ lat: string; lng: string } | null>((resolve) => {
            placesService.getDetails({ placeId }, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                    const latStr = place.geometry.location.lat().toString();
                    const lngStr = place.geometry.location.lng().toString();
                    resolve({ lat: latStr, lng: lngStr });
                } else {
                    resolve(null);
                }
            });
        });
    }, [isLoaded]);

    return {
        places,
        setPlaces,
        placesLoading,
        placesError,
        placeSearchQuery,
        setPlaceSearchQuery,
        isGeocoding,
        autocompleteSuggestions,
        showSuggestions,
        setShowSuggestions,
        handleSearchPlaces,
        handleSearchByPlaceName,
        handlePlaceSearchChange,
        handleSelectSuggestion,
    };
}
