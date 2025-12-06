"use client";

import { useRef } from "react";

interface BarSearchPanelProps {
    // Búsqueda por nombre
    placeSearchQuery: string;
    onPlaceSearchChange: (value: string) => void;
    autocompleteSuggestions: google.maps.places.AutocompletePrediction[];
    showSuggestions: boolean;
    onSelectSuggestion: (placeId: string, description: string) => void;
    onSearchByPlaceName: () => void;
    isGeocoding: boolean;

    // Geolocalización
    onUseMyLocation: () => void;

    // Búsqueda de bares
    onSearchPlaces: () => void;
    placesLoading: boolean;
    placesError: string | null;

    // Radio de búsqueda
    radius: string;
    onRadiusChange: (radius: string) => void;

    // Modo manual
    manualAddMode: boolean;
    onToggleManualMode: () => void;
}

export default function BarSearchPanel({
    placeSearchQuery,
    onPlaceSearchChange,
    autocompleteSuggestions,
    showSuggestions,
    onSelectSuggestion,
    onSearchByPlaceName,
    isGeocoding,
    onUseMyLocation,
    onSearchPlaces,
    placesLoading,
    placesError,
    radius,
    onRadiusChange,
    manualAddMode,
    onToggleManualMode,
}: BarSearchPanelProps) {
    const searchInputRef = useRef<HTMLDivElement | null>(null);

    return (
        <section className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <span>🍻 Añadir Paradas</span>
            </h2>

            {/* Búsqueda por Nombre */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Buscar por lugar</label>
                <div className="flex gap-2">
                    <div className="relative flex-1" ref={searchInputRef}>
                        <span className="absolute left-3 top-3 text-slate-400 z-10">📍</span>
                        <input
                            type="text"
                            placeholder="Ej: Plaza Mayor, Madrid"
                            className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                            value={placeSearchQuery}
                            onChange={(e) => onPlaceSearchChange(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onSearchByPlaceName()}
                        />

                        {/* Dropdown de sugerencias */}
                        {showSuggestions && autocompleteSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
                                {autocompleteSuggestions.map((suggestion) => (
                                    <button
                                        key={suggestion.place_id}
                                        onClick={() => onSelectSuggestion(suggestion.place_id, suggestion.description)}
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
                        onClick={onSearchByPlaceName}
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

            {/* Separador */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-slate-50 px-2 text-slate-400 font-medium">O</span>
                </div>
            </div>

            {/* Botón de geolocalización */}
            <div className="flex gap-2">
                <button
                    onClick={onUseMyLocation}
                    className="flex-1 bg-blue-50 text-blue-600 px-4 py-3 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border border-blue-100"
                >
                    <span>📍</span> Usar mi ubicación
                </button>
            </div>

            {/* Botón para añadir bar manualmente */}
            <button
                onClick={onToggleManualMode}
                className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border ${manualAddMode
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

            {/* Radio de búsqueda */}
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
                    onChange={(e) => onRadiusChange(e.target.value)}
                    className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            {/* Botón principal de búsqueda */}
            <button
                onClick={onSearchPlaces}
                disabled={placesLoading}
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

            {/* Error de búsqueda */}
            {placesError && (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                    <span>⚠️</span> {placesError}
                </p>
            )}
        </section>
    );
}
