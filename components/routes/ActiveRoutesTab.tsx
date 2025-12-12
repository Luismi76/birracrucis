"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DeleteRouteButton from "@/components/DeleteRouteButton";
import MyInvitations from "@/components/MyInvitations";
import RoutePreviewModal from "@/components/RoutePreviewModal";
import CreateEditionModal from "@/components/CreateEditionModal";

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

// Helper component for accordion sections
function CollapsibleSection({
    title,
    count,
    icon,
    colorClass,
    children,
    defaultOpen = false
}: {
    title: string;
    count: number;
    icon: string;
    colorClass: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
            >
                <h2 className={`text-sm font-bold ${colorClass} uppercase tracking-wide flex items-center gap-2`}>
                    <span className="text-2xl">{icon}</span> {title} ({count})
                </h2>
                <div className={`transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </div>
            </button>

            {isOpen && (
                <div className="p-3 space-y-3 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                    {children}
                </div>
            )}
        </section>
    );
}

export default function ActiveRoutesTab() {
    const router = useRouter();
    const [templates, setTemplates] = useState<RouteData[]>([]);
    const [upcomingEditions, setUpcomingEditions] = useState<RouteData[]>([]);
    const [activeEditions, setActiveEditions] = useState<RouteData[]>([]);
    const [invitedRoutes, setInvitedRoutes] = useState<RouteData[]>([]);
    const [loading, setLoading] = useState(true);

    // Preview modal state
    const [previewRouteId, setPreviewRouteId] = useState<string | null>(null);
    const [previewRouteData, setPreviewRouteData] = useState<any>(null);

    // Create edition modal state
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

            // Separar rutas por tipo
            setTemplates(data.templates || []);
            setUpcomingEditions(data.upcomingEditions || []);
            setActiveEditions(data.activeEditions || []);
            setInvitedRoutes(data.invitedRoutes || []);
        } catch (error) {
            console.error("Error fetching routes:", error);
        } finally {
            setLoading(false);
        }
    };

    const hasAnyRoutes = templates.length > 0 || upcomingEditions.length > 0 ||
        activeEditions.length > 0 || invitedRoutes.length > 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">

            {/* Invitaciones pendientes - Siempre visible al top */}
            <MyInvitations />

            {!hasAnyRoutes && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-4xl mb-3">🍺</div>
                    <p className="text-slate-600 mb-4">
                        No tienes planes a la vista. ¿Montamos algo?
                    </p>
                    <Link
                        href="/routes/new"
                        className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200"
                    >
                        Crear Nueva Ruta
                    </Link>
                </div>
            )}

            {/* Rutas Activas */}
            {activeEditions.length > 0 && (
                <CollapsibleSection
                    title="¡Está pasando ahora!"
                    count={activeEditions.length}
                    icon="🔥"
                    colorClass="text-green-600"
                    defaultOpen={true}
                >
                    {activeEditions.map((route) => (
                        <Link
                            key={route.id}
                            href={`/routes/${route.id}`}
                            className="block border-2 border-green-300 bg-green-50 rounded-xl p-4 hover:bg-green-100 hover:border-green-400 transition-all shadow-sm"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-slate-800 truncate">{route.name}</h3>
                                        <span className="shrink-0 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse font-bold">
                                            EN VIVO
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {route.date ? new Date(route.date).toLocaleDateString("es-ES", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                        }) : "Fecha pendiente"}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-md">
                                            <span>🍺</span> {route.stops.length} bares
                                        </span>
                                        <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-md">
                                            <span>👥</span> {route._count.participants} participantes
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </CollapsibleSection>
            )}

            {/* Próximas Rutas (Ediciones Pendientes) */}
            {upcomingEditions.length > 0 && (
                <CollapsibleSection
                    title="Próximas Juergas"
                    count={upcomingEditions.length}
                    icon="📅"
                    colorClass="text-blue-600"
                    defaultOpen={true}
                >
                    {upcomingEditions.map((route) => (
                        <Link
                            key={route.id}
                            href={`/routes/${route.id}`}
                            className="block border-2 border-blue-200 bg-blue-50/50 rounded-xl p-4 hover:bg-blue-50 hover:border-blue-300 transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-slate-800 truncate">{route.name}</h3>
                                        <span className="shrink-0 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
                                            Programada
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {route.date ? new Date(route.date).toLocaleDateString("es-ES", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        }) : "Fecha pendiente"}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <span>🍺</span> {route.stops.length} bares
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span>👥</span> {route._count.participants} confirmados
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-2">
                                    <DeleteRouteButton routeId={route.id} routeName={route.name} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </CollapsibleSection>
            )}

            {/* Mis Plantillas -> Ahora "Mis Rutas Guardadas" */}
            {templates.length > 0 && (
                <CollapsibleSection
                    title="Mis Planes Guardados"
                    count={templates.length}
                    icon="💾"
                    colorClass="text-purple-600"
                    defaultOpen={false}
                >
                    <div className="grid grid-cols-1 gap-3">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="block border border-purple-200 bg-white rounded-xl p-4 hover:border-purple-300 transition-all shadow-sm"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-slate-800 truncate">{template.name}</h3>
                                        </div>
                                        {template.description && (
                                            <p className="text-sm text-slate-500 mt-1 line-clamp-1 italic">{template.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                                <span>🍺</span> {template.stops.length} bares
                                            </span>
                                            {template._count.editions !== undefined && template._count.editions > 0 && (
                                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                                    <span>🔁</span> {template._count.editions} veces repetida
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-2">
                                        <DeleteRouteButton routeId={template.id} routeName={template.name} />
                                    </div>
                                </div>

                                {/* Botones de acción compactos */}
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setPreviewRouteId(template.id);
                                            setPreviewRouteData(template);
                                        }}
                                        className="flex-1 py-1.5 text-sm bg-slate-50 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Ver info
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditionTemplateId(template.id);
                                            setEditionTemplateName(template.name);
                                            setEditionTemplateData(template);
                                        }}
                                        className="flex-1 py-1.5 text-sm bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <span>🚀</span> Organizar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Rutas donde el usuario ha sido invitado */}
            {invitedRoutes.length > 0 && (
                <CollapsibleSection
                    title="Invitaciones Recibidas"
                    count={invitedRoutes.length}
                    icon="💌"
                    colorClass="text-amber-500"
                    defaultOpen={true}
                >
                    {invitedRoutes.map((route) => (
                        <Link
                            key={route.id}
                            href={`/routes/${route.id}`}
                            className="block border border-amber-200 bg-amber-50/30 rounded-xl p-4 hover:bg-amber-50 hover:border-amber-300 transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-slate-800 truncate">{route.name}</h3>
                                        <span className="shrink-0 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                                            Invitación
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        {route.creator?.name && (
                                            <div className="flex items-center gap-1 text-sm text-slate-600 bg-white px-2 py-1 rounded-full border border-slate-100">
                                                <span>👑</span> {route.creator.name} te invita
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 mt-2">
                                        {route.date ? new Date(route.date).toLocaleDateString("es-ES", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        }) : "Fecha pendiente"}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </CollapsibleSection>
            )}

            {/* Preview Modal */}
            {
                previewRouteId && (
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
                )
            }

            {/* Create Edition Modal */}
            {
                editionTemplateId && (
                    <CreateEditionModal
                        isOpen={!!editionTemplateId}
                        onClose={() => {
                            setEditionTemplateId(null);
                            setEditionTemplateName("");
                            setEditionTemplateData(null);
                            fetchRoutes(); // Refresh routes after creating edition
                        }}
                        templateId={editionTemplateId}
                        templateName={editionTemplateName}
                        templateStartMode={editionTemplateData?.startMode as "manual" | "scheduled" | "all_present" | undefined}
                        templateStops={editionTemplateData?.stops?.map(s => ({ name: s.name, address: s.address }))}
                        templatePotEnabled={editionTemplateData?.potEnabled}
                        templatePotAmount={editionTemplateData?.potAmountPerPerson}
                    />
                )
            }
        </div >
    );
}
