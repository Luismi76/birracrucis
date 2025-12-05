"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import OnboardingModal from "./OnboardingModal";

export default function OnboardingCheck() {
    const { data: session, status } = useSession();
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    useEffect(() => {
        if (status === "authenticated" && session?.user?.email) {
            // Verificar si ya completo el onboarding
            // Como no tenemos el campo en la sesion (aun), consultamos al API
            // O podemos actualizar el callback de sesion, pero eso requiere relogin.
            // Mejor consultamos una vez.
            fetch("/api/user/profile")
                .then(res => res.json())
                // @ts-ignore - profile puede contener onboardingCompleted tras el cambio de esquema
                .then(data => {
                    // Asumimos que el backend devolvera este campo en 'profile'
                    if (data.ok && data.profile && !data.profile.onboardingCompleted) {
                        setNeedsOnboarding(true);
                    }
                })
                .catch(err => console.error("Error checking onboarding:", err));
        }
    }, [status, session]);

    if (needsOnboarding) {
        return <OnboardingModal />;
    }

    return null;
}
