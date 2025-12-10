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
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">🎉 Información Básica</h2>
                <p className="text-sm text-slate-500">¿Cómo llamamos a esta aventura?</p>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase">Nombre de la Ruta</label>
                <div className="relative">
                    <span className="absolute left-3 top-3 text-lg">🏷️</span>
                    <input
                        type="text"
                        placeholder="Ej: Birracrucis Navideño"
                        className="w-full pl-10 p-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:ring-0 outline-none transition-all bg-white text-base font-semibold"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100">
                {/* Discovery Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                            🧭 Modo Aventura
                            {isDiscovery && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">ON</span>}
                        </div>
                        <p className="text-xs text-slate-500 max-w-[220px]">
                            Sin paradas fijas. Detectaremos los bares sobre la marcha.
                        </p>
                    </div>
                    <button
                        onClick={() => onIsDiscoveryChange(!isDiscovery)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${isDiscovery ? 'bg-amber-500' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${isDiscovery ? 'translate-x-5' : ''}`} />
                    </button>
                </div>

                {/* Public Toggle */}
                {showPublicOption && (
                    <>
                        <div className="w-full h-px bg-slate-200" />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                        🌍 Hacer Pública
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Visible para toda la comunidad.
                                    </p>
                                </div>
                                <button
                                    onClick={() => onIsPublicChange(!isPublic)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${isPublic ? 'bg-purple-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${isPublic ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>

                            {isPublic && (
                                <textarea
                                    placeholder="Descripción corta para la comunidad..."
                                    className="w-full p-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white"
                                    rows={2}
                                    value={description}
                                    onChange={(e) => onDescriptionChange(e.target.value)}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
