"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-slate-200",
                className
            )}
        />
    );
}

// Skeleton para el mapa
export function MapSkeleton() {
    return (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Cargando mapa...</p>
            </div>
        </div>
    );
}

// Skeleton para tarjeta de bar
export function BarCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            {/* Progress */}
            <Skeleton className="h-8 w-full rounded-xl" />
            {/* Buttons */}
            <div className="flex gap-2">
                <Skeleton className="h-12 flex-1 rounded-xl" />
                <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>
        </div>
    );
}

// Skeleton para lista de bares en RouteEditor
export function BarListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="w-16 h-6 rounded-full" />
                </div>
            ))}
        </div>
    );
}

// Skeleton para galería de fotos
export function PhotoGallerySkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
        </div>
    );
}

// Skeleton para lista de participantes
export function ParticipantsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="w-12 h-5 rounded-full" />
                </div>
            ))}
        </div>
    );
}

// Skeleton para el chat
export function ChatSkeleton() {
    return (
        <div className="space-y-3 p-4">
            {/* Mensaje del otro */}
            <div className="flex gap-2 items-end">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-12 w-48 rounded-xl rounded-bl-none" />
                </div>
            </div>
            {/* Mensaje propio */}
            <div className="flex gap-2 items-end justify-end">
                <Skeleton className="h-10 w-32 rounded-xl rounded-br-none bg-amber-100" />
            </div>
            {/* Otro mensaje */}
            <div className="flex gap-2 items-end">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-36 rounded-xl rounded-bl-none" />
                </div>
            </div>
        </div>
    );
}

// Skeleton para la página de rutas
export function RouteListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="w-16 h-6 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full" />
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Skeleton para el progreso de la ruta
export function RouteProgressSkeleton() {
    return (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between">
                <Skeleton className="h-4 w-20 bg-white/30" />
                <Skeleton className="h-6 w-24 bg-white/30" />
            </div>
            <Skeleton className="h-3 w-full rounded-full bg-white/30" />
            <div className="flex justify-between">
                <Skeleton className="h-3 w-16 bg-white/30" />
                <Skeleton className="h-3 w-16 bg-white/30" />
                <Skeleton className="h-3 w-16 bg-white/30" />
            </div>
        </div>
    );
}
