"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { compressImage, getDataUrlSize } from "@/lib/image-utils";
import { toast } from "sonner";

type AvatarSelectorProps = {
    currentAvatar?: string | null;
    onSelect: (avatarUrl: string) => void;
};

// Colección de avatares divertidos (DiceBear - Lorelei & Adventurer)
// Usamos URLs estáticas para evitar hidratación fallida si son aleatorias
const PRESET_AVATARS = [
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Felix&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Buddy&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Aneka&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe&backgroundColor=d1d4f9",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Milo&backgroundColor=ffd5dc",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Cuddles&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Bella&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver&backgroundColor=ffdfbf",
];

export default function AvatarSelector({ currentAvatar, onSelect }: AvatarSelectorProps) {
    const [selected, setSelected] = useState<string | null>(currentAvatar || null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePresetClick = (url: string) => {
        setSelected(url);
        onSelect(url);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen es muy grande. Máximo 5MB.");
            return;
        }

        setUploading(true);
        try {
            // Comprimimos la imagen para que sea ligera (avatar pequeño)
            const compressed = await compressImage(file, {
                maxWidth: 400,
                maxHeight: 400,
                quality: 0.8,
                format: "jpeg",
            });

            setSelected(compressed);
            onSelect(compressed);
            toast.success("Foto subida correctamente");
        } catch (err) {
            console.error("Error procesando imagen:", err);
            toast.error("Error al procesar la imagen");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* 1. Vista previa central */}
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative w-32 h-32 rounded-full ring-4 ring-amber-500/30 overflow-hidden shadow-xl bg-white">
                    {selected ? (
                        <img
                            src={selected}
                            alt="Avatar seleccionado"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                            <span className="text-4xl text-center">?</span>
                        </div>
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                        </div>
                    )}
                </div>
                <p className="text-sm font-medium text-slate-600">Tu Avatar Actual</p>
            </div>

            {/* 2. Seleccionar de Presets */}
            <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 block">Elige uno divertido:</h3>
                <div className="grid grid-cols-4 gap-3">
                    {PRESET_AVATARS.map((url, i) => (
                        <button
                            key={i}
                            onClick={() => handlePresetClick(url)}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${selected === url
                                    ? "border-amber-500 ring-2 ring-amber-500/30 scale-105"
                                    : "border-slate-100 hover:border-slate-300"
                                }`}
                        >
                            <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                            {selected === url && (
                                <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                    <div className="bg-white rounded-full p-1 shadow-sm">
                                        <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. O subir foto propia */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-slate-500">o sube tu foto</span>
                </div>
            </div>

            <div className="flex justify-center">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Subir desde galería
                </button>
            </div>
        </div>
    );
}
