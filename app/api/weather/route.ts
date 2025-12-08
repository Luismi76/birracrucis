import { NextResponse } from 'next/server';

// OpenWeatherMap API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Cache duration: 10 minutes
const CACHE_DURATION = 10 * 60 * 1000;

// Simple in-memory cache
const weatherCache = new Map<string, { data: any; timestamp: number }>();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');

        if (!lat || !lng) {
            return NextResponse.json(
                { error: 'Missing lat or lng parameters' },
                { status: 400 }
            );
        }

        if (!OPENWEATHER_API_KEY) {
            console.warn('OPENWEATHER_API_KEY not configured, returning placeholder data');
            return NextResponse.json({
                temp: 20,
                feelsLike: 19,
                condition: 'Clear',
                icon: '01d',
                humidity: 50,
                windSpeed: 5,
                isPlaceholder: true
            });
        }

        // Check cache
        const cacheKey = `${lat},${lng}`;
        const cached = weatherCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return NextResponse.json({ ...cached.data, fromCache: true });
        }

        // Fetch from OpenWeatherMap API
        const url = `${OPENWEATHER_BASE_URL}?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`OpenWeatherMap API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform to our format
        const weatherData = {
            temp: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            condition: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
            isPlaceholder: false
        };

        // Update cache
        weatherCache.set(cacheKey, {
            data: weatherData,
            timestamp: Date.now()
        });

        // Clean old cache entries (simple cleanup)
        if (weatherCache.size > 100) {
            const oldestKey = weatherCache.keys().next().value;
            weatherCache.delete(oldestKey);
        }

        return NextResponse.json(weatherData);

    } catch (error) {
        console.error('Weather API error:', error);

        // Return placeholder data on error
        return NextResponse.json({
            temp: 20,
            feelsLike: 19,
            condition: 'Unknown',
            icon: '01d',
            humidity: 50,
            windSpeed: 5,
            isPlaceholder: true,
            error: 'Failed to fetch weather data'
        });
    }
}
