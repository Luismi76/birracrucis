"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ShareInviteCode from "@/components/ShareInviteCode";
import { MapSkeleton, BarCardSkeleton } from "@/components/ui/Skeleton";

// Lazy loading de componentes pesados
const RouteDetailMap = dynamic(
    () => import("@/components/RouteDetailMap"),
    {
        loading: () => <MapSkeleton />,
        ssr: false
    }
);

const RouteDetailClient = dynamic(
    () => import("./RouteDetailClient"),
    {
        loading: () => (
            <div className="space-y-4">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 h-24 animate-pulse" />
                <BarCardSkeleton />
                <BarCardSkeleton />
            </div>
        ),
    }
);

type Stop = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  plannedRounds: number;
  maxRounds: number | null;
  actualRounds: number;
};

type Participant = {
  odId: string;
  odIduserId: string;
  id: string;
  name: string | null;
  image: string | null;
  lat: number;
  lng: number;
  lastSeenAt: string;
};

// Estado del progreso de la ruta para el header adaptativo
type RouteProgress = {
  currentBarIndex: number;
  currentBarName: string;
  distanceToBar: number | null;
  isAtBar: boolean;
  completedBars: number;
  totalBars: number;
  isComplete: boolean;
};

type RouteDetailWrapperProps = {
  routeId: string;
  routeName: string;
  routeDate: string;
  startTime: string;
  routeStatus: string;
  currentUserId?: string;
  inviteCode: string | null;
  stops: Stop[];
  isCreator: boolean;
  creatorName: string | null;
  participantsCount: number;
};

// Calcular tiempo hasta el inicio de la ruta
function getTimeUntilStart(routeDate: string, startTime: string): { hours: number; minutes: number; isPast: boolean } {
  const [hours, minutes] = startTime.split(":").map(Number);
  const routeDateTime = new Date(routeDate);
  routeDateTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const diff = routeDateTime.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, isPast: true };
  }

  const totalMinutes = Math.floor(diff / 60000);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    isPast: false
  };
}

