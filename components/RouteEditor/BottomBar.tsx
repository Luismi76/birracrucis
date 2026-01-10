"use client";

import { useState, useCallback } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import BarPill from "./BarPill";
import type { BarConfig } from "./types";

interface BottomBarProps {
    orderedIds: string[];
    selectedBars: Map<string, BarConfig>;
    routeDistance: number | null;
    onReorder: (newOrder: string[]) => void;
    onRemoveBar: (instanceId: string) => void;
    onSetStartBar: (instanceId: string) => void;
    onSearchAtLocation: (lat: string, lng: string) => void;
    onSearchInMapArea: () => void;
    onUseMyLocation: () => void;
    onAddManual: () => void;
    onOptimize: () => void;
    onContinue: () => void;
    isSearching: boolean;
    formatDistance: (meters: number) => string;
    // Para búsqueda de ubicación
    placeSearchQuery: string;
    onPlaceSearchChange: (value: string) => void;
    autocompleteSuggestions: google.maps.places.AutocompletePrediction[];
    showSuggestions: boolean;
    onSelectSuggestion: (placeId: string, description: string) => Promise<{ lat: string; lng: string } | null> | null;
}

export default function BottomBar({
    orderedIds,
    selectedBars,
    routeDistance,
    onReorder,
    onRemoveBar,
    onSetStartBar,
    onSearchAtLocation,
    onSearchInMapArea,
    onUseMyLocation,
    onAddManual,
    onOptimize,
    onContinue,
    isSearching,
    formatDistance,
    placeSearchQuery,
    onPlaceSearchChange,
    autocompleteSuggestions,
    showSuggestions,
    onSelectSuggestion,
}: BottomBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);

    const handleSuggestionClick = useCallback(async (placeId: string, description: string) => {
        const result = onSelectSuggestion(placeId, description);
        if (!result) return;
        const coords = await result;
        if (coords) {
            onSearchAtLocation(coords.lat, coords.lng);
            setShowSearchModal(false);
            onPlaceSearchChange("");
        }
    }, [onSelectSuggestion, onSearchAtLocation, onPlaceSearchChange]);

    const handleSearchInArea = useCallback(() => {
        onSearchInMapArea();
        setShowSearchModal(false);
    }, [onSearchInMapArea]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = orderedIds.indexOf(active.id as string);
            const newIndex = orderedIds.indexOf(over.id as string);
            onReorder(arrayMove(orderedIds, oldIndex, newIndex));
        }
    }, [orderedIds, onReorder]);

    const barCount = orderedIds.length;
    const canContinue = barCount >= 2 && orderedIds.some(id => selectedBars.get(id)?.isStart);

    return (
        <div
            className={`
                fixed bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-[0_-5px_25px_rgba(0,0,0,0.15)]
                transition-all duration-300 ease-out
                ${isExpanded ? 'h-[70%]' : 'h-auto max-h-[200px]'}
            `}
        >
            {/* Handle para expandir */}
            <div
                className="w-full flex justify-center py-2 cursor-pointer touch-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Header con acciones rápidas */}
            <div className="px-4 pb-2 flex items-center justify-between border-b border-slate-100">
                {/* Botones de acción */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSearchModal(true)}
                        disabled={isSearching}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                        title="Buscar bares en otra zona"
                    >
                        {isSearching ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent" />
                        ) : (
                            <span className="text-lg">🔍</span>
                        )}
                    </button>

                    <button
                        onClick={onUseMyLocation}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                        title="Buscar en mi ubicación"
                    >
                        <span className="text-lg">📍</span>
                    </button>

                    <button
                        onClick={onAddManual}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100 hover:bg-amber-200 transition-colors"
                        title="Añadir bar manualmente"
                    >
                        <span className="text-lg">+</span>
                    </button>
                </div>

                {/* Stats de la ruta */}
                <div className="text-right">
                    <div className="text-sm font-bold text-slate-800">
                        {barCount} {barCount === 1 ? 'bar' : 'bares'}
                    </div>
                    {routeDistance && routeDistance > 0 && (
                        <div className="text-xs text-slate-500">
                            {formatDistance(routeDistance)}
                        </div>
                    )}
                </div>
            </div>

            {/* Pills de bares con drag & drop */}
            <div className="px-4 py-3 overflow-x-auto overflow-y-hidden">
                {barCount === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-slate-400 text-sm">
                            Toca los bares en el mapa para añadirlos
                        </p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={orderedIds}
                            strategy={horizontalListSortingStrategy}
                        >
                            <div className="flex gap-2 pb-1">
                                {orderedIds.map((instanceId) => {
                                    const config = selectedBars.get(instanceId);
                                    if (!config) return null;

                                    return (
                                        <BarPill
                                            key={instanceId}
                                            instanceId={instanceId}
                                            name={config.bar.name}
                                            isStart={config.isStart}
                                            plannedRounds={config.plannedRounds}
                                            onRemove={() => onRemoveBar(instanceId)}
                                            onSetStart={() => onSetStartBar(instanceId)}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Botones de acción principales */}
            <div className="px-4 pb-4 flex gap-3">
                {barCount >= 2 && (
                    <button
                        onClick={onOptimize}
                        className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                        <span>✨</span>
                        <span className="hidden sm:inline">Optimizar</span>
                    </button>
                )}

                <button
                    onClick={onContinue}
                    disabled={!canContinue}
                    className={`
                        flex-1 py-3 rounded-xl font-bold text-lg transition-all
                        ${canContinue
                            ? 'bg-amber-500 text-white shadow-md hover:bg-amber-600 hover:shadow-lg active:scale-[0.98]'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }
                    `}
                >
                    {barCount < 2 ? (
                        `Añade ${2 - barCount} bar${2 - barCount > 1 ? 'es' : ''} más`
                    ) : !orderedIds.some(id => selectedBars.get(id)?.isStart) ? (
                        'Selecciona bar de inicio'
                    ) : (
                        'Continuar →'
                    )}
                </button>
            </div>

            {/* Modal de búsqueda de ubicación */}
            {showSearchModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-lg text-slate-800">Buscar zona</h3>
                            <button
                                onClick={() => {
                                    setShowSearchModal(false);
                                    onPlaceSearchChange("");
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Contenido */}
                        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                            {/* Input de búsqueda */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={placeSearchQuery}
                                    onChange={(e) => onPlaceSearchChange(e.target.value)}
                                    placeholder="Ej: Barcelona, Plaza Mayor, Chueca..."
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                    autoFocus
                                />

                                {/* Sugerencias de autocompletado */}
                                {showSuggestions && autocompleteSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                                        {autocompleteSuggestions.map((suggestion) => (
                                            <button
                                                key={suggestion.place_id}
                                                onClick={() => handleSuggestionClick(suggestion.place_id, suggestion.description)}
                                                className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                            >
                                                <div className="font-medium text-slate-800 text-sm">
                                                    {suggestion.structured_formatting.main_text}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {suggestion.structured_formatting.secondary_text}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Separador */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-xs text-slate-400">o</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>

                            {/* Buscar en área del mapa */}
                            <button
                                onClick={handleSearchInArea}
                                disabled={isSearching}
                                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSearching ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent" />
                                ) : (
                                    <>
                                        <span>🗺️</span>
                                        <span>Buscar en el área visible del mapa</span>
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-slate-400 text-center">
                                Mueve el mapa a la zona que quieras y pulsa el botón
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
