"use client";

import { useState } from "react";

type PricePickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (price: number) => void;
  currentPrice: number;
  title: string;
  icon: string;
};

// Precios comunes predefinidos
const QUICK_PRICES = [1.00, 1.20, 1.50, 1.80, 2.00, 2.50, 3.00, 3.50, 4.00, 5.00];

export default function PricePicker({
  isOpen,
  onClose,
  onSelect,
  currentPrice,
  title,
  icon,
}: PricePickerProps) {
  // Separar euros y centimos
  const [euros, setEuros] = useState(Math.floor(currentPrice));
  const [centimos, setCentimos] = useState(Math.round((currentPrice % 1) * 100));

  const currentTotal = euros + centimos / 100;

  const handleConfirm = () => {
    onSelect(currentTotal);
    onClose();
  };

  const handleQuickPrice = (price: number) => {
    onSelect(price);
    onClose();
  };

  const incrementEuros = () => setEuros(prev => Math.min(prev + 1, 20));
  const decrementEuros = () => setEuros(prev => Math.max(prev - 1, 0));

  const incrementCentimos = () => {
    setCentimos(prev => {
      const next = prev + 10;
      if (next >= 100) {
        if (euros < 20) {
          setEuros(e => e + 1);
          return 0;
        }
        return 90;
      }
      return next;
    });
  };

  const decrementCentimos = () => {
    setCentimos(prev => {
      const next = prev - 10;
      if (next < 0) {
        if (euros > 0) {
          setEuros(e => e - 1);
          return 90;
        }
        return 0;
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={onClose}
            className="text-slate-500 font-medium px-2"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <span className="font-bold text-slate-800">{title}</span>
          </div>
          <button
            onClick={handleConfirm}
            className="text-amber-600 font-bold px-2"
          >
            OK
          </button>
        </div>

        {/* Selector de precio con +/- */}
        <div className="p-6">
          <div className="flex items-center justify-center gap-2">
            {/* Euros */}
            <div className="flex flex-col items-center">
              <button
                onClick={incrementEuros}
                className="w-14 h-14 rounded-xl bg-slate-100 text-slate-600 text-2xl font-bold hover:bg-slate-200 active:bg-slate-300 transition-colors"
              >
                +
              </button>
              <div className="my-3 text-5xl font-black text-slate-800 w-14 text-center">
                {euros}
              </div>
              <button
                onClick={decrementEuros}
                className="w-14 h-14 rounded-xl bg-slate-100 text-slate-600 text-2xl font-bold hover:bg-slate-200 active:bg-slate-300 transition-colors"
              >
                -
              </button>
            </div>

            {/* Separador */}
            <div className="text-5xl font-black text-slate-800 mb-1">,</div>

            {/* Centimos */}
            <div className="flex flex-col items-center">
              <button
                onClick={incrementCentimos}
                className="w-14 h-14 rounded-xl bg-slate-100 text-slate-600 text-2xl font-bold hover:bg-slate-200 active:bg-slate-300 transition-colors"
              >
                +
              </button>
              <div className="my-3 text-5xl font-black text-slate-800 w-14 text-center">
                {centimos.toString().padStart(2, '0')}
              </div>
              <button
                onClick={decrementCentimos}
                className="w-14 h-14 rounded-xl bg-slate-100 text-slate-600 text-2xl font-bold hover:bg-slate-200 active:bg-slate-300 transition-colors"
              >
                -
              </button>
            </div>

            {/* Euro symbol */}
            <div className="text-4xl font-bold text-slate-400 ml-1">€</div>
          </div>

          {/* Preview del precio */}
          <div className="mt-4 text-center">
            <span className="text-lg text-slate-500">
              Precio: <span className="font-bold text-amber-600">{currentTotal.toFixed(2)}€</span>
            </span>
          </div>
        </div>

        {/* Precios rapidos */}
        <div className="px-4 pb-6">
          <p className="text-xs text-slate-500 mb-3 text-center">Precios rapidos</p>
          <div className="grid grid-cols-5 gap-2">
            {QUICK_PRICES.map((price) => (
              <button
                key={price}
                onClick={() => handleQuickPrice(price)}
                className={`py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  Math.abs(price - currentTotal) < 0.01
                    ? "bg-amber-500 text-white shadow-lg"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {price.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
