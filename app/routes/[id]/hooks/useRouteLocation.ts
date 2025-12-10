import { useState, useEffect, useRef, useCallback } from "react";
import { distanceInMeters, CHECKIN_RADIUS_METERS } from "@/lib/geo-utils";

const ACCURACY_THRESHOLD = 150;
const LOCATION_UPDATE_INTERVAL = 10000;

type Position = { lat: number; lng: number };

type UseRouteLocationOptions = {
  routeId: string;
  enabled?: boolean;
  onPositionChange?: (position: Position | null) => void;
};

type UseRouteLocationReturn = {
  position: Position | null;
  accuracy: number | null;
  error: string | null;
  isWatching: boolean;
  isReliable: boolean;
  startWatch: () => void;
  stopWatch: () => void;
  distanceTo: (lat: number, lng: number) => number | null;
  isNearLocation: (lat: number, lng: number, radius?: number) => boolean;
};

export function useRouteLocation({
  routeId,
  enabled = true,
  onPositionChange,
}: UseRouteLocationOptions): UseRouteLocationReturn {
  const [position, setPosition] = useState<Position | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastLocationSentRef = useRef<number>(0);

  // Limpiar watch al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Iniciar watch automáticamente si está habilitado
  useEffect(() => {
    if (enabled && "geolocation" in navigator) {
      startWatch();
    }
  }, [enabled]);

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

  const startWatch = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocalización no disponible");
      return;
    }

    setError(null);
    setIsWatching(true);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(newPos);
        setAccuracy(pos.coords.accuracy ?? null);
        onPositionChange?.(newPos);
      },
      (err) => {
        console.warn("Error watchPosition:", err.message);
        setError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    watchIdRef.current = id;
  }, [onPositionChange]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const isReliable = accuracy != null && accuracy <= ACCURACY_THRESHOLD;

  const distanceTo = useCallback((lat: number, lng: number): number | null => {
    if (!position) return null;
    return Math.round(distanceInMeters(position.lat, position.lng, lat, lng));
  }, [position]);

  const isNearLocation = useCallback((lat: number, lng: number, radius: number = CHECKIN_RADIUS_METERS): boolean => {
    if (!position || !isReliable) return false;
    const dist = distanceInMeters(position.lat, position.lng, lat, lng);
    return dist <= radius;
  }, [position, isReliable]);

  return {
    position,
    accuracy,
    error,
    isWatching,
    isReliable,
    startWatch,
    stopWatch,
    distanceTo,
    isNearLocation,
  };
}
