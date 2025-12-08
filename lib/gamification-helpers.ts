// Helper function to record beer consumption
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

// Helper function to award achievement
export async function awardAchievement(
    routeId: string,
    userId: string,
    type: string,
    metadata?: any
): Promise<boolean> {
    try {
        const response = await fetch(`/api/routes/${routeId}/achievements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                type,
                metadata,
            }),
        });

        if (!response.ok) {
            // Achievement might already exist, that's ok
            if (response.status === 409) {
                return false;
            }
            throw new Error('Failed to award achievement');
        }

        return true;
    } catch (error) {
        console.error('Error awarding achievement:', error);
        return false;
    }
}

// Helper function to add reaction
export async function addReaction(
    routeId: string,
    userId: string,
    stopId: string,
    type: 'fire' | 'heart' | 'thumbs_up' | 'party' | 'star'
): Promise<boolean> {
    try {
        const response = await fetch(`/api/routes/${routeId}/reactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                stopId,
                type,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to add reaction');
        }

        return true;
    } catch (error) {
        console.error('Error adding reaction:', error);
        return false;
    }
}

// Helper function to create prediction
export async function createPrediction(
    routeId: string,
    userId: string,
    type: string,
    prediction: any
): Promise<boolean> {
    try {
        const response = await fetch(`/api/routes/${routeId}/predictions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                type,
                prediction,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create prediction');
        }

        return true;
    } catch (error) {
        console.error('Error creating prediction:', error);
        return false;
    }
}
