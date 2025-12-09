"use client";

import { Trophy, Camera, Clock, Target, Users, Zap } from "lucide-react";

type PointsInfoProps = {
    onClose: () => void;
};

export default function PointsInfo({ onClose }: PointsInfoProps) {
    const pointsSystem = [
        {
            category: "Desafíos",
            icon: Trophy,
            color: "amber",
            items: [
                { name: "Foto con el camarero", points: 50, icon: Camera },
                { name: "Selfie grupal", points: 50, icon: Camera },
                { name: "Llegada rápida (< 10 min)", points: 75, icon: Clock },
                { name: "Primera ronda express", points: 75, icon: Clock },
                { name: "Prueba la especialidad", points: 30, icon: Target },
                { name: "Cerveza local", points: 30, icon: Target },
                { name: "Charla con locales", points: 40, icon: Users },
                { name: "Brindis grupal", points: 40, icon: Users },
                { name: "Secreto del bar", points: 100, icon: Zap },
                { name: "Menú secreto", points: 100, icon: Zap },
            ],
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Sistema de Puntos</h2>
                            <p className="text-sm text-purple-100">Cómo ganar puntos</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {pointsSystem.map((category) => {
                        const CategoryIcon = category.icon;
                        return (
                            <div key={category.category}>
                                <div className="flex items-center gap-2 mb-4">
                                    <CategoryIcon className={`w-5 h-5 text-${category.color}-600`} />
                                    <h3 className="font-bold text-slate-800">{category.category}</h3>
                                </div>

                                <div className="space-y-2">
                                    {category.items.map((item) => {
                                        const ItemIcon = item.icon;
                                        return (
                                            <div
                                                key={item.name}
                                                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                                        <ItemIcon className="w-4 h-4 text-slate-600" />
                                                    </div>
                                                    <span className="text-sm text-slate-700">{item.name}</span>
                                                </div>
                                                <span className="font-bold text-amber-600">+{item.points}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Info adicional */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-900 font-medium mb-2">💡 Consejo</p>
                        <p className="text-xs text-amber-800">
                            Completa desafíos con foto para ganar puntos extra y crear recuerdos únicos de tu ruta. ¡Los puntos se acumulan en tu perfil!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
