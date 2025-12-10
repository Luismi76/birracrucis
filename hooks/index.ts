// Hooks centralizados para la aplicación
export { useGeolocation, calculateDistance, GEOLOCATION_CONSTANTS } from "./useGeolocation";
export type { GeolocationPosition } from "./useGeolocation";

export { useDrinks, useAddDrink } from "./useDrinks";
export type { Drink } from "./useDrinks";

export { useDrinkStats } from "./useDrinkStats";
export type { DrinkStats } from "./useDrinkStats";

export { useRatings, useAddRating } from "./useRatings";
export type { Rating } from "./useRatings";

export { usePhotos, useUploadPhoto } from "./usePhotos";
export type { Photo } from "./usePhotos";

export { usePot, useSpendFromPot } from "./usePot";
export type { PotData } from "./usePot";
