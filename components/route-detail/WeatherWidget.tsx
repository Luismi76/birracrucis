"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, CloudSnow, Wind } from "lucide-react";

type WeatherData = {
    temp: number;
    description: string;
    icon: string;
    humidity: number;
    rainChance: number;
};

type WeatherWidgetProps = {
    lat: number;
    lng: number;
};

export default function WeatherWidget({ lat, lng }: WeatherWidgetProps) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Integrar con OpenWeatherMap API
        // Por ahora, datos de ejemplo
        setTimeout(() => {
            setWeather({
                temp: 18,
                description: "Parcialmente nublado",
                icon: "partly-cloudy",
                humidity: 65,
                rainChance: 20,
            });
            setLoading(false);
        }, 1000);
    }, [lat, lng]);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-3 animate-pulse">
                <div className="h-16 bg-sky-100 rounded" />
            </div>
        );
    }

    if (!weather) return null;

    const getWeatherIcon = () => {
        if (weather.rainChance > 50) return <CloudRain className="w-8 h-8 text-blue-500" />;
        if (weather.temp > 25) return <Sun className="w-8 h-8 text-amber-500" />;
        if (weather.temp < 10) return <CloudSnow className="w-8 h-8 text-slate-400" />;
        return <Cloud className="w-8 h-8 text-slate-500" />;
    };

    return (
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
                {/* Icono y temperatura */}
                <div className="flex items-center gap-3">
                    {getWeatherIcon()}
                    <div>
                        <p className="text-2xl font-black text-sky-900">{weather.temp}°C</p>
                        <p className="text-xs text-sky-600">{weather.description}</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="text-right space-y-1">
                    <div className="flex items-center gap-1 text-xs text-sky-700">
                        <CloudRain className="w-3 h-3" />
                        <span>{weather.rainChance}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-sky-700">
                        <Wind className="w-3 h-3" />
                        <span>{weather.humidity}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
