"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, Clock, Users, Coins } from "lucide-react";
import { toast } from "sonner";

type CreateEditionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    templateId: string;
    templateName: string;
};

export default function CreateEditionModal({
    isOpen,
    onClose,
    templateId,
    templateName,
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

    // New state for invitations
    const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState("");

    const handleAddEmail = () => {
        const email = emailInput.trim();
        if (email && email.includes('@') && !invitedEmails.includes(email)) {
            setInvitedEmails([...invitedEmails, email]);
            setEmailInput("");
        }
    };

    const handleRemoveEmail = (email: string) => {
        setInvitedEmails(invitedEmails.filter(e => e !== email));
    };

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
                invitedEmails, // Send invited emails
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
                router.push(`/routes/${data.edition.id}`);
                router.refresh();
                onClose();
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

    if (!isOpen) return null;

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
                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Nombre de la Ruta
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ej: Birracrucis de Navidad"
                            required
                        />
                    </div>

                    {/* Fecha */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Fecha *
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            required
                        />
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

                    {/* Bote Común */}
                    <div className="border-t pt-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={potEnabled}
                                onChange={(e) => setPotEnabled(e.target.checked)}
                                className="w-5 h-5 text-amber-500 rounded"
                            />
                            <div className="flex-1">
                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                    <Coins className="w-4 h-4" />
                                    Activar Bote Común
                                </div>
                                <div className="text-xs text-slate-500">Para gestionar gastos compartidos</div>
                            </div>
                        </label>

                        {potEnabled && (
                            <div className="mt-3">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Cantidad por persona (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={potAmount}
                                    onChange={(e) => setPotAmount(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ej: 20.00"
                                />
                            </div>
                        )}
                    </div>

                    {/* Invitaciones */}
                    <div className="border-t pt-4">
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Invitar Amigos <span className="font-normal text-slate-400 text-xs">(Opcional)</span>
                        </label>

                        <div className="flex gap-2 mb-3">
                            <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddEmail();
                                    }
                                }}
                                placeholder="Email del amigo..."
                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-sm"
                            />
                            <button
                                type="button"
                                onClick={handleAddEmail}
                                disabled={!emailInput.includes('@')}
                                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors disabled:opacity-50"
                            >
                                Añadir
                            </button>
                        </div>

                        {/* Lista de emails */}
                        {invitedEmails.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {invitedEmails.map((email) => (
                                    <div key={email} className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-sm text-amber-800">
                                        <span>{email}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveEmail(email)}
                                            className="text-amber-500 hover:text-amber-700 rounded-full hover:bg-amber-100 p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>


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
