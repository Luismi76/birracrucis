"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HistoryRoute = {
    id: string;
    name: string;
    date: string | null;
    status: string;
    creator: { name: string | null; image: string | null } | null;
    creatorId: string;
    duration: number | null; // minutes
    userDrinks: number;
    userPhotos: number;
    avgRating: number;
    stops: { name: string }[];
    _count: {
        participants: number;
        photos: number;
        drinks: number;
    };
};

export default function HistoryTab() {
    const [routes, setRoutes] = useState<HistoryRoute[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("/api/routes/history");
                if (res.ok) {
                    const data = await res.json();
                    setRoutes(data);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (routes.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in zoom-in duration-300">
                <div className="text-4xl mb-3">📜</div>
                <p className="text-slate-600 mb-2">No tienes historia (aún)</p>
                <p className="text-sm text-slate-500">
                    Completa tu primera ruta para empezar a ver aquí tus estadísticas legendarias.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">

            {/* Resumen Gamificado */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <span>🏆</span> Salón de la Fama
                </h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                        <p className="text-2xl font-bold">{routes.length}</p>
                        <p className="text-[10px] uppercase tracking-wider opacity-80">Rutas</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                        <p className="text-2xl font-bold">
                            {routes.reduce((acc, r) => acc + r.stops.length, 0)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider opacity-80">Bares</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                        <p className="text-2xl font-bold">
                            {routes.reduce((acc, r) => acc + r.userDrinks, 0)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider opacity-80">Cañas</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                        <p className="text-2xl font-bold">
                            {routes.reduce((acc, r) => acc + r.userPhotos, 0)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider opacity-80">Fotos</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {routes.map((route) => (
                    <Link
                        key={route.id}
                        href={`/routes/${route.id}`}
                        className="block bg-white rounded-xl border shadow-sm hover:shadow-md hover:border-amber-200 transition-all overflow-hidden group"
                    >
                        {/* Header */}
                        <div className="bg-slate-50 p-4 border-b border-slate-100 group-hover:bg-amber-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{route.name}</h3>
                                    <p className="text-slate-500 text-xs">
                                        {route.date ? new Date(route.date).toLocaleDateString("es-ES", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        }) : "Fecha sin definir"}
                                    </p>
                                </div>
                                {route.duration && (
                                    <span className="text-xs bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">
                                        ⏱️ {Math.floor(route.duration / 60)}h {route.duration % 60}m
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 grid grid-cols-2 gap-4">
                            {/* Stats */}
                            <div className="flex flex-col gap-2 justify-center text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <span>🍻</span> <strong>{route.userDrinks}</strong> bebidas
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>📸</span> <strong>{route.userPhotos}</strong> fotos
                                </div>
                            </div>

                            {/* Rating Visual */}
                            <div className="flex flex-col items-end justify-center">
                                <div className="text-2xl font-bold text-amber-500">
                                    {route.avgRating > 0 ? route.avgRating.toFixed(1) : "-"}
                                </div>
                                <div className="flex text-amber-300 text-xs">
                                    {"★".repeat(Math.round(route.avgRating))}
                                    {"☆".repeat(5 - Math.round(route.avgRating))}
                                </div>
                            </div>
                        </div>

                        {/* Footer - Social */}
                        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-50 text-xs flex justify-between items-center">
                            <div className="text-slate-500">
                                <span className="font-bold">{route._count.participants}</span> colegas se unieron
                            </div>
                            {/* Re-use Action */}
                            <div className="text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                Repetir Ruta →
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
