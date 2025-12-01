"use client";

import PhotoCapture from "@/components/PhotoCapture";
import NudgeButton from "@/components/NudgeButton";
import SkipVoteButton from "@/components/SkipVoteButton";
import DrinkCounter from "./DrinkCounter";

type Stop = {
    id: string;
    name: string;
    address: string | null;
    lat: number;
    lng: number;
    plannedRounds: number;
};

type CurrentBarCardProps = {
    stop: Stop;
    routeId: string;
    routeName: string;
    currentUserId?: string;
    rounds: number;
    beers: number;
    tapas: number;
    beerPrice: number;
    tapaPrice: number;
    distanceToBar: number | null;
    canCheckIn: boolean;
    isOverPlannedRounds: boolean;
    isLastBar: boolean;
    hasNextBar: boolean;
    nextBarName?: string;
    participantsAtBar: number;
    showDebug: boolean;
    onAddRound: () => void;
    onNextBar: () => void;
    onAddBeer: () => void;
    onRemoveBeer: () => void;
    onAddTapa: () => void;
    onRemoveTapa: () => void;
    onUpdatePrice: (type: "beer" | "tapa", price: number) => void;
    onPhotoUploaded: () => void;
};

export default function CurrentBarCard({
    stop,
    routeId,
    routeName,
    currentUserId,
    rounds,
    beers,
    tapas,
    beerPrice,
    tapaPrice,
    distanceToBar,
    canCheckIn,
    isOverPlannedRounds,
    isLastBar,
    hasNextBar,
    nextBarName,
    participantsAtBar,
    showDebug,
    onAddRound,
    onNextBar,
    onAddBeer,
    onRemoveBeer,
    onAddTapa,
    onRemoveTapa,
    onUpdatePrice,
    onPhotoUploaded,
}: CurrentBarCardProps) {
    const canInteract = canCheckIn || showDebug;

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden">
            {/* Header del bar */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold truncate">{stop.name}</h2>
                        <p className="text-amber-100 text-sm truncate">{stop.address}</p>
                    </div>
                    {/* Distancia */}
                    <div className="ml-2 shrink-0">
                        {distanceToBar !== null ? (
                            distanceToBar <= 75 ? (
                                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
                                    📍 Aqui
                                </span>
                            ) : (
                                <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                                    {distanceToBar}m
                                </span>
                            )
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="p-4 space-y-4">
                {/* Rondas completadas */}
                <div className="flex items-center justify-center gap-2 py-2">
                    <span className={`text-3xl font-black ${isOverPlannedRounds ? "text-orange-500" : "text-slate-800"}`}>
                        {rounds}
                    </span>
                    <span className="text-lg text-slate-400">/ {stop.plannedRounds} rondas</span>
                </div>

                {/* Aviso de rondas completadas */}
                {isOverPlannedRounds && hasNextBar && (
                    <div className="bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
                        <div className="text-2xl">🎯</div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-orange-800">Objetivo cumplido!</p>
                            <p className="text-xs text-orange-600">
                                Ya completaste las rondas planificadas. Puedes seguir o ir al siguiente bar.
                            </p>
                        </div>
                    </div>
                )}

                {/* Boton principal: Pedir Ronda */}
                <button
                    onClick={onAddRound}
                    disabled={!canInteract}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex flex-col items-center justify-center gap-1 ${
                        canInteract
                            ? isOverPlannedRounds
                                ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-lg"
                                : "bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-lg"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                >
                    {canInteract ? (
                        <>
                            <span>{isOverPlannedRounds ? "🍺 Otra Ronda Mas!" : "🍺 Pedir Ronda"}</span>
                            <span className="text-xs opacity-80">
                                +{participantsAtBar} {participantsAtBar === 1 ? "cerveza" : "cervezas"} ({participantsAtBar}{" "}
                                {participantsAtBar === 1 ? "persona" : "personas"})
                            </span>
                        </>
                    ) : (
                        <span>Acercate ({distanceToBar || "..."}m)</span>
                    )}
                </button>

                {/* Boton Siguiente Bar */}
                {isOverPlannedRounds && hasNextBar && (
                    <button
                        onClick={onNextBar}
                        className="w-full py-3 rounded-xl font-bold text-base bg-green-500 text-white hover:bg-green-600 active:scale-95 shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <span>➡️ Siguiente Bar: {nextBarName}</span>
                    </button>
                )}

                {/* Boton Finalizar Ruta */}
                {isOverPlannedRounds && isLastBar && (
                    <button
                        onClick={onNextBar}
                        className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 active:scale-95 shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <span>🎉 Finalizar Ruta</span>
                    </button>
                )}

                {/* Seccion de consumiciones */}
                <DrinkCounter
                    stopId={stop.id}
                    beers={beers}
                    tapas={tapas}
                    beerPrice={beerPrice}
                    tapaPrice={tapaPrice}
                    canInteract={canInteract}
                    onAddBeer={onAddBeer}
                    onRemoveBeer={onRemoveBeer}
                    onAddTapa={onAddTapa}
                    onRemoveTapa={onRemoveTapa}
                    onUpdatePrice={onUpdatePrice}
                />

                {/* Acciones: Foto + Meter prisa */}
                <div className="grid grid-cols-2 gap-2">
                    <PhotoCapture
                        routeId={routeId}
                        routeName={routeName}
                        stopId={stop.id}
                        stopName={stop.name}
                        onPhotoUploaded={onPhotoUploaded}
                        compact
                    />
                    <NudgeButton routeId={routeId} isAtCurrentStop={canInteract} compact />
                </div>

                {/* Votar saltar bar */}
                <SkipVoteButton routeId={routeId} stopId={stop.id} currentUserId={currentUserId} />
            </div>
        </div>
    );
}
