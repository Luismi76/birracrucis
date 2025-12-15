"use client";

import { GoogleMap, Marker, useLoadScript, OverlayView } from "@react-google-maps/api";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";

type PublicRoute = {
    id: string;
    name: string;
    description: string | null;
    creator: {
        name: string | null;
        image: string | null;
    } | null;
    stops?: {
        address: string;
        lat?: number;
        lng?: number;
    }[];
    _count: {
        stops: number;
        participants: number;
    };
};

type DiscoveryMapProps = {
    routes: PublicRoute[];
    onRouteSelect: (routeId: string) => void;
    searchSignature?: string;
    onResetFilter?: () => void;
};

// Map Settings
const mapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "1rem",
};

const defaultCenter = { lat: 40.4168, lng: -3.7038 }; // Madrid

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    gestureHandling: "cooperative", // Helps with scroll interactions and warnings
    styles: [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
        },
    ],
};

// Clustering Constants
const CLUSTER_RADIUS_METERS_LOW_ZOOM = 40000; // ~40km for Country View
const CLUSTER_RADIUS_METERS_MED_ZOOM = 2000;   // ~2km for City View

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance in m
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export default function DiscoveryMap({ routes, onRouteSelect, searchSignature, onResetFilter }: DiscoveryMapProps) {
    const { isLoaded, loadError } = useLoadScript({
        id: "google-maps-script",
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [zoom, setZoom] = useState(5); // Start zoomed out (Spain/Peninsula View)
    // Remove unused selectedCluster state if not used for Modal, or keep if future use
    // const [selectedCluster, setSelectedCluster] = useState<{ lat: number, lng: number, count: number } | null>(null);

    const validRoutes = useMemo(() => {
        return routes;
    }, [routes]);

    const hasFittedBounds = useRef(false);

    // 1. Reset bounds lock when search changes
    useEffect(() => {
        hasFittedBounds.current = false;
    }, [searchSignature]);

    // 2. Auto-fit bounds logic
    useEffect(() => {
        if (!map) return;

        // CHECK: If search became empty (user cleared it), reset to general view
        if ((!searchSignature || searchSignature.trim() === "") && hasFittedBounds.current === false) {
            map.panTo(defaultCenter);
            map.setZoom(5);
            hasFittedBounds.current = true;
            return;
        }

        if (validRoutes.length > 0 && !hasFittedBounds.current) {

            const isSearchActive = searchSignature && searchSignature.trim().length > 0;

            // Slight delay to ensure map is ready
            const timer = setTimeout(() => {
                const bounds = new google.maps.LatLngBounds();
                let hasPoints = false;

                validRoutes.forEach(r => {
                    const stop = r.stops?.[0] as any;
                    if (stop && typeof stop.lat === 'number' && typeof stop.lng === 'number') {
                        bounds.extend({ lat: stop.lat, lng: stop.lng });
                        hasPoints = true;
                    }
                });

                if (hasPoints) {
                    google.maps.event.trigger(map, 'resize');
                    hasFittedBounds.current = true;

                    // SMART FIT LOGIC:
                    // 1. Calculate the perfect view for ALL routes.
                    map.fitBounds(bounds);

                    // 2. CONSTRAINT: If NOT searching (Initial Load), prevent Zoom In.
                    // This satisfies "Show all routes" (FitBounds) AND "Don't lock me in" (Zoom Cap).
                    // If routes are only in Sevilla, fitBounds goes to Zoom 13. We force it back to 6.
                    // If routes are in NY and Madrid, fitBounds goes to Zoom 2. We keep it as is.
                    if (!isSearchActive) {
                        const listener = google.maps.event.addListenerOnce(map, "idle", () => {
                            const currentZoom = map.getZoom();
                            if (currentZoom && currentZoom > 6) {
                                map.setZoom(6);
                                // Optional: Center might be correct (Sevilla), but View is Regional.
                            }
                        });
                    } else {
                        // If searching specific term, allow closer zoom (e.g. 13)
                        if (validRoutes.length === 1) {
                            map.setZoom(13);
                        }
                    }
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [map, validRoutes, searchSignature]);


    // 3. Clustering Logic
    const clusters = useMemo(() => {
        const radius = zoom < 8 ? CLUSTER_RADIUS_METERS_LOW_ZOOM : zoom < 13 ? CLUSTER_RADIUS_METERS_MED_ZOOM : 0;
        if (radius === 0) return [];

        const groups: { lat: number, lng: number, members: PublicRoute[] }[] = [];

        validRoutes.forEach(r => {
            const stop = r.stops?.[0] as any;
            if (!stop || typeof stop.lat !== 'number') return;

            let added = false;
            for (const g of groups) {
                if (getDistanceFromLatLonInM(stop.lat, stop.lng, g.lat, g.lng) <= radius) {
                    g.members.push(r);
                    const totalLat = g.members.reduce((sum, m) => sum + ((m.stops?.[0] as any)?.lat || 0), 0);
                    const totalLng = g.members.reduce((sum, m) => sum + ((m.stops?.[0] as any)?.lng || 0), 0);
                    g.lat = totalLat / g.members.length;
                    g.lng = totalLng / g.members.length;
                    added = true;
                    break;
                }
            }
            if (!added) {
                groups.push({ lat: stop.lat, lng: stop.lng, members: [r] });
            }
        });

        return groups;
    }, [validRoutes, zoom]);

    const showIndividualMarkers = zoom >= 13;

    if (loadError) return <div className="p-4 text-center">Error cargando mapa</div>;
    if (!isLoaded) return <div className="p-4 text-center">Cargando mapa...</div>;

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={zoom}
                options={mapOptions}
                onLoad={(m) => setMap(m)}
                onZoomChanged={() => map && setZoom(map.getZoom() || 6)}
                onClick={() => {
                    // map click
                }}
            >
                {/* CLUSTERS */}
                {!showIndividualMarkers && clusters.map((cluster, i) => (
                    <OverlayView
                        key={`cluster-${i}`}
                        position={{ lat: cluster.lat, lng: cluster.lng }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height / 2) })}
                    >
                        <div
                            className="flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (cluster.members.length === 1) {
                                    onRouteSelect(cluster.members[0].id);
                                    return;
                                }
                                map?.panTo({ lat: cluster.lat, lng: cluster.lng });
                                const targetZoom = zoom < 8 ? 10 : 15;
                                map?.setZoom(targetZoom);
                            }}
                        >
                            <div className={`
                            flex items-center justify-center rounded-full shadow-xl border-4 border-white text-white font-bold
                            ${cluster.members.length > 10 ? 'w-16 h-16 bg-purple-600 text-xl' : 'w-12 h-12 bg-amber-500 text-base'}
                        `}>
                                {cluster.members.length}
                            </div>
                            {zoom >= 8 && (
                                <div className="mt-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-slate-700 shadow-sm">
                                    {cluster.members.length} plan{cluster.members.length !== 1 ? 'es' : ''}
                                </div>
                            )}
                        </div>
                    </OverlayView>
                ))}

                {/* MARKERS */}
                {showIndividualMarkers && validRoutes.map((route) => {
                    const stop = route.stops?.[0] as any;
                    if (!stop || typeof stop.lat !== 'number') return null;

                    return (
                        <Marker
                            key={route.id}
                            position={{ lat: stop.lat, lng: stop.lng }}
                            icon={{
                                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="20" cy="20" r="18" fill="#fff" stroke="#9333ea" stroke-width="2"/>
                                    <text x="20" y="26" font-size="20" text-anchor="middle">🍺</text>
                                </svg>
                            `)}`,
                                scaledSize: new google.maps.Size(40, 40),
                            }}
                            onClick={(e) => {
                                e.stop();
                                onRouteSelect(route.id);
                            }}
                        />
                    );
                })}
            </GoogleMap>

            {/* Smart Back Button */}
            {(zoom > 7 || (searchSignature && searchSignature.length > 0)) && (
                <button
                    onClick={() => {
                        if (searchSignature && searchSignature.length > 0 && onResetFilter) {
                            onResetFilter();
                        }

                        // Always reset to Madrid/Zoom 5 (Passive)
                        map?.panTo(defaultCenter);
                        map?.setZoom(5);
                    }}
                    className="absolute top-4 left-4 bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 border border-slate-200 z-10"
                >
                    {(searchSignature && searchSignature.length > 0) ? (
                        <><span>✖️</span> Borrar búsqueda</>
                    ) : (
                        <><span>🔙</span> Ver todo</>
                    )}
                </button>
            )}
        </div>
    );
}
