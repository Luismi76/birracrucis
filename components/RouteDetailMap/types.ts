export type Stop = {
    id: string;
    name: string;
    address: string | null;
    lat: number;
    lng: number;
    plannedRounds: number;
    actualRounds: number;
    maxRounds: number | null;
    googlePlaceId?: string | null;
};

export type Participant = {
    odId: string;
    id: string;
    name: string | null;
    image: string | null;
    lat: number;
    lng: number;
    lastSeenAt: string | null;
    isGuest?: boolean;
};
