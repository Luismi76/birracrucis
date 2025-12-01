"use client";

import { useState, useRef, useEffect } from "react";

type PricePickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (price: number) => void;
  currentPrice: number;
  title: string;
  icon: string;
};

// Precios disponibles de 0.50€ a 10€ en incrementos de 0.10€
const PRICES = Array.from({ length: 96 }, (_, i) => (i + 5) / 10); // 0.50 a 10.00

export default function PricePicker({
  isOpen,
  onClose,
  onSelect,
  currentPrice,
  title,
  icon,
}: PricePickerProps) {
  const [selectedPrice, setSelectedPrice] = useState(currentPrice);
  const listRef = useRef<HTMLDivElement>(null);
  const itemHeight = 48; // altura de cada item

  // Scroll al precio seleccionado al abrir
  useEffect(() => {
    if (isOpen && listRef.current) {
      const index = PRICES.findIndex(p => p === selectedPrice);
      if (index !== -1) {
        const scrollTop = index * itemHeight - (listRef.current.clientHeight / 2) + (itemHeight / 2);
        listRef.current.scrollTop = Math.max(0, scrollTop);
      }
    }
  }, [isOpen, selectedPrice]);

  // Detectar el precio centrado durante el scroll
  const handleScroll = () => {
    if (!listRef.current) return;
    const scrollTop = listRef.current.scrollTop;
    const centerOffset = listRef.current.clientHeight / 2;
    const index = Math.round((scrollTop + centerOffset - itemHeight / 2) / itemHeight);
    const clampedIndex = Math.max(0, Math.min(PRICES.length - 1, index));
    setSelectedPrice(PRICES[clampedIndex]);
  };

  const handleConfirm = () => {
    onSelect(selectedPrice);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-t-3xl w-full max-w-md overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={onClose}
            className="text-slate-500 font-medium"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <span className="font-bold text-slate-800">{title}</span>
          </div>
          <button
            onClick={handleConfirm}
            className="text-amber-600 font-bold"
          >
            OK
          </button>
        </div>

        {/* Picker */}
        <div className="relative h-64">
          {/* Indicador central */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-12 bg-amber-100 rounded-xl border-2 border-amber-300 pointer-events-none z-10" />

          {/* Lista de precios */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto scroll-smooth snap-y snap-mandatory"
            style={{
              scrollSnapType: "y mandatory",
              paddingTop: "calc(50% - 24px)",
              paddingBottom: "calc(50% - 24px)",
            }}
          >
            {PRICES.map((price) => {
              const isSelected = price === selectedPrice;
              return (
                <div
                  key={price}
                  className={`h-12 flex items-center justify-center snap-center transition-all ${
                    isSelected
                      ? "text-2xl font-bold text-amber-600"
                      : "text-lg text-slate-400"
                  }`}
                  onClick={() => {
                    setSelectedPrice(price);
                    // Scroll to center
                    if (listRef.current) {
                      const index = PRICES.indexOf(price);
                      const scrollTop = index * itemHeight - (listRef.current.clientHeight / 2) + (itemHeight / 2);
                      listRef.current.scrollTo({ top: scrollTop, behavior: "smooth" });
                    }
                  }}
                >
                  {price.toFixed(2)} €
                </div>
              );
            })}
          </div>
        </div>

        {/* Precios rapidos */}
        <div className="p-4 border-t bg-slate-50">
          <p className="text-xs text-slate-500 mb-2 text-center">Precios comunes</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {[1.00, 1.50, 2.00, 2.50, 3.00, 3.50, 4.00, 5.00].map((price) => (
              <button
                key={price}
                onClick={() => {
                  setSelectedPrice(price);
                  onSelect(price);
                  onClose();
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  price === selectedPrice
                    ? "bg-amber-500 text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-amber-300"
                }`}
              >
                {price.toFixed(2)}€
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
