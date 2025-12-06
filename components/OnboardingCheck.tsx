"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import OnboardingModal from "./OnboardingModal";

export default function OnboardingCheck() {
    const { data: session, status } = useSession();
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (status === "loading") return;

        if (status === "unauthenticated") {
            setIsChecking(false);
            return;
        }

        if (status === "authenticated" && session?.user?.email) {
            // Verificar si ya completo el onboarding
            fetch("/api/user/profile")
                .then(res => res.json())
                // @ts-ignore - profile puede contener onboardingCompleted tras el cambio de esquema
                .then(data => {
                    if (data.ok && data.profile && !data.profile.onboardingCompleted) {
                        setNeedsOnboarding(true);
                    }
                })
                .catch(err => console.error("Error checking onboarding:", err))
                .finally(() => setIsChecking(false));
        }
    }, [status, session]);

    // Mostrar loader bloqueante mientras verificamos sesión o perfil
    if (status === "loading" || (status === "authenticated" && isChecking)) {
        return (
            <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium animate-pulse">Cargando...</p>
            </div>
        );
    }

    if (needsOnboarding) {
        return <OnboardingModal />;
    }

    return null;
}
