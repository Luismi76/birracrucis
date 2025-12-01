"use client";

import { GoogleMap, Marker, DirectionsRenderer, DirectionsService, InfoWindow, useLoadScript } from "@react-google-maps/api";
import { useState, useMemo, useCallback, useEffect } from "react";

type Stop = {
    id: string;
    name: string;
    address: string | null;
    lat: number;
    lng: number;
    plannedRounds: number;
    actualRounds: number;
    maxRounds: number | null;
};

type Participant = {
    odId: string;
    odIduserId: string;
    name: string | null;
    image: string | null;
    lat: number;
    lng: number;
    lastSeenAt: string;
};

type RouteDetailMapProps = {
    stops: Stop[];
    userPosition?: { lat: number; lng: number } | null;
    participants?: Participant[];
};

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
        },
    ],
};

// Colores para los avatares de participantes
const PARTICIPANT_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
];

export default function RouteDetailMap({ stops, userPosition, participants = [] }: RouteDetailMapProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    });

    const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

    // Calcular el centro y zoom para mostrar toda la ruta
    const mapCenter = useMemo(() => {
        if (stops.length === 0) return { lat: 40.4168, lng: -3.7038 }; // Madrid por defecto

        const avgLat = stops.reduce((sum, stop) => sum + stop.lat, 0) / stops.length;
        const avgLng = stops.reduce((sum, stop) => sum + stop.lng, 0) / stops.length;

        return { lat: avgLat, lng: avgLng };
    }, [stops]);

    // Determinar color del marcador según estado
    const getMarkerColor = (stop: Stop) => {
        if (stop.actualRounds >= stop.plannedRounds) {
            return "#10b981"; // Verde - completado
        } else if (stop.actualRounds > 0) {
            return "#f59e0b"; // Amarillo - en progreso
        }
        return "#6b7280"; // Gris - pendiente
    };

    // Crear SVG para marcador personalizado
    const createMarkerIcon = (number: number, color: string) => {
        const svg = `
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C8.954 0 0 8.954 0 20c0 11.046 20 30 20 30s20-18.954 20-30C40 8.954 31.046 0 20 0z"
              fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="20" cy="20" r="12" fill="#fff"/>
        <text x="20" y="25" font-size="14" font-weight="bold" text-anchor="middle" fill="${color}">
          ${number}
        </text>
      </svg>
    `;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    };

    // Crear SVG para avatar de participante
    const createParticipantMarker = (name: string | null, color: string, imageUrl: string | null) => {
        const initial = name ? name.charAt(0).toUpperCase() : "?";

        // Si tiene imagen, usamos un marcador con imagen
        if (imageUrl) {
            const svg = `
            <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <clipPath id="avatarClip">
                        <circle cx="22" cy="22" r="18"/>
                    </clipPath>
                </defs>
                <circle cx="22" cy="22" r="21" fill="${color}" stroke="#fff" stroke-width="3"/>
                <circle cx="22" cy="22" r="18" fill="#fff"/>
                <text x="22" y="28" font-size="16" font-weight="bold" text-anchor="middle" fill="${color}">${initial}</text>
            </svg>
            `;
            return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
        }

        // Sin imagen, solo inicial
        const svg = `
        <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
            <circle cx="22" cy="22" r="21" fill="${color}" stroke="#fff" stroke-width="3"/>
            <text x="22" y="28" font-size="18" font-weight="bold" text-anchor="middle" fill="#fff">${initial}</text>
        </svg>
        `;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    };

    // Abrir Google Maps para navegación
    const handleGetDirections = (stop: Stop) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`;
        window.open(url, "_blank");
    };

    // Centrar mapa en ubicación del usuario
    const handleCenterOnUser = () => {
        if (map && userPosition) {
            map.panTo(userPosition);
            map.setZoom(16);
        }
    };

    // Callback para DirectionsService
    const directionsCallback = useCallback((
        result: google.maps.DirectionsResult | null,
        status: google.maps.DirectionsStatus
    ) => {
        if (status === "OK" && result) {
            setDirectionsResponse(result);
        } else {
            console.error(`Error fetching directions: ${status}`);
        }
    }, []);

    // Resetear direcciones si cambian los stops
    useEffect(() => {
        setDirectionsResponse(null);
    }, [stops]);

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

    // Preparar datos para DirectionsService
    const origin = stops.length > 0 ? { lat: stops[0].lat, lng: stops[0].lng } : null;
    const destination = stops.length > 1 ? { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng } : null;
    const waypoints = stops.length > 2
        ? stops.slice(1, -1).map(stop => ({ location: { lat: stop.lat, lng: stop.lng }, stopover: true }))
        : [];

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={14}
                options={mapOptions}
                onLoad={(mapInstance) => setMap(mapInstance)}
            >
                {/* Servicio de Direcciones (Walking) */}
                {origin && destination && !directionsResponse && (
                    <DirectionsService
                        options={{
                            origin,
                            destination,
                            waypoints,
                            travelMode: google.maps.TravelMode.WALKING,
                        }}
                        callback={directionsCallback}
                    />
                )}

                {/* Renderizado de la ruta */}
                {directionsResponse && (
                    <DirectionsRenderer
                        options={{
                            directions: directionsResponse,
                            suppressMarkers: true, // Usamos nuestros propios marcadores
                            polylineOptions: {
                                strokeColor: "#f59e0b",
                                strokeOpacity: 0.8,
                                strokeWeight: 5,
                            }
                        }}
                    />
                )}

                {/* Marcadores de bares */}
                {stops.map((stop, index) => (
                    <Marker
                        key={stop.id}
                        position={{ lat: stop.lat, lng: stop.lng }}
                        icon={{
                            url: createMarkerIcon(index + 1, getMarkerColor(stop)),
                            scaledSize: new google.maps.Size(40, 50),
                            anchor: new google.maps.Point(20, 50),
                        }}
                        onClick={() => setSelectedStop(stop)}
                    />
                ))}

                {/* Marcador de posición del usuario */}
                {userPosition && (
                    <Marker
                        position={userPosition}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#3b82f6",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                        }}
                        title="Tu ubicación"
                    />
                )}

                {/* Marcadores de otros participantes (solo con ubicación válida) */}
                {participants
                    .filter((p) => p.lat !== 0 && p.lng !== 0 && p.lastSeenAt)
                    .map((participant, index) => (
                    <Marker
                        key={participant.odIduserId}
                        position={{ lat: participant.lat, lng: participant.lng }}
                        icon={{
                            url: createParticipantMarker(
                                participant.name,
                                PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length],
                                participant.image
                            ),
                            scaledSize: new google.maps.Size(44, 44),
                            anchor: new google.maps.Point(22, 22),
                        }}
                        title={participant.name || "Participante"}
                        zIndex={100 + index}
                    />
                ))}

                {/* Info Window */}
                {selectedStop && (
                    <InfoWindow
                        position={{ lat: selectedStop.lat, lng: selectedStop.lng }}
                        onCloseClick={() => setSelectedStop(null)}
                    >
                        <div className="p-2 max-w-xs">
                            <h3 className="font-bold text-base mb-1">{selectedStop.name}</h3>
                            {selectedStop.address && (
                                <p className="text-xs text-slate-600 mb-2">{selectedStop.address}</p>
                            )}
                            <div className="text-xs space-y-1 mb-3">
                                <p>
                                    <span className="font-medium">Rondas:</span> {selectedStop.actualRounds} /{" "}
                                    {selectedStop.plannedRounds}
                                </p>
                                {selectedStop.maxRounds && (
                                    <p>
                                        <span className="font-medium">Máximo:</span> {selectedStop.maxRounds}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => handleGetDirections(selectedStop)}
                                className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                🧭 Cómo llegar
                            </button>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            {/* Leyenda del mapa */}
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur rounded-lg p-2 shadow-md text-xs">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                    <span>Pendiente</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span>En progreso</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span>Completado</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span>Tu ubicacion</span>
                </div>
            </div>

            {/* Floating Action Button - Center on User */}
            {userPosition && (
                <button
                    onClick={handleCenterOnUser}
                    className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow active:scale-95"
                    title="Centrar en mi ubicación"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6 text-blue-600"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
}
