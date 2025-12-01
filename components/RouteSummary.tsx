"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  name: string | null;
  image: string | null;
};

type Award = {
  title: string;
  emoji: string;
  winner: User;
  value: string;
};

type BarRating = {
  stop: { id: string; name: string };
  avgRating: number | null;
  totalRatings: number;
};

type Summary = {
  route: {
    id: string;
    name: string;
    date: string;
    status: string;
    creator: User;
  };
  stats: {
    totalStops: number;
    totalParticipants: number;
    totalDrinks: number;
    totalPhotos: number;
    totalMessages: number;
  };
  participants: User[];
  drinksByUser: { user: User; count: number; types: Record<string, number> }[];
  drinksPaidByUser: { user: User; count: number }[];
  barRatings: BarRating[];
  bestBar: BarRating | null;
  worstBar: BarRating | null;
  awards: Award[];
  photos: { id: string; imageUrl: string; stop: { name: string } }[];
};

type RouteSummaryProps = {
  routeId: string;
  onClose: () => void;
};

export default function RouteSummary({ routeId, onClose }: RouteSummaryProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [newBadges, setNewBadges] = useState<{ name: string; icon: string }[]>([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/routes/${routeId}/summary`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            setSummary(data.summary);
          }
        }

        // Check for new badges
        const badgeRes = await fetch("/api/badges/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ routeId }),
        });
        if (badgeRes.ok) {
          const badgeData = await badgeRes.json();
          if (badgeData.ok && badgeData.newBadges.length > 0) {
            setNewBadges(badgeData.newBadges);
          }
        }
      } catch (err) {
        console.error("Error fetching summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [routeId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto" />
          <p className="mt-4 text-slate-600">Generando resumen...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const renderStars = (rating: number) => {
    return "⭐".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="text-6xl block mb-2">🎉</span>
            <h2 className="text-2xl font-bold">Ruta Completada!</h2>
            <p className="text-white/80">{summary.route.name}</p>
            <p className="text-sm text-white/60">
              {new Date(summary.route.date).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* New Badges */}
            {newBadges.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-4 border-2 border-yellow-300">
                <h3 className="font-bold text-amber-800 mb-3 text-center">
                  🏆 Nuevos Logros Desbloqueados!
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {newBadges.map((badge, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl p-3 shadow-sm text-center animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <span className="text-3xl block">{badge.icon}</span>
                      <p className="text-sm font-medium text-slate-800">{badge.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.stats.totalStops}</p>
                <p className="text-xs text-blue-700">Bares</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{summary.stats.totalParticipants}</p>
                <p className="text-xs text-green-700">Participantes</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{summary.stats.totalDrinks}</p>
                <p className="text-xs text-amber-700">Bebidas</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-pink-600">{summary.stats.totalPhotos}</p>
                <p className="text-xs text-pink-700">Fotos</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center col-span-2">
                <p className="text-2xl font-bold text-purple-600">{summary.stats.totalMessages}</p>
                <p className="text-xs text-purple-700">Mensajes en el chat</p>
              </div>
            </div>

            {/* Awards */}
            {summary.awards.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-800 mb-3">🏅 Premios de la Noche</h3>
                <div className="space-y-2">
                  {summary.awards.map((award, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-3"
                    >
                      <span className="text-3xl">{award.emoji}</span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{award.title}</p>
                        <p className="text-sm text-slate-500">{award.value}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {award.winner.image ? (
                          <img
                            src={award.winner.image}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center font-bold">
                            {award.winner.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <span className="font-medium text-sm">{award.winner.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bar Ratings */}
            <div>
              <h3 className="font-bold text-slate-800 mb-3">⭐ Valoraciones de Bares</h3>
              <div className="space-y-2">
                {summary.barRatings.map((bar) => (
                  <div
                    key={bar.stop.id}
                    className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{bar.stop.name}</p>
                      {bar.avgRating !== null && (
                        <p className="text-sm text-yellow-500">
                          {renderStars(bar.avgRating)}
                        </p>
                      )}
                    </div>
                    {bar.avgRating !== null ? (
                      <div className="text-right">
                        <p className="text-xl font-bold text-amber-600">
                          {bar.avgRating.toFixed(1)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {bar.totalRatings} votos
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Sin valorar</p>
                    )}
                  </div>
                ))}
              </div>

              {summary.bestBar && summary.bestBar.avgRating !== null && (
                <div className="mt-3 bg-green-50 rounded-lg p-3 flex items-center gap-2">
                  <span className="text-2xl">🥇</span>
                  <div>
                    <p className="text-sm text-green-700">Mejor bar de la noche</p>
                    <p className="font-bold text-green-800">{summary.bestBar.stop.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Drink Ranking */}
            {summary.drinksByUser.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-800 mb-3">🍺 Ranking de Bebidas</h3>
                <div className="space-y-2">
                  {summary.drinksByUser.slice(0, 5).map((item, i) => (
                    <div
                      key={item.user.id}
                      className="flex items-center gap-3 bg-slate-50 rounded-lg p-2"
                    >
                      <span className="text-xl w-8">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
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
                        <p className="font-medium text-sm">{item.user.name || "Anonimo"}</p>
                      </div>
                      <span className="font-bold text-amber-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos Preview */}
            {summary.photos.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-800 mb-3">📸 Fotos de la Noche</h3>
                <div className="grid grid-cols-3 gap-2">
                  {summary.photos.slice(0, 6).map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.imageUrl}
                      alt=""
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
                {summary.photos.length > 6 && (
                  <p className="text-center text-sm text-slate-500 mt-2">
                    +{summary.photos.length - 6} fotos mas
                  </p>
                )}
              </div>
            )}

            {/* Participants */}
            <div>
              <h3 className="font-bold text-slate-800 mb-3">👥 Participantes</h3>
              <div className="flex flex-wrap gap-2">
                {summary.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1"
                  >
                    {p.image ? (
                      <img src={p.image} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-xs">
                        {p.name?.charAt(0) || "?"}
                      </div>
                    )}
                    <span className="text-sm">{p.name || "Anonimo"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={() => {
                const text = `Completamos la ruta "${summary.route.name}" con ${summary.stats.totalParticipants} personas, ${summary.stats.totalStops} bares y ${summary.stats.totalDrinks} bebidas! 🍺🎉 #BirracrUcis`;
                if (navigator.share) {
                  navigator.share({ text });
                } else {
                  navigator.clipboard.writeText(text);
                  alert("Texto copiado al portapapeles!");
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Compartir Resumen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
