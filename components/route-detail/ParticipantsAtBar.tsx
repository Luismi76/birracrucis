"use client";

import { MapPin, Navigation } from "lucide-react";

type Participant = {
    id: string;
    name: string | null;
    image: string | null;
    distance: number; // en metros
    isAtBar: boolean;
};

type ParticipantsAtBarProps = {
    participants: Participant[];
    barName: string;
};

export default function ParticipantsAtBar({
    participants,
    barName,
}: ParticipantsAtBarProps) {
    const atBar = participants.filter((p) => p.isAtBar);
    const onTheWay = participants.filter((p) => !p.isAtBar);

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    En {barName}
                </h3>
                <span className="text-sm font-bold text-slate-600">
                    {atBar.length}/{participants.length}
                </span>
            </div>

            {/* Participantes en el bar */}
            {atBar.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wide">
                        🟢 Aquí ({atBar.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {atBar.map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1"
                            >
                                {p.image ? (
                                    <img
                                        src={p.image}
                                        alt={p.name || "Usuario"}
                                        className="w-5 h-5 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                                        {p.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                )}
                                <span className="text-xs font-semibold text-green-800">
                                    {p.name || "Invitado"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Participantes de camino */}
            {onTheWay.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">
                        🔴 De camino ({onTheWay.length})
                    </p>
                    <div className="space-y-1">
                        {onTheWay.map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2"
                            >
                                <div className="flex items-center gap-2">
                                    {p.image ? (
                                        <img
                                            src={p.image}
                                            alt={p.name || "Usuario"}
                                            className="w-5 h-5 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                                            {p.name?.charAt(0).toUpperCase() || "?"}
                                        </div>
                                    )}
                                    <span className="text-xs font-semibold text-orange-800">
                                        {p.name || "Invitado"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-orange-600">
                                    <Navigation className="w-3 h-3" />
                                    <span>{p.distance}m</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
