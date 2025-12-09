// Challenge templates for dynamic generation
// Each bar will get 2 random challenges from these templates

export type ChallengeType = 'photo' | 'speed' | 'specialty' | 'social' | 'hidden';

export type ChallengeTemplate = {
    type: ChallengeType;
    title: string;
    description: string;
    points: number;
};

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
    // PHOTO CHALLENGES (50 points)
    {
        type: 'photo',
        title: 'Foto con el camarero',
        description: 'Hazte una foto con el camarero o camarera del bar',
        points: 50,
    },
    {
        type: 'photo',
        title: 'Selfie grupal',
        description: 'Haz un selfie con todo el grupo en el bar',
        points: 50,
    },
    {
        type: 'photo',
        title: 'Foto de la cerveza',
        description: 'Captura la cerveza especial del bar',
        points: 50,
    },
    {
        type: 'photo',
        title: 'Foto del ambiente',
        description: 'Captura algo único o especial de este bar',
        points: 50,
    },

    // SPEED CHALLENGES (75 points)
    {
        type: 'speed',
        title: 'Llegada rápida',
        description: 'Llega al bar en menos de 10 minutos desde el anterior',
        points: 75,
    },
    {
        type: 'speed',
        title: 'Primera ronda express',
        description: 'Pide la primera ronda en menos de 5 minutos',
        points: 75,
    },
    {
        type: 'speed',
        title: 'Check-in veloz',
        description: 'Sé el primero en hacer check-in en este bar',
        points: 75,
    },

    // SPECIALTY CHALLENGES (30 points)
    {
        type: 'specialty',
        title: 'Prueba la especialidad',
        description: 'Pide la cerveza o tapa especial de la casa',
        points: 30,
    },
    {
        type: 'specialty',
        title: 'Cerveza local',
        description: 'Pide una cerveza artesanal o local del bar',
        points: 30,
    },
    {
        type: 'specialty',
        title: 'Tapa nueva',
        description: 'Prueba una tapa que nunca hayas probado antes',
        points: 30,
    },
    {
        type: 'specialty',
        title: 'Recomendación del chef',
        description: 'Pide la recomendación especial del día',
        points: 30,
    },

    // SOCIAL CHALLENGES (40 points)
    {
        type: 'social',
        title: 'Charla con locales',
        description: 'Inicia una conversación con otro grupo del bar',
        points: 40,
    },
    {
        type: 'social',
        title: 'Consejo del camarero',
        description: 'Pregunta al camarero por su recomendación personal',
        points: 40,
    },
    {
        type: 'social',
        title: 'Historia del bar',
        description: 'Descubre y comparte una historia interesante del bar',
        points: 40,
    },
    {
        type: 'social',
        title: 'Brindis grupal',
        description: 'Organiza un brindis con todo el grupo',
        points: 40,
    },

    // HIDDEN CHALLENGES (100 points)
    {
        type: 'hidden',
        title: 'Secreto del bar',
        description: 'Descubre algo secreto u oculto del bar',
        points: 100,
    },
    {
        type: 'hidden',
        title: 'Detalle escondido',
        description: 'Encuentra un detalle decorativo único o escondido',
        points: 100,
    },
    {
        type: 'hidden',
        title: 'Menú secreto',
        description: 'Descubre si hay un menú o bebida secreta',
        points: 100,
    },
];

// Helper function to generate random challenges for a stop
export function generateChallengesForStop(
    routeId: string,
    stopId: string,
    count: number = 2
): Omit<any, 'id' | 'createdAt'>[] {
    // Shuffle templates
    const shuffled = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);

    // Ensure variety - don't pick same type twice
    const selected: ChallengeTemplate[] = [];
    const usedTypes = new Set<ChallengeType>();

    for (const template of shuffled) {
        if (selected.length >= count) break;

        // Prefer different types, but allow repeats if needed
        if (!usedTypes.has(template.type) || selected.length === shuffled.length - 1) {
            selected.push(template);
            usedTypes.add(template.type);
        }
    }

    // Map to database format
    return selected.map(template => ({
        routeId,
        stopId,
        userId: null, // Challenge for everyone
        type: template.type,
        title: template.title,
        description: template.description,
        points: template.points,
        completed: false,
        completedAt: null,
        completedBy: null,
    }));
}