export default function RouteDetailWrapper({
  routeId,
  routeName,
  routeDate,
  startTime,
  routeStatus,
  currentUserId,
  inviteCode,
  stops,
  isCreator,
  creatorName,
  participantsCount,
}: RouteDetailWrapperProps) {
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Estado del progreso de la ruta (recibido del RouteDetailClient)
  const [routeProgress, setRouteProgress] = useState<RouteProgress>({
    currentBarIndex: 0,
    currentBarName: stops[0]?.name || "",
    distanceToBar: null,
    isAtBar: false,
    completedBars: 0,
    totalBars: stops.length,
    isComplete: false,
  });

  // Countdown para rutas programadas
  const [countdown, setCountdown] = useState(() => getTimeUntilStart(routeDate, startTime));

  // Actualizar countdown cada minuto
  useEffect(() => {
    if (routeStatus === "completed" || countdown.isPast) return;

    const interval = setInterval(() => {
      setCountdown(getTimeUntilStart(routeDate, startTime));
    }, 60000);

    return () => clearInterval(interval);
  }, [routeDate, startTime, routeStatus, countdown.isPast]);

  const handleParticipantsChange = useCallback((newParticipants: Participant[]) => {
    setParticipants(newParticipants);
  }, []);

  const handleProgressChange = useCallback((progress: RouteProgress) => {
    setRouteProgress(progress);
  }, []);

  // Determinar el estado de la ruta para el header adaptativo
  const isScheduled = !countdown.isPast && routeStatus !== "completed" && routeStatus !== "active";
  const isActive = countdown.isPast && routeStatus !== "completed" && !routeProgress.isComplete;
  const isCompleted = routeStatus === "completed" || routeProgress.isComplete;

  return (
    <div className="flex flex-col h-screen-safe bg-slate-50">
      {/* Header Adaptativo */}
      <header className="bg-white border-b shadow-sm safe-area-top">
        <div className="px-4 py-3">
          {/* Fila superior: Volver + Info contextual + Menu */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/routes"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 active-scale"
              aria-label="Volver a mis rutas"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            {/* Centro: Contenido adaptativo segun estado */}
            <div className="flex-1 min-w-0">
              {isCompleted ? (
                // RUTA COMPLETADA: Resumen rapido
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">🎉</span>
                    <h1 className="text-base font-bold text-slate-900 truncate">{routeName}</h1>
                  </div>
                  <p className="text-xs text-green-600 font-medium">
                    Completada - {routeProgress.completedBars}/{routeProgress.totalBars} bares
                  </p>
                </div>
              ) : isScheduled ? (
                // RUTA PROGRAMADA: Countdown
                <div className="text-center">
                  <h1 className="text-base font-bold text-slate-900 truncate">{routeName}</h1>
                  <div className="flex items-center justify-center gap-1 text-amber-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium">
                      {countdown.hours > 0
                        ? `Empieza en ${countdown.hours}h ${countdown.minutes}m`
                        : `Empieza en ${countdown.minutes} min`
                      }
                    </span>
                  </div>
                </div>
              ) : (
                // RUTA ACTIVA: Bar actual + distancia
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    Bar {routeProgress.currentBarIndex + 1} de {routeProgress.totalBars}
                  </p>
                  <h1 className="text-base font-bold text-slate-900 truncate">{routeProgress.currentBarName || routeName}</h1>
                  {routeProgress.distanceToBar !== null && (
                    <p className={`text-xs font-medium ${routeProgress.isAtBar ? 'text-green-600' : 'text-amber-600'}`}>
                      {routeProgress.isAtBar ? '📍 Estas aqui' : `${routeProgress.distanceToBar}m de distancia`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Acciones: Mapa + Menu de mas opciones */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Boton Mapa */}
              <button
                onClick={() => setShowMap(!showMap)}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors active-scale ${
                  showMap ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                aria-label={showMap ? "Ocultar mapa" : "Ver mapa"}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>

              {/* Menu de mas opciones */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors active-scale ${
                    showMoreMenu ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  aria-label="Mas opciones"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {showMoreMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMoreMenu(false)}
                    />
                    <div className="absolute right-0 top-12 z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1 min-w-[180px]">
                      {/* Compartir */}
                      {inviteCode && (
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowShare(!showShare);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                        >
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          Compartir ruta
                        </button>
                      )}

                      {/* Editar (solo creador) */}
                      {isCreator && (
                        <Link
                          href={`/routes/${routeId}/edit`}
                          onClick={() => setShowMoreMenu(false)}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                        >
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar ruta
                        </Link>
                      )}

                      {/* Info de la ruta */}
                      <div className="border-t my-1" />
                      <div className="px-4 py-2 text-xs text-slate-500">
                        <p className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(routeDate).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                        <p className="flex items-center gap-2 mt-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {participantsCount} {participantsCount === 1 ? "participante" : "participantes"}
                        </p>
                        {creatorName && (
                          <p className="flex items-center gap-2 mt-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {isCreator ? "Creada por ti" : `Por ${creatorName}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Barra de progreso mini (solo en ruta activa) */}
          {isActive && (
            <div className="mt-2">
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(routeProgress.completedBars / routeProgress.totalBars) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Panel de Compartir (colapsable) */}
        {showShare && inviteCode && (
          <div className="px-4 pb-3 border-t bg-amber-50">
            <div className="pt-3">
              <ShareInviteCode inviteCode={inviteCode} routeName={routeName} />
            </div>
          </div>
        )}
      </header>

      {/* Mapa Colapsable */}
      {showMap && (
        <div className="h-48 md:h-64 relative border-b shrink-0">
          <RouteDetailMap stops={stops} userPosition={userPosition} participants={participants} />
          {/* Botón para cerrar el mapa */}
          <button
            onClick={() => setShowMap(false)}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-2 shadow-lg hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Contenido Principal - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pb-safe">
          <RouteDetailClient
            stops={stops}
            routeId={routeId}
            routeName={routeName}
            routeDate={routeDate}
            startTime={startTime}
            routeStatus={routeStatus}
            currentUserId={currentUserId}
            onPositionChange={setUserPosition}
            onParticipantsChange={handleParticipantsChange}
            onProgressChange={handleProgressChange}
            isCreator={isCreator}
          />
        </div>
      </main>

    </div>
  );
}
