"use client";

interface InfoStepProps {
    name: string;
    onNameChange: (name: string) => void;
    date: string;
    onDateChange: (date: string) => void;
    isPublic: boolean;
    onIsPublicChange: (isPublic: boolean) => void;
    isDiscovery: boolean;
    onIsDiscoveryChange: (isDiscovery: boolean) => void;
    description: string;
    onDescriptionChange: (desc: string) => void;
    showPublicOption: boolean;
}

export default function InfoStep({
    name,
    onNameChange,
    date,
    onDateChange,
    isPublic,
    onIsPublicChange,
    isDiscovery,
    onIsDiscoveryChange,
    description,
    onDescriptionChange,
    showPublicOption
}: InfoStepProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-slate-800">🎉 Vamos a montar una fiesta</h2>
                <p className="text-slate-500">Lo primero es lo primero: ¿Cómo se llama y cuándo es?</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Nombre de la Ruta</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-xl">🏷️</span>
                        <input
                            type="text"
                            placeholder="Ej: Birracrucis Navideño 2024"
                            className="w-full pl-12 p-4 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:ring-0 outline-none transition-all bg-white text-lg font-medium"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">
                        Fecha <span className="font-normal text-slate-400 text-xs">(Opcional para plantilla)</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-xl">📅</span>
                        <input
                            type="date"
                            className="w-full pl-12 p-4 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:ring-0 outline-none transition-all bg-white text-lg font-medium"
                            value={date}
                            onChange={(e) => onDateChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="pt-4 space-y-4">
                    {/* Discovery Mode Toggle */}
                    <div
                        onClick={() => onIsDiscoveryChange(!isDiscovery)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${isDiscovery ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-200'}`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors ${isDiscovery ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>
                                {isDiscovery && <span className="text-white text-xs">✓</span>}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    Modo Aventura
                                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">Descubrimiento</span>
                                </div>
                                <p className="text-slate-500 text-sm mt-1">
                                    En este modo solo defines el punto de partida. La ruta se construirá sobre la marcha detectando los bares automáticamente. Ideal si no tienes plan fijo.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {showPublicOption && (
                    <div className="pt-4">
                        <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${isPublic ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-200'}`}
                            onClick={() => onIsPublicChange(!isPublic)}>
                            <div className="flex items-start gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors ${isPublic ? 'border-purple-500 bg-purple-500' : 'border-slate-300'}`}>
                                    {isPublic && <span className="text-white text-xs">✓</span>}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        Hacer pública
                                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">Comunidad</span>
                                    </div>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Cualquiera podrá ver y unirse a esta ruta. Ideal para eventos abiertos.
                                    </p>
                                </div>
                            </div>

                            {isPublic && (
                                <div className="mt-4 pl-10 animate-in fade-in slide-in-from-top-2">
                                    <textarea
                                        placeholder="Descripción corta: ¿De qué va el plan?"
                                        className="w-full p-3 border border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white/50"
                                        rows={2}
                                        value={description}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            onDescriptionChange(e.target.value);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
