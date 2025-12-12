"use client";

import { useState, useEffect } from "react";
import CloneRouteButton from "./CloneRouteButton";
import { X, MapPin, Clock, Users, Beer } from "lucide-react";
import { toast } from "sonner";
import StarRating from "@/components/StarRating";
import dynamic from "next/dynamic";

// Map dinámico (solo carga si se abre el modal)
const PreviewMap = dynamic(() => import("@/components/PreviewMap"), {
    loading: () => <div className="w-full h-48 bg-slate-100 animate-pulse rounded-xl" />,
    ssr: false
});

type RoutePreviewModalProps = {
    isOpen: boolean;
    onClose: () => void;
    routeId: string;
    isOwnTemplate?: boolean; // Si es plantilla propia del usuario
    initialData?: {
        name: string;
        description: string | null;
        creator: { name: string | null; image: string | null } | null;
        _count: { stops: number; participants: number };
    };
};

type FullRouteData = {
    id: string;
    name: string;
    description: string | null;
    stops: {
        id: string;
        name: string;
        address: string;
        lat: number;
        lng: number;
        order: number;
    }[];
    creator: { name: string | null; image: string | null } | null;
    _count: { stops: number; participants: number };
    rating?: {
        average: number;
        count: number;
        userRating?: { rating: number; id: string } | null;
    };
};

export default function RoutePreviewModal({ isOpen, onClose, routeId, isOwnTemplate = false, initialData }: RoutePreviewModalProps) {
    const [loading, setLoading] = useState(true);
    const [fullRoute, setFullRoute] = useState<FullRouteData | null>(null);

    useEffect(() => {
        if (isOpen && routeId) {
            setLoading(true);
            // Fetch de detalles + valoración (ahora hacemos 2 fetches o modificamos endpoint, 
            // para simplificar haremos fetch paralelo del rating)
            const fetchDetails = fetch(`/api/routes/${routeId}`).then(res => res.json());
            const fetchRating = fetch(`/api/routes/${routeId}/rate`).then(res => res.json());

            Promise.all([fetchDetails, fetchRating])
                .then(([detailsData, ratingData]) => {
                    if (detailsData.ok) {
                        setFullRoute({
                            ...detailsData.route,
                            rating: ratingData.ok ? ratingData : undefined
                        });
                    }
                })
                .catch((err) => console.error("Error loading route details:", err))
                .finally(() => setLoading(false));
        } else {
            setFullRoute(null);
        }
    }, [isOpen, routeId]);

    if (!isOpen) return null;

    // Datos a mostrar: Preferir fullRoute, fallback a initialData
    const displayData = fullRoute || initialData;

    if (!displayData) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header con Imagen de Mapa (si hay datos completos) */}
                <div className="relative h-48 bg-slate-100 shrink-0">
                    {fullRoute ? (
                        <PreviewMap stops={fullRoute.stops} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <span className="animate-pulse">Cargando mapa...</span>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
                    >
                        <X className="w-6 h-6 text-slate-600" />
                    </button>
                </div>

                {/* Contenido Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-2">
                            {displayData.name}
                        </h2>

                        {/* Metadatos */}
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                                <Users className="w-4 h-4" />
                                <span>{displayData.creator?.name || "Anónimo"}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-100">
                                <Beer className="w-4 h-4" />
                                <span>{displayData._count?.stops || 0} bares</span>
                            </div>
                            {fullRoute && (
                                // Calculo estimado: 45 min por bar + 10 min camino
                                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100">
                                    <Clock className="w-4 h-4" />
                                    <span>~{Math.round(fullRoute.stops.length * 55 / 60)}h</span>
                                </div>
                            )}
                        </div>

                        {displayData.description && (
                            <p className="mt-4 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                                "{displayData.description}"
                            </p>
                        )}
                    </div>

                    {/* Timeline de Bares */}
                    <div>
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <span>📍</span> Recorrido
                        </h3>
                        {loading && !fullRoute ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="relative space-y-0">
                                {/* Línea conectora */}
                                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200"></div>

                                {fullRoute?.stops.map((stop, index) => (
                                    <div key={stop.id} className="relative flex gap-4 py-3 group">
                                        {/* Nodo */}
                                        <div className="shrink-0 z-10">
                                            <div className="w-10 h-10 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center font-bold text-amber-600 shadow-sm group-hover:scale-110 transition-transform">
                                                {index + 1}
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 pt-1">
                                            <h4 className="font-bold text-slate-800">{stop.name}</h4>
                                            <p className="text-sm text-slate-500 truncate">{stop.address}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col border-t bg-slate-50 shrink-0">
                    {/* Sección de Valoración */}
                    {fullRoute && (
                        <div className="px-6 py-4 border-b border-slate-100 bg-white">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                Valoración de la Comunidad
                            </h4>
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-slate-800">
                                        {(fullRoute.rating?.average || 0).toFixed(1)}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {fullRoute.rating?.count || 0} votos
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-slate-200"></div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-600 mb-1">
                                        {fullRoute.rating?.userRating ? "Tu valoración:" : "¡Valora esta ruta!"}
                                    </p>
                                    <StarRating
                                        rating={fullRoute.rating?.userRating?.rating || 0}
                                        onRatingChange={async (newRating) => {
                                            try {
                                                const res = await fetch(`/api/routes/${routeId}/rate`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ rating: newRating }),
                                                });
                                                const data = await res.json();
                                                if (data.ok) {
                                                    toast.success("¡Gracias por tu valoración!");
                                                    setFullRoute(prev => prev ? ({
                                                        ...prev,
                                                        rating: {
                                                            ...prev.rating,
                                                            userRating: data.rating,
                                                            average: data.newAverage,
                                                            count: data.newCount
                                                        }
                                                    }) : null);
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                toast.error("Error al guardar valoración");
                                            }
                                        }}
                                        size="lg"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cerrar
                        </button>
                        {!isOwnTemplate && (
                            <div className="flex-1">
                                <CloneRouteButton
                                    routeId={routeId}
                                    routeName={displayData.name}
                                    className="w-full justify-center py-3 text-base"
                                    label="Usar Plantilla"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
