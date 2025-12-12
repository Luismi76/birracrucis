"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type AdminRoute = {
    id: string;
    name: string;
    isPublic: boolean;
    description: string | null;
    createdAt: string;
    creator: {
        name: string | null;
        email: string | null;
    } | null;
    stops?: { address: string }[];
    _count: { stops: number };
};

export default function AdminCommunityPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [routes, setRoutes] = useState<AdminRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // --- City Logic (Duplicated for Admin visual verification) ---
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

    const getCity = (route: AdminRoute) => {
        let city = "";
        const address = route.stops?.[0]?.address;

        if (address) {
            const suffix = address.slice(-50).toLowerCase();
            const MAJOR_CITIES = ['Sevilla', 'Madrid', 'Barcelona', 'Valencia', 'Zaragoza', 'Málaga', 'Bilbao', 'Granada', 'Córdoba', 'Alicante'];
            for (const majorCity of MAJOR_CITIES) {
                if (suffix.includes(majorCity.toLowerCase())) return majorCity;
            }

            const parts = address.split(',');
            const validParts = parts.map(p => p.trim()).filter(p => p.length > 0 && !/^\d+$/.test(p));
            if (validParts.length > 0) {
                let candidate = validParts[validParts.length - 1];
                if ((candidate.toLowerCase() === 'españa' || candidate.toLowerCase() === 'spain') && validParts.length > 1) {
                    candidate = validParts[validParts.length - 2];
                }
                candidate = candidate.replace(/\b\d{5}\b/g, '').trim();
                const isStreet = /^(c\.|calle|av|avda|pz|plaza|plaza|pl\.|paseo|po)\s/i.test(candidate);
                if (!isStreet && candidate.length > 1) city = candidate;
            }
        }
        if ((!city || city.length < 2) && route.name.includes(':')) {
            city = route.name.split(':')[0].replace(/^[\p{Emoji}\u2000-\u3300]\s*/gu, '').replace(/[^\w\s\u00C0-\u00FF]/g, '').trim();
        }
        if (city) {
            const lowerCity = city.toLowerCase();
            if (lowerCity === 'bcn') return 'Barcelona';
            for (const [key, mappedCity] of Object.entries(CITY_NORMALIZATIONS)) {
                if (lowerCity.includes(key)) return mappedCity;
            }
        }
        return city || "Otras";
    };
    // -----------------------------------------------------------

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/routes?search=${search}`);
            if (res.status === 403) {
                alert("No tienes permisos de administrador.");
                router.push("/");
                return;
            }
            const data = await res.json();
            if (data.routes) setRoutes(data.routes);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchRoutes();
        } else if (status === "unauthenticated") {
            router.push("/auth/signin"); // Redirect to login if not logged in
        }
    }, [status, search]);

    const togglePublic = async (id: string, currentStatus: boolean) => {
        // Optimistic UI update could be done here, but let's stick to safe wait
        const toastId = toast.loading("Actualizando...");
        try {
            const res = await fetch('/api/admin/routes', {
                method: 'PATCH',
                body: JSON.stringify({ id, isPublic: !currentStatus }),
            });

            if (!res.ok) throw new Error("Error al actualizar");

            toast.success("Estado actualizado", { id: toastId });
            fetchRoutes();
        } catch (e) {
            console.error(e);
            toast.error("Error al actualizar estado", { id: toastId });
        }
    };

    const deleteRoute = async (id: string) => {
        if (!confirm("⚠️ ¿Estás seguro de eliminar esta ruta permanentemente?")) return;

        const toastId = toast.loading("Eliminando...");
        try {
            const res = await fetch('/api/admin/routes', {
                method: 'DELETE',
                body: JSON.stringify({ id }),
            });

            if (!res.ok) throw new Error("Error al eliminar");

            toast.success("Ruta eliminada", { id: toastId });
            fetchRoutes();
        } catch (e) {
            console.error(e);
            toast.error("Error al eliminar ruta", { id: toastId });
        }
    };

    if (status === "loading" || loading) return <div className="p-8">Cargando panel...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">🛡️ Admin Community Panel</h1>
                    <Link href="/" className="text-sm text-blue-600 hover:underline">Volver a la App</Link>
                </div>

                <div className="mb-6">
                    <input
                        className="w-full p-3 border rounded-lg shadow-sm"
                        placeholder="Buscar por nombre o descripción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200 flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-slate-100 text-slate-600 text-sm uppercase">
                                <tr>
                                    <th className="p-4 border-b sticky left-0 bg-slate-100 z-10 w-1/3">Ruta</th>
                                    <th className="p-4 border-b">Creador</th>
                                    <th className="p-4 border-b">Ubicación</th>
                                    <th className="p-4 border-b text-center">Estado</th>
                                    <th className="p-4 border-b text-right sticky right-0 bg-slate-100 z-10">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {routes.map(route => {
                                    const city = getCity(route);
                                    return (
                                        <tr key={route.id} className="hover:bg-slate-50">
                                            <td className="p-4 sticky left-0 bg-white z-10 border-r border-slate-100">
                                                <div className="font-bold text-slate-800">{route.name}</div>
                                                <div className="text-xs text-slate-400 font-mono truncate max-w-xs">{route.id}</div>
                                                {route.description && <div className="text-xs text-slate-500 mt-1 italic line-clamp-1">{route.description}</div>}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-slate-700">{route.creator?.name || "Anónimo"}</div>
                                                <div className="text-xs text-slate-400">{route.creator?.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${city === "Otras" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                                                    {city}
                                                </span>
                                                {route.stops && route.stops.length > 0 && (
                                                    <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px]" title={route.stops[0].address}>
                                                        {route.stops[0].address}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => togglePublic(route.id, route.isPublic)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${route.isPublic ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                >
                                                    {route.isPublic ? 'PÚBLICA' : 'PRIVADA'}
                                                </button>
                                            </td>
                                            <td className="p-4 text-right space-x-2 sticky right-0 bg-white z-10 border-l border-slate-100 shadow-sm">
                                                <button
                                                    onClick={() => deleteRoute(route.id)}
                                                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded bg-white shadow-sm border border-red-100"
                                                    title="Eliminar permanentemente"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {routes.length === 0 && (
                            <div className="p-8 text-center text-slate-400">No se encontraron rutas.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
