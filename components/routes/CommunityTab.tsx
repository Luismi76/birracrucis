"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import CloneRouteButton from "@/components/CloneRouteButton";
import RoutePreviewModal from "@/components/RoutePreviewModal";
import DiscoveryMap from "@/components/routes/DiscoveryMap";

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
    stops?: {
        address: string;
        lat: number;
        lng: number;
    }[];
};

export default function CommunityTab() {
    // Migrated from app/routes/community/page.tsx
    const [routes, setRoutes] = useState<PublicRoute[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [loading, setLoading] = useState(false);
    const { ref, inView } = useInView();

    // Preview State
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [selectedRouteData, setSelectedRouteData] = useState<any>(undefined);

    // Map Toggle State
    const [showMap, setShowMap] = useState(true);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    // State for Accordion
    const [openCity, setOpenCity] = useState<string | null>(null);

    // Normalization map for neighborhoods -> cities
    const CITY_NORMALIZATIONS: Record<string, string> = {
        'triana': 'Sevilla',
        'alameda': 'Sevilla',
        'la latina': 'Madrid',
        'malasaña': 'Madrid',
        'chueca': 'Madrid',
        'lavapiés': 'Madrid',
        'el born': 'Barcelona',
        'gótico': 'Barcelona',
        'raval': 'Barcelona',
        'gràcia': 'Barcelona',
        'el tubo': 'Zaragoza',
        'ruzafa': 'Valencia',
        'carmen': 'Valencia',
        'bcn': 'Barcelona',
        'mad': 'Madrid',
        'sev': 'Sevilla'
    };

    // Helper to extract city
    const getCityFromRoute = (route: PublicRoute) => {
        let city = "";
        const address = route.stops?.[0]?.address;

        // 1. Priority: Check if address contains a known major city in the suffix (last 50 chars)
        // This avoids "Calle Sevilla, Madrid" issues by looking at the end where City usually is.
        if (address) {
            const suffix = address.slice(-50).toLowerCase();
            const MAJOR_CITIES = ['Sevilla', 'Madrid', 'Barcelona', 'Valencia', 'Zaragoza', 'Málaga', 'Bilbao', 'Granada', 'Córdoba', 'Alicante'];

            for (const majorCity of MAJOR_CITIES) {
                if (suffix.includes(majorCity.toLowerCase())) {
                    return majorCity;
                }
            }
        }

        // 2. Try to extract from Address parsing (for smaller cities/towns)
        if (address) {
            const parts = address.split(',');
            // Filter out numeric parts and street prefixes
            const validParts = parts
                .map(p => p.trim())
                .filter(p => p.length > 0 && !/^\d+$/.test(p));

            if (validParts.length > 0) {
                let candidate = validParts[validParts.length - 1];
                // Remove Country
                if ((candidate.toLowerCase() === 'españa' || candidate.toLowerCase() === 'spain') && validParts.length > 1) {
                    candidate = validParts[validParts.length - 2];
                }
                // Clean Zip Code
                candidate = candidate.replace(/\b\d{5}\b/g, '').trim();

                // Reject Street names
                const isStreet = /^(c\.|calle|av|avda|pz|plaza|plaza|pl\.|paseo|po)\s/i.test(candidate);
                if (!isStreet && candidate.length > 1) {
                    city = candidate;
                }
            }
        }

        // 3. Fallback: Parse from Name
        if ((!city || city.length < 2) && route.name.includes(':')) {
            const nameParts = route.name.split(':');
            const candidate = nameParts[0].trim();
            city = candidate.replace(/^[\p{Emoji}\u2000-\u3300]\s*/gu, '')
                .replace(/[^\w\s\u00C0-\u00FF]/g, '')
                .trim();
        }

        // 4. Final Normalization (Barrios -> Cities, Abbreviations)
        // Use partial matching (includes) to catch things like "Alameda de Hércules" -> "alameda" -> "Sevilla"
        if (city) {
            const lowerCity = city.toLowerCase();
            if (lowerCity === 'bcn') return 'Barcelona'; // Explicit check for BCN shortcode

            for (const [key, mappedCity] of Object.entries(CITY_NORMALIZATIONS)) {
                if (lowerCity.includes(key)) {
                    return mappedCity;
                }
            }
        }

        if (!city || city.length < 2) return "Otras Ubicaciones";

        return city;
    };

    // Group routes by city
    const groupedRoutes = useMemo(() => {
        return routes.reduce((acc, route) => {
            const city = getCityFromRoute(route);
            if (!acc[city]) acc[city] = [];
            acc[city].push(route);
            return acc;
        }, {} as Record<string, PublicRoute[]>);
    }, [routes]);

    // Set default open city when routes load if none selected
    useEffect(() => {
        if (!openCity && Object.keys(groupedRoutes).length > 0) {
            setOpenCity(Object.keys(groupedRoutes)[0]);
        }
    }, [groupedRoutes, openCity]);

    const fetchRoutes = useCallback(async (pageNum: number, searchQuery: string, reset: boolean = false) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/routes/community?limit=50&offset=${pageNum * 50}&search=${encodeURIComponent(searchQuery)}`);
            if (!res.ok) throw new Error("Error loading routes");

            const newRoutes = await res.json();

            if (newRoutes.length < 50) setHasMore(false);

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
        <div className="h-full flex flex-col">
            {/* Content Switch: Map vs List */}
            {showMap ? (
                <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">

                    {/* Floating Header Overlay */}
                    <div className="absolute top-4 left-4 right-4 z-10 flex gap-2 pointer-events-none">
                        <div className="flex-1 pointer-events-auto shadow-lg rounded-xl overflow-hidden">
                            <div className="relative">
                                <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Buscar zona..."
                                    className="w-full pl-10 p-3 bg-white/95 backdrop-blur-sm border-0 focus:ring-0 outline-none text-sm font-medium"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-lg shrink-0 pointer-events-auto h-[46px] items-center">
                            <button
                                onClick={() => setShowMap(false)}
                                className="px-3 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                                📋
                            </button>
                            <button
                                onClick={() => setShowMap(true)}
                                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-purple-100 text-purple-700 shadow-sm"
                            >
                                🗺️
                            </button>
                        </div>
                    </div>

                    <DiscoveryMap
                        routes={routes}
                        onRouteSelect={(routeId) => {
                            const route = routes.find(r => r.id === routeId);
                            if (route) {
                                setSelectedRouteId(routeId);
                                setSelectedRouteData(route);
                            }
                        }}
                        searchSignature={debouncedSearch}
                        onResetFilter={() => setSearch("")}
                    />
                </div>
            ) : (
                <div className="h-full overflow-y-auto px-4 pb-24 space-y-4">
                    {/* Standard Header for List View */}
                    <div className="flex gap-2 mb-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Buscar planes..."
                                className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0 items-center">
                            <button
                                onClick={() => setShowMap(false)}
                                className="px-3 py-2 rounded-lg text-sm font-bold bg-purple-100 text-purple-700 shadow-sm"
                            >
                                📋
                            </button>
                            <button
                                onClick={() => setShowMap(true)}
                                className="px-3 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50"
                            >
                                🗺️
                            </button>
                        </div>
                    </div>
                    {Object.entries(groupedRoutes).map(([city, cityRoutes]) => (
                        <div key={city} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                            <button
                                onClick={() => setOpenCity(openCity === city ? null : city)}
                                className={`w-full flex items-center justify-between p-4 transition-colors ${openCity === city ? 'bg-purple-50 text-purple-900 border-b border-purple-100' : 'hover:bg-slate-50 text-slate-700'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">📍</span>
                                    <span className="font-bold">{city}</span>
                                    <span className="px-2 py-0.5 bg-white/50 text-xs font-medium rounded-full border border-slate-200/50">
                                        {cityRoutes.length}
                                    </span>
                                </div>
                                <span className={`transform transition-transform text-slate-400 ${openCity === city ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>

                            {/* Accordion Content */}
                            <div
                                className={`transition-all duration-300 ease-in-out overflow-hidden ${openCity === city ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="p-4 space-y-4">
                                    {cityRoutes.map((route) => {
                                        // Generar datos "sociales" deterministas basados en el ID
                                        const hash = route.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                        const rating = (3.5 + (hash % 15) / 10).toFixed(1); // 3.5 - 5.0
                                        const reviews = 5 + (hash % 50);
                                        const variants = [
                                            { bg: "from-amber-200 to-orange-100", icon: "🍺", tag: "Clásica" },
                                            { bg: "from-purple-200 to-indigo-100", icon: "🕺", tag: "Fiesta" },
                                            { bg: "from-emerald-200 to-teal-100", icon: "💸", tag: "Económica" },
                                            { bg: "from-rose-200 to-pink-100", icon: "📸", tag: "Turismo" },
                                            { bg: "from-blue-200 to-cyan-100", icon: "🌊", tag: "Chill" },
                                        ];
                                        const variant = variants[hash % variants.length];

                                        return (
                                            <div key={route.id} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:shadow-md transition-all group overflow-hidden relative">
                                                {/* Gradient Background Decoration */}
                                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${variant.bg} opacity-50 blur-2xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700`} />

                                                <div className="flex justify-between items-start gap-3 relative z-10">
                                                    <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-3xl shadow-inner border border-slate-100">
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
                                                            <p className="text-slate-500 text-sm mt-2 line-clamp-2 leading-relaxed opacity-80 italic">"{route.description}"</p>
                                                        )}

                                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
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
                                                        className="flex-1 py-2.5 bg-white text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 border border-slate-100"
                                                    >
                                                        Ver Detalles
                                                    </button>
                                                    <div className="shrink-0 w-12">
                                                        <CloneRouteButton routeId={route.id} routeName={route.name} variant="icon" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
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
            )}

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
        </div>
    );
}
