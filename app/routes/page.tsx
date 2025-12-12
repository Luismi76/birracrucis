"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import ActiveRoutesTab from "@/components/routes/ActiveRoutesTab";
import CommunityTab from "@/components/routes/CommunityTab";
import HistoryTab from "@/components/routes/HistoryTab";
import { cn } from "@/lib/utils";

type Tab = "active" | "community" | "history";

function RoutesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab;
  const [activeTab, setActiveTab] = useState<Tab>(tabParam || "active");

  // Update URL when tab changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  // Sync state if URL changes (e.g. back button)
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24 min-h-screen bg-slate-50/30">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Hub de Rutas
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Planifica, descubre y recuerda
          </p>
        </div>
        <UserMenu />
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-100 p-1 rounded-xl flex mb-6 shadow-inner">
        <button
          onClick={() => handleTabChange("active")}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2",
            activeTab === "active"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          <span>📍</span> <span className="hidden sm:inline">Mis Planes</span>
          <span className="sm:hidden">Planes</span>
        </button>
        <button
          onClick={() => handleTabChange("community")}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2",
            activeTab === "community"
              ? "bg-white text-purple-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          <span>🌍</span> <span className="hidden sm:inline">Comunidad</span>
          <span className="sm:hidden">Explorar</span>
        </button>
        <button
          onClick={() => handleTabChange("history")}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2",
            activeTab === "history"
              ? "bg-white text-amber-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          <span>📜</span> <span className="hidden sm:inline">Historial</span>
          <span className="sm:hidden">Pasado</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="min-h-[400px]">
        {activeTab === "active" && <ActiveRoutesTab />}
        {activeTab === "community" && <CommunityTab />}
        {activeTab === "history" && <HistoryTab />}
      </div>

    </div>
  );
}

export default function RoutesPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
      <RoutesContent />
    </Suspense>
  );
}
