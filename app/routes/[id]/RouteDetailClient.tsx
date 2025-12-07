"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import PhotoCapture from "@/components/PhotoCapture";
import PhotoGallery from "@/components/PhotoGallery";
import NudgeButton from "@/components/NudgeButton";
import RouteChat from "@/components/RouteChat";
import SkipVoteButton from "@/components/SkipVoteButton";
import BarTimer from "@/components/BarTimer";
import BarRating from "@/components/BarRating";
import RouteSummary from "@/components/RouteSummary";
import AddToCalendar from "@/components/AddToCalendar";
import ParticipantsList from "@/components/ParticipantsList";
// InvitationManager removed
import PricePicker from "@/components/PricePicker";
import BarPlaceInfo from "@/components/BarPlaceInfo";
import { toast } from "sonner";
import InRouteActions from "@/components/RouteDetail/InRouteActions";
import DevLocationControl from "@/components/DevLocationControl";
import RankingView from "@/components/RankingView";
import ParticipantPicker from "@/components/ParticipantPicker";
import { useRouteStream } from "@/hooks/useRouteStream";
import { Beer, Utensils, MapPin, Crown, Camera, Trophy, Users, MessageCircle, UserPlus, Bell } from "lucide-react"; // Import icons for actions

// Lazy load componentes pesados (ExportPDF usa jsPDF ~87KB)
const ExportRoutePDF = dynamic(() => import("@/components/ExportRoutePDF"), {
  loading: () => (
    <button className="opacity-50 cursor-wait bg-slate-100 text-slate-400 px-4 py-2 rounded-lg text-sm">
      Cargando...
    </button>
  ),
});

const PotManager = dynamic(() => import("@/components/PotManager"), {
  loading: () => <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />,
});

const RouteDetailMap = dynamic(
  () => import("@/components/RouteDetailMap"),
  {
    loading: () => <div className="w-full h-full bg-slate-200 animate-pulse" />,
    ssr: false
  }
);

type StopClient = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  plannedRounds: number;
  maxRounds: number | null;
  actualRounds: number;
  arrivalTime?: string;
  departureTime?: string;
  durationMinutes?: number;
  googlePlaceId?: string | null;
};

type Participant = {
  id: string;
  odId: string;
  name: string | null;
  image: string | null;
  lat: number;
  lng: number;
  lastSeenAt: string | null;
  isActive: boolean;
  isGuest?: boolean;
};

// Tipo para el progreso de la ruta (compartido con el wrapper)
type RouteProgress = {
  currentBarIndex: number;
  currentBarName: string;
  distanceToBar: number | null;
  isAtBar: boolean;
  completedBars: number;
  totalBars: number;
  isComplete: boolean;
};

const RADIUS_METERS = 30;
const ACCURACY_THRESHOLD = 150;

function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return Infinity;
  if ((lat1 === 0 && lon1 === 0) || (lat2 === 0 && lon2 === 0)) return Infinity;

  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const LOCATION_UPDATE_INTERVAL = 10000;
const PARTICIPANTS_FETCH_INTERVAL = 5000;

// Precio por defecto de la cerveza
const DEFAULT_BEER_PRICE = 1.50;
const DEFAULT_TAPA_PRICE = 3.00;

type RouteDetailClientProps = {
  // ... existing props ...
  stops: StopClient[];
  routeId: string;
  routeName: string;
  routeDate: string;
  startTime: string;
  routeStatus: string;
  currentUserId?: string;
  onPositionChange?: (position: { lat: number; lng: number } | null) => void;
  onParticipantsChange?: (participants: Participant[]) => void;
  onProgressChange?: (progress: RouteProgress) => void;
  isCreator?: boolean;
  onOpenShare?: () => void;

};

