"use client";

interface DetailsStepProps {
    startMode: "manual" | "scheduled" | "all_present";
    onStartModeChange: (mode: "manual" | "scheduled" | "all_present") => void;
    startTime: string;
    onStartTimeChange: (time: string) => void;
    hasEndTime: boolean;
    onHasEndTimeChange: (has: boolean) => void;
    endTime: string;
    onEndTimeChange: (time: string) => void;
    defaultStayDuration: number;
    onDefaultStayDurationChange: (duration: number) => void;
}

export default function DetailsStep({
    startMode,
    onStartModeChange,
    startTime,
    onStartTimeChange,
    hasEndTime,
    onHasEndTimeChange,
    endTime,
    onEndTimeChange,
    defaultStayDuration,
    onDefaultStayDurationChange
}: DetailsStepProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-slate-800">⏱️ Sincronicemos relojes</h2>
                <p className="text-slate-500">¿Cuándo empieza la fiesta y cuánto dura?</p>
            </div>

            {/* Hora de Inicio */}
            <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">¿Cómo empezamos?</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                        onClick={() => onStartModeChange("scheduled")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${startMode === "scheduled" ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500" : "border-slate-200 hover:border-amber-200 bg-white"}`}
                    >
                        <div className="text-2xl mb-2">🕐</div>
                        <div className="font-bold text-slate-800">Hora Fija</div>
                        <div className="text-xs text-slate-500">Empezamos a una hora exacta</div>
                    </button>

                    <button
                        onClick={() => onStartModeChange("all_present")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${startMode === "all_present" ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500" : "border-slate-200 hover:border-amber-200 bg-white"}`}
                    >
                        <div className="text-2xl mb-2">👥</div>
                        <div className="font-bold text-slate-800">Todos Listos</div>
                        <div className="text-xs text-slate-500">Cuando estemos todos</div>
                    </button>

                    <button
                        onClick={() => onStartModeChange("manual")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${startMode === "manual" ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500" : "border-slate-200 hover:border-amber-200 bg-white"}`}
                    >
                        <div className="text-2xl mb-2">🎯</div>
                        <div className="font-bold text-slate-800">Manual</div>
                        <div className="text-xs text-slate-500">Yo digo cuándo empieza</div>
                    </button>
                </div>

                {(startMode === "scheduled" || startMode === "all_present") && (
                    <div className="animate-in fade-in slide-in-from-top-4 mt-4">
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-xl">⏰</span>
                            <input
                                type="time"
                                className="w-full pl-12 p-4 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:ring-0 outline-none transition-all bg-white text-lg font-medium"
                                value={startTime}
                                onChange={(e) => onStartTimeChange(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-center">
                            {startMode === "scheduled" ? "Hora de inicio oficial" : "Hora estimada de quedada"}
                        </p>
                    </div>
                )}
            </div>

            <div className="border-t border-slate-100 my-6"></div>

            {/* Hora Fin */}
            <div className="space-y-4">
                <div
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${hasEndTime ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'}`}
                    onClick={() => onHasEndTimeChange(!hasEndTime)}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🍽️</span>
                        <div>
                            <div className="font-bold text-slate-800">¿Tenéis reserva despues?</div>
                            <div className="text-xs text-slate-500">Avisaremos si vais tarde</div>
                        </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${hasEndTime ? 'bg-amber-500' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${hasEndTime ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                </div>

                {hasEndTime && (
                    <div className="relative animate-in fade-in slide-in-from-top-4">
                        <span className="absolute left-4 top-3.5 text-xl">🏁</span>
                        <input
                            type="time"
                            className="w-full pl-12 p-4 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:ring-0 outline-none transition-all bg-white text-lg font-medium"
                            value={endTime}
                            onChange={(e) => onEndTimeChange(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="border-t border-slate-100 my-6"></div>

            {/* Duración */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <label className="text-sm font-bold text-slate-700 uppercase">Ritmo por bar</label>
                    <span className="text-2xl font-black text-amber-500">{defaultStayDuration} min</span>
                </div>

                <input
                    type="range"
                    min="15"
                    max="90"
                    step="5"
                    value={defaultStayDuration}
                    onChange={(e) => onDefaultStayDurationChange(parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>⚡ Rápido (15m)</span>
                    <span>🐢 Tranqui (90m)</span>
                </div>
            </div>

        </div>
    );
}
