"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets } from "lucide-react";

type WeatherData = {
    temp: number;
    feelsLike: number;
    condition: string;
    description?: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    isPlaceholder?: boolean;
};

type WeatherWidgetProps = {
    lat: number;
    lng: number;
};

export default function WeatherWidget({ lat, lng }: WeatherWidgetProps) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchWeather() {
            try {
                setLoading(true);
                setError(false);

                const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch weather');
                }

                const data = await response.json();
                setWeather(data);
            } catch (err) {
                console.error('Weather fetch error:', err);
                setError(true);
                // Set placeholder data on error
                setWeather({
                    temp: 20,
                    feelsLike: 19,
                    condition: 'Unknown',
                    icon: '01d',
                    humidity: 50,
                    windSpeed: 5,
                    isPlaceholder: true
                });
            } finally {
                setLoading(false);
            }
        }

        fetchWeather();
    }, [lat, lng]);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-3 animate-shimmer">
                <div className="h-16" />
            </div>
        );
    }

    if (!weather) return null;

    const getWeatherIcon = () => {
        const iconCode = weather.icon;

        // OpenWeatherMap icon codes
        if (iconCode.startsWith('01')) return <Sun className="w-8 h-8 text-amber-500 dark:text-amber-400" />;
        if (iconCode.startsWith('02') || iconCode.startsWith('03') || iconCode.startsWith('04'))
            return <Cloud className="w-8 h-8 text-slate-500 dark:text-slate-400" />;
        if (iconCode.startsWith('09') || iconCode.startsWith('10'))
            return <CloudRain className="w-8 h-8 text-blue-500 dark:text-blue-400" />;
        if (iconCode.startsWith('13'))
            return <CloudSnow className="w-8 h-8 text-slate-400 dark:text-slate-300" />;

        return <Cloud className="w-8 h-8 text-slate-500 dark:text-slate-400" />;
    };

    return (
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-3">
            <div className="flex items-center justify-between">
                {/* Icono y temperatura */}
                <div className="flex items-center gap-3">
                    {getWeatherIcon()}
                    <div>
                        <p className="text-2xl font-black text-sky-900 dark:text-sky-100">{weather.temp}°C</p>
                        <p className="text-xs text-sky-600 dark:text-sky-400">
                            {weather.description || weather.condition}
                            {weather.isPlaceholder && ' (estimado)'}
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="text-right space-y-1">
                    <div className="flex items-center gap-1 text-xs text-sky-700 dark:text-sky-300">
                        <Wind className="w-3 h-3" />
                        <span>{weather.windSpeed} km/h</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-sky-700 dark:text-sky-300">
                        <Droplets className="w-3 h-3" />
                        <span>{weather.humidity}%</span>
                    </div>
                </div>
            </div>

            {error && (
                <p className="text-[10px] text-sky-500 dark:text-sky-400 mt-2 text-center">
                    No se pudo obtener el clima actual
                </p>
            )}
        </div>
    );
}
