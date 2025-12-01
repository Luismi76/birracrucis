"use client";

type TabType = "route" | "photos" | "ratings" | "group";

type RouteTabsProps = {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
};

const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "route", label: "Ruta", icon: "🗺️" },
    { id: "photos", label: "Fotos", icon: "📸" },
    { id: "ratings", label: "Valorar", icon: "⭐" },
    { id: "group", label: "Grupo", icon: "👥" },
];

export default function RouteTabs({ activeTab, onTabChange }: RouteTabsProps) {
    return (
        <div className="flex bg-slate-100 rounded-xl p-1">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all touch-target ${
                        activeTab === tab.id
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    }`}
                    aria-selected={activeTab === tab.id}
                    role="tab"
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>
    );
}

export type { TabType };
