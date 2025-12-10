// src/app/routes/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DeleteRouteButton from "@/components/DeleteRouteButton";
import UserMenu from "@/components/UserMenu";
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
  stops: any[];
  _count: { participants: number; editions?: number };
  creator?: { name: string | null };
};

export default function RoutesPage() {
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
      <div className="max-w-3xl mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mis Birracrucis</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/routes/history"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            title="Historial"
          >
            📜
          </Link>
          <Link
            href="/routes/community"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
            title="Explorar Comunidad"
          >
            🌍
          </Link>
          <UserMenu />
        </div>
      </div>

      {/* Invitaciones pendientes */}
      <MyInvitations />

      {!hasAnyRoutes && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-4xl mb-3">🍺</div>
          <p className="text-slate-600 mb-4">
            Aún no tienes rutas. ¡Crea tu primer Birracrucis!
          </p>
          <Link
            href="/routes/new"
            className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Crear ruta
          </Link>
        </div>
      )}

      {/* Rutas Activas */}
      {activeEditions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-green-600 uppercase tracking-wide flex items-center gap-2">
            <span className="text-2xl">🔥</span> En Curso ({activeEditions.length})
          </h2>
          <div className="space-y-3">
            {activeEditions.map((route) => (
              <Link
                key={route.id}
                href={`/routes/${route.id}`}
                className="block border-2 border-green-300 bg-green-50 rounded-xl p-4 hover:bg-green-100 hover:border-green-400 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-800 truncate">{route.name}</h3>
                      <span className="shrink-0 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                        Activa
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
                      <span className="flex items-center gap-1">
                        <span>🍺</span> {route.stops.length} {route.stops.length === 1 ? "bar" : "bares"}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>👥</span> {route._count.participants}
                      </span>
                    </div>
                  </div >
                </div >
              </Link >
            ))}
          </div >
        </section >
      )
      }

      {/* Próximas Rutas (Ediciones Pendientes) */}
      {
        upcomingEditions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide flex items-center gap-2">
              <span className="text-2xl">📅</span> Próximas Rutas ({upcomingEditions.length})
            </h2>
            <div className="space-y-3">
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
                        <span className="shrink-0 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
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
                          <span>🍺</span> {route.stops.length} {route.stops.length === 1 ? "bar" : "bares"}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>👥</span> {route._count.participants}
                        </span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <DeleteRouteButton routeId={route.id} routeName={route.name} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      }

      {/* Mis Plantillas */}
      {
        templates.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-purple-600 uppercase tracking-wide flex items-center gap-2">
              <span className="text-2xl">📋</span> Mis Plantillas ({templates.length})
            </h2>
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="block border-2 border-purple-200 bg-purple-50/50 rounded-xl p-4 hover:bg-purple-50 hover:border-purple-300 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-800 truncate">{template.name}</h3>
                        <span className="shrink-0 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                          Plantilla
                        </span>
                      </div>
                      {template.description && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-1">{template.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span>🍺</span> {template.stops.length} {template.stops.length === 1 ? "bar" : "bares"}
                        </span>
                        {template._count.editions !== undefined && template._count.editions > 0 && (
                          <span className="flex items-center gap-1">
                            <span>📅</span> {template._count.editions} {template._count.editions === 1 ? "edición" : "ediciones"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-2">
                      <DeleteRouteButton routeId={template.id} routeName={template.name} />
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        setPreviewRouteId(template.id);
                        setPreviewRouteData(template);
                      }}
                      className="flex-1 py-2 bg-white border border-purple-200 text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>👁️</span> Ver Plantilla
                    </button>
                    <button
                      onClick={() => {
                        setEditionTemplateId(template.id);
                        setEditionTemplateName(template.name);
                      }}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <span>➕</span> Nueva Edición
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      }

      {/* Rutas donde el usuario ha sido invitado */}
      {
        invitedRoutes.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <span className="text-amber-500">🎟️</span> Invitaciones ({invitedRoutes.length})
            </h2>
            <div className="space-y-3">
              {invitedRoutes.map((route) => (
                <Link
                  key={route.id}
                  href={`/routes/${route.id}`}
                  className="block border border-slate-200 bg-white rounded-xl p-4 hover:bg-slate-50 hover:border-blue-200 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-800 truncate">{route.name}</h3>
                        <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Invitado
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
                        {route.creator?.name && (
                          <span className="flex items-center gap-1">
                            <span>👤</span> Por {route.creator.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span>🍺</span> {route.stops.length} {route.stops.length === 1 ? "bar" : "bares"}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>👥</span> {route._count.participants}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      }

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
              fetchRoutes(); // Refresh routes after creating edition
            }}
            templateId={editionTemplateId}
            templateName={editionTemplateName}
          />
        )
      }
    </div >
  );
}
