"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import CloneRouteButton from "@/components/CloneRouteButton";
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
                {routes.map((route) => (
                    <div key={route.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-purple-200 transition-colors">
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{route.name}</h3>
                                {route.description && (
                                    <p className="text-slate-500 text-sm mt-1 line-clamp-2">{route.description}</p>
                                )}

                                <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                                        <span>👤</span>
                                        <span className="font-medium text-slate-700">{route.creator?.name || "Anónimo"}</span>
                                    </div>
                                    <span className="flex items-center gap-1">
                                        <span>🍺</span> {route._count.stops} bares
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span>👥</span> {route._count.participants}
                                    </span>
                                </div>
                            </div>

                            <div className="shrink-0 flex flex-col gap-2">
                                <CloneRouteButton routeId={route.id} routeName={route.name} />
                            </div>
                        </div>
                    </div>
                ))}

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
