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
    onDefaultStayDurationChange,
    isDiscovery = false
}: DetailsStepProps & { isDiscovery?: boolean }) {

    // Auto-select Manual for Discovery (useEffect handled in parent or here?) - Let's just default UI focus.

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">⏱️ Tiempos</h2>
                <p className="text-sm text-slate-500">Configura el ritmo de la ruta</p>
            </div>

            {/* Start Mode - Compact Segmented Control */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Inicio</label>
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    {[
                        { id: "manual", icon: "🎯", label: "Manual" },
                        { id: "scheduled", icon: "🕐", label: "Fijo" },
                        { id: "all_present", icon: "👥", label: "Juntos" }
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => onStartModeChange(mode.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${startMode === mode.id
                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                }`}
                        >
                            <span>{mode.icon}</span>
                            <span>{mode.label}</span>
                        </button>
                    ))}
                </div>
                {isDiscovery && startMode !== "manual" && (
                    <p className="text-xs text-amber-600 ml-1">💡 En Modo Aventura recomendamos inicio "Manual"</p>
                )}
            </div>

            {/* Time Picker (Compact) */}
            {(startMode === "scheduled" || startMode === "all_present") && (
                <div className="bg-amber-50 rounded-xl p-3 flex items-center justify-between border border-amber-100">
                    <span className="text-sm font-medium text-amber-900">Hora prevista:</span>
                    <input
                        type="time"
                        className="bg-white border border-amber-200 text-amber-900 text-lg font-bold rounded-lg px-3 py-1 focus:outline-none focus:border-amber-500"
                        value={startTime}
                        onChange={(e) => onStartTimeChange(e.target.value)}
                    />
                </div>
            )}

            <div className="border-t border-slate-100 my-4"></div>

            {/* End Time - Simple Switch */}
            <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                        🏁
                    </div>
                    <div>
                        <div className="font-bold text-slate-700 text-sm">Hora Final / Reserva</div>
                        {hasEndTime && <div className="text-xs text-slate-400">¿A qué hora acabamos?</div>}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {hasEndTime && (
                        <input
                            type="time"
                            className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:border-blue-500"
                            value={endTime}
                            onChange={(e) => onEndTimeChange(e.target.value)}
                        />
                    )}
                    <button
                        onClick={() => onHasEndTimeChange(!hasEndTime)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${hasEndTime ? 'bg-blue-500' : 'bg-slate-200'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${hasEndTime ? 'translate-x-5' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="border-t border-slate-100 my-4"></div>

            {/* Duration Slider (Compact) */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase">Tiempo en bar</label>
                    <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                        {defaultStayDuration} min
                    </span>
                </div>

                <input
                    type="range"
                    min="15"
                    max="90"
                    step="5"
                    value={defaultStayDuration}
                    onChange={(e) => onDefaultStayDurationChange(parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>⚡ Rápido</span>
                    <span>🐢 Tranquilo</span>
                </div>
            </div>
        </div>
    );
}
