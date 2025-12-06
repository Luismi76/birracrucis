"use client";

interface RouteFormProps {
    name: string;
    onNameChange: (name: string) => void;
    date: string;
    onDateChange: (date: string) => void;
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
    isPublic: boolean;
    onIsPublicChange: (isPublic: boolean) => void;
    description: string;
    onDescriptionChange: (desc: string) => void;
    showPublicOption?: boolean;
}

export default function RouteForm({
    name,
    onNameChange,
    date,
    onDateChange,
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
    isPublic,
    onIsPublicChange,
    description,
    onDescriptionChange,
    showPublicOption = true,
}: RouteFormProps) {
    return (
        <section className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <span className="bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm">1</span>
                Datos de la Fiesta
            </h2>
            <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">🏷️</span>
                    <input
                        type="text"
                        placeholder="Nombre de la ruta (ej. Viernes Santo)"
                        className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">📅</span>
                    <input
                        type="date"
                        className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        value={date}
                        onChange={(e) => onDateChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Configuración de Tiempo */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
                <h3 className="font-bold text-blue-800 text-sm flex items-center gap-2">
                    <span>⏰</span> Configuración de Horarios
                </h3>

                <div className="space-y-3">
                    <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">¿Cuándo empezamos?</label>
                    <div className="grid grid-cols-3 gap-2">
                        <label className={`flex flex-row items-center justify-center gap-2 p-2 rounded-lg border cursor-pointer transition-all hover:bg-slate-50 ${startMode === "scheduled" ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}>
                            <input
                                type="radio"
                                name="startMode"
                                value="scheduled"
                                checked={startMode === "scheduled"}
                                onChange={() => onStartModeChange("scheduled")}
                                className="hidden"
                            />
                            <span className="text-xl">🕐</span>
                            <span className="text-xs font-bold whitespace-nowrap">Hora fija</span>
                        </label>

                        <label className={`flex flex-row items-center justify-center gap-2 p-2 rounded-lg border cursor-pointer transition-all hover:bg-slate-50 ${startMode === "all_present" ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}>
                            <input
                                type="radio"
                                name="startMode"
                                value="all_present"
                                checked={startMode === "all_present"}
                                onChange={() => onStartModeChange("all_present")}
                                className="hidden"
                            />
                            <span className="text-xl">👥</span>
                            <span className="text-xs font-bold whitespace-nowrap">Todos listos</span>
                        </label>

                        <label className={`flex flex-row items-center justify-center gap-2 p-2 rounded-lg border cursor-pointer transition-all hover:bg-slate-50 ${startMode === "manual" ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}>
                            <input
                                type="radio"
                                name="startMode"
                                value="manual"
                                checked={startMode === "manual"}
                                onChange={() => onStartModeChange("manual")}
                                className="hidden"
                            />
                            <span className="text-xl">🎯</span>
                            <span className="text-xs font-bold whitespace-nowrap">Manual</span>
                        </label>
                    </div>
                </div>

                {/* Hora de inicio (si es scheduled o all_present) */}
                {(startMode === "scheduled" || startMode === "all_present") && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                            {startMode === "scheduled" ? "Hora de inicio" : "Hora estimada de quedada"}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-400">🕐</span>
                            <input
                                type="time"
                                className="w-full pl-10 p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                value={startTime}
                                onChange={(e) => onStartTimeChange(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Hora de fin (reserva) */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={hasEndTime}
                            onChange={(e) => onHasEndTimeChange(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Tenemos hora de fin (reserva)</span>
                    </label>

                    {hasEndTime && (
                        <div className="relative mt-1">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🍽️</span>
                            <input
                                type="time"
                                className="w-full pl-9 p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                value={endTime}
                                onChange={(e) => onEndTimeChange(e.target.value)}
                                placeholder="Hora de la reserva"
                            />
                            <p className="text-xs text-slate-500 mt-1">Te avisaremos si vais justos de tiempo</p>
                        </div>
                    )}
                </div>

                {/* Tiempo por bar por defecto */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">Tiempo por bar (por defecto)</label>
                        <span className="text-sm font-bold text-blue-600">{defaultStayDuration} min</span>
                    </div>
                    <input
                        type="range"
                        min="15"
                        max="60"
                        step="5"
                        value={defaultStayDuration}
                        onChange={(e) => onDefaultStayDurationChange(parseInt(e.target.value))}
                        className="w-full accent-blue-500 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>15 min (rápido)</span>
                        <span>60 min (tranqui)</span>
                    </div>
                </div>
            </div>

            {/* Configuración de Visibilidad - Nueva sección */}
            {showPublicOption && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <h3 className="font-bold text-purple-800 text-sm flex items-center gap-2">
                        <span>🌍</span> Comunidad y Visibilidad
                    </h3>

                    <div className="space-y-4">
                        <label className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all border-slate-200 bg-white hover:border-purple-200">
                            <div className="pt-1">
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => onIsPublicChange(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-slate-800 flex items-center gap-2">
                                    Hacer pública esta ruta
                                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">Comunidad</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Otros usuarios podrán ver y clonar esta ruta.
                                </div>
                            </div>
                        </label>

                        {isPublic && (
                            <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                                <span className="absolute left-3 top-3 text-slate-400">📝</span>
                                <textarea
                                    placeholder="Descripción (opcional) - Cuenta de qué va esta ruta"
                                    className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all bg-white min-h-[80px]"
                                    value={description}
                                    onChange={(e) => onDescriptionChange(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}


        </section>
    );
}
