"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import CloneRouteButton from "@/components/CloneRouteButton";
import RoutePreviewModal from "@/components/RoutePreviewModal";
import UserMenu from "@/components/UserMenu";

type PublicRoute = {
    id: string;
    name: string;
    createdAt: string;
    isPublic: boolean;
    description: string | null;
    creator: {
        name: string | null;
        image: string | null;
    } | null;
    _count: {
        stops: number;
        participants: number;
    };
};

export default function CommunityPage() {
    const [routes, setRoutes] = useState<PublicRoute[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [loading, setLoading] = useState(false);
    const { ref, inView } = useInView();

    // Preview State
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [selectedRouteData, setSelectedRouteData] = useState<any>(undefined);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchRoutes = useCallback(async (pageNum: number, searchQuery: string, reset: boolean = false) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/routes/community?limit=20&offset=${pageNum * 20}&search=${encodeURIComponent(searchQuery)}`);
            if (!res.ok) throw new Error("Error loading routes");

            const newRoutes = await res.json();

            if (newRoutes.length < 20) setHasMore(false);

            if (reset) {
                setRoutes(newRoutes);
            } else {
                setRoutes(prev => [...prev, ...newRoutes]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Reset when search changes
    useEffect(() => {
        setPage(0);
        setHasMore(true);
        fetchRoutes(0, debouncedSearch, true);
    }, [debouncedSearch, fetchRoutes]);

    // Load more on scroll
    useEffect(() => {
        if (inView && hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchRoutes(nextPage, debouncedSearch);
        }
    }, [inView, hasMore, loading, page, debouncedSearch, fetchRoutes]);

    return (
        <div className="max-w-3xl mx-auto p-4 pb-24 space-y-6">
            <div className="flex justify-between items-center bg-white p-4 -mx-4 md:rounded-2xl md:mx-0 shadow-sm border-b md:border border-slate-100 sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span>🌍</span> Comunidad
                    </h1>
                    <p className="text-slate-500 text-sm">Descubre rutas creadas por otros</p>
                </div>
                <UserMenu />
            </div>

            <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
                <input
                    type="text"
                    placeholder="Buscar rutas por nombre..."
                    className="w-full pl-10 p-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {routes.map((route) => {
                    // Generar datos "sociales" deterministas basados en el ID
                    const hash = route.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const rating = (3.5 + (hash % 15) / 10).toFixed(1); // 3.5 - 5.0
                    const reviews = 5 + (hash % 50);
                    const variants = [
                        { bg: "from-amber-200 to-orange-100", icon: "🍺", tag: "Clásica" },
                        { bg: "from-purple-200 to-indigo-100", icon: "🕺", tag: "Fiesta" },
                        { bg: "from-emerald-200 to-teal-100", icon: "💸", tag: "Low Cost" },
                        { bg: "from-rose-200 to-pink-100", icon: "📸", tag: "Postureo" },
                        { bg: "from-blue-200 to-cyan-100", icon: "🌊", tag: "Relax" },
                    ];
                    const variant = variants[hash % variants.length];

                    return (
                        <div key={route.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all group overflow-hidden relative">
                            {/* Gradient Background Decoration */}
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${variant.bg} opacity-50 blur-2xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700`} />

                            <div className="flex justify-between items-start gap-3 relative z-10">
                                <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-3xl shadow-inner">
                                    {variant.icon}
                                </div>

                                <div className="flex-1 min-w-0 pt-1">
                                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-purple-600 transition-colors">
                                        {route.name}
                                    </h3>

                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                                            ⭐ {rating} <span className="text-slate-300 font-normal">({reviews})</span>
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wide">
                                            {variant.tag}
                                        </span>
                                    </div>

                                    {route.description && (
                                        <p className="text-slate-500 text-sm mt-2 line-clamp-2 leading-relaxed opacity-80">{route.description}</p>
                                    )}

                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50 text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            {route.creator?.image ? (
                                                <img src={route.creator.image} alt="" className="w-5 h-5 rounded-full" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">👤</div>
                                            )}
                                            <span className="font-medium truncate max-w-[100px]">{route.creator?.name || "Anónimo"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 ml-auto">
                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                                                🍻 <strong>{route._count.stops}</strong> <span className="hidden sm:inline">bares</span>
                                            </span>
                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                                                👥 <strong>{route._count.participants}</strong> <span className="hidden sm:inline">participantes</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedRouteId(route.id);
                                        setSelectedRouteData(route);
                                    }}
                                    className="flex-1 py-2.5 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 group-hover:bg-white group-hover:shadow-sm group-hover:border group-hover:border-slate-100"
                                >
                                    <span>👁️</span> Ver Detalles
                                </button>
                                <div className="shrink-0">
                                    <CloneRouteButton routeId={route.id} routeName={route.name} variant="icon" />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {routes.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-400">
                        <div className="text-4xl mb-2">🏜️</div>
                        <p>No se encontraron rutas públicas</p>
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                <div ref={ref} className="h-4" />
            </div>

            {/* Preview Modal */}
            {selectedRouteId && (
                <RoutePreviewModal
                    isOpen={!!selectedRouteId}
                    onClose={() => {
                        setSelectedRouteId(null);
                        setSelectedRouteData(undefined);
                    }}
                    routeId={selectedRouteId}
                    initialData={selectedRouteData}
                />
            )}

            {/* FAB para volver a mis rutas */}
            <div className="fixed bottom-6 right-6 z-20">
                <Link
                    href="/routes"
                    className="flex justify-center items-center w-14 h-14 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-colors"
                >
                    🍺
                </Link>
            </div>
        </div>
    );
}
