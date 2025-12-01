"use client";

type RouteProgressProps = {
    completedStops: number;
    totalStops: number;
    totalBeers: number;
    totalTapas: number;
    totalSpent: number;
};

export default function RouteProgress({
    completedStops,
    totalStops,
    totalBeers,
    totalTapas,
    totalSpent,
}: RouteProgressProps) {
    const progressPercent = (completedStops / totalStops) * 100;

    return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium opacity-90">Progreso</span>
                <span className="text-lg font-bold">
                    {completedStops}/{totalStops} Bares
                </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                    className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
            <div className="mt-3 flex justify-between text-xs opacity-90">
                <span>🍺 {totalBeers} cervezas</span>
                <span>🍢 {totalTapas} tapas</span>
                <span>💰 {totalSpent.toFixed(2)}€</span>
            </div>
        </div>
    );
}
