"use client";

import { useState } from "react";
import AvatarSelector from "./AvatarSelector";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Este componente sera invocado si el usuario no ha completado el onboarding
export default function OnboardingModal() {
    const [step, setStep] = useState<"name" | "avatar">("name");
    const [name, setName] = useState("");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const handleNext = () => {
        if (!name.trim()) {
            toast.error("Por favor, introduce tu nombre");
            return;
        }
        setStep("avatar");
    };

    const handleComplete = async () => {
        if (!avatar) {
            toast.error("Por favor, elige un avatar");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name,
                    image: avatar,
                    onboardingCompleted: true,
                }),
            });

            if (res.ok) {
                toast.success("¡Bienvenido a bordo! 🍻");
                // Forzar recarga para que el check de onboarding desaparezca
                window.location.reload();
            } else {
                throw new Error("Error al guardar perfil");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error al guardar. Inténtalo de nuevo.");
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-up">
                {step === "name" ? (
                    <div className="space-y-6">
                        <div className="text-center">
                            <span className="text-4xl mb-2 block">👋</span>
                            <h2 className="text-2xl font-bold text-slate-800">¡Hola! ¿Cómo te llamas?</h2>
                            <p className="text-slate-500">Para que tus amigos puedan reconocerte.</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Tu nombre o apodo"
                                className="w-full px-6 py-4 text-xl text-center font-bold border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors placeholder:text-slate-300 placeholder:font-normal"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                            />
                            <button
                                onClick={handleNext}
                                disabled={!name.trim()}
                                className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-amber-200"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center">
                            <span className="text-4xl mb-2 block">🎨</span>
                            <h2 className="text-2xl font-bold text-slate-800">Elige tu Look</h2>
                            <p className="text-slate-500">Selecciona o sube tu avatar.</p>
                        </div>

                        <div className="max-h-[60vh] overflow-hidden flex flex-col">
                            {/* Usamos el AvatarSelector existente pero controlando la altura desde aqui */}
                            <div className="flex-1 overflow-hidden">
                                <AvatarSelector currentAvatar={avatar} onSelect={setAvatar} />
                            </div>
                        </div>

                        <button
                            onClick={handleComplete}
                            disabled={!avatar || saving}
                            className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-amber-200"
                        >
                            {saving ? "Guardando..." : "¡Empezar!"}
                        </button>

                        <button
                            onClick={() => setStep("name")}
                            className="w-full text-slate-400 text-sm font-medium hover:text-slate-600"
                        >
                            Volver atrás
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
