"use client";

import { useState, useEffect } from "react";
import { Camera, Trophy, FileText, Share2, Users, Beer, MapPin, Clock } from "lucide-react";

type Stop = {
    id: string;
    name: string;
    actualRounds: number;
    plannedRounds: number;
};

type Participant = {
    id: string;
    name: string | null;
    image: string | null;
};

type CompletedRouteSummaryProps = {
    routeId: string;
    routeName: string;
    routeDate: string;
    stops: Stop[];
    participants: Participant[];
    onViewPhotos: () => void;
    onViewRatings: () => void;
    onViewGroup: () => void;
    onExportPDF?: () => void;
    onShare?: () => void;
};

type RouteStats = {
    totalBars: number;
    totalRounds: number;
    totalParticipants: number;
    duration: string;
};

type ParticipantRanking = {
    id: string;
    name: string;
    image: string | null;
    drinks: number;
    rounds: number;
};

export default function CompletedRouteSummary({
    routeId,
    routeName,
    routeDate,
    stops,
    participants,
    onViewPhotos,
    onViewRatings,
    onViewGroup,
    onExportPDF,
    onShare,
}: CompletedRouteSummaryProps) {
    const [rankings, setRankings] = useState<ParticipantRanking[]>([]);
    const [loading, setLoading] = useState(true);

    // Calcular estadísticas
    const stats: RouteStats = {
        totalBars: stops.length,
        totalRounds: stops.reduce((sum, stop) => sum + stop.actualRounds, 0),
        totalParticipants: participants.length,
        duration: "2h 30m", // TODO: Calcular duración real
    };

    // Cargar rankings
    useEffect(() => {
        const fetchRankings = async () => {
            try {
                const res = await fetch(`/api/routes/${routeId}/rankings`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.ok && data.rankings) {
                        setRankings(data.rankings.slice(0, 3)); // Top 3
                    }
                }
            } catch (error) {
                console.error("Error loading rankings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRankings();
    }, [routeId]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });
    };

    return (
        <div className="p-4 space-y-4 pb-6">
            {/* Header de Celebración */}
            <div className="text-center py-4">
                <div className="text-6xl mb-3 animate-bounce">🎉</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">¡Ruta Completada!</h2>
                <p className="text-lg font-semibold text-amber-600">{routeName}</p>
                <p className="text-sm text-slate-500 mt-1">{formatDate(routeDate)}</p>
            </div>

            {/* Grid de Estadísticas */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700 uppercase">Bares</span>
                    </div>
                    <p className="text-3xl font-black text-amber-900">{stats.totalBars}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Beer className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-bold text-blue-700 uppercase">Rondas</span>
                    </div>
                    <p className="text-3xl font-black text-blue-900">{stats.totalRounds}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span className="text-xs font-bold text-purple-700 uppercase">Personas</span>
                    </div>
                    <p className="text-3xl font-black text-purple-900">{stats.totalParticipants}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-5 h-5 text-green-600" />
                        <span className="text-xs font-bold text-green-700 uppercase">Duración</span>
                    </div>
                    <p className="text-3xl font-black text-green-900">{stats.duration}</p>
                </div>
            </div>

            {/* Top Participantes */}
            {rankings.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-slate-800">Top Participantes</h3>
                    </div>
                    <div className="space-y-2">
                        {rankings.map((participant, index) => (
                            <div
                                key={participant.id}
                                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-100"
                            >
                                <div className="text-2xl font-black text-slate-300 w-6">
                                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                                </div>
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-200 flex-none">
                                    {participant.image ? (
                                        <img src={participant.image} alt={participant.name || ""} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                                            {(participant.name || "?").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 truncate">{participant.name || "Anónimo"}</p>
                                    <p className="text-xs text-slate-500">{participant.drinks} bebidas</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-amber-600">{participant.rounds}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">rondas</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                    onClick={onViewPhotos}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-amber-300 hover:bg-amber-50 active:scale-95 transition-all"
                >
                    <Camera className="w-6 h-6 text-slate-700" />
                    <span className="text-sm font-bold text-slate-800">Fotos</span>
                </button>

                <button
                    onClick={onViewRatings}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-amber-300 hover:bg-amber-50 active:scale-95 transition-all"
                >
                    <Trophy className="w-6 h-6 text-amber-600" />
                    <span className="text-sm font-bold text-slate-800">Valoraciones</span>
                </button>

                <button
                    onClick={onViewGroup}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-amber-300 hover:bg-amber-50 active:scale-95 transition-all"
                >
                    <Users className="w-6 h-6 text-purple-600" />
                    <span className="text-sm font-bold text-slate-800">Grupo</span>
                </button>

                {onShare && (
                    <button
                        onClick={onShare}
                        className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all shadow-lg"
                    >
                        <Share2 className="w-6 h-6" />
                        <span className="text-sm font-bold">Compartir</span>
                    </button>
                )}
            </div>

            {/* Botón Exportar PDF (si está disponible) */}
            {onExportPDF && (
                <button
                    onClick={onExportPDF}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 border-2 border-slate-200 rounded-2xl hover:bg-slate-200 active:scale-95 transition-all text-slate-700 font-bold"
                >
                    <FileText className="w-5 h-5" />
                    <span>Exportar Resumen PDF</span>
                </button>
            )}
        </div>
    );
}
