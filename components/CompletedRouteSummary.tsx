"use client";

import { useState, useEffect } from "react";
import { Camera, Trophy, Share2, Users, Beer, MapPin, Clock, Star, Mail, CheckCircle } from "lucide-react";

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
    actualStartTime?: string | null;
    actualEndTime?: string | null;
};

type RouteStats = {
    totalBars: number;
    totalRounds: number;
    totalParticipants: number;
    duration: string;
    avgRoundsPerBar: number;
};

type ParticipantRanking = {
    id: string;
    name: string;
    image: string | null;
    drinks: number;
    rounds: number;
};

type BarRating = {
    stopId: string;
    stopName: string;
    avgRating: number;
    totalRatings: number;
};

function calculateDuration(startTime?: string | null, endTime?: string | null): string {
    if (!startTime || !endTime) return "-";

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();

    if (diffMs < 0) return "-";

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

export default function CompletedRouteSummary({
    routeId,
    routeName,
    routeDate,
    stops,
    participants,
    onViewPhotos,
    onViewRatings,
    onViewGroup,
    onShare,
    actualStartTime,
    actualEndTime,
}: CompletedRouteSummaryProps) {
    const [rankings, setRankings] = useState<ParticipantRanking[]>([]);
    const [barRatings, setBarRatings] = useState<BarRating[]>([]);
    const [loading, setLoading] = useState(true);
    const [emailSent, setEmailSent] = useState(false);

    const totalRounds = stops.reduce((sum, stop) => sum + stop.actualRounds, 0);

    const stats: RouteStats = {
        totalBars: stops.length,
        totalRounds,
        totalParticipants: participants.length,
        duration: calculateDuration(actualStartTime, actualEndTime),
        avgRoundsPerBar: stops.length > 0 ? Math.round((totalRounds / stops.length) * 10) / 10 : 0,
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rankingsRes, ratingsRes] = await Promise.all([
                    fetch(`/api/routes/${routeId}/rankings`),
                    fetch(`/api/routes/${routeId}/ratings/summary`)
                ]);

                if (rankingsRes.ok) {
                    const data = await rankingsRes.json();
                    if (data.ok && data.rankings) {
                        setRankings(data.rankings.slice(0, 3));
                    }
                }

                if (ratingsRes.ok) {
                    const data = await ratingsRes.json();
                    if (data.ok && data.ratings) {
                        setBarRatings(data.ratings.sort((a: BarRating, b: BarRating) => b.avgRating - a.avgRating).slice(0, 3));
                    }
                }

                setEmailSent(true);
            } catch (error) {
                console.error("Error loading summary data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [routeId]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });
    };

    const formatTime = (timeStr?: string | null) => {
        if (!timeStr) return "-";
        const date = new Date(timeStr);
        return date.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="p-4 space-y-4 pb-6">
            {/* Header de Celebracion */}
            <div className="text-center py-4 bg-gradient-to-b from-amber-50 to-white rounded-2xl">
                <div className="text-6xl mb-3 animate-bounce">🎉</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Ruta Completada!</h2>
                <p className="text-lg font-semibold text-amber-600">{routeName}</p>
                <p className="text-sm text-slate-500 mt-1">{formatDate(routeDate)}</p>

                {/* Horario */}
                {actualStartTime && actualEndTime && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(actualStartTime)} - {formatTime(actualEndTime)}</span>
                    </div>
                )}
            </div>

            {/* Email notification */}
            {emailSent && participants.filter(p => p.name).length > 0 && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Se ha enviado un resumen por email a los participantes</span>
                    <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />
                </div>
            )}

            {/* Grid de Estadisticas Principal */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700 uppercase">Bares</span>
                    </div>
                    <p className="text-3xl font-black text-amber-900">{stats.totalBars}</p>
                    <p className="text-xs text-amber-600 mt-1">visitados</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Beer className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-bold text-blue-700 uppercase">Rondas</span>
                    </div>
                    <p className="text-3xl font-black text-blue-900">{stats.totalRounds}</p>
                    <p className="text-xs text-blue-600 mt-1">{stats.avgRoundsPerBar} por bar</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span className="text-xs font-bold text-purple-700 uppercase">Grupo</span>
                    </div>
                    <p className="text-3xl font-black text-purple-900">{stats.totalParticipants}</p>
                    <p className="text-xs text-purple-600 mt-1">personas</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-5 h-5 text-green-600" />
                        <span className="text-xs font-bold text-green-700 uppercase">Duracion</span>
                    </div>
                    <p className="text-3xl font-black text-green-900">{stats.duration}</p>
                    <p className="text-xs text-green-600 mt-1">total</p>
                </div>
            </div>

            {/* Top Participantes */}
            {rankings.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-slate-800">Podio de Campeones</h3>
                    </div>
                    <div className="space-y-2">
                        {rankings.map((participant, index) => (
                            <div
                                key={participant.id}
                                className={`flex items-center gap-3 rounded-xl p-3 border ${
                                    index === 0
                                        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
                                        : 'bg-white border-slate-100'
                                }`}
                            >
                                <div className="text-2xl w-8 text-center">
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
                                    <p className={`font-bold truncate ${index === 0 ? 'text-amber-800' : 'text-slate-800'}`}>
                                        {participant.name || "Anonimo"}
                                    </p>
                                    <p className="text-xs text-slate-500">{participant.drinks} bebidas</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-black ${index === 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                                        {participant.rounds}
                                    </p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">rondas</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Mejores Bares */}
            {barRatings.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <h3 className="font-bold text-slate-800">Mejores Valorados</h3>
                    </div>
                    <div className="space-y-2">
                        {barRatings.map((bar, index) => (
                            <div
                                key={bar.stopId}
                                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-100"
                            >
                                <div className="text-lg font-black text-slate-300 w-6">
                                    #{index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 truncate">{bar.stopName}</p>
                                    <p className="text-xs text-slate-500">{bar.totalRatings} valoraciones</p>
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="font-bold text-yellow-700">{bar.avgRating.toFixed(1)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lista de Bares Visitados */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-slate-500" />
                    <h3 className="font-bold text-slate-800">Recorrido</h3>
                </div>
                <div className="space-y-1">
                    {stops.map((stop, index) => (
                        <div
                            key={stop.id}
                            className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
                        >
                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                                {index + 1}
                            </div>
                            <span className="flex-1 text-sm text-slate-700 truncate">{stop.name}</span>
                            <span className="text-xs text-slate-400">
                                {stop.actualRounds}/{stop.plannedRounds} rondas
                            </span>
                        </div>
                    ))}
                </div>
            </div>

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
                    <Star className="w-6 h-6 text-amber-600" />
                    <span className="text-sm font-bold text-slate-800">Valoraciones</span>
                </button>

                <button
                    onClick={onViewGroup}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-amber-300 hover:bg-amber-50 active:scale-95 transition-all"
                >
                    <Users className="w-6 h-6 text-purple-600" />
                    <span className="text-sm font-bold text-slate-800">Grupo</span>
                </button>

                <button
                    onClick={onShare}
                    disabled={!onShare}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl active:scale-95 transition-all ${
                        onShare
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    <Share2 className="w-6 h-6" />
                    <span className="text-sm font-bold">Compartir</span>
                </button>
            </div>

            {/* Footer motivacional */}
            <div className="text-center py-4">
                <p className="text-sm text-slate-400">Hasta la proxima aventura!</p>
                <p className="text-2xl mt-1">🍻</p>
            </div>

            {/* Botón para volver al inicio */}
            <div className="pt-2 pb-4">
                <a
                    href="/routes"
                    className="block w-full py-4 bg-slate-800 text-white text-center font-bold rounded-2xl hover:bg-slate-700 active:scale-[0.98] transition-all"
                >
                    ← Volver a Mis Rutas
                </a>
            </div>
        </div>
    );
}
