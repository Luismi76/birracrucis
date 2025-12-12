"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import PhotoCapture, { PhotoCaptureHandle } from "@/components/PhotoCapture";
import PhotoGallery from "@/components/PhotoGallery";
import { distanceInMeters, CHECKIN_RADIUS_METERS } from "@/lib/geo-utils";

import BarRating from "@/components/BarRating";
import ParticipantsList from "@/components/ParticipantsList";
import PricePicker from "@/components/PricePicker";
import BarPlaceInfo from "@/components/BarPlaceInfo";
import CompletedRouteSummary from "@/components/CompletedRouteSummary";
import { toast } from "sonner";
import DevLocationControl from "@/components/DevLocationControl";
import RankingView from "@/components/RankingView";
import ParticipantPicker from "@/components/ParticipantPicker";
import NotificationActions from "@/components/NotificationActions";
import { useRouteStream } from "@/hooks/useRouteStream";
import { usePot } from "@/hooks/usePot";
import { useQueryClient } from "@tanstack/react-query";
import { Beer, MapPin, Camera, Trophy, Users, UserPlus, Bell, Star, MessageCircle } from "lucide-react";
import { useUnplannedStopDetector } from "./hooks/useUnplannedStopDetector";
import { RouteProgressHeader, PaceIndicator, PotWidget, ParticipantsAtBar, SmartNotifications, useSmartNotifications, NextBarPreview } from "@/components/route-detail";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useBatterySaver } from "@/hooks/useBatterySaver";
import AccessibilityPanel from "@/components/AccessibilityPanel";
import SystemStatus from "@/components/SystemStatus";
import ConfettiTrigger from "@/components/ConfettiTrigger";

// Lazy load componentes pesados
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
  googlePlaceId?: string | null;
  stayDuration: number; // minutos planificados en el bar
  arrivedAt: string | null; // ISO timestamp
  departedAt: string | null; // ISO timestamp
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

const ACCURACY_THRESHOLD = 150;
const LOCATION_UPDATE_INTERVAL = 10000;
const DATA_REFRESH_INTERVAL = 30000; // 30s para datos secundarios (pot, drinks)

// Precio por defecto de la cerveza
const DEFAULT_BEER_PRICE = 1.50;
const DEFAULT_TAPA_PRICE = 3.00;

type RouteDetailClientProps = {
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
  creatorId?: string | null;
  onOpenShare?: () => void;
  onOpenChat?: () => void;
  showAccessibilityPanel?: boolean;
  onCloseAccessibilityPanel?: () => void;
  isDiscovery?: boolean;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
};

