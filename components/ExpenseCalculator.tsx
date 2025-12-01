"use client";

import { useState, useEffect } from "react";

type Drink = {
  id: string;
  type: string;
  userId: string;
  userName: string | null;
  paidById: string | null;
  paidByName: string | null;
};

type Participant = {
  id: string;
  name: string | null;
  image: string | null;
};

type ExpenseCalculatorProps = {
  routeId: string;
  participants: Participant[];
};

// Precios estimados por tipo de bebida
const DRINK_PRICES: Record<string, number> = {
  beer: 3.0,
  wine: 4.0,
  cocktail: 8.0,
  shot: 3.5,
  soft: 2.5,
  water: 1.5,
  other: 3.0,
};

const DRINK_LABELS: Record<string, string> = {
  beer: "Cerveza",
  wine: "Vino",
  cocktail: "Cocktail",
  shot: "Chupito",
  soft: "Refresco",
  water: "Agua",
  other: "Otro",
};

export default function ExpenseCalculator({ routeId, participants }: ExpenseCalculatorProps) {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>(DRINK_PRICES);
  const [showPriceEditor, setShowPriceEditor] = useState(false);

  useEffect(() => {
    fetchDrinks();
  }, [routeId]);

  const fetchDrinks = async () => {
    try {
      const res = await fetch(`/api/routes/${routeId}/drinks`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setDrinks(data.drinks || []);
        }
      }
    } catch (error) {
      console.error("Error fetching drinks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular gastos por persona
  const calculateExpenses = () => {
    const expenses: Record<string, { consumed: number; paid: number; drinks: number }> = {};

    // Inicializar todos los participantes
    participants.forEach((p) => {
      expenses[p.id] = { consumed: 0, paid: 0, drinks: 0 };
    });

    // Calcular consumido y pagado
    drinks.forEach((drink) => {
      const price = customPrices[drink.type] || DRINK_PRICES.other;

      // Lo que consumió cada uno
      if (expenses[drink.userId]) {
        expenses[drink.userId].consumed += price;
        expenses[drink.userId].drinks += 1;
      }

      // Lo que pagó cada uno
      if (drink.paidById && expenses[drink.paidById]) {
        expenses[drink.paidById].paid += price;
      }
    });

    return expenses;
  };

  // Calcular balances (positivo = le deben, negativo = debe)
  const calculateBalances = () => {
    const expenses = calculateExpenses();
    const balances: Record<string, number> = {};

    Object.entries(expenses).forEach(([id, { consumed, paid }]) => {
      balances[id] = paid - consumed;
    });

    return balances;
  };

  // Generar transacciones para saldar cuentas
  const generateSettlements = () => {
    const balances = calculateBalances();
    const settlements: { from: string; to: string; amount: number }[] = [];

    const debtors = Object.entries(balances)
      .filter(([, balance]) => balance < 0)
      .map(([id, balance]) => ({ id, amount: -balance }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = Object.entries(balances)
      .filter(([, balance]) => balance > 0)
      .map(([id, balance]) => ({ id, amount: balance }))
      .sort((a, b) => b.amount - a.amount);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0.01) {
        settlements.push({
          from: debtor.id,
          to: creditor.id,
          amount: Math.round(amount * 100) / 100,
        });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return settlements;
  };

  const expenses = calculateExpenses();
  const balances = calculateBalances();
  const settlements = generateSettlements();
  const totalSpent = Object.values(expenses).reduce((acc, e) => acc + e.consumed, 0);

  const getParticipant = (id: string) => participants.find((p) => p.id === id);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-4 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen Total */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <span>💰</span> Calculadora de Gastos
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-3xl font-bold">{totalSpent.toFixed(2)}€</p>
            <p className="text-green-100 text-sm">Total gastado</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{drinks.length}</p>
            <p className="text-green-100 text-sm">Bebidas totales</p>
          </div>
        </div>
      </div>

      {/* Desglose por persona */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
          <h4 className="font-semibold text-slate-800">Desglose por persona</h4>
          <button
            onClick={() => setShowPriceEditor(!showPriceEditor)}
            className="text-xs text-amber-600 hover:text-amber-700"
          >
            {showPriceEditor ? "Ocultar precios" : "Editar precios"}
          </button>
        </div>

        {/* Editor de precios */}
        {showPriceEditor && (
          <div className="p-3 bg-amber-50 border-b grid grid-cols-2 gap-2">
            {Object.entries(DRINK_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2">
                <label className="text-xs text-slate-600 w-16">{label}</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={customPrices[type]}
                  onChange={(e) =>
                    setCustomPrices((prev) => ({
                      ...prev,
                      [type]: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-16 px-2 py-1 text-xs border rounded"
                />
                <span className="text-xs text-slate-400">€</span>
              </div>
            ))}
          </div>
        )}

        <div className="divide-y">
          {participants.map((p) => {
            const exp = expenses[p.id] || { consumed: 0, paid: 0, drinks: 0 };
            const balance = balances[p.id] || 0;

            return (
              <div key={p.id} className="p-3 flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-500 font-medium">
                      {(p.name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{p.name || "Anonimo"}</p>
                  <p className="text-xs text-slate-500">
                    {exp.drinks} bebidas · Consumió {exp.consumed.toFixed(2)}€ · Pagó{" "}
                    {exp.paid.toFixed(2)}€
                  </p>
                </div>

                {/* Balance */}
                <div
                  className={`text-right ${
                    balance > 0
                      ? "text-green-600"
                      : balance < 0
                      ? "text-red-600"
                      : "text-slate-400"
                  }`}
                >
                  <p className="font-bold">
                    {balance > 0 ? "+" : ""}
                    {balance.toFixed(2)}€
                  </p>
                  <p className="text-xs">
                    {balance > 0 ? "Le deben" : balance < 0 ? "Debe" : "En paz"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transacciones para saldar */}
      {settlements.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-3 bg-slate-50 border-b">
            <h4 className="font-semibold text-slate-800">Para saldar cuentas</h4>
          </div>
          <div className="p-3 space-y-2">
            {settlements.map((s, i) => {
              const from = getParticipant(s.from);
              const to = getParticipant(s.to);

              return (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm"
                >
                  {/* From */}
                  <div className="flex items-center gap-1">
                    {from?.image ? (
                      <img src={from.image} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                        {(from?.name || "?").charAt(0)}
                      </div>
                    )}
                    <span className="font-medium">{from?.name || "?"}</span>
                  </div>

                  {/* Arrow */}
                  <span className="text-slate-400">→</span>

                  {/* To */}
                  <div className="flex items-center gap-1">
                    {to?.image ? (
                      <img src={to.image} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                        {(to?.name || "?").charAt(0)}
                      </div>
                    )}
                    <span className="font-medium">{to?.name || "?"}</span>
                  </div>

                  {/* Amount */}
                  <span className="ml-auto font-bold text-amber-600">{s.amount.toFixed(2)}€</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {drinks.length === 0 && (
        <div className="bg-slate-50 rounded-xl border p-6 text-center text-slate-500">
          <span className="text-3xl block mb-2">🍺</span>
          <p>No hay bebidas registradas todavia</p>
          <p className="text-sm">Registra bebidas en la pestana "Bebidas"</p>
        </div>
      )}
    </div>
  );
}
