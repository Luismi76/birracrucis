"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PushNotificationManager from "@/components/PushNotificationManager";

type Badge = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
};

type Settings = {
  autoCheckinEnabled: boolean;
  notificationsEnabled: boolean;
};

type ProfileData = {
  profile: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    badges: Badge[];
  };
  settings: Settings;
  stats: {
    routesCreated: number;
    routesParticipated: number;
    completedRoutes: number;
    barsVisited: number;
    totalDrinks: number;
    drinksPaid: number;
    totalPhotos: number;
    totalRatings: number;
  };
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setProfileData(data);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof Settings, value: boolean) => {
    if (!profileData) return;

    // Optimistic update
    setProfileData({
      ...profileData,
      settings: {
        ...profileData.settings,
        [key]: value,
      },
    });

    setSavingSettings(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const data = await res.json();
      if (!data.ok) {
        // Revert on error
        setProfileData({
          ...profileData,
          settings: {
            ...profileData.settings,
            [key]: !value,
          },
        });
      }
    } catch (err) {
      console.error("Error updating setting:", err);
      // Revert on error
      setProfileData({
        ...profileData,
        settings: {
          ...profileData.settings,
          [key]: !value,
        },
      });
    } finally {
      setSavingSettings(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center">
        <p className="text-slate-600">Error al cargar el perfil</p>
      </div>
    );
  }

  const { profile, stats } = profileData;

  const statCards = [
    { label: "Rutas creadas", value: stats.routesCreated, icon: "🗺️", color: "bg-blue-100 text-blue-700" },
    { label: "Rutas participadas", value: stats.routesParticipated, icon: "👥", color: "bg-green-100 text-green-700" },
    { label: "Rutas completadas", value: stats.completedRoutes, icon: "✅", color: "bg-emerald-100 text-emerald-700" },
    { label: "Bares visitados", value: stats.barsVisited, icon: "🍺", color: "bg-amber-100 text-amber-700" },
    { label: "Bebidas tomadas", value: stats.totalDrinks, icon: "🥤", color: "bg-orange-100 text-orange-700" },
    { label: "Rondas pagadas", value: stats.drinksPaid, icon: "💰", color: "bg-yellow-100 text-yellow-700" },
    { label: "Fotos tomadas", value: stats.totalPhotos, icon: "📸", color: "bg-pink-100 text-pink-700" },
    { label: "Valoraciones", value: stats.totalRatings, icon: "⭐", color: "bg-purple-100 text-purple-700" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/routes"
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold">Mi Perfil</h1>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Cerrar sesion"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex items-center gap-4">
            {profile.image ? (
              <img
                src={profile.image}
                alt=""
                className="w-20 h-20 rounded-full border-4 border-white/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center text-3xl font-bold">
                {profile.name?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{profile.name || "Sin nombre"}</h2>
              <p className="text-white/80 text-sm">{profile.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Badges */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            Logros ({profile.badges.length})
          </h3>

          {profile.badges.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <p className="text-4xl mb-2">🎯</p>
              <p>Aun no tienes logros</p>
              <p className="text-sm">Participa en rutas para desbloquearlos!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {profile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-3 border border-yellow-200"
                >
                  <span className="text-3xl block mb-1">{badge.icon}</span>
                  <p className="font-bold text-slate-800 text-sm">{badge.name}</p>
                  <p className="text-xs text-slate-500">{badge.description}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {new Date(badge.earnedAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-xl">📊</span>
            Estadisticas
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className={`${stat.color} rounded-xl p-3 text-center`}
              >
                <span className="text-2xl block">{stat.icon}</span>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Level/Experience (calculado) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-xl">🎮</span>
            Nivel de Cervecero
          </h3>

          {(() => {
            const xp =
              stats.routesCreated * 50 +
              stats.routesParticipated * 20 +
              stats.completedRoutes * 30 +
              stats.barsVisited * 10 +
              stats.totalDrinks * 5 +
              stats.drinksPaid * 15 +
              stats.totalPhotos * 10 +
              stats.totalRatings * 5;

            const level = Math.floor(xp / 100) + 1;
            const xpInLevel = xp % 100;
            const xpForNext = 100;

            const titles = [
              "Novato",
              "Aprendiz",
              "Aficionado",
              "Entusiasta",
              "Experto",
              "Maestro",
              "Leyenda",
              "Dios de la Birra",
            ];
            const title = titles[Math.min(level - 1, titles.length - 1)];

            return (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-3xl font-bold text-amber-600">Nivel {level}</p>
                    <p className="text-slate-600">{title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">XP Total</p>
                    <p className="text-xl font-bold text-slate-800">{xp}</p>
                  </div>
                </div>
                <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${(xpInLevel / xpForNext) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1 text-center">
                  {xpInLevel} / {xpForNext} XP para el siguiente nivel
                </p>
              </div>
            );
          })()}
        </div>

        {/* Configuracion */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            Configuracion
          </h3>

          <div className="space-y-4">
            {/* Auto Check-in */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-slate-800">Check-in automatico</p>
                <p className="text-xs text-slate-500">
                  Registrar rondas automaticamente cuando llegas a un bar
                </p>
              </div>
              <button
                onClick={() => updateSetting("autoCheckinEnabled", !profileData.settings.autoCheckinEnabled)}
                disabled={savingSettings}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  profileData.settings.autoCheckinEnabled
                    ? "bg-amber-500"
                    : "bg-slate-300"
                } ${savingSettings ? "opacity-50" : ""}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                    profileData.settings.autoCheckinEnabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {/* Notificaciones */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-slate-800">Notificaciones</p>
                <p className="text-xs text-slate-500">
                  Recibir avisos de tus amigos y rutas
                </p>
              </div>
              <button
                onClick={() => updateSetting("notificationsEnabled", !profileData.settings.notificationsEnabled)}
                disabled={savingSettings}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  profileData.settings.notificationsEnabled
                    ? "bg-amber-500"
                    : "bg-slate-300"
                } ${savingSettings ? "opacity-50" : ""}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                    profileData.settings.notificationsEnabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notificaciones Push */}
        <PushNotificationManager />

      </div>
    </div>
  );
}
