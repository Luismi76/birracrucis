"use client";

type DebugConsoleProps = {
    position: { lat: number; lng: number } | null;
    accuracy: number | null;
    distanceToActive: number | null;
    simLat: string;
    simLng: string;
    onSimLatChange: (value: string) => void;
    onSimLngChange: (value: string) => void;
    onApplySimulation: () => void;
};

export default function DebugConsole({
    position,
    accuracy,
    distanceToActive,
    simLat,
    simLng,
    onSimLatChange,
    onSimLngChange,
    onApplySimulation,
}: DebugConsoleProps) {
    return (
        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider">Debug Console</h4>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block mb-1">Lat</label>
                    <input
                        value={simLat}
                        onChange={(e) => onSimLatChange(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"
                    />
                </div>
                <div>
                    <label className="block mb-1">Lng</label>
                    <input
                        value={simLng}
                        onChange={(e) => onSimLngChange(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1"
                    />
                </div>
            </div>
            <button
                onClick={onApplySimulation}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-500"
            >
                Aplicar Posicion
            </button>
            <div className="font-mono text-[10px] break-all">
                Pos: {position?.lat.toFixed(5)}, {position?.lng.toFixed(5)} <br />
                Acc: {accuracy}m | Dist: {distanceToActive}m
            </div>
        </div>
    );
}
