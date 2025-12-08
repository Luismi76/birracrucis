"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import ManualBarModal from "./components/ManualBarModal";
import BarSearchPanel from "./components/BarSearchPanel";
import BarList from "./components/BarList";
import AvailableBarsList from "./components/AvailableBarsList";
import CompactRouteSummary from "./components/CompactRouteSummary";

// Import Wizard Steps
import InfoStep from "./steps/InfoStep";
import DetailsStep from "./steps/DetailsStep";
import ReviewStep from "./steps/ReviewStep";

const STEPS = ["Info", "Mapa", "Detalles", "Revisión"];

export default function RouteEditor({ initialData }: RouteEditorProps) {
    const router = useRouter();
    const isEditing = !!initialData;

    // Wizard State
    const [currentStep, setCurrentStep] = useState(0);
    const [isMobileListExpanded, setIsMobileListExpanded] = useState(false); // Nuevo estado para UI móvil

    // Estado del formulario básico
    const [name, setName] = useState(initialData?.name || "");
    const [date, setDate] = useState(
        initialData?.date ? new Date(initialData.date).toISOString().slice(0, 10) : ""
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado de configuración de tiempo
    const [startMode, setStartMode] = useState<"manual" | "scheduled" | "all_present">(
        initialData?.startMode || "scheduled"
    );
    const [startTime, setStartTime] = useState(
        initialData?.startTime ? new Date(initialData.startTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""
    );
    const [hasEndTime, setHasEndTime] = useState(initialData?.hasEndTime || false);
    const [endTime, setEndTime] = useState(
        initialData?.endTime ? new Date(initialData.endTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""
    );
    const [defaultStayDuration, setDefaultStayDuration] = useState(initialData?.defaultStayDuration || 30);
    const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);
    const [description, setDescription] = useState(initialData?.description || "");

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
                // Generate a unique instance ID for each stop, even if placeId repeats
                const instanceId = generateInstanceId(); // Use the existing helper or inline it if scope issue?
                // Helper is defined above, but inside function component body. It's accessible.

                // But wait, generateInstanceId is defined AFTER this useEffect in the previous tool call?
                // No, I inserted it before handleToggleBar.
                // Ah, useEffect is defined BEFORE handleToggleBar in the original file (line 131 vs 206).
                // So generateInstanceId might not be defined yet if it is declared after.
                // I need to confirm where I inserted generateInstanceId.
                // I replaced handleToggleBar (line 206). useEffect is at 131.
                // So generateInstanceId is NOT available in useEffect.
                // I should move generateInstanceId up or duplicate logic.
                const uniqueId = Math.random().toString(36).substring(2, 15);

                // Check if place is already in newPlaces to avoid duplicates in the "Available/Cache" list
                let place = newPlaces.find(p => p.placeId === placeId);
                if (!place) {
                    place = {
                        placeId,
                        name: stop.name,
                        address: stop.address,
                        lat: stop.lat,
                        lng: stop.lng,
                        rating: null,
                        userRatingsTotal: 0,
                    };
                    newPlaces.push(place);
                }

                newOrderedIds.push(uniqueId);
                newSelectedBars.set(uniqueId, {
                    placeId,
                    bar: place,
                    plannedRounds: stop.plannedRounds,
                    maxRounds: stop.maxRounds ?? undefined,
                    isStart: index === 0,
                    stayDuration: 30, // Or recover from stop if available? The stop object has stayDuration in payload but maybe not in type?
                    // Type RouteStop doesn't seem to have stayDuration in the viewed file.
                    // If it did, use it. For now default.
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

    // Generar ID único para instancias de bares
    const generateInstanceId = () => Math.random().toString(36).substring(2, 15);

    // Añadir bar (permite duplicados)
    const handleAddBar = (placeId: string) => {
        const place = barSearch.places.find((p) => p.placeId === placeId);
        if (!place) return;

        const instanceId = generateInstanceId();

        setSelectedBars((prev) => {
            const newMap = new Map(prev);
            const isFirst = newMap.size === 0;
            newMap.set(instanceId, {
                placeId,
                bar: place,
                plannedRounds: 3,
                maxRounds: undefined,
                isStart: isFirst,
                stayDuration: defaultStayDuration,
            });
            return newMap;
        });

        setOrderedIds((prev) => [...prev, instanceId]);
        toast.success("Bar añadido a la ruta");
    };

    // Eliminar bar (por instancia)
    const handleRemoveBar = (instanceId: string) => {
        setSelectedBars((prev) => {
            const newMap = new Map(prev);
            const wasStart = newMap.get(instanceId)?.isStart;
            newMap.delete(instanceId);

            if (wasStart && newMap.size > 0) {
                // Asignar start al siguiente
                const firstKey = newMap.keys().next().value as string | undefined;
                if (firstKey) {
                    const v = newMap.get(firstKey);
                    if (v) newMap.set(firstKey, { ...v, isStart: true });
                }
            }
            return newMap;
        });

        setOrderedIds((prev) => prev.filter((id) => id !== instanceId));
        toast.info("Bar eliminado de la ruta");
    };

    // Legacy adapter for components verifying selection (optional)
    const handleToggleBar = (placeId: string) => {
        // En AvailableBarsList, esto siempre es "Add" ahora.
        // Pero mantenemos el nombre para minimizar cambios en props por ahora,
        // aunque lo ideal sería renombrar en el componente hijo.
        handleAddBar(placeId);
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
            toast.success("Ruta optimizada para caminar menos");
        } else {
            toast.error("Selecciona un bar de inicio primero.");
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

    const handleSubmit = async () => {
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
                fullStartTime = `${dateOnly}T${startTime}:00`;
            }

            let fullEndTime: string | null = null;
            if (hasEndTime && endTime && date) {
                const dateOnly = date.split("T")[0];
                fullEndTime = `${dateOnly}T${endTime}:00`;
            }

            const url = isEditing ? `/api/routes/${initialData?.id}` : "/api/routes";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    date: date.includes("T") ? date.split("T")[0] + "T00:00:00" : `${date}T00:00:00`,
                    stops: stopsPayload,
                    startMode,
                    startTime: fullStartTime,
                    hasEndTime,
                    endTime: fullEndTime,
                    isPublic,
                    description,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al guardar la ruta");

            toast.success(isEditing ? "Ruta actualizada correctamente" : "Ruta creada correctamente");
            router.push(`/routes/${data.route.id}`);
            router.refresh();
        } catch (err) {
            const message = (err as Error).message;
            setError(message);
            toast.error(message);
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

    // Detectar si mostrar opción pública
    const isClone = isEditing && !!initialData?.originalRouteId;
    const hasChanges = () => {
        if (!initialData) return true;
        if (orderedIds.length !== initialData.stops.length) return true;

        // Simplificado para el wizard, si hay cualquier cambio asumimos que puede querer publicarla
        return true;
    };
    const showPublicOption = !isClone || (isEditing && initialData.isPublic) || hasChanges();

    // WIZARD NAVIGATION LOGIC
    const handleNext = () => {
        if (currentStep === 0) {
            if (!name.trim()) return toast.error("El nombre es obligatorio");
            if (!date) return toast.error("La fecha es obligatoria");
        }
        if (currentStep === 1) {
            if (selectedBars.size < 2) return toast.error("Selecciona al menos 2 bares");
        }

        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3 shadow-sm z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => currentStep > 0 ? handleBack() : router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="font-bold text-slate-800 text-sm md:text-base">
                            {isEditing ? "Editar Ruta" : "Nueva Ruta"}
                        </h1>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            Paso {currentStep + 1} de {STEPS.length}: {STEPS[currentStep]}
                        </div>
                    </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-1.5">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`w-8 h-1.5 rounded-full transition-all ${i <= currentStep ? 'bg-amber-500' : 'bg-slate-200'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {/* Step 0: Info */}
                {currentStep === 0 && (
                    <div className="max-w-2xl mx-auto p-6 md:p-12 h-full overflow-y-auto">
                        <InfoStep
                            name={name} onNameChange={setName}
                            date={date} onDateChange={setDate}
                            isPublic={isPublic} onIsPublicChange={setIsPublic}
                            description={description} onDescriptionChange={setDescription}
                            showPublicOption={showPublicOption}
                        />
                    </div>
                )}

                {/* Step 1: Map Builder (Full Width) */}
                <div className={`${currentStep === 1 ? 'block' : 'hidden'} h-full md:flex md:flex-row relative`}>

                    {/* Resumen Compacto Flotante (Solo visible en paso 1) */}
                    <div className="absolute top-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
                        <div className="pointer-events-auto">
                            <CompactRouteSummary
                                selectedBarsCount={orderedIds.length}
                                routeDistance={routeDistance}
                                totalTimes={routeCalculations.totalTimes}
                                formatDistance={routeCalculations.formatDistance}
                            />
                        </div>
                    </div>

                    {/* Búsqueda y Lista (Sidebar en Desktop, Bottom Sheet en Mobile) */}
                    <div
                        className={`
                            fixed bottom-0 left-0 right-0 z-20 bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.1)] rounded-t-3xl transition-all duration-300
                            md:static md:w-1/3 md:h-full md:shadow-none md:rounded-none md:border-r flex flex-col
                            ${isMobileListExpanded ? 'h-[85%]' : 'h-[35%] md:h-full'}
                        `}
                    >
                        {/* Toggle Handle (Mobile Only) */}
                        <div
                            className="md:hidden w-full flex justify-center py-3 cursor-pointer touch-none"
                            onClick={() => setIsMobileListExpanded(!isMobileListExpanded)}
                        >
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                                onToggleBar={handleRemoveBar}
                                onSetStartBar={handleSetStartBar}
                                onUpdateRounds={handleUpdateRounds}
                                onUpdateStayDuration={handleUpdateStayDuration}
                                arrivalTimes={routeCalculations.arrivalTimes}
                                draggedId={draggedId}
                                onOptimizeRoute={handleOptimizeRoute}
                                preOptimizeDistance={routeOptimization.preOptimizeDistance}
                                routeDistance={routeDistance}
                                formatDistance={routeCalculations.formatDistance}

                            />

                            {/* Lista de bares disponibles */}
                            {barSearch.places.length > 0 && (
                                <AvailableBarsList
                                    places={barSearch.places}
                                    selectedBars={selectedBars}
                                    centerLat={geolocation.centerLat}
                                    centerLng={geolocation.centerLng}
                                    onToggleBar={handleAddBar}
                                    formatDistance={routeCalculations.formatDistance}
                                />
                            )}
                        </div>
                    </div>

                    {/* Mapa (Absolute en Mobile, Flex en Desktop) */}
                    <div className="absolute inset-0 md:static md:flex-1 bg-slate-100 h-full z-0 md:z-auto pb-[35%] md:pb-0">
                        <BarSearchMap
                            center={mapCenter}
                            radius={parseInt(radius)}
                            bars={barSearch.places}
                            selectedBars={orderedIds.map(id => selectedBars.get(id)?.placeId).filter((id): id is string => !!id)}
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
                        {manualBarCreation.manualAddMode && (
                            <div className="absolute inset-x-4 top-4 md:bottom-4 md:top-auto bg-white p-4 rounded-xl shadow-lg z-20 flex flex-col gap-3 animate-in slide-in-from-top md:slide-in-from-bottom">
                                <p className="text-sm font-medium text-center">Toca en el mapa para añadir un punto</p>
                                <button
                                    onClick={() => {
                                        if (mapFunctionsRef.current) {
                                            const coords = mapFunctionsRef.current.getMapCenter();
                                            if (coords) manualBarCreation.handleMapClick(coords.lat, coords.lng);
                                        }
                                    }}
                                    className="w-full py-3 bg-purple-500 text-white rounded-lg font-bold"
                                >
                                    Añadir centro del mapa
                                </button>
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
                    </div>
                </div>

                {/* Step 2: Details */}
                {currentStep === 2 && (
                    <div className="max-w-2xl mx-auto p-6 md:p-12 h-full overflow-y-auto">
                        <DetailsStep
                            startMode={startMode} onStartModeChange={setStartMode}
                            startTime={startTime} onStartTimeChange={setStartTime}
                            hasEndTime={hasEndTime} onHasEndTimeChange={setHasEndTime}
                            endTime={endTime} onEndTimeChange={setEndTime}
                            defaultStayDuration={defaultStayDuration} onDefaultStayDurationChange={setDefaultStayDuration}
                        />
                    </div>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                    <div className="max-w-2xl mx-auto p-6 md:p-12 h-full overflow-y-auto pb-32">
                        <ReviewStep
                            name={name} date={date}
                            startMode={startMode} startTime={startTime}
                            hasEndTime={hasEndTime} endTime={endTime}
                            defaultStayDuration={defaultStayDuration} isPublic={isPublic}
                            orderedIds={orderedIds} selectedBars={selectedBars}
                            routeDistance={routeDistance} routeDuration={routeDuration}
                        />
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="bg-white border-t px-6 py-4 shadow-lg z-20">
                <div className="max-w-4xl mx-auto flex gap-4">
                    {currentStep > 0 && (
                        <button
                            onClick={handleBack}
                            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            Atrás
                        </button>
                    )}

                    {currentStep < STEPS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold text-lg shadow-md hover:bg-amber-600 hover:shadow-lg transition-all active:scale-[0.98]"
                        >
                            Continuar &rarr;
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    Guardando...
                                </>
                            ) : (
                                <>🚀 ¡Crear Ruta!</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
