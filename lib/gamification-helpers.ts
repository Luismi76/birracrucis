// Helper function to record beer/drink consumption (usa modelo Drink internamente)
export async function recordBeerConsumption(
    routeId: string,
    userId: string,
    stopId: string,
    count: number = 1
): Promise<boolean> {
    try {
        const response = await fetch(`/api/routes/${routeId}/beers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                stopId,
                count,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to record beer consumption');
        }

        return true;
    } catch (error) {
        console.error('Error recording beer consumption:', error);
        return false;
    }
}

// Helper function to award an achievement
export async function awardAchievement(
    routeId: string,
    userId: string,
    achievementId: string
): Promise<boolean> {
    try {
        // En producción real, esto llamaría a un endpoint que verifica reglas y otorga badges
        // Por ahora, simulamos la llamada o usamos un endpoint genérico de badges
        const response = await fetch(`/api/users/${userId}/badges`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                badgeId: achievementId,
                routeId,
            }),
        });

        if (!response.ok) {
            // No lanzamos error para no interrumpir el flujo principal, solo log
            console.warn(`Failed to award achievement ${achievementId}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error(`Error awarding achievement ${achievementId}:`, error);
        return false;
    }
}
