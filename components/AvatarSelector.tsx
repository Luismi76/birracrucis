"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { compressImage, getDataUrlSize } from "@/lib/image-utils";
import { toast } from "sonner";

type AvatarSelectorProps = {
    currentAvatar?: string | null;
    onSelect: (avatarUrl: string) => void;
};

const AVATAR_STYLES = ['adventurer', 'bottts', 'fun-emoji', 'micah', 'open-peeps', 'personas', 'avataaars'];
const SEEDS = ['Felix', 'Aneka', 'Milo', 'Cuddles', 'Chloe', 'Oliver', 'Bella', 'Jack', 'Sam', 'Sassy', 'Happy', 'Buddy', 'Coco', 'Rocky', 'Lola'];
const BG_COLORS = ['b6e3f4', 'c0aede', 'ffdfbf', 'ffd5dc', 'd1d4f9', 'c9ebc2'];

// Generamos muchos avatares combinando estilos y semillas
const GENERATED_AVATARS = AVATAR_STYLES.flatMap(style =>
    SEEDS.slice(0, 8).map(seed => {
        const bg = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
        return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${bg}`;
    })
);

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
        <div className="flex flex-col h-[70vh] md:h-auto">
            {/* 1. Vista previa fija arriba */}
            <div className="flex-none flex flex-col items-center justify-center gap-2 mb-4 pb-4 border-b">
                <div className="relative w-24 h-24 rounded-full ring-4 ring-amber-500/30 overflow-hidden shadow-xl bg-white">
                    {selected ? (
                        <img src={selected} alt="Avatar seleccionado" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                            <span className="text-3xl font-bold">?</span>
                        </div>
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                        </div>
                    )}
                </div>
                <p className="text-xs font-medium text-slate-500">Tu Avatar</p>
            </div>

            {/* 2. Scrollable Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                <h3 className="text-sm font-bold text-slate-800 mb-2 sticky top-0 bg-white z-10 py-1">Elige uno divertido:</h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {GENERATED_AVATARS.map((url, i) => (
                        <button
                            key={i}
                            onClick={() => handlePresetClick(url)}
                            className={`relative aspect-square rounded-xl overflow-hidden border transition-all active:scale-95 ${selected === url
                                ? "border-amber-500 ring-2 ring-amber-500/30"
                                : "border-slate-100"
                                }`}
                        >
                            <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" loading="lazy" />
                            {selected === url && (
                                <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                    <div className="bg-white rounded-full p-0.5 shadow-sm">
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

            {/* 3. Botón de subida fijo abajo */}
            <div className="flex-none pt-4 mt-2 border-t bg-white">
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Subir foto propia
                </button>
            </div>
        </div>
    );
}
