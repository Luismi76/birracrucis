"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import BarSearchMap from "@/components/BarSearchMap";
import { useLoadScript } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";

// Import types
import type { RouteEditorProps, PlaceResult, BarConfig } from "./types";

// Import hooks
import { useGeolocation } from "./hooks/useGeolocation";
import { useBarSearch } from "./hooks/useBarSearch";
import { useRouteOptimization } from "./hooks/useRouteOptimization";
import { useRouteCalculations } from "./hooks/useRouteCalculations";
import { useManualBarCreation } from "./hooks/useManualBarCreation";

// Import components
import RouteForm from "./components/RouteForm";
import ManualBarModal from "./components/ManualBarModal";
import BarSearchPanel from "./components/BarSearchPanel";
import BarList from "./components/BarList";
import AvailableBarsList from "./components/AvailableBarsList";

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
    const [defaultStayDuration, setDefaultStayDuration] = useState(30);

    // Estado de búsqueda
    const [radius, setRadius] = useState("800");

    // Estado de selección y orden
    const [selectedBars, setSelectedBars] = useState<Map<string, BarConfig>>(new Map());
    const [orderedIds, setOrderedIds] = useState<string[]>([]);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    // Estado de distancia
    const [routeDistance, setRouteDistance] = useState<number | null>(null);
    const [routeDuration, setRouteDuration] = useState<number | null>(null);

    const mapFunctionsRef = useRef<{
        getClickCoordinates: (x: number, y: number, rect: DOMRect) => { lat: number; lng: number } | null;
        getMapCenter: () => { lat: number; lng: number } | null;
    } | null>(null);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    // Custom hooks
    const geolocation = useGeolocation();

    const barSearch = useBarSearch({
        centerLat: geolocation.centerLat,
        centerLng: geolocation.centerLng,
        radius,
        isLoaded,
        selectedBars,
    });

    const routeOptimization = useRouteOptimization(orderedIds, selectedBars, routeDistance);

    const routeCalculations = useRouteCalculations(
        orderedIds,
        selectedBars,
        routeDuration,
        startTime,
        date
    );

    // Callback para cuando se añade un bar manual
    const handleBarAdded = (place: PlaceResult, config: BarConfig) => {
        barSearch.setPlaces(prev => [...prev, place]);

        setSelectedBars(prev => {
            const newMap = new Map(prev);
            const isFirst = newMap.size === 0;
            newMap.set(config.placeId, {
                ...config,
                isStart: isFirst,
            });
            return newMap;
        });

        setOrderedIds(prev => [...prev, config.placeId]);
    };

    const manualBarCreation = useManualBarCreation({
        defaultStayDuration,
        onBarAdded: handleBarAdded,
    });

    // Inicializar datos si estamos editando
    useEffect(() => {
        if (initialData && initialData.stops.length > 0) {
            const newSelectedBars = new Map<string, BarConfig>();
            const newOrderedIds: string[] = [];
            const newPlaces: PlaceResult[] = [];

            const sortedStops = [...initialData.stops].sort((a, b) => a.order - b.order);

            sortedStops.forEach((stop, index) => {
                const placeId = stop.googlePlaceId || stop.id;

                const place: PlaceResult = {
                    placeId,
                    name: stop.name,
                    address: stop.address,
                    lat: stop.lat,
                    lng: stop.lng,
                    rating: null,
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
                    stayDuration: 30,
                });
            });

            barSearch.setPlaces(newPlaces);
            setOrderedIds(newOrderedIds);
            setSelectedBars(newSelectedBars);

            if (sortedStops.length > 0) {
                geolocation.setCenterLat(sortedStops[0].lat.toString());
                geolocation.setCenterLng(sortedStops[0].lng.toString());
            }
        } else {
            geolocation.handleUseMyLocation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData]);

    // Cuando las coordenadas cambian, buscar automáticamente
    useEffect(() => {
        if (geolocation.centerLat && geolocation.centerLng && !initialData) {
            barSearch.handleSearchPlaces();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [geolocation.centerLat, geolocation.centerLng]);

    // Manejar selección de sugerencia con actualización de coordenadas
    const handleSelectSuggestionWithSearch = async (placeId: string, description: string) => {
        const result = await barSearch.handleSelectSuggestion(placeId, description);
        if (result) {
            geolocation.setCenterLat(result.lat);
            geolocation.setCenterLng(result.lng);
            await barSearch.handleSearchPlaces(result.lat, result.lng);
        }
    };

    // Manejar búsqueda por nombre con actualización de coordenadas
    const handleSearchByPlaceNameWithCoords = async () => {
        const result = await barSearch.handleSearchByPlaceName();
        if (result) {
            geolocation.setCenterLat(result.lat);
            geolocation.setCenterLng(result.lng);
            await barSearch.handleSearchPlaces(result.lat, result.lng);
        }
    };

    // Toggle + agregar / eliminar barra
    const handleToggleBar = (placeId: string) => {
        const isSelected = selectedBars.has(placeId);

        if (isSelected) {
            setSelectedBars((prev) => {
                const newMap = new Map(prev);
                const wasStart = newMap.get(placeId)?.isStart;
                newMap.delete(placeId);

                if (wasStart && newMap.size > 0) {
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
            const place = barSearch.places.find((p) => p.placeId === placeId);
            if (!place) {
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

    // Optimizar ruta
    const handleOptimizeRoute = () => {
        const optimizedOrder = routeOptimization.handleOptimizeRoute();
        if (optimizedOrder) {
            setOrderedIds(optimizedOrder);
        } else {
            setError("Selecciona un bar de inicio primero para optimizar.");
        }
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

            let fullStartTime: string | null = null;
            if (startTime && date) {
                const dateOnly = date.split("T")[0];
                fullStartTime = new Date(`${dateOnly}T${startTime}`).toISOString();
            }

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
                    startMode,
                    startTime: fullStartTime,
                    hasEndTime,
                    endTime: fullEndTime,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al guardar la ruta");

            router.push(`/routes/${data.route.id}`);
            router.refresh();
        } catch (err) {
            setError((err as Error).message);
            setLoading(false);
        }
    };

    const mapCenter = geolocation.centerLat && geolocation.centerLng
        ? { lat: parseFloat(geolocation.centerLat), lng: parseFloat(geolocation.centerLng) }
        : { lat: 40.4168, lng: -3.7038 };

    const routePreview = orderedIds
        .map((id) => selectedBars.get(id))
        .filter((b): b is BarConfig => !!b)
        .map((b) => ({ lat: b.bar.lat, lng: b.bar.lng }));

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            {/* Overlay fullscreen para modo manual */}
            {manualBarCreation.manualAddMode && (
                <div className="fixed inset-0 z-50 bg-white">
                    <div className="w-full h-full">
                        <BarSearchMap
                            center={mapCenter}
                            radius={parseInt(radius)}
                            bars={barSearch.places}
                            selectedBars={orderedIds}
                            routePreview={routePreview}
                            onBarClick={handleToggleBar}
                            onDistanceCalculated={(distance, duration) => {
                                setRouteDistance(distance);
                                setRouteDuration(duration);
                            }}
                            onMapClick={manualBarCreation.handleMapClick}
                            manualAddMode={manualBarCreation.manualAddMode}
                            isLoaded={isLoaded}
                            loadError={loadError}
                            onMapRef={(ref) => { mapFunctionsRef.current = ref; }}
                        />
                    </div>

                    <div className="absolute top-4 left-4 right-4 z-20">
                        <div className="bg-purple-500 text-white rounded-xl px-4 py-2 shadow-lg flex items-center justify-between">
                            <span className="font-bold text-sm">✏️ Navega y pulsa el botón</span>
                            <button
                                onClick={() => manualBarCreation.setManualAddMode(false)}
                                className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1 text-sm font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="flex flex-col items-center">
                            <div className="text-5xl animate-bounce">📍</div>
                            <div className="w-3 h-3 bg-purple-500 rounded-full -mt-2"></div>
                        </div>
                    </div>

                    <div className="absolute bottom-8 left-4 right-4 z-20">
                        <button
                            onClick={() => {
                                if (mapFunctionsRef.current) {
                                    const coords = mapFunctionsRef.current.getMapCenter();
                                    if (coords) {
                                        manualBarCreation.handleMapClick(coords.lat, coords.lng);
                                        return;
                                    }
                                }
                                manualBarCreation.handleMapClick(mapCenter.lat, mapCenter.lng);
                            }}
                            className="w-full py-4 bg-purple-500 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-purple-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span>✓</span> Añadir bar aquí
                        </button>
                    </div>

                    <ManualBarModal
                        isOpen={!!manualBarCreation.pendingManualBar}
                        barName={manualBarCreation.manualBarName}
                        onBarNameChange={manualBarCreation.setManualBarName}
                        barAddress={manualBarCreation.manualBarAddress}
                        onBarAddressChange={manualBarCreation.setManualBarAddress}
                        onConfirm={manualBarCreation.handleConfirmManualBar}
                        onCancel={manualBarCreation.handleCancelManualBar}
                    />
                </div>
            )}

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
                <div className="w-full md:w-1/3 flex flex-col border-r bg-white overflow-y-auto">
                    <div className="p-4 space-y-8">
                        <RouteForm
                            name={name}
                            onNameChange={setName}
                            date={date}
                            onDateChange={setDate}
                            startMode={startMode}
                            onStartModeChange={setStartMode}
                            startTime={startTime}
                            onStartTimeChange={setStartTime}
                            hasEndTime={hasEndTime}
                            onHasEndTimeChange={setHasEndTime}
                            endTime={endTime}
                            onEndTimeChange={setEndTime}
                            defaultStayDuration={defaultStayDuration}
                            onDefaultStayDurationChange={setDefaultStayDuration}
                        />

                        <BarSearchPanel
                            placeSearchQuery={barSearch.placeSearchQuery}
                            onPlaceSearchChange={barSearch.handlePlaceSearchChange}
                            autocompleteSuggestions={barSearch.autocompleteSuggestions}
                            showSuggestions={barSearch.showSuggestions}
                            onSelectSuggestion={handleSelectSuggestionWithSearch}
                            onSearchByPlaceName={handleSearchByPlaceNameWithCoords}
                            isGeocoding={barSearch.isGeocoding}
                            onUseMyLocation={geolocation.handleUseMyLocation}
                            onSearchPlaces={() => barSearch.handleSearchPlaces()}
                            placesLoading={barSearch.placesLoading}
                            placesError={barSearch.placesError}
                            radius={radius}
                            onRadiusChange={setRadius}
                            manualAddMode={manualBarCreation.manualAddMode}
                            onToggleManualMode={() => manualBarCreation.setManualAddMode(!manualBarCreation.manualAddMode)}
                        />

                        <BarList
                            orderedIds={orderedIds}
                            selectedBars={selectedBars}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                            onToggleBar={handleToggleBar}
                            onSetStartBar={handleSetStartBar}
                            onUpdateRounds={handleUpdateRounds}
                            onUpdateStayDuration={handleUpdateStayDuration}
                            arrivalTimes={routeCalculations.arrivalTimes}
                            draggedId={draggedId}
                            onOptimizeRoute={handleOptimizeRoute}
                            preOptimizeDistance={routeOptimization.preOptimizeDistance}
                            routeDistance={routeDistance}
                            formatDistance={routeCalculations.formatDistance}
                            totalTimes={routeCalculations.totalTimes}
                            startTime={startTime}
                            hasEndTime={hasEndTime}
                            endTime={endTime}
                        />

                        {/* Lista de bares disponibles */}
                        {barSearch.places.length > 0 && (
                            <AvailableBarsList
                                places={barSearch.places}
                                selectedBars={selectedBars}
                                centerLat={geolocation.centerLat}
                                centerLng={geolocation.centerLng}
                                onToggleBar={handleToggleBar}
                                formatDistance={routeCalculations.formatDistance}
                            />
                        )}
                    </div>
                </div>

                <div className="flex-1 relative bg-slate-100">
                    <BarSearchMap
                        center={mapCenter}
                        radius={parseInt(radius)}
                        bars={barSearch.places}
                        selectedBars={orderedIds}
                        routePreview={routePreview}
                        onBarClick={handleToggleBar}
                        onDistanceCalculated={(distance, duration) => {
                            setRouteDistance(distance);
                            setRouteDuration(duration);
                        }}
                        onMapClick={manualBarCreation.handleMapClick}
                        manualAddMode={false}
                        isLoaded={isLoaded}
                        loadError={loadError}
                        onMapRef={(ref) => { mapFunctionsRef.current = ref; }}
                    />
                </div>
            </div>

            <div className="bg-white border-t px-4 py-3 shadow-lg">
                {error && (
                    <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 mb-3 flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </p>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={loading || selectedBars.size < 2}
                    className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Guardando...
                        </>
                    ) : (
                        <>
                            <span>✓</span> {isEditing ? "Actualizar Ruta" : "Crear Ruta"}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
