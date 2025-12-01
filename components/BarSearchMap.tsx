"use client";

import { GoogleMap, Marker, Circle, DirectionsRenderer } from "@react-google-maps/api";
import { useMemo, useState, useEffect, useRef } from "react";

type PlaceResult = {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating: number | null;
    userRatingsTotal: number;
};

type BarSearchMapProps = {
    center: { lat: number; lng: number };
    radius: number;
    bars: PlaceResult[];
    selectedBars: string[]; // placeIds
    routePreview?: { lat: number; lng: number }[]; // Array de coordenadas ordenadas
    onBarClick?: (placeId: string) => void;
    onDistanceCalculated?: (distanceMeters: number, durationSeconds: number) => void;
    onMapClick?: (lat: number, lng: number) => void; // Para añadir bares manualmente
    manualAddMode?: boolean; // Indica si está activo el modo de añadir bar manual
    isLoaded: boolean;
    loadError?: Error;
    onMapRef?: (mapRef: { getClickCoordinates: (x: number, y: number, rect: DOMRect) => { lat: number; lng: number } | null }) => void;
};

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const getMapOptions = (manualMode: boolean) => ({
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    draggableCursor: manualMode ? "crosshair" : undefined,
});

// Crear una key única para comparar rutas
const getRouteKey = (routePreview?: { lat: number; lng: number }[]): string => {
    if (!routePreview || routePreview.length < 2) return "";
    return routePreview.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join("|");
};

