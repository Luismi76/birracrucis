"use client";

import { useState, useEffect } from "react";
import { Dices, Trophy, X } from "lucide-react";

type Participant = {
    id: string;
    name: string | null;
    image: string | null;
};

type RoundRouletteProps = {
    participants: Participant[];
    onClose: () => void;
};

export default function RoundRoulette({ participants, onClose }: RoundRouletteProps) {
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<Participant | null>(null);
    const [displayIndex, setDisplayIndex] = useState(0);

    const handleSpin = () => {
        if (participants.length === 0) return;
        setIsSpinning(true);
        setWinner(null);

        let speed = 50;
        let counter = 0;
        const maxSpins = 30 + Math.floor(Math.random() * 20); // Random duration

        const spin = () => {
            setDisplayIndex(prev => (prev + 1) % participants.length);
            counter++;

            if (counter < maxSpins) {
                speed += counter * 2; // Decelerate
                setTimeout(spin, Math.min(speed, 300));
            } else {
                setIsSpinning(false);
                setWinner(participants[(displayIndex + 1) % participants.length]);
                // Confetti or vibration could trigger here
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                    navigator.vibrate([200, 100, 200, 100, 400]);
                }
            }
        };

        spin();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm mx-4 rounded-3xl overflow-hidden shadow-2xl relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-2">
                        <Dices className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-900">¿Quién Pide?</h2>
                        <p className="text-slate-500 text-sm">Que decida el destino...</p>
                    </div>

                    {/* Stage */}
                    <div className="py-6 w-full flex justify-center">
                        {winner ? (
                            <div className="animate-in zoom-in spin-in-3 duration-500 flex flex-col items-center gap-3">
                                <div className="relative">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl">
                                        👑
                                    </div>
                                    <img
                                        src={winner.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.name}`}
                                        alt={winner.name || "User"}
                                        className="w-24 h-24 rounded-full border-4 border-amber-400 shadow-xl"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Le toca a</p>
                                    <h3 className="text-2xl font-black text-slate-800">{winner.name}</h3>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <img
                                    src={participants[displayIndex]?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participants[displayIndex]?.name || 'chk'}`}
                                    alt="Participant"
                                    className={`w-20 h-20 rounded-full border-4 border-slate-100 transition-transform ${isSpinning ? 'scale-110' : 'scale-100'}`}
                                />
                                <h3 className="text-xl font-bold text-slate-400">{participants[displayIndex]?.name || "Esperando..."}</h3>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    {!winner ? (
                        <button
                            onClick={handleSpin}
                            disabled={isSpinning || participants.length === 0}
                            className="w-full py-4 bg-purple-600 text-white rounded-xl font-black text-lg shadow-lg shadow-purple-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                        >
                            {isSpinning ? "Girando..." : "🎲 Girar Ruleta"}
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                        >
                            ¡A por ello!
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
