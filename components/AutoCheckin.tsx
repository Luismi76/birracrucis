"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Stop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type AutoCheckinProps = {
  routeId: string;
  stops: Stop[];
  currentStopId: string | null;
  userPosition: { lat: number; lng: number } | null;
  onCheckin: (stopId: string) => void;
  enabled?: boolean;
};

const CHECKIN_RADIUS_METERS = 30; // Radio para check-in automático
const CHECKIN_COOLDOWN_MS = 60000; // 1 minuto entre check-ins automáticos

function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return Infinity;
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

export default function AutoCheckin({
  routeId,
  stops,
  currentStopId,
  userPosition,
  onCheckin,
  enabled = true,
}: AutoCheckinProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [lastCheckin, setLastCheckin] = useState<{ stopId: string; time: number } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const checkedInStops = useRef<Set<string>>(new Set());

  const checkProximity = useCallback(() => {
    if (!isEnabled || !userPosition || !currentStopId) return;

    const currentStop = stops.find((s) => s.id === currentStopId);
    if (!currentStop) return;

    // Verificar si ya hicimos check-in en esta parada
    if (checkedInStops.current.has(currentStopId)) return;

    // Verificar cooldown
    if (lastCheckin && Date.now() - lastCheckin.time < CHECKIN_COOLDOWN_MS) return;

    const distance = distanceInMeters(
      userPosition.lat,
      userPosition.lng,
      currentStop.lat,
      currentStop.lng
    );

    if (distance <= CHECKIN_RADIUS_METERS) {
      // Auto check-in
      checkedInStops.current.add(currentStopId);
      setLastCheckin({ stopId: currentStopId, time: Date.now() });
      setNotification(`Has llegado a ${currentStop.name}`);
      onCheckin(currentStopId);

      // Vibrar si está disponible
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // Limpiar notificación después de 3 segundos
      setTimeout(() => setNotification(null), 3000);

      // Registrar llegada en el servidor
      fetch(`/api/stops/${currentStopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arrivedAt: new Date().toISOString() }),
      }).catch(console.error);
    }
  }, [isEnabled, userPosition, currentStopId, stops, lastCheckin, onCheckin]);

  useEffect(() => {
    checkProximity();
  }, [checkProximity]);

  if (!isEnabled) return null;

  return (
    <>
      {/* Toggle de check-in automático */}
      <div className="bg-white rounded-xl border p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📍</span>
          <div>
            <p className="font-medium text-slate-800 text-sm">Check-in automatico</p>
            <p className="text-xs text-slate-500">
              {isEnabled ? "Te registramos al llegar al bar" : "Desactivado"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${isEnabled ? "bg-green-500" : "bg-slate-300"
            }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isEnabled ? "left-7" : "left-1"
              }`}
          />
        </button>
      </div>

      {/* Notificación de check-in */}
      {notification && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
          <div className="bg-green-500 text-white rounded-xl p-4 shadow-lg flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold">Check-in automatico</p>
              <p className="text-sm text-green-100">{notification}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
