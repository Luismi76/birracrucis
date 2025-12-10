"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import ShareModal from "@/components/ShareModal";
import RouteChat from "@/components/RouteChat";
import { MapSkeleton, BarCardSkeleton } from "@/components/ui/Skeleton";
import { Share2, MessageCircle, Settings, Moon, Sun, Accessibility } from "lucide-react";
import { useTheme } from "next-themes";

// Lazy loading de componentes pesados


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
  googlePlaceId?: string | null;
};

type Participant = {
  id: string;
  odId: string;
  name: string | null;
  image: string | null;
  lat: number;
  lng: number;
  lastSeenAt: string | null; // Allow null
  isActive?: boolean;
  isGuest?: boolean;
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
  creatorId: string | null;
  participantsCount: number;
  isDiscovery: boolean;
  actualStartTime: string | null;
  actualEndTime: string | null;
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
  creatorId,
  participantsCount,
  isDiscovery,
  actualStartTime,
  actualEndTime,
}: RouteDetailWrapperProps) {
  const { data: session } = useSession();
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const { theme, setTheme } = useTheme();

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

  const openShareModal = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  const closeAccessibilityPanel = useCallback(() => {
    setShowAccessibilityPanel(false);
  }, []);

  // Determinar el estado de la ruta para el header adaptativo
  const isScheduled = !countdown.isPast && routeStatus !== "completed" && routeStatus !== "active";
  const isActive = countdown.isPast && routeStatus !== "completed" && !routeProgress.isComplete;
  const isCompleted = routeStatus === "completed" || routeProgress.isComplete;

  return (
    <div className="flex flex-col w-full bg-slate-200 overflow-hidden" style={{ height: '100dvh' }}>
      {/* Header - Ahora estático en el flujo flex, sticky top */}
      <header className="shrink-0 z-50 bg-white/90 backdrop-blur-md shadow-sm safe-area-top transition-all relative">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            {/* Left Section: Back + Avatar */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/routes"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100/50 hover:bg-slate-200 transition-colors active-scale backdrop-blur-sm"
                aria-label="Volver a mis rutas"
              >
                <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>

              {/* User Avatar with Dropdown */}
              {session?.user && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm hover:border-amber-400 transition-colors active:scale-95"
                    aria-label="Menú de usuario"
                  >
                    {session.user.image ? (
                      <img src={session.user.image} alt={session.user.name || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        {(session.user.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                      <div className="absolute left-0 top-12 z-50 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                          <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                            {session.user.name || "Usuario"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Participante
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          {/* Theme Toggle */}
                          <button
                            onClick={() => {
                              setTheme(theme === 'dark' ? 'light' : 'dark');
                              setShowUserDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                          >
                            {theme === 'dark' ? (
                              <Sun className="w-4 h-4" />
                            ) : (
                              <Moon className="w-4 h-4" />
                            )}
                            <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
                          </button>

                          {/* Accessibility */}
                          <button
                            onClick={() => {
                              setShowAccessibilityPanel(true);
                              setShowUserDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                          >
                            <Accessibility className="w-4 h-4" />
                            <span>Accesibilidad</span>
                          </button>

                          {/* Settings */}
                          <button
                            onClick={() => {
                              // TODO: Open settings modal
                              setShowUserDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Configuración</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

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
                  <div className="flex flex-col items-center">
                    <p className="text-[10px] text-amber-600 font-black">
                      {countdown.hours > 0 ? `${countdown.hours}h ${countdown.minutes}m` : `${countdown.minutes} min`} para empezar
                    </p>
                    {isDiscovery && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full mt-0.5 font-bold border border-amber-200">Aventura 🧭</span>}
                  </div>
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

            {/* Botones Derecha */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Chat Button */}
              <button
                onClick={() => setShowChat(!showChat)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white text-slate-700 hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
                aria-label="Chat"
              >
                <MessageCircle className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>

              {/* Botón Compartir */}
              {inviteCode && (
                <button
                  onClick={openShareModal}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500 text-white shadow-sm hover:bg-amber-600 active:scale-95 transition-all"
                  aria-label="Compartir ruta"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              )}

              {/* Menú */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors active-scale shadow-sm ${showMoreMenu ? "bg-slate-200 text-slate-800" : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  aria-label="Más opciones"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                    <div className="absolute right-0 top-12 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
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
        </div>
      </header>

      {/* Client gestiona el resto del layout (Actions + Map + Tabs) */}
      <main className="flex-1 flex flex-col min-h-0">
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
          creatorId={creatorId}
          onOpenShare={openShareModal}
          showAccessibilityPanel={showAccessibilityPanel}
          onCloseAccessibilityPanel={closeAccessibilityPanel}
          isDiscovery={isDiscovery}
          actualStartTime={actualStartTime}
          actualEndTime={actualEndTime}
        />
      </main>


      {/* Modal de Compartir */}
      {inviteCode && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          inviteCode={inviteCode}
          routeName={routeName}
        />
      )}

      {/* Chat Modal */}
      {showChat && currentUserId && (
        <RouteChat
          routeId={routeId}
          currentUserId={currentUserId}
          onClose={() => setShowChat(false)}
          onUnreadCountChange={setUnreadMessages}
        />
      )}
    </div>
  );
}

