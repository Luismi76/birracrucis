"use client";

import { useState } from "react";
import RouteDetailMap from "@/components/RouteDetailMap";
import RouteDetailClient from "./RouteDetailClient";

type Stop = {
    id: string;
    name: string;
    address: string | null;
    lat: number;
    lng: number;
    plannedRounds: number;
    maxRounds: number | null;
    actualRounds: number;
};

type RouteDetailWrapperProps = {
    stops: Stop[];
};

export default function RouteDetailWrapper({ stops }: RouteDetailWrapperProps) {
    const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

    return (
        <>
            {/* Map */}
            <div className="h-1/2 md:h-2/3 relative">
                <RouteDetailMap stops={stops} userPosition={userPosition} />
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
                <div className="p-4">
                    <h2 className="text-lg font-semibold mb-3">Bares de la ruta</h2>
                    <RouteDetailClient stops={stops} onPositionChange={setUserPosition} />
                </div>
            </div>
        </>
    );
}