export default function RouteDetailClient({ stops, routeId, routeName, routeDate, startTime, routeStatus, currentUserId, onPositionChange, onParticipantsChange, onProgressChange, isCreator = false, creatorId, onOpenShare, onOpenChat, showAccessibilityPanel, onCloseAccessibilityPanel, isDiscovery = false, actualStartTime, actualEndTime }: RouteDetailClientProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Geolocalización
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Participantes
  const [participants, setParticipants] = useState<Participant[]>([]);
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

  // Tabs
  const [activeTab, setActiveTab] = useState<"route" | "photos" | "ratings" | "group">("route");
  const [photoRefresh, setPhotoRefresh] = useState(0);

  // Estado para centrar el mapa en una ubicación específica
  const [mapFocusLocation, setMapFocusLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Auto-checkin silencioso
  const [autoCheckinEnabled, setAutoCheckinEnabled] = useState(true);
  const autoCheckinStopsRef = useRef<Set<string>>(new Set());

  const [autoCheckinNotification, setAutoCheckinNotification] = useState<string | null>(null);

  // Track shown nudges to avoid duplicates (persists across remounts)
  const getShownNudges = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    const stored = sessionStorage.getItem(`shownNudges_${routeId}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  };

  const addShownNudge = (id: string) => {
    if (typeof window === 'undefined') return;
    const shown = getShownNudges();
    shown.add(id);
    sessionStorage.setItem(`shownNudges_${routeId}`, JSON.stringify([...shown]));
  };

  // Stabilize callbacks to prevent re-renders
  const handleParticipantsUpdate = useCallback((data: Participant[]) => {
    setParticipants(data);
    onParticipantsChange?.(data);
  }, [onParticipantsChange]);

  const handleNudgesUpdate = useCallback((nudges: any[]) => {
    const shownNudges = getShownNudges();

    nudges.forEach(n => {
      // Skip if already shown
      if (shownNudges.has(n.id)) {
        return;
      }

      // Mark as shown
      addShownNudge(n.id);

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
  }, [routeId]);

  useRouteStream({
    routeId,
    enabled: true,
    onParticipants: handleParticipantsUpdate,
    onNudges: handleNudgesUpdate,
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

  // Estado del bote (TanStack Query)
  const { data: potData = { currentAmount: 0, targetAmount: 0, participantsCount: 0, paidCount: 0 } } = usePot(routeId);

  // Indice del bar actual (manual, no automatico)
  const [currentBarIndex, setCurrentBarIndex] = useState(() => {
    // Inicializar en el primer bar que no ha completado sus rondas
    const index = stops.findIndex(s => s.actualRounds < s.plannedRounds);
    return index !== -1 ? index : stops.length - 1;
  });

  // El bar activo es el que el usuario tiene seleccionado
  const activeStop = stops[currentBarIndex] || stops[stops.length - 1];
  const isRouteComplete = currentBarIndex >= stops.length;

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
  const [accessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);

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
    const isAtNextBar = distToNextBar <= CHECKIN_RADIUS_METERS;

    // Condicion 2: Estamos mas cerca del siguiente bar que del actual Y lejos del actual
    const isCloserToNextBar = distToNextBar < distToCurrentBar && distToCurrentBar > CHECKIN_RADIUS_METERS * 2;

    // Avanzar automaticamente si estamos en el siguiente bar o claramente yendo hacia el
    if (isAtNextBar || (isCloserToNextBar && isOverPlannedRounds)) {
      setCurrentBarIndex(nextBarIndex);
    }
  }, [position, currentBarIndex, stops, isRouteComplete, isOverPlannedRounds]);

  // Calcular progreso
  const completedStops = stops.filter(s => (rounds[s.id] || 0) >= s.plannedRounds).length;

  // ========== GEOLOCALIZACIÓN ==========
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

      // Toast notification with better UX
      toast.success(`✅ Has llegado a ${activeStop.name}`, {
        description: "Check-in automático realizado",
        duration: 4000,
        action: {
          label: "Ver",
          onClick: () => console.log("Arrived at bar"),
        },
      });

      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // Update arrival time
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

  // Pot data ahora viene del hook usePot (TanStack Query con auto-refresh)

  // Participantes se reciben por SSE (useRouteStream), solo fetch inicial
  useEffect(() => {
    if (!routeId) return;
    fetch(`/api/routes/${routeId}/participants`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.ok && data.participants) {
          setParticipants(data.participants);
          onParticipantsChange?.(data.participants);
        }
      })
      .catch(err => console.warn("Error obteniendo participantes:", err));
  }, [routeId]);

  const handleStartWatch = () => {
    if (!("geolocation" in navigator)) return;
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
  const isGeographicallyAtBar = distToActive != null && distToActive <= CHECKIN_RADIUS_METERS && isPositionReliable();
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
      return dist <= CHECKIN_RADIUS_METERS;
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

  // Limpiar geolocalización cuando la ruta está completada
  useEffect(() => {
    if (routeStatus === "completed" && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
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

    // Calculate round cost for pot using Decimal for precision
    const beerPrice = barPrices[stopId]?.beer || DEFAULT_BEER_PRICE;
    const Decimal = (await import('decimal.js')).default;
    const roundCost = new Decimal(beerPrice).times(peopleAtBar).toNumber();

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

      // Update pot spending
      try {
        const currentStop = stops.find(s => s.id === stopId);
        const description = `Ronda en ${currentStop?.name || 'bar'} (${peopleAtBar} ${peopleAtBar === 1 ? 'persona' : 'personas'})`;

        const potResponse = await fetch(`/api/routes/${routeId}/pot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'spend',
            amount: roundCost,
            description,
          }),
        });
        const potResponseData = await potResponse.json();

        if (!potResponse.ok) {
          toast.error(`Error actualizando bote: ${potResponseData.error || 'Unknown'}`);
        } else {
          queryClient.invalidateQueries({ queryKey: ["pot", routeId] });
        }
      } catch {
        toast.error('Error al actualizar el bote');
      }

      // Registrar consumo en sistema de gamificación
      if (currentUserId) {
        try {
          const { recordBeerConsumption } = await import('@/lib/gamification-helpers');
          await recordBeerConsumption(routeId, currentUserId, stopId, 1);
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

  // Calcular ritmo (pace) - minutos adelantados/retrasados respecto al plan
  const calculatePace = () => {
    if (!actualStartTime) return 0;

    const startTime = new Date(actualStartTime).getTime();
    const now = Date.now();
    const elapsedMinutes = Math.floor((now - startTime) / 60000);

    // Calcular tiempo planificado hasta el bar actual
    let plannedMinutes = 0;
    for (let i = 0; i <= currentBarIndex && i < stops.length; i++) {
      plannedMinutes += stops[i].stayDuration;
    }

    // Positivo = adelantados, Negativo = retrasados
    return plannedMinutes - elapsedMinutes;
  };

  // Preparar datos de participantes para ParticipantsAtBar
  const participantsWithDistance = useMemo(() => {
    if (!activeStop) return [];
    return participants.map(p => ({
      id: p.id,
      name: p.name,
      image: p.image,
      distance: Math.round(distanceInMeters(p.lat, p.lng, activeStop.lat, activeStop.lng)),
      isAtBar: distanceInMeters(p.lat, p.lng, activeStop.lat, activeStop.lng) <= CHECKIN_RADIUS_METERS,
    }));
  }, [participants, activeStop]);

  // Calcular tiempo real en el bar actual
  const timeInCurrentBar = useMemo(() => {
    if (!activeStop?.arrivedAt) return 0;
    const arrivedTime = new Date(activeStop.arrivedAt).getTime();
    return Math.floor((Date.now() - arrivedTime) / 60000);
  }, [activeStop?.arrivedAt]);

  // Generar notificaciones inteligentes
  const smartNotifications = useSmartNotifications({
    participants: participantsWithDistance,
    currentBarId: activeStop?.id || "",
    timeInBar: timeInCurrentBar,
    plannedDuration: activeStop?.stayDuration || 30,
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
      lat: nextBar.lat,
      lng: nextBar.lng,
    };
  }, [currentBarIndex, stops, position]);

  // Confetti al completar ruta
  const [showCompletionConfetti, setShowCompletionConfetti] = useState(false);

  useEffect(() => {
    if (routeStatus === "completed" && !showCompletionConfetti) {
      setShowCompletionConfetti(true);
    }
  }, [routeStatus, showCompletionConfetti]);

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden pointer-events-auto bg-slate-50 dark:bg-slate-900">
      <SystemStatus
        isOnline={offlineQueue.isOnline}
        queueSize={offlineQueue.queueSize}
        batteryLevel={batterySaver.batteryLevel}
        batterySaverMode={batterySaver.mode}
      />

      {showAccessibilityPanel && (
        <AccessibilityPanel
          settings={accessibilitySettings}
          onSettingsChange={setAccessibilitySettings}
        />
      )}

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
          creatorId={creatorId}
          focusLocation={mapFocusLocation}
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
            activeStop={activeStop ? { id: activeStop.id, name: activeStop.name, lat: activeStop.lat, lng: activeStop.lng, plannedRounds: activeStop.plannedRounds } : undefined}
            stops={stops.map(s => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng, plannedRounds: s.plannedRounds }))}
            onSetPosition={(pos) => {
              setPosition(pos);
              setAccuracy(5);
              const stopName = stops.find(s => s.lat === pos.lat && s.lng === pos.lng)?.name || 'ubicación';
              toast.success(`Teletransportado a ${stopName} 📍`);
            }}
            rounds={rounds}
            onSetRounds={(stopId, count) => {
              setRounds(prev => ({ ...prev, [stopId]: count }));
              toast.success(`Rondas ajustadas a ${count}`);
            }}
            currentBarIndex={currentBarIndex}
          />
        )}
      </div>

      {/* 3. BOTTOM INFO SHEET */}
      {activeTab === 'route' && activeStop && (
        <div className={`shrink-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-xl rounded-t-3xl z-40 -mt-4 relative animate-slide-up overflow-y-auto ${routeStatus === "completed" ? "max-h-[25vh]" : "max-h-[35vh]"}`}>
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
              actualStartTime={actualStartTime}
              actualEndTime={actualEndTime}
            />
          ) : (
            /* RUTA ACTIVA: Diseño simplificado y claro */
            (() => {
              const currentRounds = rounds[activeStop.id] || 0;
              const plannedRounds = activeStop.plannedRounds || 0;
              // Solo consideramos completado si hay rondas planificadas Y se han alcanzado
              const roundsCompleted = plannedRounds > 0 && currentRounds >= plannedRounds;
              const isOverTime = timeInCurrentBar > (activeStop.stayDuration * 1.5);
              const minutesOver = timeInCurrentBar - activeStop.stayDuration;

              return (
                <div className="p-4 pt-1 space-y-3">
                  {/* CABECERA DEL BAR ACTUAL */}
                  <div className="text-center pb-2">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-1">
                      <span className={`font-bold ${roundsCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
                        Bar {currentBarIndex + 1} de {stops.length}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white truncate px-4">
                      {activeStop.name}
                    </h2>

                    {/* Barra de progreso de rondas + Info bote */}
                    <div className="mt-2 px-6">
                      <div className="flex items-center gap-3">
                        {/* Progreso rondas */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  roundsCompleted
                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                    : 'bg-gradient-to-r from-amber-400 to-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, (currentRounds / plannedRounds) * 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold whitespace-nowrap ${
                              roundsCompleted ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'
                            }`}>
                              {currentRounds}/{plannedRounds} {roundsCompleted && '✓'}
                            </span>
                          </div>
                          <p className={`text-[10px] mt-0.5 ${roundsCompleted ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                            {!roundsCompleted
                              ? `${plannedRounds - currentRounds} rondas restantes`
                              : '¡Objetivo cumplido!'}
                          </p>
                        </div>

                        {/* Separador */}
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-600" />

                        {/* Info bote compacta */}
                        <button
                          onClick={() => setActiveTab('group')}
                          className="flex flex-col items-center px-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg py-1 transition-colors"
                        >
                          <span className="text-lg">💰</span>
                          <span className={`text-xs font-bold ${potData.currentAmount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {potData.currentAmount > 0 ? `${potData.currentAmount.toFixed(0)}€` : 'Sin bote'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Estado: Estás aquí + tiempo */}
                    {canCheckIn ? (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          Estás aquí
                        </span>
                        {timeInCurrentBar > 0 && (
                          <span className={`text-xs ${isOverTime ? 'text-orange-500 font-semibold' : 'text-slate-400'}`}>
                            {timeInCurrentBar} min {isOverTime && `(+${minutesOver} min)`}
                          </span>
                        )}
                      </div>
                    ) : position && (
                      <div className="text-xs text-blue-600 mt-2">
                        📍 A {Math.round(distanceInMeters(position.lat, position.lng, activeStop.lat, activeStop.lng))}m
                      </div>
                    )}
                  </div>

                  {/* BANNER RONDAS COMPLETADAS + IR AL SIGUIENTE */}
                  {roundsCompleted && nextBarData && canCheckIn && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        <div>
                          <p className="font-bold text-emerald-800 dark:text-emerald-200">¡Rondas completadas!</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            Siguiente: {nextBarData.barName} ({Math.round(nextBarData.distance)}m)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${nextBarData.lat},${nextBarData.lng}&travelmode=walking`;
                          window.open(url, '_blank');
                        }}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <MapPin className="w-5 h-5" />
                        <span>Ir al siguiente bar</span>
                      </button>
                    </div>
                  )}

                  {/* BANNER ÚLTIMO BAR - FINALIZAR RUTA */}
                  {canFinishRoute && canCheckIn && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        <div>
                          <p className="font-bold text-purple-800 dark:text-purple-200">¡Último bar completado!</p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            Habéis completado {stops.length} bares y todas las rondas
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleFinishRoute}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-purple-200/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <Trophy className="w-5 h-5" />
                        <span>🎉 Finalizar Ruta</span>
                      </button>
                    </div>
                  )}

                  {/* ACCIÓN PRINCIPAL */}
                  {canCheckIn ? (
                    <button
                      onClick={() => activeStop && handleAddRound(activeStop.id)}
                      className={`w-full py-4 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${
                        roundsCompleted
                          ? 'bg-slate-400 dark:bg-slate-600 shadow-slate-200/50'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-200/50'
                      }`}
                    >
                      <Beer className="w-6 h-6" />
                      <span>{roundsCompleted ? 'Una ronda más' : 'Añadir Ronda'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (activeStop) {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${activeStop.lat},${activeStop.lng}&travelmode=walking`;
                          window.open(url, '_blank');
                        }
                      }}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200/50 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                      <MapPin className="w-6 h-6" />
                      <span>Navegar al Bar</span>
                    </button>
                  )}

                  {/* ACCIONES SECUNDARIAS */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => photoCaptureRef.current?.trigger()}
                      className="p-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-all"
                    >
                      <Camera className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">Foto</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('ratings')}
                      className="p-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-all"
                    >
                      <Star className="w-5 h-5 text-amber-500" />
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">Valorar</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('group')}
                      className="p-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-all"
                    >
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">Grupo</span>
                    </button>
                    <button
                      onClick={() => setNotificationPickerOpen(true)}
                      className="p-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-all"
                    >
                      <Bell className="w-5 h-5 text-orange-500" />
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">Avisar</span>
                    </button>
                  </div>

                  {/* SIGUIENTE BAR (oculto solo cuando mostramos el banner de completado) */}
                  {nextBarData && !(roundsCompleted && canCheckIn) && (
                    <button
                      onClick={() => setMapFocusLocation({ lat: nextBarData.lat, lng: nextBarData.lng })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center gap-3 active:scale-[0.98] transition-all"
                    >
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                        {currentBarIndex + 2}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{nextBarData.barName}</div>
                        <div className="text-xs text-slate-500">{Math.round(nextBarData.distance)}m • {Math.ceil(nextBarData.distance / 80)} min</div>
                      </div>
                      <MapPin className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

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

                  {/* Chat del Grupo - PROMINENTE */}
                  <button
                    onClick={onOpenChat}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 flex items-center justify-between text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-lg">Chat del Grupo</h3>
                        <p className="text-sm text-amber-100">Habla con todos los participantes</p>
                      </div>
                    </div>
                    <span className="text-2xl">💬</span>
                  </button>

                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800">Enviar Aviso</h3>
                      <p className="text-sm text-slate-500">Notificación rápida</p>
                    </div>
                    <button onClick={() => setNotificationPickerOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-300 text-slate-600 rounded-lg font-bold shadow-sm active:scale-95 transition-all hover:bg-slate-100">
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
        onPhotoUploaded={async () => {
          setPhotoRefresh(prev => prev + 1);

        }}
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

    </div >
  );
}
