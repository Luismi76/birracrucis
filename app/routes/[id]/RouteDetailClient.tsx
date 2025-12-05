"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
import InvitationManager from "@/components/InvitationManager";
import PricePicker from "@/components/PricePicker";
import { toast } from "sonner";

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
};

const RADIUS_METERS = 75;
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

export default function RouteDetailClient({ stops, routeId, routeName, routeDate, startTime, routeStatus, currentUserId, onPositionChange, onParticipantsChange, onProgressChange, isCreator = false }: RouteDetailClientProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [useWatch, setUseWatch] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showSummary, setShowSummary] = useState(false);



  // Tabs simplificadas
  const [activeTab, setActiveTab] = useState<"route" | "photos" | "ratings" | "group">("route");
  const [photoRefresh, setPhotoRefresh] = useState(0);

  // Auto-checkin silencioso
  const [autoCheckinEnabled, setAutoCheckinEnabled] = useState(true);
  const autoCheckinStopsRef = useRef<Set<string>>(new Set());
  const [autoCheckinNotification, setAutoCheckinNotification] = useState<string | null>(null);
  const AUTOCHECKIN_RADIUS = 50; // metros

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
  const currentStopIndex = currentBarIndex; // Alias para compatibilidad

  // Detectar si nos hemos pasado de rondas planificadas
  const isOverPlannedRounds = activeStop && (rounds[activeStop.id] || 0) >= activeStop.plannedRounds;

  // Auto-avance de bar basado en ubicacion
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

  // Calcular progreso
  const completedStops = stops.filter(s => (rounds[s.id] || 0) >= s.plannedRounds).length;
  const totalRounds = Object.values(rounds).reduce((sum, r) => sum + r, 0);
  const progressPercent = (completedStops / stops.length) * 100;

  // Calcular gasto total
  const totalSpent = stops.reduce((sum, stop) => {
    const prices = barPrices[stop.id] || { beer: DEFAULT_BEER_PRICE, tapa: DEFAULT_TAPA_PRICE };
    return sum + (beers[stop.id] || 0) * prices.beer + (tapas[stop.id] || 0) * prices.tapa;
  }, 0);

  const totalBeers = Object.values(beers).reduce((sum, b) => sum + b, 0);
  const totalTapas = Object.values(tapas).reduce((sum, t) => sum + t, 0);

  // Referencia para el último envío de ubicación
  const lastLocationSentRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Auto-start watch on mount if supported
  useEffect(() => {
    if ("geolocation" in navigator) {
      handleStartWatch();
    }
  }, []);

  // Cargar configuracion de auto-checkin del usuario
  useEffect(() => {
    const fetchUserSettings = async () => {
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
  }, []);

  // Auto-checkin silencioso basado en ubicacion
  useEffect(() => {
    if (!autoCheckinEnabled || !position || !activeStop || isRouteComplete) return;

    // Si ya hicimos auto-checkin en esta parada, no repetir
    if (autoCheckinStopsRef.current.has(activeStop.id)) return;

    const distToBar = distanceInMeters(position.lat, position.lng, activeStop.lat, activeStop.lng);

    if (distToBar <= AUTOCHECKIN_RADIUS) {
      // Registrar auto-checkin
      autoCheckinStopsRef.current.add(activeStop.id);
      handleAddRound(activeStop.id);

      // Mostrar notificacion temporal
      setAutoCheckinNotification(`Llegaste a ${activeStop.name}`);
      setTimeout(() => setAutoCheckinNotification(null), 3000);

      // Vibrar si esta disponible
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // Registrar llegada en el servidor
      fetch(`/api/stops/${activeStop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arrivedAt: new Date().toISOString() }),
      }).catch(console.error);
    }
  }, [position, activeStop, autoCheckinEnabled, isRouteComplete]);

  // Enviar ubicación al servidor periódicamente
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

  // Obtener ubicaciones de otros participantes periódicamente
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

  const handleStopWatch = () => {
    setUseWatch(false);
    if (watchIdRef.current != null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };



  const isPositionReliable = () => {

    if (accuracy == null) return false;
    return accuracy <= ACCURACY_THRESHOLD;
  };

  // Calcular distancia al bar activo
  const distToActive = (position && activeStop)
    ? Math.round(distanceInMeters(position.lat, position.lng, activeStop.lat, activeStop.lng))
    : null;

  const canCheckIn = distToActive != null && distToActive <= RADIUS_METERS && isPositionReliable();

  // Notificar cambios de progreso al componente padre (header adaptativo)
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

  // Contar participantes en el bar actual (dentro del radio)
  const getParticipantsAtBar = (stopId: string) => {
    const stop = stops.find(s => s.id === stopId);
    if (!stop) return 1; // Al menos el usuario actual

    const atBar = participants.filter(p => {
      if (p.lat === 0 && p.lng === 0) return false;
      const dist = distanceInMeters(p.lat, p.lng, stop.lat, stop.lng);
      return dist <= RADIUS_METERS;
    });

    // +1 por el usuario actual si está en el bar
    const userAtBar = canCheckIn ? 1 : 0;
    return Math.max(1, atBar.length + userAtBar);
  };

  // Avanzar al siguiente bar manualmente
  const handleNextBar = () => {
    if (currentBarIndex < stops.length - 1) {
      setCurrentBarIndex(prev => prev + 1);
    } else {
      // Ultimo bar, marcar ruta como completada
      setCurrentBarIndex(stops.length);
    }
  };

  const handleAddRound = async (stopId: string) => {
    vibrate();
    if (!navigator.onLine) {
      toast.error("No tienes conexión a internet");
      return;
    }

    // Contar participantes en el bar
    const peopleAtBar = getParticipantsAtBar(stopId);

    // Optimistic update - sumar ronda
    setRounds(prev => ({
      ...prev,
      [stopId]: (prev[stopId] || 0) + 1
    }));

    // Sumar una cerveza por cada persona en el bar
    setBeers(prev => ({
      ...prev,
      [stopId]: (prev[stopId] || 0) + peopleAtBar
    }));

    try {
      const res = await fetch(`/api/stops/${stopId}/checkin`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to check in');

      // Registrar las cervezas en el servidor
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
      // Rollback
      setRounds(prev => ({
        ...prev,
        [stopId]: Math.max(0, (prev[stopId] || 0) - 1)
      }));
      setBeers(prev => ({
        ...prev,
        [stopId]: Math.max(0, (prev[stopId] || 0) - peopleAtBar)
      }));
      toast.error("Error al registrar la ronda. Inténtalo de nuevo.");
    }
  };

  const handleAddBeer = (stopId: string) => {
    vibrate(30);
    setBeers(prev => ({ ...prev, [stopId]: (prev[stopId] || 0) + 1 }));
    // Registrar en servidor
    fetch(`/api/routes/${routeId}/drinks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stopId, type: 'beer' }),
    }).catch(console.error);
  };

  const handleRemoveBeer = (stopId: string) => {
    vibrate(30);
    if ((beers[stopId] || 0) <= 0) return;
    setBeers(prev => ({ ...prev, [stopId]: (prev[stopId] || 0) - 1 }));
  };

  const handleAddTapa = (stopId: string) => {
    vibrate(30);
    setTapas(prev => ({ ...prev, [stopId]: (prev[stopId] || 0) + 1 }));
    fetch(`/api/routes/${routeId}/drinks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stopId, type: 'tapa' }),
    }).catch(console.error);
  };

  const handleRemoveTapa = (stopId: string) => {
    vibrate(30);
    if ((tapas[stopId] || 0) <= 0) return;
    setTapas(prev => ({ ...prev, [stopId]: (prev[stopId] || 0) - 1 }));
  };

  const handleUpdatePrice = (stopId: string, type: 'beer' | 'tapa', value: string) => {
    const price = parseFloat(value);
    if (isNaN(price) || price < 0) return;
    setBarPrices(prev => ({
      ...prev,
      [stopId]: { ...prev[stopId], [type]: price }
    }));
  };

  // Gasto en el bar actual

  const currentBarSpent = activeStop
    ? (beers[activeStop.id] || 0) * (barPrices[activeStop.id]?.beer || DEFAULT_BEER_PRICE) +
    (tapas[activeStop.id] || 0) * (barPrices[activeStop.id]?.tapa || DEFAULT_TAPA_PRICE)
    : 0;



  return (
    <>
      {/* 1. Notificaciones Flotantes (Top) */}
      {autoCheckinNotification && (
        <div className="fixed top-28 left-4 right-4 z-50 animate-slide-down pointer-events-none">
          <div className="bg-green-500/90 backdrop-blur text-white rounded-2xl p-4 shadow-xl flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold">Check-in automático</p>
              <p className="text-sm text-green-100">{autoCheckinNotification}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Área de Acción Flotante (FAB) - Bottom Right */}
      {!isRouteComplete && activeStop && activeTab === 'route' && (
        <div className="fixed bottom-[110px] right-4 z-50 flex flex-col items-end gap-3 pointer-events-auto">
          {/* Meter Prisa (Mini FAB) */}
          <div className="scale-90 origin-bottom-right">
            <NudgeButton
              routeId={routeId}
              isAtCurrentStop={canCheckIn}
              compact={true}
            />
          </div>

          {/* Cámara (Mini FAB) */}
          <div className="scale-90 origin-bottom-right">
            <PhotoCapture
              routeId={routeId}
              routeName={routeName}
              stopId={activeStop.id}
              stopName={activeStop.name}
              onPhotoUploaded={() => setPhotoRefresh(prev => prev + 1)}
              compact={true}
            />
          </div>

          {/* Botón Principal: PEDIR RONDA (FAB Grande) */}
          <button
            onClick={() => handleAddRound(activeStop.id)}
            disabled={!canCheckIn}
            className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl transition-all duration-300 active:scale-90 ${canCheckIn
              ? isOverPlannedRounds
                ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/30"
                : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/30"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
          >
            🍺
          </button>
        </div>
      )}

      {/* 3. Bottom Sheet (Panel Inferior Fijo) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pointer-events-auto flex flex-col transition-all duration-500 ease-out ${activeTab !== 'route' ? 'h-[85vh]' : 'h-auto max-h-[60vh]'
          }`}
      >
        {/* Handle Visual */}
        <div className="w-full flex justify-center py-3 shrink-0 cursor-grab active:cursor-grabbing" onClick={() => setActiveTab(activeTab === 'route' ? 'photos' : 'route')}>
          <div className="w-12 h-1.5 bg-slate-200/80 rounded-full" />
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 custom-scrollbar">

          {/* TAB: RUTA (Vista Principal Simplificada) */}
          {activeTab === 'route' && (
            <div className="space-y-4">
              {/* Header del Bar Actual */}
              {activeStop && !isRouteComplete && (
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 leading-tight">{activeStop.name}</h2>
                      <p className="text-sm text-slate-500 truncate max-w-[200px]">{activeStop.address}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${canCheckIn ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {canCheckIn ? "📍 Estás aquí" : `${distToActive}m`}
                    </span>
                  </div>

                  {/* Progreso de Rondas */}
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-slate-700">Rondas</span>
                        <span className="font-bold text-slate-700">{rounds[activeStop.id] || 0} / {activeStop.plannedRounds}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isOverPlannedRounds ? 'bg-orange-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(100, ((rounds[activeStop.id] || 0) / activeStop.plannedRounds) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-slate-400">Gasto</span>
                      <span className="block font-bold text-green-600">{currentBarSpent.toFixed(2)} €</span>
                    </div>
                  </div>

                  {/* Contadores Grandes (Cerveza / Tapa) */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {/* Cervezas */}
                    <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 flex flex-col items-center">
                      <span className="text-xs font-bold text-amber-800 uppercase mb-2 tracking-wide">Cervezas</span>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleRemoveBeer(activeStop.id)}
                          className="w-12 h-12 rounded-full bg-white text-slate-400 border border-slate-200 text-2xl font-bold flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all"
                        >-</button>
                        <span className="text-3xl font-black text-slate-800 w-8 text-center">{beers[activeStop.id] || 0}</span>
                        <button
                          onClick={() => handleAddBeer(activeStop.id)}
                          className="w-12 h-12 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-200 text-2xl font-bold flex items-center justify-center hover:bg-amber-600 active:scale-90 transition-all"
                        >+</button>
                      </div>
                      <button onClick={() => setPricePickerOpen({ type: 'beer', stopId: activeStop.id })} className="mt-2 text-[10px] text-amber-600 font-medium bg-white/50 px-2 py-0.5 rounded-md">
                        {(barPrices[activeStop.id]?.beer || DEFAULT_BEER_PRICE).toFixed(2)}€ / ud
                      </button>
                    </div>

                    {/* Tapas */}
                    <div className="bg-orange-50 rounded-2xl p-3 border border-orange-100 flex flex-col items-center">
                      <span className="text-xs font-bold text-orange-800 uppercase mb-2 tracking-wide">Tapas</span>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleRemoveTapa(activeStop.id)}
                          className="w-12 h-12 rounded-full bg-white text-slate-400 border border-slate-200 text-2xl font-bold flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all"
                        >-</button>
                        <span className="text-3xl font-black text-slate-800 w-8 text-center">{tapas[activeStop.id] || 0}</span>
                        <button
                          onClick={() => handleAddTapa(activeStop.id)}
                          className="w-12 h-12 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-200 text-2xl font-bold flex items-center justify-center hover:bg-orange-600 active:scale-90 transition-all"
                        >+</button>
                      </div>
                      <button onClick={() => setPricePickerOpen({ type: 'tapa', stopId: activeStop.id })} className="mt-2 text-[10px] text-orange-600 font-medium bg-white/50 px-2 py-0.5 rounded-md">
                        {(barPrices[activeStop.id]?.tapa || DEFAULT_TAPA_PRICE).toFixed(2)}€ / ud
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Boton Siguiente Bar */}
              {isOverPlannedRounds && currentBarIndex < stops.length - 1 && (
                <button
                  onClick={handleNextBar}
                  className="w-full py-3 rounded-xl font-bold bg-slate-800 text-white shadow-lg active:scale-95 transition-all mt-2"
                >
                  Ir al siguiente bar ➡️
                </button>
              )}
            </div>
          )}

          {/* OTRAS TABS */}
          {activeTab === 'photos' && <PhotoGallery routeId={routeId} refreshTrigger={photoRefresh} />}

          {activeTab === 'ratings' && activeStop && (
            <BarRating routeId={routeId} stopId={activeStop.id} stopName={activeStop.name} currentUserId={currentUserId} />
          )}

          {activeTab === 'group' && (
            <div className="space-y-4">
              <ParticipantsList routeId={routeId} currentUserId={currentUserId} currentStop={activeStop} userPosition={position} />
              <InvitationManager routeId={routeId} isCreator={isCreator} />
              <PotManager routeId={routeId} isCreator={isCreator} currentUserId={currentUserId} totalSpent={totalSpent} />
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION (Tabs) */}
        <div className="shrink-0 bg-white border-t border-slate-100 pb-safe pt-2 px-2">
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

      </div>

      {/* Global Modals */}
      {pricePickerOpen && (
        <PricePicker
          isOpen={true}
          onClose={() => setPricePickerOpen(null)}
          onSelect={(price) => {
            // ... existing logic ...
            setBarPrices(prev => ({ ...prev, [pricePickerOpen.stopId]: { ...prev[pricePickerOpen.stopId], [pricePickerOpen.type]: price } }));
          }}
          currentPrice={pricePickerOpen.type === 'beer' ? (barPrices[pricePickerOpen.stopId]?.beer || DEFAULT_BEER_PRICE) : (barPrices[pricePickerOpen.stopId]?.tapa || DEFAULT_TAPA_PRICE)}
          title={pricePickerOpen.type === 'beer' ? 'Precio Cerveza' : 'Precio Tapeo'}
          icon={pricePickerOpen.type === 'beer' ? '🍺' : '🍢'}
        />
      )}

      {showSummary && <RouteSummary routeId={routeId} onClose={() => setShowSummary(false)} />}

      <RouteChat routeId={routeId} currentUserId={currentUserId} />
    </>
  );
}
