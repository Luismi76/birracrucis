"use client";

import { GoogleMap, Marker, DirectionsRenderer, DirectionsService, InfoWindow, useLoadScript, OverlayView } from "@react-google-maps/api";
import { useState, useMemo, useCallback, useEffect } from "react";
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";

type Stop = {
    id: string;
    name: string;
    address: string | null;
    lat: number;
    lng: number;
    plannedRounds: number;
    actualRounds: number;
    maxRounds: number | null;
    googlePlaceId?: string | null;
};

type Participant = {
    odId: string;
    id: string; // Ensure id is present
    name: string | null;
    image: string | null;
    lat: number;
    lng: number;
    lastSeenAt: string | null;
    isGuest?: boolean;
};

type RouteDetailMapProps = {
    stops: Stop[];
    userPosition?: { lat: number; lng: number } | null;
    participants?: Participant[];
    onParticipantClick?: (participant: Participant) => void;
    isRouteComplete?: boolean; // Si es true, tooltips siempre visibles
    creatorId?: string | null;
    focusLocation?: { lat: number; lng: number } | null; // Si cambia, centra el mapa en esta ubicación
};

function isValidCoordinate(lat: number, lng: number) {
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
}

// Componente para tooltip fijo del bar
function BarTooltip({ stop, index }: { stop: Stop; index: number }) {
    const [placeDetails, setPlaceDetails] = useState<{
        photo?: string;
        rating?: number;
    } | null>(null);

    useEffect(() => {
        if (!stop.googlePlaceId) return;

        const service = new google.maps.places.PlacesService(document.createElement('div'));
        service.getDetails(
            {
                placeId: stop.googlePlaceId,
                fields: ['photos', 'rating']
            },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    setPlaceDetails({
                        photo: place.photos?.[0]?.getUrl({ maxWidth: 80, maxHeight: 60 }),
                        rating: place.rating
                    });
                }
            }
        );
    }, [stop.googlePlaceId]);

    const getStatusColor = () => {
        if (stop.actualRounds >= stop.plannedRounds) return "bg-green-500";
        if (stop.actualRounds > 0) return "bg-amber-500";
        return "bg-slate-400";
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-2 min-w-[140px] max-w-[180px] border-2 border-slate-200">
            {/* Número del bar */}
            <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full ${getStatusColor()} text-white flex items-center justify-center text-xs font-bold border-2 border-white`}>
                {index + 1}
            </div>

            {/* Imagen de Google Places */}
            {placeDetails?.photo && (
                <img
                    src={placeDetails.photo}
                    alt={stop.name}
                    className="w-full h-14 object-cover rounded mb-1"
                />
            )}

            {/* Nombre del bar */}
            <h4 className="font-bold text-xs text-slate-800 truncate mb-1">
                {stop.name}
            </h4>

            {/* Rating */}
            {placeDetails?.rating && (
                <div className="flex items-center gap-1 mb-1">
                    <span className="text-amber-500 text-xs">⭐</span>
                    <span className="text-xs font-semibold text-slate-700">
                        {placeDetails.rating.toFixed(1)}
                    </span>
                </div>
            )}

            {/* Rondas */}
            <div className="text-[10px] text-slate-600">
                <span className="font-semibold">{stop.actualRounds}</span>
                <span className="text-slate-400">/{stop.plannedRounds}</span>
                <span className="ml-1">rondas</span>
            </div>
        </div>
    );
}

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

const CLUSTER_RADIUS_METERS = 10;

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in m
    return d * 1000;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

const PARTICIPANT_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export default function RouteDetailMap({ stops, userPosition, participants = [], onParticipantClick, isRouteComplete = false, creatorId, focusLocation }: RouteDetailMapProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
    const [hoveredStopId, setHoveredStopId] = useState<string | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [userHasInteracted, setUserHasInteracted] = useState(false);

    // Calcular el centro inicial para mostrar toda la ruta
    const initialCenter = useMemo(() => {
        if (stops.length === 0) {
            // 1. Priorizar centro de participantes (donde está el grupo/creador)
            const activeParticipants = participants.filter(p => isValidCoordinate(p.lat, p.lng));
            if (activeParticipants.length > 0) {
                const avgLat = activeParticipants.reduce((sum, p) => sum + p.lat, 0) / activeParticipants.length;
                const avgLng = activeParticipants.reduce((sum, p) => sum + p.lng, 0) / activeParticipants.length;
                return { lat: avgLat, lng: avgLng };
            }

            // 2. Si no hay participantes activos, usar ubicación del usuario (si es válida)
            if (userPosition && isValidCoordinate(userPosition.lat, userPosition.lng)) {
                return userPosition;
            }

            // Fallback: Madrid (evita mapa gris)
            return { lat: 40.4168, lng: -3.7038 };
        }

        const validStops = stops.filter(s => isValidCoordinate(s.lat, s.lng));
        if (validStops.length === 0) return { lat: 40.4168, lng: -3.7038 };

        const avgLat = validStops.reduce((sum, stop) => sum + stop.lat, 0) / validStops.length;
        const avgLng = validStops.reduce((sum, stop) => sum + stop.lng, 0) / validStops.length;

        return { lat: avgLat, lng: avgLng };
    }, [stops, userPosition, participants]);

    // Pan to user position or participants if discovery mode (no stops) and position loads
    useEffect(() => {
        if (stops.length > 0 || userHasInteracted || !map) return;

        // Misma lógica de prioridad que initialCenter
        const activeParticipants = participants.filter(p => isValidCoordinate(p.lat, p.lng));
        if (activeParticipants.length > 0) {
            const avgLat = activeParticipants.reduce((sum, p) => sum + p.lat, 0) / activeParticipants.length;
            const avgLng = activeParticipants.reduce((sum, p) => sum + p.lng, 0) / activeParticipants.length;
            map.panTo({ lat: avgLat, lng: avgLng });
            map.setZoom(15);
            return;
        }

        if (userPosition && isValidCoordinate(userPosition.lat, userPosition.lng)) {
            map.panTo(userPosition);
            map.setZoom(16);
        }
    }, [stops.length, userPosition, map, userHasInteracted, participants]);

    // Centrar mapa cuando focusLocation cambie (ej: "Ver en mapa" del próximo bar)
    useEffect(() => {
        if (!map || !focusLocation) return;
        if (!isValidCoordinate(focusLocation.lat, focusLocation.lng)) return;

        map.panTo(focusLocation);
        map.setZoom(17);
    }, [map, focusLocation]);

    // Estado para controlar el overlay de "Buscando..."
    const [showLocatingOverlay, setShowLocatingOverlay] = useState(true);

    // Ocultar overlay si encontramos ubicación válida (usuario o participantes) o si hay stops
    useEffect(() => {
        if (stops.length > 0) {
            setShowLocatingOverlay(false);
            return;
        }

        const validUserPos = userPosition && isValidCoordinate(userPosition.lat, userPosition.lng);
        const hasValidParticipants = participants.some(p => isValidCoordinate(p.lat, p.lng));

        if (validUserPos || hasValidParticipants) {
            setShowLocatingOverlay(false);
        }
    }, [userPosition, stops.length, participants]);

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


    // Agrupamiento simple (Clustering)
    const clusters = useMemo(() => {
        const activeParticipants = participants.filter(p => p.lat !== 0 && p.lng !== 0 && p.lastSeenAt);
        const grouped: { lat: number, lng: number, members: Participant[] }[] = [];

        activeParticipants.forEach(p => {
            let added = false;
            for (const group of grouped) {
                if (getDistanceFromLatLonInM(p.lat, p.lng, group.lat, group.lng) <= CLUSTER_RADIUS_METERS) {
                    group.members.push(p);
                    // Recalcular centro del grupo
                    group.lat = group.members.reduce((sum, m) => sum + m.lat, 0) / group.members.length;
                    group.lng = group.members.reduce((sum, m) => sum + m.lng, 0) / group.members.length;
                    added = true;
                    break;
                }
            }
            if (!added) {
                grouped.push({ lat: p.lat, lng: p.lng, members: [p] });
            }
        });

        return grouped;
    }, [participants]);

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
            {/* Overlay: Buscando ubicación en Modo Aventura */}
            {stops.length === 0 && !loadError && showLocatingOverlay && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm p-4 text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="font-bold text-slate-700 animate-pulse">Buscando tu ubicación...</p>
                    <p className="text-xs text-slate-500 mt-2 mb-6">Estamos centrando el mapa en ti o en los participantes 🛰️</p>
                    <button
                        onClick={() => setShowLocatingOverlay(false)}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-600 font-medium shadow-sm hover:bg-slate-50"
                    >
                        Cancelar y ver mapa manual
                    </button>
                    {participants.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-4">
                            Hay {participants.length} participantes activos en el mapa.
                        </p>
                    )}
                </div>
            )}

            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={userHasInteracted ? undefined : initialCenter}
                zoom={14}
                options={mapOptions}
                onLoad={(mapInstance) => setMap(mapInstance)}
                onDragStart={() => setUserHasInteracted(true)}
                onZoomChanged={() => setUserHasInteracted(true)}
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
                        title={`${stop.name} - Rondas: ${stop.actualRounds}/${stop.plannedRounds}`}
                        onClick={() => setSelectedStop(stop)}
                        onMouseOver={() => setHoveredStopId(stop.id)}
                        onMouseOut={() => setHoveredStopId(null)}
                    />
                ))}

                {/* Tooltips de bares (siempre visibles si ruta completada, solo hover si activa) */}
                {stops
                    .filter(stop => isRouteComplete || stop.id === hoveredStopId)
                    .map((stop, index) => {
                        const stopIndex = stops.findIndex(s => s.id === stop.id);
                        return (
                            <OverlayView
                                key={`tooltip-${stop.id}`}
                                position={{ lat: stop.lat, lng: stop.lng }}
                                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                getPixelPositionOffset={(width, height) => ({
                                    x: -(width / 2),
                                    y: -height - 60, // Posicionar arriba del marcador
                                })}
                            >
                                <div
                                    onClick={() => setSelectedStop(stop)}
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredStopId(stop.id)}
                                    onMouseLeave={() => setHoveredStopId(null)}
                                >
                                    <BarTooltip stop={stop} index={stopIndex} />
                                </div>
                            </OverlayView>
                        );
                    })}

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

                {/* Marcadores de participantes (OverlayView para soporte de avatares) */}
                {clusters.map((cluster, i) => {
                    const isGroup = cluster.members.length > 1;
                    const firstMember = cluster.members[0];

                    return (
                        <OverlayView
                            key={isGroup ? `cluster-${i}` : `participant-${firstMember.id}`}
                            position={{ lat: cluster.lat, lng: cluster.lng }}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                            getPixelPositionOffset={(width, height) => ({
                                x: -(width / 2),
                                y: -(height / 2),
                            })}
                        >
                            <div
                                className={`relative flex items-center justify-center rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 active:scale-95 ${isGroup ? "w-11 h-11 bg-amber-500 text-white" : "w-11 h-11 bg-white"
                                    }`}
                                style={{
                                    border: isGroup ? "3px solid white" : `3px solid ${PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length]}`,
                                    zIndex: isGroup ? 200 : 100 + i // Ensure consistent z-index type
                                }}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent map click
                                    if (isGroup) {
                                        map?.panTo({ lat: cluster.lat, lng: cluster.lng });
                                        map?.setZoom((map.getZoom() || 14) + 2);
                                    }
                                }}
                            >
                                {isGroup ? (
                                    <span className="font-bold text-sm">+{cluster.members.length}</span>
                                ) : (
                                    <>
                                        {firstMember.image ? (
                                            <img
                                                src={firstMember.image}
                                                alt={firstMember.name || "User"}
                                                className="w-full h-full rounded-full object-cover p-[2px]"
                                            />
                                        ) : (
                                            <span
                                                className="font-bold text-lg"
                                                style={{ color: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length] }}
                                            >
                                                {firstMember.name ? firstMember.name.charAt(0).toUpperCase() : "?"}
                                            </span>
                                        )}
                                    </>
                                )}

                                {/* Etiqueta de nombre al hacer hover (opcional, simplificado) */}
                                {!isGroup && (
                                    <div className="absolute -bottom-6 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                                        {firstMember.name}
                                    </div>
                                )}
                            </div>
                        </OverlayView>
                    );
                })}

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
