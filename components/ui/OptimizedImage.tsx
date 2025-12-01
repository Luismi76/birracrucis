"use client";

import { useState, useEffect, useRef } from "react";

type OptimizedImageProps = {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    priority?: boolean; // Si es true, carga inmediatamente
    onClick?: () => void;
};

/**
 * Componente de imagen optimizado para móviles
 * - Lazy loading nativo
 * - Fade-in suave al cargar
 * - Placeholder de blur mientras carga
 * - IntersectionObserver para cargar solo cuando es visible
 */
export default function OptimizedImage({
    src,
    alt,
    className = "",
    width,
    height,
    priority = false,
    onClick,
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (priority) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: "50px", // Precargar 50px antes de que sea visible
                threshold: 0.01,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [priority]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${className}`}
            style={{ width, height }}
            onClick={onClick}
        >
            {/* Placeholder/skeleton mientras carga */}
            <div
                className={`absolute inset-0 bg-slate-200 animate-pulse transition-opacity duration-300 ${
                    isLoaded ? "opacity-0" : "opacity-100"
                }`}
            />

            {/* Imagen con error fallback */}
            {hasError ? (
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                </div>
            ) : (
                isInView && (
                    <img
                        src={src}
                        alt={alt}
                        loading={priority ? "eager" : "lazy"}
                        decoding="async"
                        onLoad={handleLoad}
                        onError={handleError}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                            isLoaded ? "opacity-100" : "opacity-0"
                        }`}
                    />
                )
            )}
        </div>
    );
}
