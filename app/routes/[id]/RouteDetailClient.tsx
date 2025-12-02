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

  // Debug mode
  const [showDebug, setShowDebug] = useState(false);
  const [simLat, setSimLat] = useState("");
  const [simLng, setSimLng] = useState("");
  const [simActive, setSimActive] = useState(false);

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
        setSimActive(false);
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

  const applySimulatedPosition = () => {
    const lat = Number(simLat);
    const lng = Number(simLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      const newPos = { lat, lng };
      setPosition(newPos);
      setAccuracy(null);
      setSimActive(true);
      onPositionChange?.(newPos);
    }
  };

  const isPositionReliable = () => {
    if (simActive) return true;
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
      alert("Error al registrar la ronda. Inténtalo de nuevo.");
    }
  };

  const handleAddBeer = (stopId: string) => {
    setBeers(prev => ({ ...prev, [stopId]: (prev[stopId] || 0) + 1 }));
    // Registrar en servidor
    fetch(`/api/routes/${routeId}/drinks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stopId, type: 'beer' }),
    }).catch(console.error);
  };

  const handleRemoveBeer = (stopId: string) => {
    if ((beers[stopId] || 0) <= 0) return;
    setBeers(prev => ({ ...prev, [stopId]: (prev[stopId] || 0) - 1 }));
  };

  const handleAddTapa = (stopId: string) => {
    setTapas(prev => ({ ...prev, [stopId]: (prev[stopId] || 0) + 1 }));
    fetch(`/api/routes/${routeId}/drinks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stopId, type: 'tapa' }),
    }).catch(console.error);
  };

  const handleRemoveTapa = (stopId: string) => {
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
    <div className="space-y-4 pb-20">

      {/* Notificacion de Auto-checkin */}
      {autoCheckinNotification && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
          <div className="bg-green-500 text-white rounded-xl p-4 shadow-lg flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold">Check-in automatico</p>
              <p className="text-sm text-green-100">{autoCheckinNotification}</p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Barra de Progreso Global */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium opacity-90">Progreso</span>
          <span className="text-lg font-bold">
            {completedStops}/{stops.length} Bares
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-xs opacity-90">
          <span>🍺 {totalBeers} cervezas</span>
          <span>🍢 {totalTapas} tapas</span>
          <span>💰 {totalSpent.toFixed(2)}€</span>
        </div>
      </div>

      {/* 2. Bote Comun */}
      <PotManager
        routeId={routeId}
        isCreator={isCreator}
        currentUserId={currentUserId}
        totalSpent={totalSpent}
      />

      {/* 3. Header de Estado */}
      <div className="flex justify-between items-center">
        <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
          {isRouteComplete ? "🎉 Ruta Completada" : `Parada ${currentStopIndex + 1} de ${stops.length}`}
        </div>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs text-slate-300 hover:text-slate-500"
        >
          🐞
        </button>
      </div>

      {/* 3. Tarjeta Principal (Bar Actual) - TODO INTEGRADO */}
      {!isRouteComplete && activeStop && (
        <div className="bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden">
          {/* Header del bar */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold truncate">{activeStop.name}</h2>
                <p className="text-amber-100 text-sm truncate">{activeStop.address}</p>
              </div>
              {/* Distancia */}
              <div className="ml-2 shrink-0">
                {distToActive !== null ? (
                  distToActive <= RADIUS_METERS ? (
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
                      📍 Aqui
                    </span>
                  ) : (
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                      {distToActive}m
                    </span>
                  )
                ) : null}
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="p-4 space-y-4">

            {/* Rondas completadas */}
            <div className="flex items-center justify-center gap-2 py-2">
              <span className={`text-3xl font-black ${isOverPlannedRounds ? 'text-orange-500' : 'text-slate-800'}`}>
                {rounds[activeStop.id] || 0}
              </span>
              <span className="text-lg text-slate-400">/ {activeStop.plannedRounds} rondas</span>
            </div>

            {/* Aviso de rondas completadas - Sugerir pasar al siguiente bar */}
            {isOverPlannedRounds && currentBarIndex < stops.length - 1 && (
              <div className="bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
                <div className="text-2xl">🎯</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-orange-800">Objetivo cumplido!</p>
                  <p className="text-xs text-orange-600">Ya completaste las rondas planificadas. Puedes seguir o ir al siguiente bar.</p>
                </div>
              </div>
            )}

            {/* Boton principal: Pedir Ronda */}
            {(() => {
              const peopleAtBar = getParticipantsAtBar(activeStop.id);
              return (
                <button
                  onClick={() => handleAddRound(activeStop.id)}
                  disabled={!canCheckIn && !showDebug}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex flex-col items-center justify-center gap-1 ${
                    (canCheckIn || showDebug)
                      ? isOverPlannedRounds
                        ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-lg"
                        : "bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-lg"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {(canCheckIn || showDebug) ? (
                    <>
                      <span>{isOverPlannedRounds ? '🍺 Otra Ronda Mas!' : '🍺 Pedir Ronda'}</span>
                      <span className="text-xs opacity-80">+{peopleAtBar} {peopleAtBar === 1 ? 'cerveza' : 'cervezas'} ({peopleAtBar} {peopleAtBar === 1 ? 'persona' : 'personas'})</span>
                    </>
                  ) : (
                    <span>Acercate ({distToActive || '...'}m)</span>
                  )}
                </button>
              );
            })()}

            {/* Boton Siguiente Bar - Solo aparece cuando hemos completado las rondas */}
            {isOverPlannedRounds && currentBarIndex < stops.length - 1 && (
              <button
                onClick={handleNextBar}
                className="w-full py-3 rounded-xl font-bold text-base bg-green-500 text-white hover:bg-green-600 active:scale-95 shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>➡️ Siguiente Bar: {stops[currentBarIndex + 1]?.name}</span>
              </button>
            )}

            {/* Boton Finalizar Ruta - Solo en el ultimo bar cuando completado */}
            {isOverPlannedRounds && currentBarIndex === stops.length - 1 && (
              <button
                onClick={handleNextBar}
                className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 active:scale-95 shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>🎉 Finalizar Ruta</span>
              </button>
            )}

            {/* Seccion de consumiciones */}
            <div className="bg-slate-50 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">Mi cuenta en este bar</h4>
                <span className="text-lg font-bold text-green-600">{currentBarSpent.toFixed(2)}€</span>
              </div>

              {/* Cervezas */}
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍺</span>
                  <div>
                    <span className="font-medium text-slate-800">Cerveza</span>
                    <button
                      onClick={() => setPricePickerOpen({ type: 'beer', stopId: activeStop.id })}
                      className="flex items-center gap-1 text-amber-600 text-sm font-medium hover:text-amber-700"
                    >
                      {(barPrices[activeStop.id]?.beer || DEFAULT_BEER_PRICE).toFixed(2)}€
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRemoveBeer(activeStop.id)}
                    disabled={!canCheckIn && !showDebug}
                    className="w-11 h-11 rounded-full bg-slate-200 text-slate-600 font-bold text-xl hover:bg-slate-300 disabled:opacity-50 transition-colors active-scale"
                    aria-label="Quitar cerveza"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-xl">{beers[activeStop.id] || 0}</span>
                  <button
                    onClick={() => handleAddBeer(activeStop.id)}
                    disabled={!canCheckIn && !showDebug}
                    className="w-11 h-11 rounded-full bg-amber-500 text-white font-bold text-xl hover:bg-amber-600 disabled:opacity-50 transition-colors active-scale"
                    aria-label="Añadir cerveza"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Tapas */}
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍢</span>
                  <div>
                    <span className="font-medium text-slate-800">Tapeo</span>
                    <button
                      onClick={() => setPricePickerOpen({ type: 'tapa', stopId: activeStop.id })}
                      className="flex items-center gap-1 text-orange-600 text-sm font-medium hover:text-orange-700"
                    >
                      {(barPrices[activeStop.id]?.tapa || DEFAULT_TAPA_PRICE).toFixed(2)}€
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRemoveTapa(activeStop.id)}
                    disabled={!canCheckIn && !showDebug}
                    className="w-11 h-11 rounded-full bg-slate-200 text-slate-600 font-bold text-xl hover:bg-slate-300 disabled:opacity-50 transition-colors active-scale"
                    aria-label="Quitar tapa"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-xl">{tapas[activeStop.id] || 0}</span>
                  <button
                    onClick={() => handleAddTapa(activeStop.id)}
                    disabled={!canCheckIn && !showDebug}
                    className="w-11 h-11 rounded-full bg-orange-500 text-white font-bold text-xl hover:bg-orange-600 disabled:opacity-50 transition-colors active-scale"
                    aria-label="Añadir tapa"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Acciones: Foto + Meter prisa */}
            <div className="grid grid-cols-2 gap-2">
              <PhotoCapture
                routeId={routeId}
                routeName={routeName}
                stopId={activeStop.id}
                stopName={activeStop.name}
                onPhotoUploaded={() => setPhotoRefresh(prev => prev + 1)}
                compact
              />
              <NudgeButton
                routeId={routeId}
                isAtCurrentStop={canCheckIn || showDebug}
                compact
              />
            </div>

            {/* Votar saltar bar */}
            <SkipVoteButton
              routeId={routeId}
              stopId={activeStop.id}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      )}

      {/* Nudge para los que no estan en el bar */}
      {!canCheckIn && !showDebug && !isRouteComplete && (
        <NudgeButton routeId={routeId} isAtCurrentStop={false} />
      )}

      {/* Anadir al calendario */}
      {!isRouteComplete && (
        <AddToCalendar
          routeName={routeName}
          routeDate={routeDate}
          startTime={startTime}
          stops={stops.map(s => ({
            id: s.id,
            name: s.name,
            address: s.address || "",
            arrivalTime: s.arrivalTime,
            departureTime: s.departureTime,
          }))}
        />
      )}


      {/* Tabs simplificadas: Ruta / Fotos / Valorar / Grupo */}
      <div className="flex bg-slate-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab("route")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
            activeTab === "route"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          🗺️ Ruta
        </button>
        <button
          onClick={() => setActiveTab("photos")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
            activeTab === "photos"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          📸 Fotos
        </button>
        <button
          onClick={() => setActiveTab("ratings")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
            activeTab === "ratings"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          ⭐ Valorar
        </button>
        <button
          onClick={() => setActiveTab("group")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
            activeTab === "group"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          👥 Grupo
        </button>
      </div>

      {activeTab === "group" && (
        <div className="space-y-4">
          <ParticipantsList
            routeId={routeId}
            currentUserId={currentUserId}
            currentStop={activeStop ? {
              id: activeStop.id,
              name: activeStop.name,
              lat: activeStop.lat,
              lng: activeStop.lng,
            } : null}
            userPosition={position}
          />
          <InvitationManager
            routeId={routeId}
            isCreator={isCreator}
          />
        </div>
      )}

      {activeTab === "photos" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>📸</span> Galeria de la Ruta
          </h3>
          <PhotoGallery routeId={routeId} refreshTrigger={photoRefresh} />
        </div>
      )}

      {activeTab === "ratings" && (
        activeStop ? (
          <BarRating
            routeId={routeId}
            stopId={activeStop.id}
            stopName={activeStop.name}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="bg-white rounded-xl border p-4 text-center text-slate-500">
            Selecciona un bar para valorar
          </div>
        )
      )}

      {activeTab === "route" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>🗺️</span> Tu Pasaporte
          </h3>
          <div className="space-y-0 relative">
            <div className="absolute left-[1.15rem] top-2 bottom-2 w-0.5 bg-slate-100 -z-10"></div>

            {stops.map((stop, index) => {
              const isCurrent = stop.id === activeStop?.id && !isRouteComplete;
              const isDone = (rounds[stop.id] || 0) >= stop.plannedRounds;
              const stopBeers = beers[stop.id] || 0;
              const stopTapas = tapas[stop.id] || 0;
              const stopPrices = barPrices[stop.id] || { beer: DEFAULT_BEER_PRICE, tapa: DEFAULT_TAPA_PRICE };
              const stopSpent = stopBeers * stopPrices.beer + stopTapas * stopPrices.tapa;

              return (
                <div key={stop.id} className={`flex items-start gap-3 py-3 ${isCurrent ? 'scale-105 origin-left transition-transform' : 'opacity-80'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 shrink-0 transition-colors ${
                    isDone
                      ? "bg-green-500 border-green-100 text-white"
                      : isCurrent
                        ? "bg-amber-500 border-amber-100 text-white animate-bounce-slow"
                        : "bg-white border-slate-200 text-slate-400"
                  }`}>
                    {isDone ? "✓" : (index + 1)}
                  </div>

                  <div className="flex-1 min-w-0 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex justify-between items-start">
                      <h4 className={`font-bold truncate ${isCurrent ? 'text-slate-900' : 'text-slate-600'}`}>
                        {stop.name}
                      </h4>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isDone ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                      }`}>
                        {rounds[stop.id] || 0}/{stop.plannedRounds}
                      </span>
                    </div>

                    {/* Mini resumen del bar */}
                    {(stopBeers > 0 || stopTapas > 0) && (
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        {stopBeers > 0 && <span>🍺 {stopBeers}</span>}
                        {stopTapas > 0 && <span>🍢 {stopTapas}</span>}
                        <span className="text-green-600 font-medium">{stopSpent.toFixed(2)}€</span>
                      </div>
                    )}

                    {showDebug && (
                      <button
                        onClick={() => {
                          setSimLat(stop.lat.toString());
                          setSimLng(stop.lng.toString());
                          setSimActive(true);
                          const newPos = { lat: stop.lat, lng: stop.lng };
                          setPosition(newPos);
                          onPositionChange?.(newPos);
                        }}
                        className="mt-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        📍 Teleport
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen total de gastos */}
          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex justify-between items-center">
              <span className="font-bold text-green-800">Total gastado</span>
              <span className="text-2xl font-black text-green-600">{totalSpent.toFixed(2)}€</span>
            </div>
            <div className="mt-1 text-xs text-green-600">
              🍺 {totalBeers} cervezas · 🍢 {totalTapas} tapas
            </div>
          </div>
        </div>
      )}

      {/* Boton Ver Resumen (cuando ruta completada) */}
      {isRouteComplete && (
        <div className="space-y-3">
          <button
            onClick={() => setShowSummary(true)}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
          >
            🎉 Ver Resumen de la Ruta
          </button>
          <div className="flex justify-center">
            <ExportRoutePDF
              route={{
                id: routeId,
                name: routeName,
                date: routeDate,
                status: routeStatus,
                stops: stops.map(s => ({
                  id: s.id,
                  name: s.name,
                  address: s.address,
                  plannedRounds: s.plannedRounds,
                  actualRounds: rounds[s.id] || s.actualRounds,
                  arrivedAt: s.arrivalTime || null,
                  leftAt: s.departureTime || null,
                })),
                participants: participants.map(p => ({
                  id: p.id,
                  name: p.name,
                  image: p.image,
                })),
                totalDrinks: totalBeers,
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Resumen */}
      {showSummary && (
        <RouteSummary
          routeId={routeId}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Chat Flotante */}
      <RouteChat
        routeId={routeId}
        currentUserId={currentUserId}
      />

      {/* Debug Console */}
      {showDebug && (
        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider">Debug Console</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1">Lat</label>
              <input
                value={simLat}
                onChange={e => setSimLat(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block mb-1">Lng</label>
              <input
                value={simLng}
                onChange={e => setSimLng(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"
              />
            </div>
          </div>
          <button
            onClick={applySimulatedPosition}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-500"
          >
            Aplicar Posicion
          </button>
          <div className="font-mono text-[10px] break-all">
            Pos: {position?.lat.toFixed(5)}, {position?.lng.toFixed(5)} <br />
            Acc: {accuracy}m | Dist: {distToActive}m
          </div>
        </div>
      )}

      {/* Price Picker Modal */}
      {pricePickerOpen && (
        <PricePicker
          isOpen={true}
          onClose={() => setPricePickerOpen(null)}
          onSelect={(price) => {
            setBarPrices(prev => ({
              ...prev,
              [pricePickerOpen.stopId]: {
                ...prev[pricePickerOpen.stopId],
                [pricePickerOpen.type]: price
              }
            }));
          }}
          currentPrice={
            pricePickerOpen.type === 'beer'
              ? (barPrices[pricePickerOpen.stopId]?.beer || DEFAULT_BEER_PRICE)
              : (barPrices[pricePickerOpen.stopId]?.tapa || DEFAULT_TAPA_PRICE)
          }
          title={pricePickerOpen.type === 'beer' ? 'Precio Cerveza' : 'Precio Tapeo'}
          icon={pricePickerOpen.type === 'beer' ? '🍺' : '🍢'}
        />
      )}

    </div>
  );
}
