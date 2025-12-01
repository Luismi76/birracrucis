"use client";

import { useEffect, useState, useRef } from "react";
import PhotoCapture from "@/components/PhotoCapture";
import PhotoGallery from "@/components/PhotoGallery";
import NudgeButton from "@/components/NudgeButton";
import RouteChat from "@/components/RouteChat";
import SkipVoteButton from "@/components/SkipVoteButton";
import DrinkCounter from "@/components/DrinkCounter";
import BarTimer from "@/components/BarTimer";
import BarRating from "@/components/BarRating";
import RouteSummary from "@/components/RouteSummary";
import AddToCalendar from "@/components/AddToCalendar";
import ParticipantsList from "@/components/ParticipantsList";

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

const LOCATION_UPDATE_INTERVAL = 10000; // Enviar ubicación cada 10 segundos
const PARTICIPANTS_FETCH_INTERVAL = 5000; // Obtener participantes cada 5 segundos

export default function RouteDetailClient({ stops, routeId, routeName, routeDate, startTime, routeStatus, currentUserId, onPositionChange, onParticipantsChange, isCreator = false }: RouteDetailClientProps) {
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

  // Tabs para diferentes secciones
  const [activeTab, setActiveTab] = useState<"route" | "photos" | "drinks" | "ratings" | "group">("route");
  const [photoRefresh, setPhotoRefresh] = useState(0);

  // Estado local de rondas (optimista)
  const [rounds, setRounds] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    stops.forEach((s) => { initial[s.id] = s.actualRounds; });
    return initial;
  });

  // Determinar el bar actual (el primero que no ha completado sus rondas)
  const currentStopIndex = stops.findIndex(s => (rounds[s.id] || 0) < s.plannedRounds);
  const activeStop = currentStopIndex !== -1 ? stops[currentStopIndex] : stops[stops.length - 1];
  const isRouteComplete = currentStopIndex === -1;

  // Calcular progreso
  const completedStops = stops.filter(s => (rounds[s.id] || 0) >= s.plannedRounds).length;
  const totalRounds = Object.values(rounds).reduce((sum, r) => sum + r, 0);
  const progressPercent = (completedStops / stops.length) * 100;

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

    // Fetch inicial
    fetchParticipants();

    // Polling periódico
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

  const handleAddRound = async (stopId: string) => {
    // Optimistic update
    setRounds(prev => ({
      ...prev,
      [stopId]: (prev[stopId] || 0) + 1
    }));

    try {
      const res = await fetch(`/api/stops/${stopId}/checkin`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to check in');
    } catch (err) {
      // Rollback
      console.error(err);
      setRounds(prev => ({
        ...prev,
        [stopId]: Math.max(0, (prev[stopId] || 0) - 1)
      }));
      alert("Error al registrar la ronda. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="space-y-6 pb-20">

      {/* 1. Barra de Progreso Global */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium opacity-90">Progreso de la Ruta</span>
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
          <span>🍺 {totalRounds} rondas totales</span>
          <span>⏱️ ~{stops.length * 20} min estimados</span>
        </div>
      </div>

      {/* 2. Header de Estado */}
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

      {/* 3. Tarjeta Principal (Bar Actual) */}
      {!isRouteComplete && activeStop && (
        <div className="bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden relative">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white">
            <h2 className="text-2xl font-bold truncate">{activeStop.name}</h2>
            <p className="text-amber-100 text-sm truncate">{activeStop.address}</p>
          </div>

          <div className="p-6 flex flex-col items-center gap-4">
            {/* Estado de Distancia */}
            <div className="text-center">
              {distToActive !== null ? (
                distToActive <= RADIUS_METERS ? (
                  <span className="text-green-600 font-bold flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full animate-pulse">
                    📍 ¡Estás aquí!
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
                    👣 A {distToActive} metros
                  </span>
                )
              ) : (
                <span className="text-slate-400 text-sm">Buscando ubicación...</span>
              )}
            </div>

            {/* Contador de Rondas */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-black text-slate-800">
                  {rounds[activeStop.id] || 0}
                  <span className="text-lg text-slate-400 font-normal">/{activeStop.plannedRounds}</span>
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">Rondas</div>
              </div>
            </div>

            {/* Botón de Acción Principal */}
            <button
              onClick={() => handleAddRound(activeStop.id)}
              disabled={!canCheckIn && !showDebug}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${(canCheckIn || showDebug)
                  ? "bg-amber-500 text-white hover:bg-amber-600 hover:shadow-amber-200 hover:-translate-y-1"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
            >
              {(canCheckIn || showDebug) ? "🍺 ¡Pedir Ronda!" : "Acércate para pedir"}
            </button>

            {!canCheckIn && !showDebug && distToActive !== null && (
              <p className="text-xs text-slate-400 text-center">
                Debes estar a menos de {RADIUS_METERS}m del bar.
              </p>
            )}

            {/* Botones de Foto y Nudge */}
            {(canCheckIn || showDebug) && (
              <div className="w-full space-y-3 pt-2 border-t border-slate-100">
                <PhotoCapture
                  routeId={routeId}
                  routeName={routeName}
                  stopId={activeStop.id}
                  stopName={activeStop.name}
                  onPhotoUploaded={() => setPhotoRefresh(prev => prev + 1)}
                />
                <NudgeButton
                  routeId={routeId}
                  isAtCurrentStop={canCheckIn || showDebug}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nudge para los que no estan en el bar */}
      {!canCheckIn && !showDebug && (
        <NudgeButton routeId={routeId} isAtCurrentStop={false} />
      )}

      {/* Votacion para saltar bar - siempre visible si hay bar activo */}
      {activeStop && !isRouteComplete && (
        <SkipVoteButton
          routeId={routeId}
          stopId={activeStop.id}
          currentUserId={currentUserId}
        />
      )}

      {/* Anadir al calendario - siempre visible excepto si completada */}
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

      {/* Tabs: Ruta / Grupo / Fotos / Bebidas / Valoraciones */}
      <div className="flex bg-slate-100 rounded-xl p-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("route")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
            activeTab === "route"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          🗺️ Ruta
        </button>
        <button
          onClick={() => setActiveTab("group")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
            activeTab === "group"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          👥 Grupo
        </button>
        <button
          onClick={() => setActiveTab("photos")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
            activeTab === "photos"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          📸 Fotos
        </button>
        <button
          onClick={() => setActiveTab("drinks")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
            activeTab === "drinks"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          🍺 Bebidas
        </button>
        <button
          onClick={() => setActiveTab("ratings")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
            activeTab === "ratings"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          ⭐ Valorar
        </button>
      </div>

      {activeTab === "group" && (
        /* Lista de Participantes */
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
      )}

      {activeTab === "photos" && (
        /* Galeria de Fotos */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>📸</span> Galeria de la Ruta
          </h3>
          <PhotoGallery routeId={routeId} refreshTrigger={photoRefresh} />
        </div>
      )}

      {activeTab === "drinks" && (
        /* Contador de Bebidas */
        activeStop ? (
          <DrinkCounter
            routeId={routeId}
            stopId={activeStop.id}
            currentUserId={currentUserId}
            participants={participants.map(p => ({
              id: p.id,
              name: p.name,
              image: p.image,
            }))}
          />
        ) : (
          <div className="bg-white rounded-xl border p-4 text-center text-slate-500">
            Selecciona un bar para ver las bebidas
          </div>
        )
      )}

      {activeTab === "ratings" && (
        /* Valoracion del Bar */
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
        /* 4. Timeline de la Ruta (Pasaporte) */
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>🗺️</span> Tu Pasaporte
        </h3>
        <div className="space-y-0 relative">
          {/* Línea conectora vertical */}
          <div className="absolute left-[1.15rem] top-2 bottom-2 w-0.5 bg-slate-100 -z-10"></div>

          {stops.map((stop, index) => {
            const isCurrent = stop.id === activeStop?.id && !isRouteComplete;
            const isDone = (rounds[stop.id] || 0) >= stop.plannedRounds;

            return (
              <div key={stop.id} className={`flex items-start gap-3 py-3 ${isCurrent ? 'scale-105 origin-left transition-transform' : 'opacity-80'}`}>
                {/* Indicador Circular */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 shrink-0 transition-colors ${isDone
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
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDone ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                      }`}>
                      {rounds[stop.id] || 0}/{stop.plannedRounds}
                    </span>
                  </div>
                  {stop.address && <p className="text-xs text-slate-400 truncate">{stop.address}</p>}

                  {/* Botón simular (solo debug) */}
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
      </div>
      )}

      {/* Boton Ver Resumen (cuando ruta completada) */}
      {isRouteComplete && (
        <button
          onClick={() => setShowSummary(true)}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
        >
          🎉 Ver Resumen de la Ruta
        </button>
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

      {/* 5. Controles de Debug (Ocultos por defecto) */}
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
            Aplicar Posición
          </button>
          <div className="font-mono text-[10px] break-all">
            Pos: {position?.lat.toFixed(5)}, {position?.lng.toFixed(5)} <br />
            Acc: {accuracy}m <br />
            Err: {locError}
          </div>
        </div>
      )}

    </div>
  );
}
