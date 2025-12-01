"use client";

import { useState, useMemo } from "react";
import { useDrinks, useAddDrink, type Drink } from "@/hooks/useDrinks";

type Participant = {
  id: string;
  name: string | null;
  image: string | null;
};

type DrinkCounterProps = {
  routeId: string;
  stopId: string;
  currentUserId?: string;
  participants: Participant[];
};

const DRINK_TYPES = [
  { value: "beer", label: "Cerveza", emoji: "🍺" },
  { value: "wine", label: "Vino", emoji: "🍷" },
  { value: "cocktail", label: "Cocktail", emoji: "🍸" },
  { value: "shot", label: "Chupito", emoji: "🥃" },
  { value: "soft", label: "Refresco", emoji: "🥤" },
  { value: "water", label: "Agua", emoji: "💧" },
];

export default function DrinkCounter({
  routeId,
  stopId,
  currentUserId,
  participants,
}: DrinkCounterProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState("beer");
  const [paidById, setPaidById] = useState<string | null>(null);

  // React Query hooks
  const { data } = useDrinks(routeId, stopId);
  const drinks = data?.drinks ?? [];

  const addDrinkMutation = useAddDrink(routeId);

  const handleAddDrink = async () => {
    if (addDrinkMutation.isPending) return;

    try {
      await addDrinkMutation.mutateAsync({
        stopId,
        type: selectedType,
        paidById: paidById || undefined,
      });
      setShowAddModal(false);
      setSelectedType("beer");
      setPaidById(null);
    } catch (err) {
      console.error("Error adding drink:", err);
    }
  };

  // Contar bebidas por usuario
  const drinksByUser = drinks.reduce((acc, drink) => {
    const userId = drink.user.id;
    if (!acc[userId]) {
      acc[userId] = {
        user: drink.user,
        count: 0,
        types: {} as Record<string, number>,
      };
    }
    acc[userId].count++;
    acc[userId].types[drink.type] = (acc[userId].types[drink.type] || 0) + 1;
    return acc;
  }, {} as Record<string, { user: Drink["user"]; count: number; types: Record<string, number> }>);

  const myDrinksCount = drinks.filter((d) => d.user.id === currentUserId).length;

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-slate-800 flex items-center gap-2">
          <span className="text-2xl">🍺</span>
          Contador de Bebidas
        </h4>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Anadir
        </button>
      </div>

      {/* Mi contador */}
      <div className="bg-amber-50 rounded-lg p-3 mb-3 text-center">
        <p className="text-3xl font-bold text-amber-600">{myDrinksCount}</p>
        <p className="text-sm text-amber-700">Mis bebidas en este bar</p>
      </div>

      {/* Ranking */}
      {Object.keys(drinksByUser).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Ranking del bar</p>
          {Object.values(drinksByUser)
            .sort((a, b) => b.count - a.count)
            .map((item, index) => (
              <div
                key={item.user.id}
                className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
              >
                <span className="text-lg font-bold text-slate-400 w-6">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                </span>
                {item.user.image ? (
                  <img
                    src={item.user.image}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-sm">
                    {item.user.name?.charAt(0) || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-800">
                    {item.user.name || "Anonimo"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {Object.entries(item.types)
                      .map(([type, count]) => {
                        const drinkType = DRINK_TYPES.find((d) => d.value === type);
                        return `${drinkType?.emoji || ""} ${count}`;
                      })
                      .join(" ")}
                  </p>
                </div>
                <span className="font-bold text-amber-600">{item.count}</span>
              </div>
            ))}
        </div>
      )}

      {drinks.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-4">
          Nadie ha registrado bebidas todavia
        </p>
      )}

      {/* Modal para añadir */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Anadir bebida</h3>

            {/* Tipo de bebida */}
            <p className="text-sm font-medium text-slate-600 mb-2">Que estas tomando?</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {DRINK_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedType === type.value
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  <span className="text-2xl block">{type.emoji}</span>
                  <span className="text-xs">{type.label}</span>
                </button>
              ))}
            </div>

            {/* Quién paga */}
            <p className="text-sm font-medium text-slate-600 mb-2">Quien paga? (opcional)</p>
            <select
              value={paidById || ""}
              onChange={(e) => setPaidById(e.target.value || null)}
              className="w-full p-3 border rounded-lg mb-4"
            >
              <option value="">Yo mismo / Sin especificar</option>
              {participants
                .filter((p) => p.id !== currentUserId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || "Sin nombre"}
                  </option>
                ))}
            </select>

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddDrink}
                disabled={addDrinkMutation.isPending}
                className="flex-1 py-2 px-4 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50"
              >
                {addDrinkMutation.isPending ? "Anadiendo..." : "Anadir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
