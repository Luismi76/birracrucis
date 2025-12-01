// Hooks centralizados para la aplicación
export { useGeolocation, calculateDistance, GEOLOCATION_CONSTANTS } from "./useGeolocation";
export type { GeolocationPosition } from "./useGeolocation";

export { useParticipants, useUpdateLocation } from "./useParticipants";
export type { Participant } from "./useParticipants";

export { useDrinks, useAddDrink } from "./useDrinks";
export type { Drink } from "./useDrinks";

export { useRatings, useAddRating } from "./useRatings";
export type { Rating } from "./useRatings";

export { usePhotos, useUploadPhoto } from "./usePhotos";
export type { Photo } from "./usePhotos";
