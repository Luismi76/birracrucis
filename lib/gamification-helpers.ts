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
