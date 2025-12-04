"use client";

interface ManualBarModalProps {
    isOpen: boolean;
    barName: string;
    onBarNameChange: (name: string) => void;
    barAddress: string;
    onBarAddressChange: (address: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ManualBarModal({
    isOpen,
    barName,
    onBarNameChange,
    barAddress,
    onBarAddressChange,
    onConfirm,
    onCancel,
}: ManualBarModalProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black/50 flex items-end sm:items-center justify-center z-30">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl w-full sm:max-w-sm sm:mx-4 max-h-[80vh] overflow-y-auto">
                <div className="text-center mb-4">
                    <span className="text-3xl">📍</span>
                    <h3 className="font-bold text-slate-800 text-lg mt-1">Nuevo Bar</h3>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            Nombre del bar *
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Bar de Pepe, La Taberna..."
                            value={barName}
                            onChange={(e) => onBarNameChange(e.target.value)}
                            className="w-full mt-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-base"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            Dirección (opcional)
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Calle Mayor 5"
                            value={barAddress}
                            onChange={(e) => onBarAddressChange(e.target.value)}
                            className="w-full mt-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-base"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!barName.trim()}
                        className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ✓ Añadir
                    </button>
                </div>
            </div>
        </div>
    );
}
