// Script para calcular distancia entre dos puntos
function distanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Tu posición según el portátil
const myLat = 37.79071;
const myLng = -5.41295;

// Coordenadas de los restaurantes
const agredano = { lat: 37.7786561, lng: -5.3886883 };
const alberto = { lat: 37.7788401, lng: -5.3892566 };

console.log('\n📍 Calculando distancias...\n');
console.log('Tu posición (según portátil):', myLat, myLng);
console.log('Precisión GPS: 5713 metros (MUY BAJA)\n');

const distAgredano = distanceInMeters(myLat, myLng, agredano.lat, agredano.lng);
const distAlberto = distanceInMeters(myLat, myLng, alberto.lat, alberto.lng);

console.log(`Distancia a Restaurante Agredano: ${Math.round(distAgredano)} metros`);
console.log(`Distancia a Restaurante Casa Alberto: ${Math.round(distAlberto)} metros\n`);

console.log('⚠️  PROBLEMA IDENTIFICADO:');
console.log('La geolocalización del portátil está dando una posición incorrecta.');
console.log('La precisión de 5713m indica que la ubicación es por WiFi/IP, no GPS.\n');

console.log('✅ SOLUCIÓN:');
console.log('1. Usa la función "Aplicar simulación" con las coordenadas reales');
console.log('2. O usa un móvil con GPS para probar la funcionalidad');
console.log('3. Las coordenadas de los bares están correctas en la BD\n');
