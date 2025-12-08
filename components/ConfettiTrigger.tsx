"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

type ConfettiTriggerProps = {
    trigger: boolean;
    type?: "achievement" | "completion" | "celebration";
};

export default function ConfettiTrigger({ trigger, type = "celebration" }: ConfettiTriggerProps) {
    const [hasTriggered, setHasTriggered] = useState(false);

    useEffect(() => {
        if (!trigger || hasTriggered) return;

        setHasTriggered(true);

        switch (type) {
            case "achievement":
                // Confeti dorado desde abajo
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.8 },
                    colors: ["#FFD700", "#FFA500", "#FF8C00"],
                });
                break;

            case "completion":
                // Explosión grande desde el centro
                const duration = 3000;
                const end = Date.now() + duration;

                const frame = () => {
                    confetti({
                        particleCount: 2,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors: ["#00ff00", "#00cc00", "#009900"],
                    });
                    confetti({
                        particleCount: 2,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors: ["#00ff00", "#00cc00", "#009900"],
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                };
                frame();
                break;

            case "celebration":
            default:
                // Confeti multicolor desde arriba
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.4 },
                });
                break;
        }

        // Reset después de 5 segundos
        setTimeout(() => setHasTriggered(false), 5000);
    }, [trigger, type, hasTriggered]);

    return null;
}