export default function BarSearchMap({
    center,
    radius,
    bars,
    selectedBars,
    routePreview,
    onBarClick,
    onDistanceCalculated,
    onMapClick,
    manualAddMode = false,
    isLoaded,
    loadError,
    onMapRef,
}: BarSearchMapProps) {
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
    const lastRouteKeyRef = useRef<string>("");
    const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    // Calcular zoom según el radio
    const zoom = useMemo(() => {
        if (radius <= 300) return 16;
        if (radius <= 800) return 15;
        if (radius <= 1500) return 14;
        return 13;
    }, [radius]);

    // Crear marcador SVG personalizado
    const createMarkerIcon = (isSelected: boolean, number?: number) => {
        const color = isSelected ? "#10b981" : "#f59e0b"; // Verde si seleccionado, amarillo si no
        const svg = `
      <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z"
              fill="${color}" stroke="#fff" stroke-width="2"/>
        ${number ? `
          <circle cx="16" cy="16" r="10" fill="#fff"/>
          <text x="16" y="20" font-size="12" font-weight="bold" text-anchor="middle" fill="${color}">
            ${number}
          </text>
        ` : `
          <circle cx="16" cy="16" r="6" fill="#fff"/>
        `}
      </svg>
    `;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    };

    // Inicializar DirectionsService una sola vez
    useEffect(() => {
        if (isLoaded && !directionsServiceRef.current) {
            directionsServiceRef.current = new google.maps.DirectionsService();
        }
    }, [isLoaded]);

    // Solicitar direcciones solo cuando cambia la ruta
    useEffect(() => {
        const currentRouteKey = getRouteKey(routePreview);

        // Si no hay ruta suficiente, limpiar
        if (!routePreview || routePreview.length < 2) {
            if (directionsResponse) {
                setDirectionsResponse(null);
                lastRouteKeyRef.current = "";
            }
            return;
        }

        // Si la ruta no cambió, no hacer nada
        if (currentRouteKey === lastRouteKeyRef.current) {
            return;
        }

        // Si no tenemos el servicio, esperar
        if (!directionsServiceRef.current) {
            return;
        }

        // Actualizar la key antes de la llamada
        lastRouteKeyRef.current = currentRouteKey;

        const origin = routePreview[0];
        const destination = routePreview[routePreview.length - 1];
        const waypoints = routePreview.length > 2
            ? routePreview.slice(1, -1).map(loc => ({ location: loc, stopover: true }))
            : [];

        directionsServiceRef.current.route(
            {
                origin,
                destination,
                waypoints,
                travelMode: google.maps.TravelMode.WALKING,
            },
            (result, status) => {
                if (status === "OK" && result) {
                    setDirectionsResponse(result);

                    // Extraer distancia y duración total
                    const route = result.routes[0];
                    if (route) {
                        let totalDistance = 0;
                        let totalDuration = 0;

                        route.legs.forEach(leg => {
                            totalDistance += leg.distance?.value || 0;
                            totalDuration += leg.duration?.value || 0;
                        });

                        onDistanceCalculated?.(totalDistance, totalDuration);
                    }
                } else {
                    console.error(`Error fetching directions: ${status}`);
                    // En caso de error, resetear para permitir reintentos
                    lastRouteKeyRef.current = "";
                }
            }
        );
    }, [routePreview, isLoaded, onDistanceCalculated, directionsResponse]);

    if (loadError) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <p className="text-red-600">Error al cargar el mapa</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-2"></div>
                    <p className="text-slate-600">Cargando mapa...</p>
                </div>
            </div>
        );
    }

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        console.log("BarSearchMap click event, manualAddMode:", manualAddMode, "hasCallback:", !!onMapClick);
        if (manualAddMode && onMapClick && e.latLng) {
            console.log("Calling onMapClick with:", e.latLng.lat(), e.latLng.lng());
            onMapClick(e.latLng.lat(), e.latLng.lng());
        }
    };

    // Función para obtener coordenadas del clic usando la referencia del mapa
    const getClickCoordinates = (pixelX: number, pixelY: number, containerRect: DOMRect): { lat: number; lng: number } | null => {
        if (!mapRef.current) return null;

        const map = mapRef.current;
        const bounds = map.getBounds();

        if (!bounds) return null;

        // Obtener el punto del mundo basado en la posición del clic
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const mapWidth = containerRect.width;
        const mapHeight = containerRect.height;

        // Calcular el porcentaje de posición dentro del mapa
        const percentX = pixelX / mapWidth;
        const percentY = pixelY / mapHeight;

        // Interpolar las coordenadas
        const lng = sw.lng() + (ne.lng() - sw.lng()) * percentX;
        const lat = ne.lat() - (ne.lat() - sw.lat()) * percentY;

        return { lat, lng };
    };

    // Callback para guardar referencia al mapa
    const onMapLoad = (map: google.maps.Map) => {
        mapRef.current = map;
        // Notificar al padre con las funciones del mapa
        if (onMapRef) {
            onMapRef({ getClickCoordinates });
        }
    };

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={zoom}
            options={getMapOptions(manualAddMode)}
            onClick={handleMapClick}
            onLoad={onMapLoad}
        >
            {/* Círculo mostrando el radio de búsqueda */}
            <Circle
                center={center}
                radius={radius}
                options={{
                    strokeColor: "#f59e0b",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#f59e0b",
                    fillOpacity: 0.1,
                }}
            />

            {/* Renderizado de la ruta */}
            {directionsResponse && (
                <DirectionsRenderer
                    options={{
                        directions: directionsResponse,
                        suppressMarkers: true, // Usamos nuestros propios marcadores
                        polylineOptions: {
                            strokeColor: "#10b981",
                            strokeOpacity: 0.8,
                            strokeWeight: 5,
                        }
                    }}
                />
            )}

            {/* Marcador del centro de búsqueda */}
            <Marker
                position={center}
                icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#3b82f6",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                }}
                title="Centro de búsqueda"
            />

            {/* Marcadores de bares */}
            {bars.map((bar, index) => {
                const isSelected = selectedBars.includes(bar.placeId);
                const selectedIndex = selectedBars.indexOf(bar.placeId);
                const displayNumber = isSelected ? selectedIndex + 1 : undefined;

                return (
                    <Marker
                        key={bar.placeId}
                        position={{ lat: bar.lat, lng: bar.lng }}
                        icon={{
                            url: createMarkerIcon(isSelected, displayNumber),
                            scaledSize: new google.maps.Size(32, 40),
                            anchor: new google.maps.Point(16, 40),
                        }}
                        title={`${bar.name}${isSelected ? ` (#${displayNumber})` : ""}`}
                        onClick={() => onBarClick?.(bar.placeId)}
                        animation={isSelected ? google.maps.Animation.BOUNCE : undefined}
                    />
                );
            })}
        </GoogleMap>
    );
}
