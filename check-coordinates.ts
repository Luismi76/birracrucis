// Script para verificar coordenadas en la base de datos
import { prisma } from './lib/prisma';

async function checkCoordinates() {
  console.log('🔍 Verificando coordenadas en la base de datos...\n');

  const allStops = await prisma.routeStop.findMany({
    select: {
      id: true,
      name: true,
      lat: true,
      lng: true,
      googlePlaceId: true,
      route: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(`Total de bares en la BD: ${allStops.length}\n`);

  // Verificar coordenadas inválidas
  const invalidStops = allStops.filter((stop) => {
    const isNaN = Number.isNaN(stop.lat) || Number.isNaN(stop.lng);
    const isZero = stop.lat === 0 && stop.lng === 0;
    const outOfRange =
      stop.lat < -90 || stop.lat > 90 || stop.lng < -180 || stop.lng > 180;
    return isNaN || isZero || outOfRange;
  });

  if (invalidStops.length > 0) {
    console.log(`❌ Encontrados ${invalidStops.length} bares con coordenadas inválidas:\n`);
    invalidStops.forEach((stop) => {
      console.log(`  - ${stop.name} (Ruta: ${stop.route.name})`);
      console.log(`    ID: ${stop.id}`);
      console.log(`    Coordenadas: ${stop.lat}, ${stop.lng}`);
      console.log(`    Google Place ID: ${stop.googlePlaceId || 'N/A'}\n`);
    });
  } else {
    console.log('✅ Todas las coordenadas son válidas\n');
  }

  // Verificar cuántos tienen googlePlaceId
  const withPlaceId = allStops.filter((stop) => stop.googlePlaceId).length;
  console.log(`📍 Bares con Google Place ID: ${withPlaceId}/${allStops.length}`);
  console.log(`📍 Bares sin Google Place ID: ${allStops.length - withPlaceId}/${allStops.length}\n`);

  // Mostrar algunos ejemplos de coordenadas
  console.log('📊 Ejemplos de coordenadas guardadas:');
  allStops.slice(0, 5).forEach((stop) => {
    console.log(`  - ${stop.name}: (${stop.lat}, ${stop.lng})`);
  });

  await prisma.$disconnect();
}

checkCoordinates().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
