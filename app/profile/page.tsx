"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import BottomNavigation from "@/components/BottomNavigation";
import AvatarSelector from "@/components/AvatarSelector";
import PushNotificationManager from "@/components/PushNotificationManager";
import PrivacySettings from "@/components/PrivacySettings";

type Badge = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  isEarned?: boolean;
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
  const [activeTab, setActiveTab] = useState<'progress' | 'settings'>('progress');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const [profileRes, adminRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/admin/check")
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.ok) {
          setProfileData(data);
        }
      }

      if (adminRes.ok) {
        const adminData = await adminRes.json();
        setIsAdmin(adminData.isAdmin);
      }

    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router, fetchProfile]);

  const handleUpdateAvatar = async (avatarUrl: string) => {
    if (!profileData) return;

    // Optimistic update
    setProfileData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        profile: {
          ...prevData.profile,
          image: avatarUrl,
        },
      };
    });
    setShowAvatarSelector(false); // Close modal immediately

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: avatarUrl }),
      });

      if (!res.ok) throw new Error("Error al actualizar avatar");
      toast.success("Avatar actualizado");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar el avatar");
      // Revert optimistic update (reload profile)
      fetchProfile();
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
              title="Cerrar sesión"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex items-center gap-4">
            {/* Avatar a la izquierda */}
            <div className="relative group">
              <div
                className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-lg cursor-pointer transform transition-transform group-hover:scale-105"
                onClick={() => setShowAvatarSelector(true)}
              >
                {profile.image ? (
                  <img
                    src={profile.image}
                    alt={profile.name || "Usuario"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-2xl font-bold">
                    {profile.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                {/* Overlay de edición */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <button
                className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-slate-100 text-slate-600"
                onClick={() => setShowAvatarSelector(true)}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile.name || "Sin nombre"}</h2>
              <p className="text-white/80 text-sm">{profile.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b bg-white sticky top-0 z-10">
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'progress'
            ? 'text-amber-600 border-b-2 border-amber-600'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Progreso
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'settings'
            ? 'text-amber-600 border-b-2 border-amber-600'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Ajustes
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">

        {activeTab === 'progress' && (
          <>
            {/* Level/Experience (Ahora arriba para protagonismo) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-xl">🎮</span>
                Nivel
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

                const titles = ["Novato", "Aprendiz", "Aficionado", "Entusiasta", "Experto", "Maestro", "Leyenda", "Dios de la Birra"];
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

            {/* Badges - Carousel Horizontal */}
            <div className="bg-white rounded-2xl p-4 shadow-sm overflow-hidden">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  Logros ({profile.badges.length})
                </div>
                <span className="text-xs text-slate-400 font-normal">Desliza para ver más →</span>
              </h3>

              {profile.badges.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <p>No se encontraron badges, algo anda mal.</p>
                </div>
              ) : (
                <div className="flex overflow-x-auto pb-2 gap-3 snap-x scrollbar-hide -mx-2 px-2">
                  {profile.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`flex-shrink-0 w-32 snap-center rounded-xl p-3 border flex flex-col items-center text-center transition-all ${badge.isEarned
                        ? "bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 shadow-sm"
                        : "bg-slate-50 border-slate-100 grayscale opacity-60"
                        }`}
                    >
                      <span className="text-4xl block mb-2">{badge.icon}</span>
                      <p className={`font-bold text-xs leading-tight mb-1 ${badge.isEarned ? "text-slate-800" : "text-slate-500"}`}>
                        {badge.name}
                      </p>
                      {/* Description hidden on mobile card to save space, or truncation */}
                      {badge.isEarned && (
                        <p className="text-[10px] text-amber-600 font-medium mt-auto">
                          ¡Conseguido!
                        </p>
                      )}
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {statCards.map((stat) => (
                  <div
                    key={stat.label}
                    className={`${stat.color} rounded-xl p-3 text-center flex flex-col items-center justify-center h-24`}
                  >
                    <span className="text-2xl mb-1">{stat.icon}</span>
                    <p className="text-xl font-bold leading-none">{stat.value}</p>
                    <p className="text-[10px] mt-1 opacity-80">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            {/* Configuracion */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                Configuración
              </h3>

              <div className="space-y-4">
                {/* Auto Check-in */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">Check-in automático</p>
                    <p className="text-xs text-slate-500">
                      Registrar rondas al llegar
                    </p>
                  </div>
                  <button
                    onClick={() => updateSetting("autoCheckinEnabled", !profileData.settings.autoCheckinEnabled)}
                    disabled={savingSettings}
                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${profileData.settings.autoCheckinEnabled
                      ? "bg-amber-500"
                      : "bg-slate-300"
                      } ${savingSettings ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${profileData.settings.autoCheckinEnabled ? "translate-x-5" : ""
                        }`}
                    />
                  </button>
                </div>

                {/* Notificaciones */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">Notificaciones</p>
                    <p className="text-xs text-slate-500">
                      Avisos de rutas y amigos
                    </p>
                  </div>
                  <button
                    onClick={() => updateSetting("notificationsEnabled", !profileData.settings.notificationsEnabled)}
                    disabled={savingSettings}
                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${profileData.settings.notificationsEnabled
                      ? "bg-amber-500"
                      : "bg-slate-300"
                      } ${savingSettings ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${profileData.settings.notificationsEnabled ? "translate-x-5" : ""
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Notificaciones Push */}
            <PushNotificationManager />

            {/* Privacidad y Legales */}
            <PrivacySettings />

            {/* Admin Panel Link */}
            {isAdmin && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-800">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🛡️</span>
                  Administración
                </h3>
                <Link
                  href="/admin/community"
                  className="flex items-center justify-between p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔧</span>
                    <div>
                      <p className="font-medium">Panel de Comunidad</p>
                      <p className="text-xs text-slate-400">Moderación de rutas</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </>
        )}

      </div>

      <BottomNavigation />

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slide-up sm:animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Elige tu Avatar</h2>
              <button
                onClick={() => setShowAvatarSelector(false)}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <AvatarSelector
              currentAvatar={profile.image}
              onSelect={handleUpdateAvatar}
            />
          </div>
        </div>
      )}
    </div>
  );
}
