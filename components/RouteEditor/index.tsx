"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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

// Import new components
import BottomBar from "./BottomBar";
import ConfigModal, { type RouteConfig } from "./ConfigModal";
import ManualBarModal from "./components/ManualBarModal";
import ShareInviteCode from "@/components/ShareInviteCode";

export default function RouteEditor({ initialData }: RouteEditorProps) {
    const router = useRouter();
    const isEditing = !!initialData;

    // View State - Solo 2 vistas: Mapa y Modal de configuración
    const [showConfigModal, setShowConfigModal] = useState(false);

    // Success/Share State
    const [createdRoute, setCreatedRoute] = useState<{ id: string; name: string; inviteCode: string } | null>(null);

    // Estado de carga y errores
    const [loading, setLoading] = useState(false);

    // Estado de selección y orden
    const [selectedBars, setSelectedBars] = useState<Map<string, BarConfig>>(new Map());
    const [orderedIds, setOrderedIds] = useState<string[]>([]);

    // Estado de distancia
    const [routeDistance, setRouteDistance] = useState<number | null>(null);
    const [routeDuration, setRouteDuration] = useState<number | null>(null);

    // Estado de búsqueda
    const [radius, setRadius] = useState("800");

    // Configuración por defecto (se puede editar en el modal)
    const defaultStayDuration = initialData?.defaultStayDuration || 30;

    const mapFunctionsRef = useRef<{
        getClickCoordinates: (x: number, y: number, rect: DOMRect) => { lat: number; lng: number } | null;
        getMapCenter: () => { lat: number; lng: number } | null;
    } | null>(null);

    const { isLoaded, loadError } = useLoadScript({
        id: "google-maps-script",
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

    // Para calcular tiempos, usamos valores por defecto temporales
    const routeCalculations = useRouteCalculations(
        orderedIds,
        selectedBars,
        routeDuration,
        "", // startTime vacío por ahora
        ""  // date vacío por ahora
    );

    // Generar nombre sugerido basado en la ubicación del primer bar
    const suggestedName = useMemo(() => {
        if (orderedIds.length === 0) return "";
        const firstBar = selectedBars.get(orderedIds[0]);
        if (!firstBar) return "";

        const zone = firstBar.bar.address.split(",")[1]?.trim() || "tu zona";
        const dateStr = format(new Date(), "d MMM", { locale: es });
        return `Ruta por ${zone} - ${dateStr}`;
    }, [orderedIds, selectedBars]);

    // Callback para cuando se añade un bar manual
    const handleBarAdded = useCallback((place: PlaceResult, config: BarConfig) => {
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
    }, [barSearch]);

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
                const placeId = stop.googlePlaceId || "";
                const uniqueId = Math.random().toString(36).substring(2, 15);

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
                    stayDuration: defaultStayDuration,
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

    // Auto-búsqueda cuando cambian las coordenadas (solo si no estamos editando)
    useEffect(() => {
        if (geolocation.centerLat && geolocation.centerLng && !initialData) {
            barSearch.handleSearchPlaces();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [geolocation.centerLat, geolocation.centerLng]);

    // Generar ID único para instancias de bares
    const generateInstanceId = () => Math.random().toString(36).substring(2, 15);

    // Añadir bar (permite duplicados)
    const handleAddBar = useCallback((placeId: string) => {
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
    }, [barSearch.places, defaultStayDuration]);

    // Eliminar bar (por instancia)
    const handleRemoveBar = useCallback((instanceId: string) => {
        setSelectedBars((prev) => {
            const newMap = new Map(prev);
            const wasStart = newMap.get(instanceId)?.isStart;
            newMap.delete(instanceId);

            if (wasStart && newMap.size > 0) {
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
    }, []);

    // Establecer bar de inicio
    const handleSetStartBar = useCallback((instanceId: string) => {
        setSelectedBars((prev) => {
            const newMap = new Map<string, BarConfig>();
            for (const [key, cfg] of prev.entries()) {
                newMap.set(key, { ...cfg, isStart: key === instanceId });
            }
            return newMap;
        });
    }, []);

    // Reordenar bares
    const handleReorder = useCallback((newOrder: string[]) => {
        setOrderedIds(newOrder);
    }, []);

    // Optimizar ruta
    const handleOptimizeRoute = useCallback(() => {
        const optimizedOrder = routeOptimization.handleOptimizeRoute();
        if (optimizedOrder) {
            setOrderedIds(optimizedOrder);
            toast.success("Ruta optimizada para caminar menos");
        } else {
            toast.error("Selecciona un bar de inicio primero.");
        }
    }, [routeOptimization]);

    // Abrir modal de configuración
    const handleContinue = useCallback(() => {
        if (orderedIds.length < 2) {
            toast.error("Añade al menos 2 bares");
            return;
        }

        const hasStart = orderedIds.some(id => selectedBars.get(id)?.isStart);
        if (!hasStart) {
            toast.error("Selecciona un bar de inicio");
            return;
        }

        setShowConfigModal(true);
    }, [orderedIds, selectedBars]);

    // Submit de la ruta
    const handleSubmit = useCallback(async (config: RouteConfig) => {
        setLoading(true);

        try {
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
            if (config.startTime && config.date) {
                const dateOnly = config.date.split("T")[0];
                fullStartTime = `${dateOnly}T${config.startTime}:00`;
            }

            const url = isEditing ? `/api/routes/${initialData?.id}` : "/api/routes";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: config.name,
                    date: config.date ? (config.date.includes("T") ? config.date.split("T")[0] + "T00:00:00" : `${config.date}T00:00:00`) : null,
                    stops: stopsPayload,
                    startMode: config.startMode,
                    startTime: fullStartTime,
                    hasEndTime: false,
                    endTime: null,
                    isPublic: false,
                    isDiscovery: false,
                    description: "",
                    createEditionNow: !isEditing,
                    potEnabled: config.potEnabled,
                    potAmountPerPerson: config.potEnabled ? config.potAmount : null,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al guardar la ruta");

            if (isEditing) {
                toast.success("Ruta actualizada correctamente");
                router.push(`/routes/${data.route.id}`);
                router.refresh();
            } else {
                if (data.edition && data.edition.inviteCode) {
                    toast.success("¡Ruta creada! 🎉");
                    setCreatedRoute({
                        id: data.edition.id,
                        name: data.edition.name,
                        inviteCode: data.edition.inviteCode,
                    });
                } else {
                    toast.success("Ruta guardada");
                    router.push("/routes");
                    router.refresh();
                }
            }
        } catch (err) {
            const message = (err as Error).message;
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [orderedIds, selectedBars, isEditing, initialData?.id, router]);

    const mapCenter = geolocation.centerLat && geolocation.centerLng
        ? { lat: parseFloat(geolocation.centerLat), lng: parseFloat(geolocation.centerLng) }
        : { lat: 40.4168, lng: -3.7038 };

    const routePreview = orderedIds
        .map((id) => selectedBars.get(id))
        .filter((b): b is BarConfig => !!b)
        .map((b) => ({ lat: b.bar.lat, lng: b.bar.lng }));

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-50 font-sans text-slate-900 overflow-hidden">
            {/* Modal para añadir bar manualmente */}
            <ManualBarModal
                isOpen={manualBarCreation.isModalOpen}
                barName={manualBarCreation.barName}
                onBarNameChange={manualBarCreation.setBarName}
                barAddress={manualBarCreation.barAddress}
                onBarAddressChange={manualBarCreation.setBarAddress}
                onConfirm={() => {
                    const currentCenter = mapFunctionsRef.current?.getMapCenter();
                    const lat = currentCenter?.lat ?? mapCenter.lat;
                    const lng = currentCenter?.lng ?? mapCenter.lng;
                    manualBarCreation.handleConfirm(lat, lng);
                }}
                onCancel={manualBarCreation.closeModal}
            />

            {/* Modal de configuración */}
            <ConfigModal
                isOpen={showConfigModal}
                onClose={() => setShowConfigModal(false)}
                onSubmit={handleSubmit}
                selectedBars={selectedBars}
                orderedIds={orderedIds}
                routeDistance={routeDistance}
                routeDuration={routeDuration}
                suggestedName={suggestedName}
                loading={loading}
            />

            {/* Success/Share Overlay */}
            {createdRoute && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                        {/* Contenido scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-center space-y-5">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto animate-in zoom-in spin-in-12 duration-500">
                                <span className="text-3xl sm:text-4xl">🍺</span>
                            </div>

                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">¡Ruta Lista!</h2>
                                <p className="text-slate-600 text-sm sm:text-base">
                                    Tu ruta <span className="font-bold text-amber-600">"{createdRoute.name}"</span> está creada.
                                    <br />¡Invita a tus amigos antes de empezar!
                                </p>
                            </div>

                            <div className="text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <ShareInviteCode
                                    inviteCode={createdRoute.inviteCode}
                                    routeName={createdRoute.name}
                                />
                            </div>
                        </div>

                        {/* Botón fijo en la parte inferior */}
                        <div className="p-4 sm:p-6 border-t bg-white">
                            <button
                                onClick={() => {
                                    router.push(`/routes/${createdRoute.id}`);
                                    router.refresh();
                                }}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg active:scale-[0.98] text-lg"
                            >
                                Ir a la Ruta →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header minimalista */}
            <div className="bg-white/80 backdrop-blur-sm border-b px-4 py-3 shadow-sm z-30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="font-bold text-slate-800">
                            {isEditing ? "Editar Ruta" : "Nueva Ruta"}
                        </h1>
                        <p className="text-xs text-slate-500">
                            Toca los bares en el mapa para añadirlos
                        </p>
                    </div>
                </div>

                {/* Stats rápidos */}
                {orderedIds.length > 0 && (
                    <div className="text-right">
                        <div className="text-sm font-bold text-amber-600">
                            {orderedIds.length} {orderedIds.length === 1 ? 'bar' : 'bares'}
                        </div>
                        {routeDistance && routeDistance > 0 && (
                            <div className="text-xs text-slate-500">
                                {routeCalculations.formatDistance(routeDistance)}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mapa a pantalla completa */}
            <div className="flex-1 relative">
                <BarSearchMap
                    center={mapCenter}
                    radius={parseInt(radius)}
                    bars={barSearch.places}
                    selectedBars={orderedIds.map(id => selectedBars.get(id)?.placeId).filter((id): id is string => !!id)}
                    routePreview={routePreview}
                    onBarClick={handleAddBar}
                    onDistanceCalculated={(distance, duration) => {
                        setRouteDistance(distance);
                        setRouteDuration(duration);
                    }}
                    isLoaded={isLoaded}
                    loadError={loadError}
                    onMapRef={(ref) => { mapFunctionsRef.current = ref; }}
                />

                {/* Indicador del centro del mapa cuando está posicionando */}
                {manualBarCreation.isPositioning && (
                    <>
                        {/* Pin en el centro */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                            <div className="flex flex-col items-center -translate-y-8">
                                <div className="text-5xl drop-shadow-lg animate-bounce">📍</div>
                                <div className="w-4 h-4 bg-amber-500 rounded-full shadow-lg border-2 border-white -mt-2"></div>
                            </div>
                        </div>
                        {/* Barra superior con instrucción y botones */}
                        <div className="absolute top-4 left-2 right-2 z-30">
                            <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-200">
                                <p className="text-center text-slate-700 font-medium mb-3">
                                    📍 Mueve el mapa para posicionar el bar
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={manualBarCreation.cancelPositioning}
                                        className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={manualBarCreation.confirmPosition}
                                        className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
                                    >
                                        Añadir aquí
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Barra inferior con controles */}
                {!manualBarCreation.isPositioning && (
                    <BottomBar
                        orderedIds={orderedIds}
                        selectedBars={selectedBars}
                        routeDistance={routeDistance}
                        onReorder={handleReorder}
                        onRemoveBar={handleRemoveBar}
                        onSetStartBar={handleSetStartBar}
                        onSearchAtLocation={(lat, lng) => {
                            geolocation.setCenterLat(lat);
                            geolocation.setCenterLng(lng);
                            barSearch.handleSearchPlaces(lat, lng);
                        }}
                        onSearchInMapArea={() => {
                            const center = mapFunctionsRef.current?.getMapCenter();
                            if (center) {
                                const lat = center.lat.toString();
                                const lng = center.lng.toString();
                                geolocation.setCenterLat(lat);
                                geolocation.setCenterLng(lng);
                                barSearch.handleSearchPlaces(lat, lng);
                            }
                        }}
                        onUseMyLocation={() => {
                            geolocation.handleUseMyLocation();
                        }}
                        onAddManual={manualBarCreation.startPositioning}
                        onOptimize={handleOptimizeRoute}
                        onContinue={handleContinue}
                        isSearching={barSearch.placesLoading}
                        formatDistance={routeCalculations.formatDistance}
                        placeSearchQuery={barSearch.placeSearchQuery}
                        onPlaceSearchChange={barSearch.handlePlaceSearchChange}
                        autocompleteSuggestions={barSearch.autocompleteSuggestions}
                        showSuggestions={barSearch.showSuggestions}
                        onSelectSuggestion={barSearch.handleSelectSuggestion}
                    />
                )}
            </div>
        </div>
    );
}
