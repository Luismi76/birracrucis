"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import BarSearchMap from "@/components/BarSearchMap";
import { useLoadScript } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";

// Tipos
type PlaceResult = {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating: number | null;
    userRatingsTotal: number;
};

type BarConfig = {
    placeId: string;
    bar: PlaceResult;
    plannedRounds: number;
    maxRounds?: number;
    isStart: boolean;
    stayDuration: number; // minutos de estancia en el bar
};

type RouteStop = {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    order: number;
    plannedRounds: number;
    maxRounds: number | null;
    googlePlaceId: string | null;
};

type RouteData = {
    id: string;
    name: string;
    date: string; // ISO string
    stops: RouteStop[];
};

interface RouteEditorProps {
    initialData?: RouteData;
}

export default function RouteEditor({ initialData }: RouteEditorProps) {
    const router = useRouter();
    const isEditing = !!initialData;

    // Estado del formulario básico
    const [name, setName] = useState(initialData?.name || "");
    const [date, setDate] = useState(
        initialData?.date ? new Date(initialData.date).toISOString().slice(0, 16) : ""
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado de configuración de tiempo
    const [startMode, setStartMode] = useState<"manual" | "scheduled" | "all_present">("scheduled");
    const [startTime, setStartTime] = useState("");
    const [hasEndTime, setHasEndTime] = useState(false);
    const [endTime, setEndTime] = useState("");
    const [defaultStayDuration, setDefaultStayDuration] = useState(30); // minutos por defecto por bar

    // Estado de búsqueda
    const [centerLat, setCenterLat] = useState("");
    const [centerLng, setCenterLng] = useState("");
    const [radius, setRadius] = useState("800");
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
    const searchInputRef = useRef<HTMLDivElement | null>(null);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    // Estado de selección y orden
    const [selectedBars, setSelectedBars] = useState<Map<string, BarConfig>>(new Map());
    const [orderedIds, setOrderedIds] = useState<string[]>([]); // Para mantener el orden visual
    const [draggedId, setDraggedId] = useState<string | null>(null);

    // Estado de distancia y optimización
    const [routeDistance, setRouteDistance] = useState<number | null>(null); // en metros
    const [routeDuration, setRouteDuration] = useState<number | null>(null); // en segundos
    const [preOptimizeDistance, setPreOptimizeDistance] = useState<number | null>(null);

    // Estado para añadir bar manual (clicando en el mapa)
    const [manualAddMode, setManualAddMode] = useState(false);
    const [pendingManualBar, setPendingManualBar] = useState<{ lat: number; lng: number } | null>(null);
    const [manualBarName, setManualBarName] = useState("");
    const [manualBarAddress, setManualBarAddress] = useState("");
    const mapFunctionsRef = useRef<{
        getClickCoordinates: (x: number, y: number, rect: DOMRect) => { lat: number; lng: number } | null;
        getMapCenter: () => { lat: number; lng: number } | null;
    } | null>(null);

    // Estado para ordenación de la lista de bares
    const [sortBy, setSortBy] = useState<"relevance" | "distance">("relevance");

    // Función para calcular distancia entre dos puntos (Haversine)
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distancia en metros
    };

    // Formatear distancia para mostrar
    const formatDistance = (meters: number): string => {
        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        }
        return `${(meters / 1000).toFixed(1)} km`;
    };

    // Inicializar datos si estamos editando
    useEffect(() => {
        if (initialData && initialData.stops.length > 0) {
            const newSelectedBars = new Map<string, BarConfig>();
            const newOrderedIds: string[] = [];
            const newPlaces: PlaceResult[] = [];

            // Ordenar stops por 'order'
            const sortedStops = [...initialData.stops].sort((a, b) => a.order - b.order);

            sortedStops.forEach((stop, index) => {
                const placeId = stop.googlePlaceId || stop.id;

                const place: PlaceResult = {
                    placeId,
                    name: stop.name,
                    address: stop.address,
                    lat: stop.lat,
                    lng: stop.lng,
                    rating: null, // No lo tenemos guardado
                    userRatingsTotal: 0,
                };

                newPlaces.push(place);
                newOrderedIds.push(placeId);
                newSelectedBars.set(placeId, {
                    placeId,
                    bar: place,
                    plannedRounds: stop.plannedRounds,
                    maxRounds: stop.maxRounds ?? undefined,
                    isStart: index === 0,
                    stayDuration: 30, // Por defecto 30 min
                });
            });

            setPlaces(newPlaces);
            setOrderedIds(newOrderedIds);
            setSelectedBars(newSelectedBars);

            // Centrar mapa en el primer bar
            if (sortedStops.length > 0) {
                setCenterLat(sortedStops[0].lat.toString());
                setCenterLng(sortedStops[0].lng.toString());
            }
        } else {
            // Si es nuevo, intentar obtener ubicación
            handleUseMyLocation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData]);

    const handleUseMyLocation = () => {
        if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
            setPlacesError("Este navegador no soporta geolocalización.");
            return;
        }

        setPlacesError(null);
        setPlacesLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude.toString();
                const lng = pos.coords.longitude.toString();
                setCenterLat(lat);
                setCenterLng(lng);
                // Buscar bares automáticamente
                handleSearchPlaces(lat, lng);
            },
            (err) => {
                console.error("Error geolocation:", err);
                setPlacesError("No se pudo obtener la ubicación.");
                setPlacesLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSearchPlaces = async (overrideLat?: string, overrideLng?: string) => {
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
    };

    const handleSearchByPlaceName = async () => {
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
                setCenterLat(latStr);
                setCenterLng(lngStr);

                // Buscar bares automáticamente con las coordenadas obtenidas
                handleSearchPlaces(latStr, lngStr);
            } else {
                setPlacesError(`No se encontró "${placeSearchQuery}". Intenta con otro nombre.`);
            }
        } catch (err) {
            setPlacesError("Error al buscar el lugar. Inténtalo de nuevo.");
            console.error(err);
        } finally {
            setIsGeocoding(false);
        }
    };

    // Inicializar AutocompleteService
    useEffect(() => {
        if (isLoaded && !autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        }
    }, [isLoaded]);

    // Manejar cambios en el input de búsqueda con autocomplete
    const handlePlaceSearchChange = (value: string) => {
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
    };

    // Seleccionar una sugerencia
    const handleSelectSuggestion = (placeId: string, description: string) => {
        setPlaceSearchQuery(description);
        setShowSuggestions(false);
        setAutocompleteSuggestions([]);

        // Obtener detalles del lugar y geocodificar
        if (!isLoaded) return;

        const placesService = new google.maps.places.PlacesService(document.createElement("div"));
        placesService.getDetails({ placeId }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                const latStr = place.geometry.location.lat().toString();
                const lngStr = place.geometry.location.lng().toString();
                setCenterLat(latStr);
                setCenterLng(lngStr);
                handleSearchPlaces(latStr, lngStr);
            }
        });
    };

    // Cerrar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Toggle + agregar / eliminar barra
    const handleToggleBar = (placeId: string) => {
        const isSelected = selectedBars.has(placeId);

        if (isSelected) {
            // REMOVE
            setSelectedBars((prev) => {
                const newMap = new Map(prev);
                const wasStart = newMap.get(placeId)?.isStart;
                newMap.delete(placeId);

                // Si borramos el start bar, asignamos otro si hay
                if (wasStart && newMap.size > 0) {
                    // Seleccionar la primera key del nuevo map como start
                    const firstKey = newMap.keys().next().value as string | undefined;
                    if (firstKey) {
                        const v = newMap.get(firstKey);
                        if (v) newMap.set(firstKey, { ...v, isStart: true });
                    }
                }
                return newMap;
            });

            setOrderedIds((prev) => prev.filter((id) => id !== placeId));
        } else {
            // ADD
            const place = places.find((p) => p.placeId === placeId);
            if (!place) {
                // Si no está en places, no hacemos nada (o podrías pedir detalles a la API)
                console.warn("Place no encontrado en places:", placeId);
                return;
            }

            setSelectedBars((prev) => {
                const newMap = new Map(prev);
                const isFirst = newMap.size === 0;
                newMap.set(placeId, {
                    placeId,
                    bar: place,
                    plannedRounds: 1,
                    maxRounds: undefined,
                    isStart: isFirst,
                    stayDuration: defaultStayDuration,
                });
                return newMap;
            });

            setOrderedIds((prev) => [...prev, placeId]);
        }
    };

    // Establecer bar de inicio
    const handleSetStartBar = (placeId: string) => {
        setSelectedBars((prev) => {
            const newMap = new Map<string, BarConfig>();
            for (const [key, cfg] of prev.entries()) {
                newMap.set(key, { ...cfg, isStart: key === placeId });
            }
            return newMap;
        });
    };

    const handleUpdateRounds = (placeId: string, field: "plannedRounds" | "maxRounds", value: string) => {
        const numVal = value === "" ? undefined : parseInt(value, 10);
        if (value !== "" && isNaN(numVal as number)) return;

        setSelectedBars((prev) => {
            const newMap = new Map(prev);
            const target = newMap.get(placeId);
            if (target) {
                if (field === "plannedRounds") {
                    newMap.set(placeId, { ...target, plannedRounds: numVal ?? target.plannedRounds });
                } else {
                    newMap.set(placeId, { ...target, maxRounds: numVal });
                }
            }
            return newMap;
        });
    };

    const handleUpdateStayDuration = (placeId: string, value: string) => {
        const numVal = parseInt(value, 10);
        if (isNaN(numVal) || numVal < 5) return;

        setSelectedBars((prev) => {
            const newMap = new Map(prev);
            const target = newMap.get(placeId);
            if (target) {
                newMap.set(placeId, { ...target, stayDuration: numVal });
            }
            return newMap;
        });
    };

    // Calcular tiempo total de la ruta (estancia + caminata)
    const calculateTotalTime = () => {
        const totalStayTime = orderedIds.reduce((sum, id) => {
            const config = selectedBars.get(id);
            return sum + (config?.stayDuration || 30);
        }, 0);

        const walkTime = routeDuration ? Math.round(routeDuration / 60) : 0;
        return { totalStayTime, walkTime, total: totalStayTime + walkTime };
    };

    // Calcular hora estimada de llegada a cada bar
    const calculateArrivalTimes = () => {
        if (!startTime || !date || orderedIds.length === 0) return [];

        // Combinar fecha y hora de inicio
        const dateOnly = date.split("T")[0]; // YYYY-MM-DD
        const fullStartDateTime = new Date(`${dateOnly}T${startTime}`);

        // Verificar que la fecha sea válida
        if (isNaN(fullStartDateTime.getTime())) return [];

        const arrivalTimes: { id: string; arrivalTime: Date; departureTime: Date }[] = [];
        let currentTime = fullStartDateTime;

        orderedIds.forEach((id) => {
            const config = selectedBars.get(id);
            if (!config) return;

            // El primer bar es el punto de partida
            const arrivalTime = new Date(currentTime);
            const departureTime = new Date(currentTime.getTime() + config.stayDuration * 60 * 1000);

            arrivalTimes.push({ id, arrivalTime, departureTime });

            // Añadir tiempo de caminata al siguiente bar (estimación)
            // Por ahora usamos un promedio de 5 min entre bares si no tenemos datos exactos
            const walkTimeToNext = 5; // minutos (podría mejorarse con datos reales de la API)
            currentTime = new Date(departureTime.getTime() + walkTimeToNext * 60 * 1000);
        });

        return arrivalTimes;
    };

    const arrivalTimes = calculateArrivalTimes();
    const totalTimes = calculateTotalTime();

    // Algoritmo Nearest Neighbor para optimizar ruta
    const handleOptimizeRoute = () => {
        if (orderedIds.length < 2) return; // Permitir con 2 o más

        const startBarId = orderedIds.find((id) => selectedBars.get(id)?.isStart);
        if (!startBarId) {
            setError("Selecciona un bar de inicio primero para optimizar.");
            return;
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

        setOrderedIds(optimizedOrder);
    };

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === id) return;

        const sourceIndex = orderedIds.indexOf(draggedId);
        const targetIndex = orderedIds.indexOf(id);

        if (sourceIndex !== -1 && targetIndex !== -1) {
            const newOrder = [...orderedIds];
            newOrder.splice(sourceIndex, 1);
            newOrder.splice(targetIndex, 0, draggedId);
            setOrderedIds(newOrder);
        }
    };

    const handleDragEnd = () => {
        setDraggedId(null);
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newOrder = [...orderedIds];
        const temp = newOrder[index];
        newOrder[index] = newOrder[index - 1];
        newOrder[index - 1] = temp;
        setOrderedIds(newOrder);
    };

    const handleMoveDown = (index: number) => {
        if (index === orderedIds.length - 1) return;
        const newOrder = [...orderedIds];
        const temp = newOrder[index];
        newOrder[index] = newOrder[index + 1];
        newOrder[index + 1] = temp;
        setOrderedIds(newOrder);
    };

    // Handler para clic en el mapa (modo manual)
    const handleMapClick = (lat: number, lng: number) => {
        console.log("Map clicked at:", lat, lng, "Manual mode:", manualAddMode);
        setPendingManualBar({ lat, lng });
        setManualBarName("");
        setManualBarAddress("");
    };

    // Confirmar la creación del bar manual
    const handleConfirmManualBar = () => {
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

        // Añadir a places
        setPlaces(prev => [...prev, manualPlace]);

        // Añadir a seleccionados
        setSelectedBars(prev => {
            const newMap = new Map(prev);
            const isFirst = newMap.size === 0;
            newMap.set(manualPlaceId, {
                placeId: manualPlaceId,
                bar: manualPlace,
                plannedRounds: 1,
                maxRounds: undefined,
                isStart: isFirst,
                stayDuration: defaultStayDuration,
            });
            return newMap;
        });

        setOrderedIds(prev => [...prev, manualPlaceId]);

        // Limpiar estado
        setPendingManualBar(null);
        setManualBarName("");
        setManualBarAddress("");
        setManualAddMode(false);
    };

    // Cancelar la creación del bar manual
    const handleCancelManualBar = () => {
        setPendingManualBar(null);
        setManualBarName("");
        setManualBarAddress("");
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (selectedBars.size < 2) {
                throw new Error("Selecciona al menos 2 bares para crear una ruta.");
            }
            if (!name.trim() || !date) {
                throw new Error("Nombre y fecha son obligatorios.");
            }

            const orderedBars = orderedIds.map((id) => selectedBars.get(id)).filter((b): b is BarConfig => !!b);

            const startBar = orderedBars.find((b) => b.isStart);
            if (!startBar) throw new Error("Debe haber un bar de inicio.");

            const stopsPayload = orderedBars.map((b, index) => ({
                name: b.bar.name,
                address: b.bar.address,
                lat: b.bar.lat,
                lng: b.bar.lng,
                plannedRounds: b.plannedRounds,
                maxRounds: b.maxRounds ?? null,
                googlePlaceId: b.placeId,
                order: index,
                stayDuration: b.stayDuration,
            }));

            // Construir fecha/hora de inicio completa si hay startTime
            let fullStartTime: string | null = null;
            if (startTime && date) {
                const dateOnly = date.split("T")[0]; // YYYY-MM-DD
                fullStartTime = new Date(`${dateOnly}T${startTime}`).toISOString();
            }

            // Construir fecha/hora de fin completa si hay endTime
            let fullEndTime: string | null = null;
            if (hasEndTime && endTime && date) {
                const dateOnly = date.split("T")[0];
                fullEndTime = new Date(`${dateOnly}T${endTime}`).toISOString();
            }

            const url = isEditing ? `/api/routes/${initialData?.id}` : "/api/routes";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    date: new Date(date).toISOString(),
                    stops: stopsPayload,
                    // Campos de tiempo
                    startMode,
                    startTime: fullStartTime,
                    hasEndTime,
                    endTime: fullEndTime,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al guardar la ruta");

            // navegar a la ruta creada/actualizada
            router.push(`/routes/${data.route.id}`);
            router.refresh();
        } catch (err) {
            setError((err as Error).message);
            setLoading(false);
        }
    };

    const mapCenter = centerLat && centerLng ? { lat: parseFloat(centerLat), lng: parseFloat(centerLng) } : { lat: 40.4168, lng: -3.7038 };

    // Debug: mostrar estado de carga del mapa
    console.log("Google Maps loaded:", isLoaded, "Error:", loadError?.message);

    const routePreview = orderedIds
        .map((id) => selectedBars.get(id))
        .filter((b): b is BarConfig => !!b)
        .map((b) => ({ lat: b.bar.lat, lng: b.bar.lng }));

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            {/* Overlay fullscreen para modo manual - FUERA del contenedor flex */}
            {manualAddMode && (
                <div className="fixed inset-0 z-50 bg-white">
                    <div className="w-full h-full">
                        <BarSearchMap
                            center={mapCenter}
                            radius={parseInt(radius)}
                            bars={places}
                            selectedBars={orderedIds}
                            routePreview={routePreview}
                            onBarClick={handleToggleBar}
                            onDistanceCalculated={(distance, duration) => {
                                setRouteDistance(distance);
                                setRouteDuration(duration);
                            }}
                            onMapClick={handleMapClick}
                            manualAddMode={manualAddMode}
                            isLoaded={isLoaded}
                            loadError={loadError}
                            onMapRef={(ref) => { mapFunctionsRef.current = ref; }}
                        />
                    </div>

                    {/* Banner indicador */}
                    <div className="absolute top-4 left-4 right-4 z-20">
                        <div className="bg-purple-500 text-white rounded-xl px-4 py-2 shadow-lg flex items-center justify-between">
                            <span className="font-bold text-sm">✏️ Navega y pulsa el botón</span>
                            <button
                                onClick={() => setManualAddMode(false)}
                                className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1 text-sm font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>

                    {/* Marcador central fijo */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="flex flex-col items-center">
                            <div className="text-5xl animate-bounce">📍</div>
                            <div className="w-3 h-3 bg-purple-500 rounded-full -mt-2"></div>
                        </div>
                    </div>

                    {/* Botón para confirmar ubicación */}
                    <div className="absolute bottom-8 left-4 right-4 z-20">
                        <button
                            onClick={() => {
                                if (mapFunctionsRef.current) {
                                    const coords = mapFunctionsRef.current.getMapCenter();
                                    if (coords) {
                                        console.log("Adding bar at map center:", coords.lat, coords.lng);
                                        handleMapClick(coords.lat, coords.lng);
                                        return;
                                    }
                                }
                                handleMapClick(mapCenter.lat, mapCenter.lng);
                            }}
                            className="w-full py-4 bg-purple-500 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-purple-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span>✓</span> Añadir bar aquí
                        </button>
                    </div>

                    {/* Modal para introducir nombre del bar manual */}
                    {pendingManualBar && (
                        <div className="absolute inset-0 bg-black/50 flex items-end sm:items-center justify-center z-30">
                            <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl w-full sm:max-w-sm sm:mx-4 max-h-[80vh] overflow-y-auto">
                                <div className="text-center mb-4">
                                    <span className="text-3xl">📍</span>
                                    <h3 className="font-bold text-slate-800 text-lg mt-1">Nuevo Bar</h3>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                            Nombre del bar *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Bar de Pepe, La Taberna..."
                                            value={manualBarName}
                                            onChange={(e) => setManualBarName(e.target.value)}
                                            className="w-full mt-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-base"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                            Dirección (opcional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Calle Mayor 5"
                                            value={manualBarAddress}
                                            onChange={(e) => setManualBarAddress(e.target.value)}
                                            className="w-full mt-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-base"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={handleCancelManualBar}
                                        className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmManualBar}
                                        disabled={!manualBarName.trim()}
                                        className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ✓ Añadir
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Header Fijo */}
            <div className="bg-white border-b px-4 py-3 shadow-sm z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-amber-600 flex items-center gap-2">
                        <span>🍺</span> {isEditing ? "Editar Birracrucis" : "Nuevo Birracrucis"}
                    </h1>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Panel Izquierdo (Formulario + Lista) - Scrollable */}
                <div className="w-full md:w-1/3 flex flex-col border-r bg-white overflow-y-auto">
                    <div className="p-4 space-y-8">
                        {/* 1. Datos Básicos */}
                        <section className="space-y-4">
                            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <span className="bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm">1</span>
                                Datos de la Fiesta
                            </h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400">🏷️</span>
                                    <input
                                        type="text"
                                        placeholder="Nombre de la ruta (ej. Viernes Santo)"
                                        className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400">📅</span>
                                    <input
                                        type="datetime-local"
                                        className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Configuración de Tiempo */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
                                <h3 className="font-bold text-blue-800 text-sm flex items-center gap-2">
                                    <span>⏰</span> Configuración de Horarios
                                </h3>

                                {/* Modo de inicio */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">¿Cuándo empezamos?</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${startMode === "scheduled" ? "border-blue-500 bg-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}>
                                            <input
                                                type="radio"
                                                name="startMode"
                                                value="scheduled"
                                                checked={startMode === "scheduled"}
                                                onChange={() => setStartMode("scheduled")}
                                                className="hidden"
                                            />
                                            <span className="text-xl">🕐</span>
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-800">A una hora fija</div>
                                                <div className="text-xs text-slate-500">Empezamos puntualmente</div>
                                            </div>
                                        </label>

                                        <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${startMode === "all_present" ? "border-blue-500 bg-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}>
                                            <input
                                                type="radio"
                                                name="startMode"
                                                value="all_present"
                                                checked={startMode === "all_present"}
                                                onChange={() => setStartMode("all_present")}
                                                className="hidden"
                                            />
                                            <span className="text-xl">👥</span>
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-800">Cuando estemos todos</div>
                                                <div className="text-xs text-slate-500">Esperamos a que lleguen al primer bar</div>
                                            </div>
                                        </label>

                                        <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${startMode === "manual" ? "border-blue-500 bg-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}>
                                            <input
                                                type="radio"
                                                name="startMode"
                                                value="manual"
                                                checked={startMode === "manual"}
                                                onChange={() => setStartMode("manual")}
                                                className="hidden"
                                            />
                                            <span className="text-xl">🎯</span>
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-800">Inicio manual</div>
                                                <div className="text-xs text-slate-500">El creador decide cuándo empezar</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Hora de inicio (si es scheduled o all_present) */}
                                {(startMode === "scheduled" || startMode === "all_present") && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                                            {startMode === "scheduled" ? "Hora de inicio" : "Hora estimada de quedada"}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-slate-400">🕐</span>
                                            <input
                                                type="time"
                                                className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Hora de fin (reserva) */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasEndTime}
                                            onChange={(e) => setHasEndTime(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Tenemos hora de fin (reserva)</span>
                                    </label>

                                    {hasEndTime && (
                                        <div className="relative mt-2">
                                            <span className="absolute left-3 top-3 text-slate-400">🍽️</span>
                                            <input
                                                type="time"
                                                className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                placeholder="Hora de la reserva"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">Te avisaremos si vais justos de tiempo</p>
                                        </div>
                                    )}
                                </div>

                                {/* Tiempo por bar por defecto */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">Tiempo por bar (por defecto)</label>
                                        <span className="text-sm font-bold text-blue-600">{defaultStayDuration} min</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="15"
                                        max="60"
                                        step="5"
                                        value={defaultStayDuration}
                                        onChange={(e) => setDefaultStayDuration(parseInt(e.target.value))}
                                        className="w-full accent-blue-500 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>15 min (rápido)</span>
                                        <span>60 min (tranqui)</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Búsqueda */}
                        <section className="space-y-4">
                            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <span className="bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm">2</span>
                                ¿Dónde empezamos?
                            </h2>

                            {/* Búsqueda por Nombre */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Buscar por lugar</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1" ref={searchInputRef as any}>
                                        <span className="absolute left-3 top-3 text-slate-400 z-10">📍</span>
                                        <input
                                            type="text"
                                            placeholder="Ej: Plaza Mayor, Madrid"
                                            className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                            value={placeSearchQuery}
                                            onChange={(e) => handlePlaceSearchChange(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSearchByPlaceName()}
                                            onFocus={() => autocompleteSuggestions.length > 0 && setShowSuggestions(true)}
                                        />

                                        {/* Dropdown de sugerencias */}
                                        {showSuggestions && autocompleteSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
                                                {autocompleteSuggestions.map((suggestion) => (
                                                    <button
                                                        key={suggestion.place_id}
                                                        onClick={() => handleSelectSuggestion(suggestion.place_id, suggestion.description)}
                                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-2"
                                                    >
                                                        <span className="text-slate-400 mt-0.5">📍</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-slate-800 truncate">
                                                                {suggestion.structured_formatting.main_text}
                                                            </div>
                                                            <div className="text-xs text-slate-500 truncate">
                                                                {suggestion.structured_formatting.secondary_text}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSearchByPlaceName}
                                        disabled={isGeocoding || !placeSearchQuery.trim()}
                                        className="px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {isGeocoding ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                Buscando...
                                            </>
                                        ) : (
                                            <>🔍 Buscar</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-slate-50 px-2 text-slate-400 font-medium">O</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleUseMyLocation}
                                    className="flex-1 bg-blue-50 text-blue-600 px-4 py-3 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border border-blue-100"
                                >
                                    <span>📍</span> Usar mi ubicación
                                </button>
                            </div>

                            {/* Botón para añadir bar manualmente */}
                            <button
                                onClick={() => {
                                    console.log("Toggle manual mode, current:", manualAddMode, "-> new:", !manualAddMode);
                                    setManualAddMode(!manualAddMode);
                                }}
                                className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border ${
                                    manualAddMode
                                        ? "bg-purple-500 text-white border-purple-600 hover:bg-purple-600"
                                        : "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100"
                                }`}
                            >
                                <span>✏️</span>
                                {manualAddMode ? "Modo manual activo - Clica en el mapa" : "Añadir bar que no aparece"}
                            </button>
                            {manualAddMode && (
                                <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded-lg border border-purple-100 text-center">
                                    💡 Haz clic en el mapa para añadir un bar que no aparece en Google Maps
                                </p>
                            )}

                            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                                    <span>Radio de sed</span>
                                    <span className="text-amber-600">{radius}m</span>
                                </div>
                                <input
                                    type="range"
                                    min="300"
                                    max="2000"
                                    step="100"
                                    value={radius}
                                    onChange={(e) => setRadius(e.target.value)}
                                    className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <button
                                onClick={() => handleSearchPlaces()}
                                disabled={placesLoading || !centerLat || !centerLng}
                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {placesLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Buscando bares...
                                    </>
                                ) : (
                                    <>🔍 Buscar Bares</>
                                )}
                            </button>

                            {placesError && (
                                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                                    <span>⚠️</span> {placesError}
                                </p>
                            )}
                        </section>

                        {/* 3. Selección y Configuración */}
                        {(places.length > 0 || selectedBars.size > 0) && (
                            <section className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        <span className="bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm">3</span>
                                        La Ruta
                                    </h2>
                                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                                        {selectedBars.size} bares
                                    </span>
                                </div>

                                {/* Lista de Seleccionados (Reordenable) */}
                                {orderedIds.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tu Itinerario</h3>
                                            {orderedIds.length > 1 && (
                                                <button
                                                    onClick={handleOptimizeRoute}
                                                    className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100 transition-colors"
                                                >
                                                    <span>✨</span> Optimizar Ruta
                                                </button>
                                            )}
                                        </div>

                                        {/* Información de Tiempo Total */}
                                        {orderedIds.length > 0 && (
                                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-3 space-y-3">
                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    <div>
                                                        <div className="text-xs text-slate-500 font-medium">🍺 En bares</div>
                                                        <div className="text-lg font-bold text-slate-800">{totalTimes.totalStayTime} min</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 font-medium">🚶 Caminando</div>
                                                        <div className="text-lg font-bold text-slate-800">{totalTimes.walkTime} min</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 font-medium">⏱️ Total</div>
                                                        <div className="text-lg font-bold text-amber-600">{Math.floor(totalTimes.total / 60)}h {totalTimes.total % 60}m</div>
                                                    </div>
                                                </div>
                                                {routeDistance !== null && (
                                                    <div className="text-center text-xs text-slate-500 border-t border-blue-100 pt-2">
                                                        📍 {routeDistance >= 1000 ? `${(routeDistance / 1000).toFixed(2)} km` : `${Math.round(routeDistance)} m`} de recorrido
                                                    </div>
                                                )}
                                                {startTime && arrivalTimes.length > 0 && (
                                                    <div className="bg-white rounded-lg p-2 border border-blue-100">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-600">🚀 Inicio:</span>
                                                            <span className="font-bold text-slate-800">{startTime}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-600">🏁 Fin estimado:</span>
                                                            <span className="font-bold text-slate-800">
                                                                {arrivalTimes[arrivalTimes.length - 1]?.departureTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                                            </span>
                                                        </div>
                                                        {hasEndTime && endTime && (
                                                            <div className="flex justify-between text-sm mt-1 pt-1 border-t border-blue-50">
                                                                <span className="text-slate-600">🍽️ Reserva:</span>
                                                                <span className={`font-bold ${
                                                                    arrivalTimes[arrivalTimes.length - 1]?.departureTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) > endTime
                                                                        ? "text-red-600"
                                                                        : "text-green-600"
                                                                }`}>
                                                                    {endTime}
                                                                    {arrivalTimes[arrivalTimes.length - 1]?.departureTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) > endTime
                                                                        ? " ⚠️ ¡Vais tarde!"
                                                                        : " ✅"}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {preOptimizeDistance !== null && routeDistance !== null && preOptimizeDistance > routeDistance && (
                                                    <div className="bg-green-100 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                                                        <span className="text-green-600 font-bold text-sm">🎉 Ahorraste {Math.round(preOptimizeDistance - routeDistance)} m</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {orderedIds.map((id, index) => {
                                                const config = selectedBars.get(id);
                                                if (!config) return null;

                                                return (
                                                    <div
                                                        key={id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, id)}
                                                        onDragOver={(e) => handleDragOver(e, id)}
                                                        onDragEnd={handleDragEnd}
                                                        className={`relative group bg-white border-2 rounded-xl p-3 shadow-sm cursor-move transition-all ${draggedId === id
                                                            ? "opacity-50 border-amber-400 rotate-2 scale-95"
                                                            : "border-slate-100 hover:border-amber-200 hover:shadow-md"
                                                            } ${config.isStart ? "border-amber-400 bg-amber-50/50" : ""}`}
                                                    >
                                                        {/* Conector visual (línea punteada) */}
                                                        {index < orderedIds.length - 1 && (
                                                            <div className="absolute left-[1.65rem] top-[3.5rem] bottom-[-1rem] w-0.5 border-l-2 border-dashed border-slate-200 -z-10"></div>
                                                        )}

                                                        <div className="flex items-start gap-3">
                                                            <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${config.isStart ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                                                                }`}>
                                                                {index + 1}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h3 className="font-bold text-slate-800 truncate pr-2">{config.bar.name}</h3>
                                                                        <p className="text-xs text-slate-500 truncate">{config.bar.address}</p>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1 ml-2">
                                                                        <button
                                                                            onClick={() => handleMoveUp(index)}
                                                                            disabled={index === 0}
                                                                            className="text-slate-400 hover:text-amber-600 disabled:opacity-20 disabled:hover:text-slate-400"
                                                                            title="Subir"
                                                                        >
                                                                            ▲
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleMoveDown(index)}
                                                                            disabled={index === orderedIds.length - 1}
                                                                            className="text-slate-400 hover:text-amber-600 disabled:opacity-20 disabled:hover:text-slate-400"
                                                                            title="Bajar"
                                                                        >
                                                                            ▼
                                                                        </button>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleToggleBar(id)}
                                                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>

                                                                {/* Hora estimada de llegada */}
                                                                {arrivalTimes.find(a => a.id === id) && (
                                                                    <div className="mt-2 flex items-center gap-2 text-xs">
                                                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                                            🕐 {arrivalTimes.find(a => a.id === id)?.arrivalTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                                                        </span>
                                                                        <span className="text-slate-400">→</span>
                                                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                                                            {arrivalTimes.find(a => a.id === id)?.departureTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                                        <span className="text-xs">🍺</span>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            max="10"
                                                                            value={config.plannedRounds}
                                                                            onChange={(e) => handleUpdateRounds(id, "plannedRounds", e.target.value)}
                                                                            className="w-8 text-sm bg-transparent text-center font-bold outline-none"
                                                                        />
                                                                    </div>

                                                                    <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                                                                        <span className="text-xs">⏱️</span>
                                                                        <input
                                                                            type="number"
                                                                            min="5"
                                                                            max="120"
                                                                            step="5"
                                                                            value={config.stayDuration}
                                                                            onChange={(e) => handleUpdateStayDuration(id, e.target.value)}
                                                                            className="w-10 text-sm bg-transparent text-center font-bold outline-none text-blue-700"
                                                                        />
                                                                        <span className="text-xs text-blue-500">min</span>
                                                                    </div>

                                                                    <label className={`flex items-center gap-1 text-xs font-medium cursor-pointer px-2 py-1 rounded-lg border transition-colors ${config.isStart
                                                                        ? "bg-amber-100 text-amber-700 border-amber-200"
                                                                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                                                        }`}>
                                                                        <input
                                                                            type="radio"
                                                                            name="startBar"
                                                                            checked={config.isStart}
                                                                            onChange={() => handleSetStartBar(id)}
                                                                            className="hidden"
                                                                        />
                                                                        <span>{config.isStart ? "🚩 Inicio" : "🏁 Aquí"}</span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Lista de Resultados de Búsqueda */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Bares Disponibles ({places.filter((p) => !selectedBars.has(p.placeId)).length})
                                        </h3>
                                        {/* Selector de ordenación */}
                                        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                                            <button
                                                onClick={() => setSortBy("relevance")}
                                                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                                    sortBy === "relevance"
                                                        ? "bg-white text-slate-800 shadow-sm"
                                                        : "text-slate-500 hover:text-slate-700"
                                                }`}
                                            >
                                                ⭐ Relevancia
                                            </button>
                                            <button
                                                onClick={() => setSortBy("distance")}
                                                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                                    sortBy === "distance"
                                                        ? "bg-white text-slate-800 shadow-sm"
                                                        : "text-slate-500 hover:text-slate-700"
                                                }`}
                                            >
                                                📍 Cercanía
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {places
                                            .filter((p) => !selectedBars.has(p.placeId))
                                            .map((place) => ({
                                                ...place,
                                                distance: centerLat && centerLng
                                                    ? calculateDistance(parseFloat(centerLat), parseFloat(centerLng), place.lat, place.lng)
                                                    : null
                                            }))
                                            .sort((a, b) => {
                                                if (sortBy === "distance") {
                                                    return (a.distance ?? Infinity) - (b.distance ?? Infinity);
                                                }
                                                // Por relevancia: primero rating, luego número de reseñas
                                                const ratingA = a.rating ?? 0;
                                                const ratingB = b.rating ?? 0;
                                                if (ratingB !== ratingA) return ratingB - ratingA;
                                                return b.userRatingsTotal - a.userRatingsTotal;
                                            })
                                            .map((place) => (
                                                <div
                                                    key={place.placeId}
                                                    onClick={() => handleToggleBar(place.placeId)}
                                                    className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 cursor-pointer transition-all"
                                                >
                                                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-amber-400 flex items-center justify-center flex-shrink-0">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-baseline gap-2">
                                                            <h3 className="font-medium text-slate-700 truncate">{place.name}</h3>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                {place.distance !== null && (
                                                                    <span className="text-xs text-blue-500 font-medium">
                                                                        {formatDistance(place.distance)}
                                                                    </span>
                                                                )}
                                                                {place.rating && (
                                                                    <span className="text-xs text-amber-500 font-bold flex items-center gap-0.5">
                                                                        ⭐ {place.rating}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-slate-400 truncate">{place.address}</p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Botón Crear */}
                        <div className="pt-2 pb-8 sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-slate-100 -mx-4 px-4">
                            {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg text-center">{error}</p>}
                            <button
                                onClick={handleSubmit}
                                disabled={loading || selectedBars.size < 2}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-amber-200 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? "Guardando..." : isEditing ? "💾 Guardar Cambios" : "🚀 ¡Crear Ruta Épica!"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho (Mapa) - Solo visible cuando NO está en modo manual */}
                {!manualAddMode && (
                    <div className="relative w-full md:w-2/3 h-[60dvh] md:h-full order-first md:order-last border-b md:border-l border-slate-200">
                        <BarSearchMap
                            center={mapCenter}
                            radius={parseInt(radius)}
                            bars={places}
                            selectedBars={orderedIds}
                            routePreview={routePreview}
                            onBarClick={handleToggleBar}
                            onDistanceCalculated={(distance, duration) => {
                                setRouteDistance(distance);
                                setRouteDuration(duration);
                            }}
                            onMapClick={handleMapClick}
                            manualAddMode={false}
                            isLoaded={isLoaded}
                            loadError={loadError}
                            onMapRef={(ref) => { mapFunctionsRef.current = ref; }}
                        />

                        {/* Overlay de instrucciones si está vacío */}
                        {places.length === 0 && selectedBars.size === 0 && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center pointer-events-none z-10">
                                <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-xs border border-slate-100">
                                    <div className="text-4xl mb-3">🗺️</div>
                                    <p className="text-slate-800 font-bold text-lg">¡Empieza tu aventura!</p>
                                    <p className="text-sm text-slate-500 mt-2">Usa el panel para buscar bares o tu ubicación actual.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
