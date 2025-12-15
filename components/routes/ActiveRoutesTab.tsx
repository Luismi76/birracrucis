"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DeleteRouteButton from "@/components/DeleteRouteButton";
import MyInvitations from "@/components/MyInvitations";
import RoutePreviewModal from "@/components/RoutePreviewModal";
import CreateEditionModal from "@/components/CreateEditionModal";
import { cn } from "@/lib/utils";

type RouteData = {
    id: string;
    name: string;
    date: string | null;
    status: string;
    isTemplate: boolean;
    templateId: string | null;
    description: string | null;
    stops: { name: string; address?: string | null }[];
    _count: { participants: number; editions?: number };
    creator?: { name: string | null };
    startMode?: "manual" | "scheduled" | "all_present";
    potEnabled?: boolean;
    potAmountPerPerson?: number | null;
};

// Componente de Tarjeta de Ruta
function RouteCard({
    route,
    isLive = false,
    role = "creator",
}: {
    route: RouteData;
    isLive?: boolean;
    role: "creator" | "guest";
}) {
    const isCreator = role === "creator";
    const statusColor = isLive ? "green" : isCreator ? "blue" : "amber";
    const statusBg = isLive ? "bg-green-50" : isCreator ? "bg-blue-50" : "bg-amber-50";
    const statusBorder = isLive ? "border-green-200" : isCreator ? "border-blue-200" : "border-amber-200";

    return (
        <Link
            href={`/routes/${route.id}`}
            className={cn(
                "block relative overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md group bg-white",
                statusBorder
            )}
        >
            {/* Background Accent */}
            <div className={cn("absolute top-0 left-0 w-1.5 h-full",
                isLive ? "bg-green-500" : isCreator ? "bg-blue-500" : "bg-amber-500"
            )} />

            <div className="p-4 pl-6">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                        {/* Header: Badges & Name */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {isLive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] uppercase font-bold tracking-wider animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white block" /> En Curso
                                </span>
                            )}
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border",
                                isCreator
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "bg-amber-100 text-amber-700 border-amber-200"
                            )}>
                                {isCreator ? "👑 Organizador" : "📩 Invitado"}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-amber-600 transition-colors truncate">
                            {route.name}
                        </h3>

                        {/* Location Line */}
                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                            <div className="flex -space-x-1.5">
                                {route.creator?.name ? (
                                    <div className="w-5 h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[8px] font-bold text-indigo-700" title={route.creator.name}>
                                        {route.creator.name.charAt(0)}
                                    </div>
                                ) : null}
                                <div className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] text-slate-500">
                                    +{route._count.participants}
                                </div>
                            </div>
                            <span className="text-slate-400">•</span>
                            <span className="truncate max-w-[150px]">
                                {route.date ? new Date(route.date).toLocaleDateString("es-ES", {
                                    weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
                                }) : "Sin fecha"}
                            </span>
                        </div>
                    </div>

                    {/* Action Arrow */}
                    <div className="flex flex-col items-end gap-2">
                        {isCreator && !isLive && (
                            <DeleteRouteButton routeId={route.id} routeName={route.name} />
                        )}
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="text-base">📍</span> {route.stops.length} paradas
                    </span>
                    {route.potEnabled && (
                        <span className="flex items-center gap-1.5 text-emerald-600">
                            <span className="text-base">💰</span> Bote Activo
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}


export default function ActiveRoutesTab() {
    const router = useRouter();
    const [templates, setTemplates] = useState<RouteData[]>([]);
    const [upcomingRoutes, setUpcomingRoutes] = useState<RouteData[]>([]);
    const [activeRoutes, setActiveRoutes] = useState<RouteData[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [previewRouteId, setPreviewRouteId] = useState<string | null>(null);
    const [previewRouteData, setPreviewRouteData] = useState<any>(null);
    const [editionTemplateId, setEditionTemplateId] = useState<string | null>(null);
    const [editionTemplateName, setEditionTemplateName] = useState("");
    const [editionTemplateData, setEditionTemplateData] = useState<RouteData | null>(null);

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/routes/user-routes");
            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/auth/signin");
                    return;
                }
                throw new Error("Error loading routes");
            }

            const data = await res.json();
            const {
                templates: apiTemplates,
                upcomingEditions,
                activeEditions,
                invitedRoutes
            } = data;

            setTemplates(apiTemplates || []);

            // Process Active Routes (Merge owned + invited)
            const activeInvited = (invitedRoutes || []).filter((r: RouteData) => r.status === "active");
            // @ts-ignore
            const allActive = [...(activeEditions || []), ...activeInvited].sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());

            // Allow identifying ownership manually since API doesn't confirm it on merged array easily
            // Note: Api 'invitedRoutes' excludes creatorId=userId. 'activeEditions' means creatorId=userId.
            // We can attach a temporary property "role" for the UI.
            const allActiveWithRole = allActive.map(r => ({
                ...r,
                role: (activeEditions || []).find((ae: RouteData) => ae.id === r.id) ? "creator" : "guest"
            }));
            setActiveRoutes(allActiveWithRole);


            // Process Upcoming Routes (Merge owned + invited)
            const pendingInvited = (invitedRoutes || []).filter((r: RouteData) => r.status === "pending");
            // @ts-ignore
            const allUpcoming = [...(upcomingEditions || []), ...pendingInvited].sort((a, b) => new Date(a.date || "").getTime() - new Date(b.date || "").getTime());

            const allUpcomingWithRole = allUpcoming.map(r => ({
                ...r,
                role: (upcomingEditions || []).find((ue: RouteData) => ue.id === r.id) ? "creator" : "guest"
            }));

            setUpcomingRoutes(allUpcomingWithRole);

        } catch (error) {
            console.error("Error fetching routes:", error);
        } finally {
            setLoading(false);
        }
    };

    const hasAnyRoutes = templates.length > 0 || upcomingRoutes.length > 0 || activeRoutes.length > 0;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Cargando tus rutas...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500 pb-10">

            {/* Invitaciones pendientes - Siempre visible al top */}
            <MyInvitations />

            {!hasAnyRoutes && (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mx-4">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-4xl mb-4 animate-bounce-slow">
                        🍺
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        Todo muy tranquilo por aquí
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-xs mx-auto">
                        No tienes rutas activas ni invitaciones. ¡Es el momento perfecto para organizar algo!
                    </p>
                    <Link
                        href="/routes/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:scale-105 transition-transform"
                    >
                        <span>🔥</span> Crear Nueva Ruta
                    </Link>
                </div>
            )}

            {/* 🔥 En Curso */}
            {activeRoutes.length > 0 && (
                <div className="space-y-3 px-1">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider pl-1">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
                        En Curso ahora mismo
                    </h2>
                    <div className="grid gap-3">
                        {activeRoutes.map((route) => (
                            // @ts-ignore
                            <RouteCard key={route.id} route={route} isLive={true} role={route.role} />
                        ))}
                    </div>
                </div>
            )}

            {/* 📅 Próximas */}
            {upcomingRoutes.length > 0 && (
                <div className="space-y-3 px-1">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider pl-1">
                        <span>📅</span> Próximas Juergas
                    </h2>
                    <div className="grid gap-3">
                        {upcomingRoutes.map((route) => (
                            // @ts-ignore
                            <RouteCard key={route.id} route={route} isLive={false} role={route.role} />
                        ))}
                    </div>
                </div>
            )}

            {/* 🎒 Plantillas */}
            {templates.length > 0 && (
                <div className="space-y-3 px-1 pt-4 border-t border-slate-200 border-dashed">
                    <h2 className="text-base font-bold text-slate-500 flex items-center gap-2 uppercase tracking-wider pl-1">
                        <span>💾</span> Mis Plantillas Guardadas
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-purple-300 transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-700">{template.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{template.stops.length} paradas • {template._count.editions || 0} usos</p>
                                    </div>
                                    <DeleteRouteButton routeId={template.id} routeName={template.name} />
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setPreviewRouteId(template.id);
                                            setPreviewRouteData(template);
                                        }}
                                        className="flex-1 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        Ver Detalles
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditionTemplateId(template.id);
                                            setEditionTemplateName(template.name);
                                            setEditionTemplateData(template);
                                        }}
                                        className="flex-1 py-1.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <span>🚀</span> Organizar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modales */}
            {previewRouteId && (
                <RoutePreviewModal
                    isOpen={!!previewRouteId}
                    onClose={() => {
                        setPreviewRouteId(null);
                        setPreviewRouteData(null);
                    }}
                    routeId={previewRouteId}
                    initialData={previewRouteData}
                    isOwnTemplate={true}
                />
            )}

            {editionTemplateId && (
                <CreateEditionModal
                    isOpen={!!editionTemplateId}
                    onClose={() => {
                        setEditionTemplateId(null);
                        setEditionTemplateName("");
                        setEditionTemplateData(null);
                        fetchRoutes();
                    }}
                    templateId={editionTemplateId}
                    templateName={editionTemplateName}
                    templateStartMode={editionTemplateData?.startMode as "manual" | "scheduled" | "all_present" | undefined}
                    templateStops={editionTemplateData?.stops?.map(s => ({ name: s.name, address: s.address }))}
                    templatePotEnabled={editionTemplateData?.potEnabled}
                    templatePotAmount={editionTemplateData?.potAmountPerPerson}
                />
            )}
        </div>
    );
}
