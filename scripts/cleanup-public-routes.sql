-- Script de limpieza para eliminar rutas públicas incompletas o incorrectas

-- 1. Eliminar rutas públicas que no tienen descripción (ej. pruebas, rutas vacías)
DELETE FROM "Route" 
WHERE "isPublic" = true 
AND "description" IS NULL;

-- 2. Eliminar rutas públicas que no tienen ninguna parada (RouteStop) asociada
-- Esto eliminará las rutas "fantasmas" que aparecen pero no tienen contenido
DELETE FROM "Route" 
WHERE "isPublic" = true 
AND "id" NOT IN (SELECT DISTINCT "routeId" FROM "RouteStop");

-- 3. Opcional: Eliminar rutas públicas antiguas que no sean las nuevas "oficiales" (las que empiezan por 'cl_')
-- Descomentar si se quiere ser más drástico y borrar TODO menos las 3 nuevas de Sevilla
-- DELETE FROM "Route" 
-- WHERE "isPublic" = true 
-- AND "id" NOT LIKE 'cl_%';