export default function RouteDetailClient({ stops, routeId, routeName, routeDate, startTime, routeStatus, currentUserId, onPositionChange, onParticipantsChange, onProgressChange, isCreator = false, onOpenShare }: RouteDetailClientProps) {
  // ... state ...
  const { data: session } = useSession();
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [useWatch, setUseWatch] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [notificationPickerOpen, setNotificationPickerOpen] = useState(false);

  // Tabs simplificadas
  const [activeTab, setActiveTab] = useState<"route" | "photos" | "ratings" | "group">("route");
  const [photoRefresh, setPhotoRefresh] = useState(0);

  // Auto-checkin silencioso
  const [autoCheckinEnabled, setAutoCheckinEnabled] = useState(true);
  const autoCheckinStopsRef = useRef<Set<string>>(new Set());

  const [autoCheckinNotification, setAutoCheckinNotification] = useState<string | null>(null);

  // SSE Global Connection
  const { participants: streamParticipants } = useRouteStream({
    routeId,
    enabled: true,
    onParticipants: (data) => {
      setParticipants(data);
      onParticipantsChange?.(data);
    },
    onNudges: (nudges) => {
      nudges.forEach(n => {
        // Prevent duplicate toasts if re-renders happen? Sonner dedupes by ID usually, but here we generate new ID or no ID.
        // Also SSE might send same nudges if logic is "since connection". 
        // But we implemented lastNudgeId tracking in backend, so we only get NEW ones.
        toast(`🔔 ${n.sender.name || 'Alguien'} dice:`, {
          description: n.message,
          duration: 5000,
          action: {
            label: "Ver",
            onClick: () => console.log("Nudge clicked"),
          },
        });
        // Vibrate pattern for attention
        vibrate([200, 100, 200]);
      });
    }
  });
  const AUTOCHECKIN_RADIUS = 30; // metros

  // Price picker modal
  const [pricePickerOpen, setPricePickerOpen] = useState<{ type: 'beer' | 'tapa'; stopId: string } | null>(null);

  // Precios por bar (cerveza y tapa)
  const [barPrices, setBarPrices] = useState<Record<string, { beer: number; tapa: number }>>(() => {
    const initial: Record<string, { beer: number; tapa: number }> = {};
    stops.forEach((s) => { initial[s.id] = { beer: DEFAULT_BEER_PRICE, tapa: DEFAULT_TAPA_PRICE }; });
    return initial;
  });

  // Contador de cervezas y tapas por bar
  const [beers, setBeers] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    stops.forEach((s) => { initial[s.id] = 0; });
    return initial;
  });

  const vibrate = (pattern: number | number[] = 50) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const [tapas, setTapas] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    stops.forEach((s) => { initial[s.id] = 0; });
    return initial;
  });

  // Estado local de rondas (optimista)
  const [rounds, setRounds] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    stops.forEach((s) => { initial[s.id] = s.actualRounds; });
    return initial;
  });

  // Indice del bar actual (manual, no automatico)
  const [currentBarIndex, setCurrentBarIndex] = useState(() => {
    // Inicializar en el primer bar que no ha completado sus rondas
    const index = stops.findIndex(s => s.actualRounds < s.plannedRounds);
    return index !== -1 ? index : stops.length - 1;
  });

  // El bar activo es el que el usuario tiene seleccionado
  const activeStop = stops[currentBarIndex] || stops[stops.length - 1];
  const isRouteComplete = currentBarIndex >= stops.length;
  // const currentStopIndex = currentBarIndex; // Removed alias

  // Detectar si nos hemos pasado de rondas planificadas
  const isOverPlannedRounds = activeStop && (rounds[activeStop.id] || 0) >= activeStop.plannedRounds;

  // ... Auto-avance logic (useEffects) ...
  useEffect(() => {
    if (!position || isRouteComplete) return;

    const nextBarIndex = currentBarIndex + 1;
    if (nextBarIndex >= stops.length) return;

    const nextStop = stops[nextBarIndex];
    const currentStop = stops[currentBarIndex];

    // Calcular distancias
    const distToCurrentBar = distanceInMeters(position.lat, position.lng, currentStop.lat, currentStop.lng);
    const distToNextBar = distanceInMeters(position.lat, position.lng, nextStop.lat, nextStop.lng);

    // Condicion 1: Estamos dentro del radio del siguiente bar
    const isAtNextBar = distToNextBar <= RADIUS_METERS;

    // Condicion 2: Estamos mas cerca del siguiente bar que del actual Y lejos del actual
    const isCloserToNextBar = distToNextBar < distToCurrentBar && distToCurrentBar > RADIUS_METERS * 2;

    // Avanzar automaticamente si estamos en el siguiente bar o claramente yendo hacia el
    if (isAtNextBar || (isCloserToNextBar && isOverPlannedRounds)) {
      setCurrentBarIndex(nextBarIndex);
    }
  }, [position, currentBarIndex, stops, isRouteComplete, isOverPlannedRounds]);

  // Calcular progreso and stats (same as before)
  const completedStops = stops.filter(s => (rounds[s.id] || 0) >= s.plannedRounds).length;
  // const totalRounds = Object.values(rounds).reduce((sum, r) => sum + r, 0); // Unused
  // const progressPercent = (completedStops / stops.length) * 100; // Unused

  const totalSpent = stops.reduce((sum, stop) => {
    const prices = barPrices[stop.id] || { beer: DEFAULT_BEER_PRICE, tapa: DEFAULT_TAPA_PRICE };
    return sum + (beers[stop.id] || 0) * prices.beer + (tapas[stop.id] || 0) * prices.tapa;
  }, 0);

  // const totalBeers = Object.values(beers).reduce((sum, b) => sum + b, 0); // Unused
  // const totalTapas = Object.values(tapas).reduce((sum, t) => sum + t, 0); // Unused

  // ... Location effects (same as before) ...
  const lastLocationSentRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      handleStartWatch();
    }
  }, []);

  useEffect(() => {
    const fetchUserSettings = async () => {
      // Only fetch settings for authenticated users, not guests
      if (!session?.user) return;

      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.settings) {
            setAutoCheckinEnabled(data.settings.autoCheckinEnabled);
          }
        }
      } catch (err) {
        console.warn("Error obteniendo configuracion:", err);
      }
    };
    fetchUserSettings();
  }, [session]);

  useEffect(() => {
    if (!autoCheckinEnabled || !position || !activeStop || isRouteComplete) return;
    if (autoCheckinStopsRef.current.has(activeStop.id)) return;

    const distToBar = distanceInMeters(position.lat, position.lng, activeStop.lat, activeStop.lng);

    if (distToBar <= AUTOCHECKIN_RADIUS) {
      autoCheckinStopsRef.current.add(activeStop.id);
      // handleAddRound(activeStop.id); // DISABLED: Manual control requested
      setAutoCheckinNotification(`Llegaste a ${activeStop.name}`);
      setTimeout(() => setAutoCheckinNotification(null), 3000);
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      fetch(`/api/stops/${activeStop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arrivedAt: new Date().toISOString() }),
      }).catch(console.error);
    }
  }, [position, activeStop, autoCheckinEnabled, isRouteComplete]);

  useEffect(() => {
    if (!position || !routeId) return;
    const now = Date.now();
    if (now - lastLocationSentRef.current < LOCATION_UPDATE_INTERVAL) return;
    lastLocationSentRef.current = now;
    fetch(`/api/routes/${routeId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: position.lat, lng: position.lng }),
    }).catch(err => console.warn("Error enviando ubicación:", err));
  }, [position, routeId]);

  useEffect(() => {
    if (!routeId || !onParticipantsChange) return;
    const fetchParticipants = async () => {
      try {
        const res = await fetch(`/api/routes/${routeId}/participants`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.participants) {
            setParticipants(data.participants);
            onParticipantsChange(data.participants);
          }
        }
      } catch (err) {
        console.warn("Error obteniendo participantes:", err);
      }
    };
    fetchParticipants();
    const interval = setInterval(fetchParticipants, PARTICIPANTS_FETCH_INTERVAL);
    return () => clearInterval(interval);
  }, [routeId, onParticipantsChange]);

  const handleStartWatch = () => {
    if (!("geolocation" in navigator)) return;
    setLocError(null);
    setUseWatch(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(newPos);
        setAccuracy(pos.coords.accuracy ?? null);
        onPositionChange?.(newPos);
      },
      (err) => {
        console.warn("Error watchPosition:", err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    watchIdRef.current = id;
  };

  const handleStopWatch = () => { /* ... Unused but keeping ... */ };

  const isPositionReliable = () => {
    if (accuracy == null) return false;
    return accuracy <= ACCURACY_THRESHOLD;
  };

  const distToActive = (position && activeStop)
    ? Math.round(distanceInMeters(position.lat, position.lng, activeStop.lat, activeStop.lng))
    : null;

  // Manual override for "At Bar" state
  const [manualArrivals, setManualArrivals] = useState<Set<string>>(new Set());

  // Consider at bar if:
  // 1. GPS says close enough (< RADIUS) OR
  // 2. User manually clicked "Llegué" (manualArrivals has ID)
  // 3. User manually added a round (implies arrival) -> implicit in rounds count? No, better explicit.
  const isGeographicallyAtBar = distToActive != null && distToActive <= RADIUS_METERS && isPositionReliable();
  const canCheckIn = isGeographicallyAtBar || (activeStop && manualArrivals.has(activeStop.id));

  useEffect(() => {
    if (!onProgressChange) return;
    onProgressChange({
      currentBarIndex,
      currentBarName: activeStop?.name || "",
      distanceToBar: distToActive,
      isAtBar: canCheckIn,
      completedBars: completedStops,
      totalBars: stops.length,
      isComplete: isRouteComplete,
    });
  }, [currentBarIndex, activeStop?.name, distToActive, canCheckIn, completedStops, stops.length, isRouteComplete, onProgressChange]);


  // ... Handlers (getParticipantsAtBar, handleNextBar, handleAddRound, etc) ...
  const getParticipantsAtBar = (stopId: string) => {
    const stop = stops.find(s => s.id === stopId);
    if (!stop) return 1;
    const atBar = participants.filter(p => {
      if (currentUserId && (p.id === currentUserId || (p as any).userId === currentUserId)) return false;
      if (p.lat === 0 && p.lng === 0) return false;
      const dist = distanceInMeters(p.lat, p.lng, stop.lat, stop.lng);
      return dist <= RADIUS_METERS;
    });
    const userAtBar = canCheckIn ? 1 : 0;
    return Math.max(1, atBar.length + userAtBar);
  };

  const handleNextBar = () => {
    if (currentBarIndex < stops.length - 1) {
      setCurrentBarIndex(prev => prev + 1);
    } else {
      setCurrentBarIndex(stops.length);
    }
  };

  const handleSendNudge = async (target: { id: string, name?: string | null, isGuest?: boolean }, message?: string) => {
    try {
      const isGlobal = target.id === 'all';
      const body: any = { message };

      if (!isGlobal) {
        if (target.isGuest) {
          body.targetGuestId = target.id;
        } else {
          // If not explicit, assume User ID unless it's a guest ID format (which we might not know for sure, 
          // but our participant object should ideally have isGuest flag)
          // In useRouteStream, we set isGuest: !p.userId.
          // So we should trust target.isGuest.
          body.targetUserId = target.id;
        }
      }

      const res = await fetch(`/api/routes/${routeId}/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");

      // Vibrate to confirm
      vibrate([50, 50, 50]);
    } catch (err) {
      console.error("Error sending nudge:", err);
      throw err; // Re-throw for picker to handle error toast
    }
  };

  const handleAddRound = async (stopId: string) => {
    vibrate();
    if (!navigator.onLine) { toast.error("No tienes conexión a internet"); return; }
    const peopleAtBar = getParticipantsAtBar(stopId);
    setRounds(prev => ({ ...prev, [stopId]: (prev[stopId] || 0) + 1 }));
    setBeers(prev => ({ ...prev, [stopId]: (prev[stopId] || 0) + peopleAtBar }));
    try {
      const res = await fetch(`/api/stops/${stopId}/checkin`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to check in');
      for (let i = 0; i < peopleAtBar; i++) {
        fetch(`/api/routes/${routeId}/drinks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stopId, type: 'beer' }),
        }).catch(console.error);
      }
      toast.success("¡Ronda registrada!");
    } catch (err) {
      console.error(err);
      setRounds(prev => ({ ...prev, [stopId]: Math.max(0, (prev[stopId] || 0) - 1) }));
      setBeers(prev => ({ ...prev, [stopId]: Math.max(0, (prev[stopId] || 0) - peopleAtBar) }));
      toast.error("Error al registrar la ronda. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="flex flex-col h-full pointer-events-auto bg-slate-50">
      {/* 1. TOP ACTIONS BAR (Docked) */}
      <div className="shrink-0 z-30 bg-white border-b border-slate-200">
        <InRouteActions
          isAtBar={canCheckIn}
          isRouteComplete={isRouteComplete}
          distToBar={distToActive}
          onCheckIn={() => {
            if (activeStop) {
              setManualArrivals(prev => new Set(prev).add(activeStop.id));
              handleAddRound(activeStop.id);
            }
          }}
          onAddRound={() => activeStop && handleAddRound(activeStop.id)}
          onPhotoClick={() => setShowCamera(true)}
          onNudgeClick={() => toast("¡Prisa enviada! 🔔")}
          onSpinClick={() => setRankingOpen(true)}
          onSkipClick={() => toast("Próximamente: Votar salto")}
          onNextBarClick={() => {
            const isOverPlannedRounds = activeStop ? ((rounds[activeStop.id] || 0) >= activeStop.plannedRounds) : false;
            if (isOverPlannedRounds) handleNextBar();
            else { toast("¿Ya te vas? Aún quedan rondas..."); handleNextBar(); }
          }}
          onInviteClick={onOpenShare || (() => { })}
          onNavigate={() => {
            if (activeStop) {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${activeStop.lat},${activeStop.lng}&travelmode=walking`;
              window.open(url, '_blank');
            } else {
              toast.error("No hay destino definido");
            }
          }}
          barName={activeStop?.name || ""}
          roundsCount={activeStop ? (rounds[activeStop.id] || 0) : 0}
          plannedRounds={activeStop?.plannedRounds || 0}
        />
      </div>

      {/* 2. MAPA (Content) */}
      <div className="flex-1 relative overflow-hidden">
        <RouteDetailMap
          stops={stops}
          userPosition={position}
          participants={participants}
          onParticipantClick={(p) => handleSendNudge({ id: p.id, name: p.name, isGuest: p.isGuest })}
        />

        {/* Notificaciones Flotantes (sobre el mapa) */}
        {autoCheckinNotification && (
          <div className="absolute top-4 left-4 right-4 z-50 animate-slide-down pointer-events-none">
            <div className="bg-green-500/90 backdrop-blur text-white rounded-2xl p-4 shadow-xl flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold">Check-in automático</p>
                <p className="text-sm text-green-100">{autoCheckinNotification}</p>
              </div>
            </div>
          </div>
        )}

        {/* DEV TOOLS */}
        {activeTab === 'route' && (
          <DevLocationControl
            activeStop={activeStop ? { id: activeStop.id, name: activeStop.name, lat: activeStop.lat, lng: activeStop.lng } : undefined}
            onSetPosition={(pos) => {
              setPosition(pos);
              setAccuracy(5);
              toast.success(`Teletransportado a ${activeStop?.name} 📍`);
            }}
          />
        )}
      </div>

      {/* 3. BOTTOM INFO SHEET (Restored) */}
      {activeTab === 'route' && activeStop && (
        <div className="shrink-0 bg-white border-t border-slate-200 shadow-xl rounded-t-3xl z-40 -mt-4 relative animate-slide-up">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1" />
          <div className="p-4 pt-1 space-y-4">
            {/* ACCIONES PRINCIPALES (Nuevo Bloque Unificado) */}
            <div className="flex flex-col gap-3 mb-2">
              {!canCheckIn ? (
                /* ESTADO: EN CAMINO */
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (activeStop) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${activeStop.lat},${activeStop.lng}&travelmode=walking`;
                        window.open(url, '_blank');
                      }
                    }}
                    className="p-4 bg-blue-50 text-blue-600 rounded-2xl active:scale-95 transition-all flex flex-col items-center justify-center gap-1 flex-1"
                  >
                    <MapPin className="w-6 h-6" />
                    <span className="text-xs font-bold">Cómo llegar</span>
                  </button>

                  <button
                    onClick={() => {
                      if (activeStop) {
                        setManualArrivals(prev => new Set(prev).add(activeStop.id));
                        handleAddRound(activeStop.id);
                      }
                    }}
                    className="p-4 bg-slate-900 text-white rounded-2xl active:scale-95 transition-all flex flex-col items-center justify-center gap-1 flex-[2] shadow-lg shadow-slate-200"
                  >
                    <Crown className="w-6 h-6 text-amber-500" />
                    <span className="text-lg font-bold">Ya llegué</span>
                  </button>
                </div>
              ) : (
                /* ESTADO: EN EL BAR */
                <div className="flex flex-col gap-3">
                  {/* Botón Principal: PEDIR RONDA - Reducido */}
                  <button
                    onClick={() => activeStop && handleAddRound(activeStop.id)}
                    className="py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Beer className="w-5 h-5" />
                    <div className="flex flex-col items-start">
                      <span className="text-base">Añadir Ronda</span>
                      <span className="text-xs text-amber-100">Registra tu consumición</span>
                    </div>
                  </button>

                  {/* Grid 2x2 de Acciones Rápidas */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Foto del Bar */}
                    <button
                      onClick={() => setShowCamera(true)}
                      className="p-4 bg-white border-2 border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:border-amber-300 hover:bg-amber-50"
                    >
                      <Camera className="w-6 h-6 text-slate-700" />
                      <div className="text-center">
                        <div className="text-sm font-bold text-slate-800">Foto</div>
                        <div className="text-xs text-slate-500">del Bar</div>
                      </div>
                    </button>

                    {/* Ranking */}
                    <button
                      onClick={() => setRankingOpen(true)}
                      className="p-4 bg-white border-2 border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:border-amber-300 hover:bg-amber-50"
                    >
                      <Trophy className="w-6 h-6 text-amber-600" />
                      <div className="text-center">
                        <div className="text-sm font-bold text-slate-800">Ranking</div>
                        <div className="text-xs text-slate-500">Ver stats</div>
                      </div>
                    </button>

                    {/* Grupo */}
                    <button
                      onClick={() => { vibrate(30); setActiveTab('group'); }}
                      className="p-4 bg-white border-2 border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:border-amber-300 hover:bg-amber-50"
                    >
                      <Users className="w-6 h-6 text-blue-600" />
                      <div className="text-center">
                        <div className="text-sm font-bold text-slate-800">Grupo</div>
                        <div className="text-xs text-slate-500">Ver todos</div>
                      </div>
                    </button>

                    {/* Chat */}
                    <button
                      onClick={() => { /* Open chat - implement later */ }}
                      className="p-4 bg-white border-2 border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:border-amber-300 hover:bg-amber-50 relative"
                    >
                      <MessageCircle className="w-6 h-6 text-green-600" />
                      <div className="text-center">
                        <div className="text-sm font-bold text-slate-800">Chat</div>
                        <div className="text-xs text-slate-500">Mensajes</div>
                      </div>
                      {/* Badge de notificaciones - placeholder */}
                      {/* {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )} */}
                    </button>
                  </div>

                  {/* Botón Extra: Avisar a Alguien */}
                  <button
                    onClick={() => setNotificationPickerOpen(true)}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl flex items-center justify-center gap-2 text-slate-600 font-bold active:scale-95 transition-all hover:bg-slate-100 hover:border-slate-300"
                  >
                    <Bell className="w-5 h-5 text-amber-500" />
                    <span>Avisar a alguien...</span>
                  </button>
                </div>
              )}
            </div>

            {/* Google Place Info */}
            <div className="mb-2">
              <BarPlaceInfo placeId={activeStop.googlePlaceId} name={activeStop.name} />
            </div>

            {/* Price Controls & Actions Row */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPricePickerOpen({ type: 'beer', stopId: activeStop.id })}
                className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 active:scale-95 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">🍺</div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Caña</p>
                  <p className="text-lg font-black text-slate-800">
                    {barPrices[activeStop.id]?.beer?.toFixed(2) || DEFAULT_BEER_PRICE.toFixed(2)}€
                  </p>
                </div>
              </button>

              <button
                onClick={() => setPricePickerOpen({ type: 'tapa', stopId: activeStop.id })}
                className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 active:scale-95 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">🍢</div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Tapa</p>
                  <p className="text-lg font-black text-slate-800">
                    {barPrices[activeStop.id]?.tapa?.toFixed(2) || DEFAULT_TAPA_PRICE.toFixed(2)}€
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CONTENIDO DE TABS */}
      {
        activeTab !== 'route' && (
          <div className="absolute inset-x-0 bottom-[64px] top-[100px] z-40 bg-white rounded-t-3xl shadow-xl flex flex-col animate-slide-up">
            <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
              {activeTab === 'photos' && <PhotoGallery routeId={routeId} refreshTrigger={photoRefresh} />}
              {activeTab === 'ratings' && activeStop && (
                <BarRating routeId={routeId} stopId={activeStop.id} stopName={activeStop.name} currentUserId={currentUserId} />
              )}
              {activeTab === 'group' && (
                <div className="space-y-4 pt-4">
                  <ParticipantsList routeId={routeId} currentUserId={currentUserId} currentStop={activeStop} userPosition={position} />
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800">Invitar Amigos</h3>
                      <p className="text-sm text-slate-500">Comparte el código o enlace</p>
                    </div>
                    <button onClick={onOpenShare} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-bold shadow-sm active:scale-95 transition-all">
                      <UserPlus className="w-5 h-5" /> Invitar
                    </button>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <PotManager routeId={routeId} isCreator={isCreator} currentUserId={currentUserId} totalSpent={totalSpent} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* 4. BOTTOM NAVIGATION */}
      <div className="shrink-0 bg-white border-t border-slate-100 pb-safe pt-2 px-2 z-50">
        <div className="flex justify-around items-center">
          {[
            { id: 'route', icon: '🍻', label: 'Bar' },
            { id: 'photos', icon: '📸', label: 'Fotos' },
            { id: 'ratings', icon: '⭐', label: 'Valorar' },
            { id: 'group', icon: '👥', label: 'Grupo' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { vibrate(30); setActiveTab(tab.id as any); }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${activeTab === tab.id ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:bg-slate-50'
                }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MODAL CÁMARA */}
      {
        showCamera && activeStop && (
          <div className="fixed inset-0 z-[60] bg-black animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-4 right-4 z-50">
              <button onClick={() => setShowCamera(false)} className="text-white text-lg font-bold p-4 bg-black/20 rounded-full backdrop-blur">✕</button>
            </div>
            <PhotoCapture
              routeId={routeId}
              routeName={routeName}
              stopId={activeStop.id}
              stopName={activeStop.name}
              onPhotoUploaded={() => { setPhotoRefresh(prev => prev + 1); setShowCamera(false); }}
              compact={false}
            />
          </div>
        )
      }

      {/* Price Picker Modal & Chat */}
      {
        pricePickerOpen && (
          <PricePicker
            isOpen={true}
            onClose={() => setPricePickerOpen(null)}
            onSelect={(price) => {
              setBarPrices(prev => ({ ...prev, [pricePickerOpen.stopId]: { ...prev[pricePickerOpen.stopId], [pricePickerOpen.type]: price } }));
            }}
            currentPrice={pricePickerOpen.type === 'beer' ? (barPrices[pricePickerOpen.stopId]?.beer || DEFAULT_BEER_PRICE) : (barPrices[pricePickerOpen.stopId]?.tapa || DEFAULT_TAPA_PRICE)}
            title={pricePickerOpen.type === 'beer' ? 'Precio Cerveza' : 'Precio Tapeo'}
            icon={pricePickerOpen.type === 'beer' ? '🍺' : '🍢'}
          />
        )
      }

      {/* RANKING MODAL */}
      {
        rankingOpen && (
          <RankingView
            routeId={routeId}
            onClose={() => setRankingOpen(false)}
          />
        )
      }

      {/* NOTIFICATION PICKER MODAL */}
      {
        notificationPickerOpen && (
          <ParticipantPicker
            participants={participants}
            onClose={() => setNotificationPickerOpen(false)}
            onSelect={handleSendNudge}
          />
        )
      }

      <RouteChat routeId={routeId} currentUserId={currentUserId} />
    </div >
  );
}
