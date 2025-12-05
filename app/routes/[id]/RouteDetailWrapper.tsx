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
  // showMap state removed as map is always visible now
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
    <div className="relative h-screen-safe w-full overflow-hidden bg-slate-200">
      {/* CAPA 1: Mapa Fullscreen (Fondo) */}
      <div className="absolute inset-0 z-0">
        <RouteDetailMap stops={stops} userPosition={userPosition} participants={participants} />
      </div>

      {/* CAPA 2: UI Overlay */}
      {/* pointer-events-none para que los clics pasen al mapa en las zonas vacías */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">

        {/* Header - pointer-events-auto para que sea interactivo */}
        <header className="pointer-events-auto bg-white/90 backdrop-blur-md shadow-sm safe-area-top transition-all">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              {/* Volver */}
              <Link
                href="/routes"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100/50 hover:bg-slate-200 transition-colors shrink-0 active-scale backdrop-blur-sm"
                aria-label="Volver a mis rutas"
              >
                <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>

              {/* Info Central */}
              <div className="flex-1 min-w-0 bg-slate-100/50 rounded-xl px-3 py-1.5 backdrop-blur-sm mx-auto max-w-xs text-center border border-white/20">
                {isCompleted ? (
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-wide">{routeName}</p>
                    <p className="text-[10px] text-green-600 font-black">Ruta Completada</p>
                  </div>
                ) : isScheduled ? (
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-wide">{routeName}</p>
                    <p className="text-[10px] text-amber-600 font-black">
                      {countdown.hours > 0 ? `${countdown.hours}h ${countdown.minutes}m` : `${countdown.minutes} min`} para empezar
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      Bar {routeProgress.currentBarIndex + 1} / {routeProgress.totalBars}
                    </p>
                    <p className="text-xs font-bold text-slate-900 truncate">{routeProgress.currentBarName}</p>
                  </div>
                )}
              </div>

              {/* Menú */}
              <div className="relative pointer-events-auto">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors active-scale shadow-sm ${showMoreMenu ? "bg-amber-500 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  aria-label="Más opciones"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {/* Dropdown Menu (Mismo contenido, solo asegurando z-index) */}
                {showMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                    <div className="absolute right-0 top-12 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                      {inviteCode && (
                        <button
                          onClick={() => { setShowMoreMenu(false); setShowShare(!showShare); }}
                          className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-medium"
                        >
                          <span className="text-lg">📤</span> Compartir ruta
                        </button>
                      )}
                      {isCreator && (
                        <Link
                          href={`/routes/${routeId}/edit`}
                          onClick={() => setShowMoreMenu(false)}
                          className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-medium"
                        >
                          <span className="text-lg">✏️</span> Editar ruta
                        </Link>
                      )}
                      <div className="border-t my-1" />
                      <div className="px-4 py-2 text-xs text-slate-500 space-y-2">
                        <p className="flex items-center gap-2">📅 {new Date(routeDate).toLocaleDateString("es-ES", { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                        <p className="flex items-center gap-2">👥 {participantsCount} participantes</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Panel de Compartir */}
          {showShare && inviteCode && (
            <div className="px-4 pb-3 border-t bg-amber-50/90 backdrop-blur-md">
              <div className="pt-3">
                <ShareInviteCode inviteCode={inviteCode} routeName={routeName} />
              </div>
            </div>
          )}
        </header>

        {/* Main: El espacio restante. RouteDetailClient gestionará su propio layout (bottom sheet) */}
        <main className="flex-1 relative pointer-events-none">
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
        </main>
      </div>
    </div>
  );
}
