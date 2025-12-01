"use client";

import { useState } from "react";
import PricePicker from "@/components/PricePicker";

type DrinkCounterProps = {
    stopId: string;
    beers: number;
    tapas: number;
    beerPrice: number;
    tapaPrice: number;
    canInteract: boolean;
    onAddBeer: () => void;
    onRemoveBeer: () => void;
    onAddTapa: () => void;
    onRemoveTapa: () => void;
    onUpdatePrice: (type: "beer" | "tapa", price: number) => void;
};

export default function DrinkCounter({
    stopId,
    beers,
    tapas,
    beerPrice,
    tapaPrice,
    canInteract,
    onAddBeer,
    onRemoveBeer,
    onAddTapa,
    onRemoveTapa,
    onUpdatePrice,
}: DrinkCounterProps) {
    const [pricePickerOpen, setPricePickerOpen] = useState<{ type: "beer" | "tapa" } | null>(null);

    const totalSpent = beers * beerPrice + tapas * tapaPrice;

    return (
        <div className="bg-slate-50 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">Mi cuenta en este bar</h4>
                <span className="text-lg font-bold text-green-600">{totalSpent.toFixed(2)}€</span>
            </div>

            {/* Cervezas */}
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🍺</span>
                    <div>
                        <span className="font-medium text-slate-800">Cerveza</span>
                        <button
                            onClick={() => setPricePickerOpen({ type: "beer" })}
                            className="flex items-center gap-1 text-amber-600 text-sm font-medium hover:text-amber-700"
                        >
                            {beerPrice.toFixed(2)}€
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onRemoveBeer}
                        disabled={!canInteract || beers <= 0}
                        className="w-11 h-11 rounded-full bg-slate-200 text-slate-600 font-bold text-xl hover:bg-slate-300 disabled:opacity-50 transition-colors active-scale"
                        aria-label="Quitar cerveza"
                    >
                        -
                    </button>
                    <span className="w-8 text-center font-bold text-xl">{beers}</span>
                    <button
                        onClick={onAddBeer}
                        disabled={!canInteract}
                        className="w-11 h-11 rounded-full bg-amber-500 text-white font-bold text-xl hover:bg-amber-600 disabled:opacity-50 transition-colors active-scale"
                        aria-label="Añadir cerveza"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Tapas */}
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🍢</span>
                    <div>
                        <span className="font-medium text-slate-800">Tapeo</span>
                        <button
                            onClick={() => setPricePickerOpen({ type: "tapa" })}
                            className="flex items-center gap-1 text-orange-600 text-sm font-medium hover:text-orange-700"
                        >
                            {tapaPrice.toFixed(2)}€
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onRemoveTapa}
                        disabled={!canInteract || tapas <= 0}
                        className="w-11 h-11 rounded-full bg-slate-200 text-slate-600 font-bold text-xl hover:bg-slate-300 disabled:opacity-50 transition-colors active-scale"
                        aria-label="Quitar tapa"
                    >
                        -
                    </button>
                    <span className="w-8 text-center font-bold text-xl">{tapas}</span>
                    <button
                        onClick={onAddTapa}
                        disabled={!canInteract}
                        className="w-11 h-11 rounded-full bg-orange-500 text-white font-bold text-xl hover:bg-orange-600 disabled:opacity-50 transition-colors active-scale"
                        aria-label="Añadir tapa"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Price Picker Modal */}
            {pricePickerOpen && (
                <PricePicker
                    isOpen={true}
                    onClose={() => setPricePickerOpen(null)}
                    onSelect={(price) => {
                        onUpdatePrice(pricePickerOpen.type, price);
                        setPricePickerOpen(null);
                    }}
                    currentPrice={pricePickerOpen.type === "beer" ? beerPrice : tapaPrice}
                    title={pricePickerOpen.type === "beer" ? "Precio Cerveza" : "Precio Tapeo"}
                    icon={pricePickerOpen.type === "beer" ? "🍺" : "🍢"}
                />
            )}
        </div>
    );
}
