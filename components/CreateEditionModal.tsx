"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, Clock, Users, Coins, MapPin } from "lucide-react";
import { toast } from "sonner";
import ShareInviteCode from "./ShareInviteCode";

type TemplateStop = {
    name: string;
    address?: string | null;
};

type CreateEditionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    templateId: string;
    templateName: string;
    templateStartMode?: "manual" | "scheduled" | "all_present";
    templateStops?: TemplateStop[];
    templatePotEnabled?: boolean;
    templatePotAmount?: number | null;
};

export default function CreateEditionModal({
    isOpen,
    onClose,
    templateId,
    templateName,
    templateStartMode = "manual",
    templateStops = [],
    templatePotEnabled = false,
    templatePotAmount = null,
}: CreateEditionModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState(templateName);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [startMode, setStartMode] = useState<"manual" | "scheduled" | "all_present">("manual");
    const [potEnabled, setPotEnabled] = useState(false);
    const [potAmount, setPotAmount] = useState("");

    // Success state
    const [createdRoute, setCreatedRoute] = useState<{ id: string, name: string, inviteCode: string } | null>(null);

    // Reset when opening - heredar valores de la plantilla
    useEffect(() => {
        if (isOpen && !createdRoute) {
            setDate(new Date().toISOString().slice(0, 10)); // Default today
            setStartMode(templateStartMode); // Heredar modo de inicio
            setPotEnabled(templatePotEnabled); // Heredar config de bote
            setPotAmount(templatePotAmount ? templatePotAmount.toString() : "");
            setCreatedRoute(null);
            setName(templateName);
        }
    }, [isOpen, createdRoute, templateName, templateStartMode, templatePotEnabled, templatePotAmount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!date) {
            toast.error("La fecha es obligatoria");
            return;
        }

        setLoading(true);

        try {
            // Combinar fecha y hora
            const dateTime = time
                ? new Date(`${date}T${time}`)
                : new Date(date);

            const body: any = {
                name,
                date: dateTime.toISOString(),
                startMode,
                potEnabled,
            };

            if (startMode === "scheduled" && time) {
                body.startTime = dateTime.toISOString();
            }

            if (potEnabled && potAmount) {
                body.potAmountPerPerson = parseFloat(potAmount);
            }

            const res = await fetch(`/api/routes/${templateId}/create-edition`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (data.ok) {
                toast.success("¡Edición creada exitosamente!");
                // Show Success View
                setCreatedRoute(data.edition);
            } else {
                toast.error(data.error || "Error al crear la edición");
            }
        } catch (error) {
            console.error("Error creating edition:", error);
            toast.error("Error al crear la edición");
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        if (createdRoute) {
            onClose();
            router.push(`/routes/${createdRoute.id}`);
            router.refresh();
        }
    };

    if (!isOpen) return null;

    // --- SUCCESS VIEW (SHARE) ---
    if (createdRoute) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in spin-in-12 duration-500">
                            <Users className="w-10 h-10" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Ruta Creada!</h2>
                            <p className="text-slate-600">
                                Tu edición de <span className="font-bold text-amber-600">"{templateName}"</span> está lista.
                                <br />¡Invita a tus amigos ahora!
                            </p>
                        </div>

                        <div className="text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <ShareInviteCode
                                inviteCode={createdRoute.inviteCode}
                                routeName={createdRoute.name}
                            />
                        </div>

                        <button
                            onClick={handleFinish}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg active:scale-[0.98] text-lg"
                        >
                            Ir a la Ruta &rarr;
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold mb-1">Nueva Edición</h2>
                    <p className="text-amber-100 text-sm">Crear una nueva ruta desde la plantilla</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Preview de bares */}
                    {templateStops.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                                <MapPin className="w-3 h-3" />
                                {templateStops.length} bares en esta ruta
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {templateStops.slice(0, 5).map((stop, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs text-slate-600 border border-slate-200">
                                        <span className="w-4 h-4 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                                        {stop.name}
                                    </span>
                                ))}
                                {templateStops.length > 5 && (
                                    <span className="px-2 py-1 text-xs text-slate-400">+{templateStops.length - 5} más</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Nombre y Fecha en fila */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-sm"
                                placeholder="Nombre"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Fecha <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* Bote Común - DESTACADO */}
                    <div className={`rounded-xl p-4 border-2 transition-all ${potEnabled ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={potEnabled}
                                onChange={(e) => setPotEnabled(e.target.checked)}
                                className="w-5 h-5 text-emerald-500 rounded"
                            />
                            <div className="flex-1">
                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-emerald-600" />
                                    Bote Común
                                </div>
                                <div className="text-xs text-slate-500">Gestionar gastos compartidos</div>
                            </div>
                            {potEnabled && (
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={potAmount}
                                        onChange={(e) => setPotAmount(e.target.value)}
                                        className="w-16 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-center font-bold text-emerald-700"
                                        placeholder="20"
                                    />
                                    <span className="text-emerald-700 font-bold">€</span>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Modo de Inicio */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">
                            Modo de Inicio
                        </label>
                        <div className="space-y-2">
                            <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${startMode === "manual"
                                ? "border-amber-500 bg-amber-50"
                                : "border-slate-200 hover:border-amber-200"
                                }`}>
                                <input
                                    type="radio"
                                    name="startMode"
                                    value="manual"
                                    checked={startMode === "manual"}
                                    onChange={(e) => setStartMode(e.target.value as any)}
                                    className="w-4 h-4 text-amber-500"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-800">Manual</div>
                                    <div className="text-xs text-slate-500">Iniciar cuando quieras</div>
                                </div>
                            </label>

                            <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${startMode === "scheduled"
                                ? "border-amber-500 bg-amber-50"
                                : "border-slate-200 hover:border-amber-200"
                                }`}>
                                <input
                                    type="radio"
                                    name="startMode"
                                    value="scheduled"
                                    checked={startMode === "scheduled"}
                                    onChange={(e) => setStartMode(e.target.value as any)}
                                    className="w-4 h-4 text-amber-500"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-800">Programado</div>
                                    <div className="text-xs text-slate-500">Hora específica de inicio</div>
                                </div>
                            </label>

                            <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${startMode === "all_present"
                                ? "border-amber-500 bg-amber-50"
                                : "border-slate-200 hover:border-amber-200"
                                }`}>
                                <input
                                    type="radio"
                                    name="startMode"
                                    value="all_present"
                                    checked={startMode === "all_present"}
                                    onChange={(e) => setStartMode(e.target.value as any)}
                                    className="w-4 h-4 text-amber-500"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-800">Todos Presentes</div>
                                    <div className="text-xs text-slate-500">Cuando todos lleguen</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Hora de Inicio (solo si es programado) */}
                    {startMode === "scheduled" && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Hora de Inicio
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    )}

                </form>

                {/* Footer */}
                <div className="border-t bg-slate-50 p-4 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
                    >
                        {loading ? "Creando..." : "Crear Edición"}
                    </button>
                </div>
            </div >
        </div >
    );
}
