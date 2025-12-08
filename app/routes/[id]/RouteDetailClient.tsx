"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import PhotoCapture, { PhotoCaptureHandle } from "@/components/PhotoCapture";
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
import CompletedRouteSummary from "@/components/CompletedRouteSummary";
import { toast } from "sonner";
import InRouteActions from "@/components/RouteDetail/InRouteActions";
import DevLocationControl from "@/components/DevLocationControl";
import RankingView from "@/components/RankingView";
import ParticipantPicker from "@/components/ParticipantPicker";
import NotificationActions from "@/components/NotificationActions";
import { useRouteStream } from "@/hooks/useRouteStream";
import { Beer, Utensils, MapPin, Crown, Camera, Trophy, Users, MessageCircle, UserPlus, Bell } from "lucide-react"; // Import icons for actions
import { useUnplannedStopDetector } from "./hooks/useUnplannedStopDetector";
import { RouteProgressHeader, PaceIndicator, PotWidget, ParticipantsAtBar, SmartNotifications, useSmartNotifications, NextBarPreview, AchievementsToast, useAchievements, DrinkComparison, WeatherWidget, BarChallenge, PredictionsPanel, QuickReactions } from "@/components/route-detail";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useBatterySaver } from "@/hooks/useBatterySaver";
import AccessibilityPanel from "@/components/AccessibilityPanel";
import SystemStatus from "@/components/SystemStatus";
import ThemeToggle from "@/components/ThemeToggle";
import ConfettiTrigger from "@/components/ConfettiTrigger";

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
  const photoCaptureRef = useRef<PhotoCaptureHandle>(null);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [notificationPickerOpen, setNotificationPickerOpen] = useState(false);
  const [notificationTarget, setNotificationTarget] = useState<Participant | null>(null);

  // Unplanned Stop Detector
  const existingStopPlaceIds = useMemo(() => {
    return new Set(stops.map(s => s.googlePlaceId).filter((id): id is string => !!id));
  }, [stops]);

  useUnplannedStopDetector({
    routeId,
    isCreator,
    currentLocation: position,
    isRouteActive: routeStatus !== "completed",
    existingStopPlaceIds
  });

  // Debug loop removed

  // Tabs simplificadas
  const [activeTab, setActiveTab] = useState<"route" | "photos" | "ratings" | "group">("route");
  const [photoRefresh, setPhotoRefresh] = useState(0);

  // Auto-checkin silencioso
  const [autoCheckinEnabled, setAutoCheckinEnabled] = useState(true);
  const autoCheckinStopsRef = useRef<Set<string>>(new Set());

  const [autoCheckinNotification, setAutoCheckinNotification] = useState<string | null>(null);

  // SSE Global Connection
  const [messages, setMessages] = useState<any[]>([]); // Should be Message type

  const { participants: streamParticipants } = useRouteStream({
    routeId,
    enabled: true,
    onParticipants: (data) => {
      setParticipants(data);
      onParticipantsChange?.(data);
    },
    onMessages: (newMessages) => {
      // Simple merge or replace? 
      // Hook typically gives ALL messages or NEW calls?
      // Our hook implementation sends parsed new messages.
      setMessages(prev => {
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueNew = newMessages.filter((m: any) => !existingIds.has(m.id));
        return [...prev, ...uniqueNew];
      });
    },
    onNudges: (nudges) => {
      nudges.forEach(n => {
        toast(`🔔 ${n.sender.name || 'Alguien'} dice:`, {
          description: n.message,
          duration: 5000,
          action: {
            label: "Ver",
            onClick: () => console.log("Nudge clicked"),
          },
        });
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

  // ========== SPRINT 4: OPTIMIZATION HOOKS ==========

  // Offline queue
  const offlineQueue = useOfflineQueue();

  // Battery saver
  const batterySaver = useBatterySaver();

  // Accessibility settings
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReaderMode: false,
  });

  // Cargar settings de accesibilidad del localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("accessibility_settings");
    if (saved) {
      try {
        setAccessibilitySettings(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading accessibility settings:", e);
      }
    }
  }, []);

  // Guardar settings de accesibilidad
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessibility_settings", JSON.stringify(accessibilitySettings));

    // Aplicar clases CSS según settings
    if (accessibilitySettings.highContrast) {
      document.body.classList.add("high-contrast");
    } else {
      document.body.classList.remove("high-contrast");
    }

    if (accessibilitySettings.largeText) {
      document.body.classList.add("large-text");
    } else {
      document.body.classList.remove("large-text");
    }

    if (accessibilitySettings.reducedMotion) {
      document.body.classList.add("reduced-motion");
    } else {
      document.body.classList.remove("reduced-motion");
    }
  }, [accessibilitySettings]);

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

  // Calcular si se puede finalizar la ruta
  // Solo se puede finalizar cuando:
  // 1. Estamos en el último bar (currentBarIndex >= stops.length - 1)
  // 2. Se han completado todas las rondas planificadas del último bar
  const lastStop = stops[stops.length - 1];
  const canFinishRoute =
    currentBarIndex >= stops.length - 1 &&
    lastStop &&
    (rounds[lastStop.id] || 0) >= lastStop.plannedRounds;

  // Handle Route Completion
  const handleFinishRoute = async () => {
    try {
      const res = await fetch(`/api/routes/${routeId}/finish`, { method: "POST" });
      if (!res.ok) throw new Error("Error finishing route");
      toast.success("Ruta finalizada correctamente");
      window.location.reload();
    } catch (err) {
      toast.error("Error al finalizar la ruta");
      console.error(err);
    }
  };

  // Effect to clean up location watching if route is completed
  useEffect(() => {
    if (routeStatus === "completed") {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setUseWatch(false);
    }
  }, [routeStatus]);

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

      // GAMIFICATION: Registrar consumo en sistema de gamificación
      if (currentUserId) {
        try {
          const { recordBeerConsumption, awardAchievement } = await import('@/lib/gamification-helpers');

          // Registrar consumo del usuario actual
          await recordBeerConsumption(routeId, currentUserId, stopId, 1);

          // Intentar otorgar logro de primera cerveza (falla silenciosamente si ya existe)
          await awardAchievement(routeId, currentUserId, 'first_beer');
        } catch (gamificationError) {
          // No fallar si gamificación falla, solo log
          console.error('Gamification error:', gamificationError);
        }
      }

      toast.success("¡Ronda registrada!");
    } catch (err) {
      console.error(err);
      setRounds(prev => ({ ...prev, [stopId]: Math.max(0, (prev[stopId] || 0) - 1) }));
      setBeers(prev => ({ ...prev, [stopId]: Math.max(0, (prev[stopId] || 0) - peopleAtBar) }));
      toast.error("Error al registrar la ronda. Inténtalo de nuevo.");
    }
  };

  // ========== CÁLCULOS PARA NUEVOS COMPONENTES ==========

  // Calcular progreso global
  const completionPercent = stops.length > 0 ? (completedStops / stops.length) * 100 : 0;

  // Calcular tiempo estimado de finalización
  const calculateEstimatedFinish = () => {
    if (stops.length === 0) return null;
    const avgTimePerBar = 30; // minutos por defecto
    const remainingBars = stops.length - currentBarIndex;
    const minutesRemaining = remainingBars * avgTimePerBar;
    const estimatedFinish = new Date(Date.now() + minutesRemaining * 60000);
    return estimatedFinish.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  const calculateTimeRemaining = () => {
    if (stops.length === 0) return null;
    const avgTimePerBar = 30;
    const remainingBars = stops.length - currentBarIndex;
    const minutesRemaining = remainingBars * avgTimePerBar;
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = minutesRemaining % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Calcular ritmo (pace)
  const calculatePace = () => {
    // TODO: Implementar cálculo real basado en tiempos planificados
    // Por ahora retorna 0 (ritmo perfecto)
    return 0;
  };

  // Preparar datos de participantes para ParticipantsAtBar
  const participantsWithDistance = useMemo(() => {
    if (!activeStop) return [];
    return participants.map(p => ({
      id: p.id,
      name: p.name,
      image: p.image,
      distance: Math.round(distanceInMeters(p.lat, p.lng, activeStop.lat, activeStop.lng)),
      isAtBar: distanceInMeters(p.lat, p.lng, activeStop.lat, activeStop.lng) <= RADIUS_METERS,
    }));
  }, [participants, activeStop]);

  // Calcular datos del bote (pot)
  const potData = {
    currentAmount: totalSpent,
    targetAmount: totalSpent * 1.1, // Ejemplo: 10% más como objetivo
    participantsCount: participants.length,
    paidCount: participants.length, // TODO: Implementar tracking real de pagos
  };

  // Generar notificaciones inteligentes
  const smartNotifications = useSmartNotifications({
    participants: participantsWithDistance,
    currentBarId: activeStop?.id || "",
    timeInBar: 15, // TODO: Calcular tiempo real en bar
    plannedDuration: 30,
    roundsCompleted: activeStop ? (rounds[activeStop.id] || 0) : 0,
    plannedRounds: activeStop?.plannedRounds || 0,
    potPaid: potData.currentAmount,
    potTotal: potData.targetAmount,
  });

  // ========== CÁLCULOS PARA SPRINT 2 ==========

  // Datos del próximo bar
  const nextBarData = useMemo(() => {
    if (currentBarIndex >= stops.length - 1) return null;
    const nextBar = stops[currentBarIndex + 1];
    if (!nextBar || !position) return null;

    const distance = Math.round(
      distanceInMeters(position.lat, position.lng, nextBar.lat, nextBar.lng)
    );

    // Estimar tiempo de llegada (asumiendo 5 km/h caminando)
    const walkingSpeedKmH = 5;
    const minutesToArrive = Math.round((distance / 1000) / walkingSpeedKmH * 60);
    const eta = new Date(Date.now() + minutesToArrive * 60000);
    const etaString = eta.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      barName: nextBar.name,
      address: nextBar.address,
      distance,
      estimatedArrival: etaString,
      googlePlaceId: nextBar.googlePlaceId,
    };
  }, [currentBarIndex, stops, position]);

  // Detectar logros (achievements)
  const currentUserBeers = activeStop ? (beers[activeStop.id] || 0) : 0;
  const totalUserBeers = Object.values(beers).reduce((sum, b) => sum + b, 0);

  const achievements = useAchievements({
    rounds: activeStop ? (rounds[activeStop.id] || 0) : 0,
    photos: 0, // TODO: Obtener número real de fotos
    beersCount: totalUserBeers,
    completedBars: completedStops,
    totalBars: stops.length,
    userName: session?.user?.name || "Usuario",
  });

  // Preparar datos para comparativa de bebidas
  const participantsWithBeers = useMemo(() => {
    return participants.map(p => {
      // Calcular total de cervezas por participante
      // TODO: Implementar tracking real por participante
      const participantBeers = Math.floor(Math.random() * 10); // Placeholder
      return {
        id: p.id,
        name: p.name,
        image: p.image,
        beersCount: participantBeers,
      };
    });
  }, [participants]);

  // ========== DATOS PARA SPRINT 3 ==========

  // Datos de desafíos (placeholder)
  const barChallenges = useMemo(() => {
    if (!activeStop) return [];
    return [
      {
        id: "photo-1",
        type: "photo" as const,
        title: "Foto con el camarero",
        description: "Hazte una foto con el camarero o camarera del bar",
        points: 50,
        completed: false,
      },
      {
        id: "specialty-1",
        type: "specialty" as const,
        title: "Prueba la especialidad",
        description: "Pide la cerveza o tapa especial de la casa",
        points: 30,
        completed: false,
      },
    ];
  }, [activeStop]);

  // Datos de predicciones (placeholder)
  const predictions = useMemo(() => [
    {
      id: "pred-1",
      type: "first_arrival" as const,
      question: "¿Quién llegará primero al próximo bar?",
      options: participants.slice(0, 3).map(p => p.name || "Usuario"),
      points: 20,
    },
    {
      id: "pred-2",
      type: "rounds_count" as const,
      question: "¿Cuántas rondas haremos en total?",
      options: ["5-7", "8-10", "11-15", "16+"],
      points: 30,
    },
  ], [participants]);

  // Datos de reacciones (placeholder)
  const quickReactions = useMemo(() => {
    if (!activeStop) return [];
    return [
      {
        type: "good_beer" as const,
        emoji: "🍺",
        label: "Buena cerveza",
        count: 0,
        userReacted: false,
      },
      {
        type: "great_food" as const,
        emoji: "😋",
        label: "Tapas increíbles",
        count: 0,
        userReacted: false,
      },
      {
        type: "good_music" as const,
        emoji: "🎶",
        label: "Buena música",
        count: 0,
        userReacted: false,
      },
      {
        type: "good_vibe" as const,
        emoji: "👍",
        label: "Buen ambiente",
        count: 0,
        userReacted: false,
      },
    ];
  }, [activeStop]);

  // ========== SPRINT 5: CONFETTI TRIGGERS ==========

  const [showAchievementConfetti, setShowAchievementConfetti] = useState(false);
  const [showCompletionConfetti, setShowCompletionConfetti] = useState(false);

  // Trigger confetti cuando se completa la ruta
  useEffect(() => {
    if (routeStatus === "completed" && !showCompletionConfetti) {
      setShowCompletionConfetti(true);
    }
  }, [routeStatus, showCompletionConfetti]);

  // Trigger confetti cuando se consigue un logro
  useEffect(() => {
    if (achievements.length > 0) {
      setShowAchievementConfetti(true);
      setTimeout(() => setShowAchievementConfetti(false), 100);
    }
  }, [achievements.length]);

  return (
    <div className="flex flex-col h-full pointer-events-auto bg-slate-50 dark:bg-slate-900">
      {/* SYSTEM STATUS - Sprint 4 */}
      <SystemStatus
        isOnline={offlineQueue.isOnline}
        queueSize={offlineQueue.queueSize}
        batteryLevel={batterySaver.batteryLevel}
        batterySaverMode={batterySaver.mode}
      />

      {/* ACCESSIBILITY PANEL - Sprint 4 */}
      <AccessibilityPanel
        settings={accessibilitySettings}
        onSettingsChange={setAccessibilitySettings}
      />

      {/* THEME TOGGLE - Sprint 5 */}
      <ThemeToggle />

      {/* CONFETTI TRIGGERS - Sprint 5 */}
      <ConfettiTrigger trigger={showAchievementConfetti} type="achievement" />
      <ConfettiTrigger trigger={showCompletionConfetti} type="completion" />

      {/* 1. ROUTE PROGRESS HEADER (Nuevo) */}
      {routeStatus !== "completed" && (
        <RouteProgressHeader
          routeName={routeName}
          currentBarIndex={currentBarIndex}
          totalBars={stops.length}
          activeParticipants={participants.filter(p => p.lastSeenAt).length}
          completionPercent={completionPercent}
          estimatedFinishTime={calculateEstimatedFinish()}
          timeRemaining={calculateTimeRemaining()}
        />
      )}

      {/* Smart Notifications */}
      <SmartNotifications notifications={smartNotifications} />

      {/* 2. MAPA (Content) */}
      <div className="flex-1 relative overflow-hidden">
        <RouteDetailMap
          stops={stops}
          userPosition={position}
          participants={participants}
          isRouteComplete={routeStatus === "completed"}
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

        {/* DEV TOOLS - Solo en desarrollo */}
        {activeTab === 'route' && process.env.NODE_ENV === 'development' && (
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

      {/* 3. BOTTOM INFO SHEET */}
      {activeTab === 'route' && activeStop && (
        <div className={`shrink-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-xl rounded-t-3xl z-40 -mt-4 relative animate-slide-up overflow-y-auto ${routeStatus === "completed" ? "max-h-[30vh]" : "max-h-[40vh]"}`}>
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full mx-auto mt-3 mb-1" />

          {/* RUTA COMPLETADA: Mostrar resumen */}
          {routeStatus === "completed" ? (
            <CompletedRouteSummary
              routeId={routeId}
              routeName={routeName}
              routeDate={routeDate}
              stops={stops}
              participants={participants}
              onViewPhotos={() => setActiveTab('photos')}
              onViewRatings={() => setActiveTab('ratings')}
              onViewGroup={() => setActiveTab('group')}
              onShare={onOpenShare}
            />
          ) : (
            /* RUTA ACTIVA: Mostrar acciones y controles */
            <div className="p-4 pt-1 space-y-4">
              {/* WIDGETS EN GRID 2 COLUMNAS */}
              <div className="grid grid-cols-2 gap-3">
                {/* POT WIDGET */}
                <PotWidget
                  currentAmount={potData.currentAmount}
                  targetAmount={potData.targetAmount}
                  participantsCount={potData.participantsCount}
                  paidCount={potData.paidCount}
                  onClick={() => setActiveTab('group')}
                />

                {/* PARTICIPANTS AT BAR */}
                <ParticipantsAtBar
                  participants={participantsWithDistance}
                  barName={activeStop.name}
                />
              </div>

              {/* PACE INDICATOR - Full width */}
              <PaceIndicator minutesAhead={calculatePace()} />

              {/* NEXT BAR PREVIEW */}
              {nextBarData && (
                <NextBarPreview
                  barName={nextBarData.barName}
                  address={nextBarData.address}
                  distance={nextBarData.distance}
                  estimatedArrival={nextBarData.estimatedArrival}
                  googlePlaceId={nextBarData.googlePlaceId}
                  onViewOnMap={() => {
                    // TODO: Implementar centrado de mapa en próximo bar
                    toast.info("Próximo bar en el mapa");
                  }}
                />
              )}

              {/* DRINK COMPARISON & WEATHER - Grid 2 columnas */}
              <div className="grid grid-cols-2 gap-3">
                {/* DRINK COMPARISON */}
                <DrinkComparison
                  participants={participantsWithBeers}
                  currentUserId={currentUserId}
                />

                {/* WEATHER WIDGET */}
                {activeStop && (
                  <WeatherWidget lat={activeStop.lat} lng={activeStop.lng} />
                )}
              </div>

              {/* ACHIEVEMENTS TOAST */}
              <AchievementsToast achievements={achievements} />

              {/* BAR CHALLENGE */}
              {barChallenges.length > 0 && (
                <BarChallenge
                  barName={activeStop.name}
                  challenges={barChallenges}
                  onCompleteChallenge={(id) => {
                    toast.success("¡Desafío completado! +50 puntos");
                    // TODO: Implementar lógica de completar desafío
                  }}
                />
              )}

              {/* PREDICTIONS PANEL */}
              {predictions.length > 0 && (
                <PredictionsPanel
                  predictions={predictions}
                  onMakePrediction={(predId, option) => {
                    toast.success(`Predicción registrada: ${option}`);
                    // TODO: Implementar lógica de predicciones
                  }}
                />
              )}

              {/* QUICK REACTIONS */}
              {quickReactions.length > 0 && (
                <QuickReactions
                  barId={activeStop.id}
                  reactions={quickReactions}
                  onReact={(type) => {
                    toast.success("¡Reacción añadida!");
                    // TODO: Implementar lógica de reacciones
                  }}
                />
              )}
              {/* ACCIONES PRINCIPALES */}
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
                    {/* Botón Principal: PEDIR RONDA */}
                    <button
                      onClick={() => activeStop && handleAddRound(activeStop.id)}
                      className="py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white rounded-2xl font-bold shadow-lg shadow-amber-200 dark:shadow-amber-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
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
                        onClick={() => photoCaptureRef.current?.trigger()}
                        className="p-4 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-slate-600"
                      >
                        <Camera className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                        <div className="text-center">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Foto</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">del Bar</div>
                        </div>
                      </button>

                      {/* Ranking */}
                      <button
                        onClick={() => setRankingOpen(true)}
                        className="p-4 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-slate-600"
                      >
                        <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        <div className="text-center">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Ranking</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Ver stats</div>
                        </div>
                      </button>
                    </div>

                    {/* Botón Extra: Avisar a Alguien */}
                    <button
                      onClick={() => setNotificationPickerOpen(true)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 border-dashed rounded-2xl flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 font-bold active:scale-95 transition-all hover:bg-slate-100 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                    >
                      <Bell className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                      <span>Avisar a alguien...</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Google Place Info */}
              <div className="mb-2">
                <BarPlaceInfo placeId={activeStop.googlePlaceId} name={activeStop.name} />
              </div>

              {/* Price Controls */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPricePickerOpen({ type: 'beer', stopId: activeStop.id })}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xl">🍺</div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Caña</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100">
                      {barPrices[activeStop.id]?.beer?.toFixed(2) || DEFAULT_BEER_PRICE.toFixed(2)}€
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setPricePickerOpen({ type: 'tapa', stopId: activeStop.id })}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xl">🍢</div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tapa</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100">
                      {barPrices[activeStop.id]?.tapa?.toFixed(2) || DEFAULT_TAPA_PRICE.toFixed(2)}€
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )
      }

      {/* 3. CONTENIDO DE TABS */}
      {
        activeTab !== 'route' && (
          <div className="absolute inset-x-0 bottom-[64px] top-[100px] z-40 bg-white rounded-t-3xl shadow-xl flex flex-col animate-slide-up">
            <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
              {activeTab === 'photos' && <PhotoGallery routeId={routeId} stops={stops} refreshTrigger={photoRefresh} />}
              {activeTab === 'ratings' && activeStop && (
                <BarRating routeId={routeId} stopId={activeStop.id} stopName={activeStop.name} currentUserId={currentUserId} />
              )}
              {activeTab === 'group' && (
                <div className="space-y-4 pt-4">
                  <ParticipantsList
                    routeId={routeId}
                    currentUserId={currentUserId}
                    currentStop={activeStop}
                    userPosition={position}
                    participants={participants}
                  />
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800">Invitar Amigos</h3>
                      <p className="text-sm text-slate-500">Comparte el código o enlace</p>
                    </div>
                    <button onClick={onOpenShare} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-bold shadow-sm active:scale-95 transition-all">
                      <UserPlus className="w-5 h-5" /> Invitar
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800">Enviar Avisos</h3>
                      <p className="text-sm text-slate-500">Notifica a los participantes</p>
                    </div>
                    <button onClick={() => setNotificationPickerOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-amber-500 text-amber-600 rounded-lg font-bold shadow-sm active:scale-95 transition-all hover:bg-amber-50">
                      <Bell className="w-5 h-5" /> Avisar
                    </button>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <PotManager routeId={routeId} isCreator={isCreator} currentUserId={currentUserId} totalSpent={0} />
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
      {/* Photo Capture (Hidden Input) */}
      <PhotoCapture
        ref={photoCaptureRef}
        routeId={routeId}
        routeName={routeName}
        stopId={activeStop?.id}
        stopName={activeStop?.name}
        onPhotoUploaded={() => setPhotoRefresh(prev => prev + 1)}
        compact={false}
      />

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
            onSelect={(participant) => {
              setNotificationTarget(participant as any); // 2 steps flow
              setNotificationPickerOpen(false);
            }}
          />
        )
      }

      {/* NOTIFICATION ACTIONS MODAL */}
      {
        notificationTarget && (
          <NotificationActions
            targetName={notificationTarget.name || "Invitado"}
            onClose={() => setNotificationTarget(null)}
            onSend={(msg) => handleSendNudge(notificationTarget, msg)}
          />
        )
      }

      <RouteChat
        routeId={routeId}
        currentUserId={currentUserId}
        messages={messages}
        onSendMessage={async (content) => {
          await fetch(`/api/routes/${routeId}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });
        }}
      />
    </div >
  );
}
