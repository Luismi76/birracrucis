"use client";

import { Clock, Footprints, Beer } from "lucide-react";

interface CompactRouteSummaryProps {
    selectedBarsCount: number;
    routeDistance: number | null;
    totalTimes: { totalStayTime: number; walkTime: number; total: number };
    formatDistance: (meters: number) => string;
}

export default function CompactRouteSummary({
    selectedBarsCount,
    routeDistance,
    totalTimes,
    formatDistance,
}: CompactRouteSummaryProps) {
    if (selectedBarsCount === 0) return null;

    return (
        <div className="bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm rounded-full px-4 py-2 flex items-center gap-4 text-xs md:text-sm whitespace-nowrap overflow-x-auto mx-4 md:mx-0">
            <div className="flex items-center gap-1.5 text-slate-700">
                <Beer className="w-4 h-4 text-amber-500" />
                <span className="font-bold">{selectedBarsCount}</span>
                <span className="hidden sm:inline">bares</span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center gap-1.5 text-slate-700">
                <Footprints className="w-4 h-4 text-blue-500" />
                <span className="font-bold">
                    {routeDistance !== null ? formatDistance(routeDistance) : "0m"}
                </span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center gap-1.5 text-slate-700">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="font-bold">
                    {Math.floor(totalTimes.total / 60)}h {totalTimes.total % 60}m
                </span>
            </div>
        </div>
    );
}
