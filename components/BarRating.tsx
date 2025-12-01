"use client";

import { useState, useEffect } from "react";

type Rating = {
  id: string;
  rating: number;
  comment: string | null;
  user: { id: string; name: string | null; image: string | null };
  stop: { id: string; name: string };
};

type BarRatingProps = {
  routeId: string;
  stopId: string;
  stopName: string;
  currentUserId?: string;
};

export default function BarRating({
  routeId,
  stopId,
  stopName,
  currentUserId,
}: BarRatingProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [myRating, setMyRating] = useState<number>(0);
  const [myComment, setMyComment] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await fetch(`/api/routes/${routeId}/ratings?stopId=${stopId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            setRatings(data.ratings);
            // Calcular media
            const avg = data.averages.find(
              (a: { stopId: string; _avg: { rating: number } }) => a.stopId === stopId
            );
            if (avg) {
              setAverage(avg._avg.rating);
            }
            // Buscar mi valoración
            const mine = data.ratings.find((r: Rating) => r.user.id === currentUserId);
            if (mine) {
              setMyRating(mine.rating);
              setMyComment(mine.comment || "");
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching ratings:", err);
      }
    };

    fetchRatings();
  }, [routeId, stopId, currentUserId]);

  const handleSubmit = async () => {
    if (myRating === 0 || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/routes/${routeId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stopId,
          rating: myRating,
          comment: myComment || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          // Actualizar lista
          setRatings((prev) => {
            const filtered = prev.filter((r) => r.user.id !== currentUserId);
            return [data.rating, ...filtered];
          });
          // Recalcular media
          const newRatings = ratings.filter((r) => r.user.id !== currentUserId);
          newRatings.push(data.rating);
          const sum = newRatings.reduce((acc, r) => acc + r.rating, 0);
          setAverage(sum / newRatings.length);
          setShowForm(false);
        }
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setMyRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`text-2xl transition-transform ${
              interactive ? "hover:scale-110 cursor-pointer" : "cursor-default"
            }`}
          >
            {star <= displayRating ? "⭐" : "☆"}
          </button>
        ))}
      </div>
    );
  };

  const hasRated = ratings.some((r) => r.user.id === currentUserId);

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-slate-800 flex items-center gap-2">
          <span className="text-xl">⭐</span>
          Valoracion
        </h4>
        {average !== null && (
          <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg">
            <span className="text-yellow-600 font-bold">{average.toFixed(1)}</span>
            <span className="text-xs text-yellow-700">({ratings.length})</span>
          </div>
        )}
      </div>

      {/* Mi valoración o botón para valorar */}
      {!showForm && !hasRated && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-yellow-300 rounded-xl text-yellow-600 font-medium hover:bg-yellow-50 transition-colors"
        >
          Valorar este bar
        </button>
      )}

      {hasRated && !showForm && (
        <div className="bg-yellow-50 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tu valoracion:</p>
              {renderStars(myRating)}
              {myComment && (
                <p className="text-sm text-slate-600 mt-1 italic">"{myComment}"</p>
              )}
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-yellow-600 hover:underline"
            >
              Editar
            </button>
          </div>
        </div>
      )}

      {/* Formulario de valoración */}
      {showForm && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">Como estuvo {stopName}?</p>
            {renderStars(myRating, true)}
          </div>

          <textarea
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="Comentario opcional..."
            className="w-full p-3 border rounded-lg resize-none h-20"
            maxLength={200}
          />

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={myRating === 0 || submitting}
              className="flex-1 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50"
            >
              {submitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Otras valoraciones */}
      {ratings.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Valoraciones del grupo
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {ratings
              .filter((r) => r.user.id !== currentUserId)
              .slice(0, 5)
              .map((rating) => (
                <div
                  key={rating.id}
                  className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg"
                >
                  {rating.user.image ? (
                    <img
                      src={rating.user.image}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-sm">
                      {rating.user.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {rating.user.name || "Anonimo"}
                      </span>
                      <span className="text-yellow-500 text-sm">
                        {"⭐".repeat(rating.rating)}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="text-xs text-slate-500 italic">
                        "{rating.comment}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
