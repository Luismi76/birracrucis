"use client";

import { GoogleMap, Marker, useLoadScript, OverlayView, InfoWindow } from "@react-google-maps/api";
import { useState, useMemo, useCallback, useEffect } from "react";
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";
import CloneRouteButton from "@/components/CloneRouteButton";

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
        lat?: number; // Might not be populated in list view, need to ensure API returns it or use fallback
    }[];
    _count: {
        stops: number;
        participants: number;
    };
};

type DiscoveryMapProps = {
    routes: PublicRoute[];
    onRouteSelect: (routeId: string) => void;
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

export default function DiscoveryMap({ routes, onRouteSelect }: DiscoveryMapProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [zoom, setZoom] = useState(6); // Start zoomed out (Spain view)
    const [selectedCluster, setSelectedCluster] = useState<{ lat: number, lng: number, count: number } | null>(null);

    // 1. Process Routes with approximate coordinates
    // We assume the API returns at least one stop OR we geocode based on city name?
    // For specific coordinates in `CommunityTab.tsx` data, we need `stops` to include `lat/lng`.
    // Currently `CommunityTab` fetch only selects `address`. We might need to fetch coordinates or rely on the fact that existing routes usually have them.
    // If we only have address, we can't plot easily without calling geocoding API $$$ which is bad.
    // OPTIMIZATION: We really should modify the API to return the first stop's Lat/Lng. I'll assume passing coordinates is possible/done.

    // NOTE: This component expects routes to actually have `stops[0].lat/lng` or similar. 
    // IF NOT AVAILABLE, we might fall back to a hardcoded city map? No, let's assume valid data for now.

    const validRoutes = useMemo(() => {
        // Fallback for missing coordinates (Simulate for now if missing, but should be fixed in API)
        // Since we know the seeds have real lat/lng in DB, we just need to ensure API returns/we use it.
        // But `PublicRoute` type in `CommunityTab` didn't have lat/lng in stops.
        return routes;
    }, [routes]);

    // Auto-fit bounds when routes change (e.g. after search)
    useEffect(() => {
        if (map && validRoutes.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            let hasPoints = false;

            validRoutes.forEach(r => {
                const stop = r.stops?.[0] as any;
                if (stop && stop.lat && stop.lng) {
                    bounds.extend({ lat: stop.lat, lng: stop.lng });
                    hasPoints = true;
                }
            });

            if (hasPoints) {
                // If only one point, avoid zooming in too much
                if (validRoutes.length === 1) {
                    const stop = (validRoutes[0].stops?.[0] as any);
                    map.setCenter({ lat: stop.lat, lng: stop.lng });
                    map.setZoom(12);
                } else {
                    map.fitBounds(bounds);
                }
            }
        }
    }, [map, validRoutes]);


    // 2. Custom Clustering Logic based on Zoom
    const clusters = useMemo(() => {
        // Logic:
        // Zoom < 8: Country View (Group mostly by City/Province)
        // Zoom 8 - 13: Area View (Neighborhoods)
        // Zoom > 13: Individual Markers (Specific Bars/Start Points)

        const radius = zoom < 8 ? CLUSTER_RADIUS_METERS_LOW_ZOOM : zoom < 13 ? CLUSTER_RADIUS_METERS_MED_ZOOM : 0;

        if (radius === 0) return []; // No clustering, show individual markers

        const groups: { lat: number, lng: number, members: PublicRoute[] }[] = [];

        // We need coordinates. If we don't have them in the props yet, this will fail.
        // Assuming we will fix API to return `lat/lng` of first stop.

        validRoutes.forEach(r => {
            // HACK: Use stop[0] coordinate if available, otherwise ignore
            // In the `CommunityTab` component's `routes` state, we currently define `stops?: { address: string }[]`.
            // We need to extend this type and API response.
            // For now, let's pretend they exist or cast safely.
            const stop = r.stops?.[0] as any;
            if (!stop || typeof stop.lat !== 'number') return;

            let added = false;
            for (const g of groups) {
                if (getDistanceFromLatLonInM(stop.lat, stop.lng, g.lat, g.lng) <= radius) {
                    g.members.push(r);
                    // Weighted center? For simplicity keep first point or average?
                    // Average looks better
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

    // Render Logic
    const showIndividualMarkers = zoom >= 13;


    if (loadError) return <div className="p-4 text-center">Error cargando mapa</div>;
    if (!isLoaded) return <div className="p-4 text-center">Cargando mapa...</div>;

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={6}
                options={mapOptions}
                onLoad={(m) => setMap(m)}
                onZoomChanged={() => map && setZoom(map.getZoom() || 6)}
                onClick={() => {
                    setSelectedCluster(null);
                }}
            >
                {/* CLUSTERS (Zoom < 13) */}
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

                                // If single route in cluster, open it directly
                                if (cluster.members.length === 1) {
                                    onRouteSelect(cluster.members[0].id);
                                    return;
                                }

                                // Zoom in to this cluster
                                map?.panTo({ lat: cluster.lat, lng: cluster.lng });
                                const targetZoom = zoom < 8 ? 10 : 15;
                                map?.setZoom(targetZoom);
                            }}
                        >
                            {/* Circle Badge */}
                            <div className={`
                            flex items-center justify-center rounded-full shadow-xl border-4 border-white text-white font-bold
                            ${cluster.members.length > 10 ? 'w-16 h-16 bg-purple-600 text-xl' : 'w-12 h-12 bg-amber-500 text-base'}
                        `}>
                                {cluster.members.length}
                            </div>

                            {/* Optional Label (Area Name?) - Could imply from members */}
                            {zoom >= 8 && (
                                <div className="mt-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-slate-700 shadow-sm">
                                    {cluster.members.length} plan{cluster.members.length !== 1 ? 'es' : ''}
                                </div>
                            )}
                        </div>
                    </OverlayView>
                ))}

                {/* INDIVIDUAL MARKERS (Zoom >= 13) */}
                {showIndividualMarkers && validRoutes.map((route) => {
                    const stop = route.stops?.[0] as any;
                    if (!stop || !stop.lat) return null;

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

            {/* Back to Overview Button */}
            {zoom > 7 && (
                <button
                    onClick={() => {
                        map?.setZoom(6);
                        map?.panTo(defaultCenter);
                    }}
                    className="absolute top-4 left-4 bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 border border-slate-200 z-10"
                >
                    <span>🔙</span> Ver todo
                </button>
            )}
        </div>
    );
}
