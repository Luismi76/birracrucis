-- Script CORRECTO para insertar rutas públicas en Sevilla
-- Ejecutar en la consola SQL de Neon/Postgres

-- 1. Ruta: Clásicos del Centro
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_sevilla_centro_01', 'Clásicos del Centro 🏛️', 'La esencia de Sevilla. Solera, chacina y lugares con siglos de historia.', true, true, 'manual', 'pending', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds")
VALUES 
('stop_cen_1', 'cl_sevilla_centro_01', 'Bodeguita Antonio Romero', 'C. Antonia Díaz, 19, 41001 Sevilla', 37.3872, -5.9982, 0, 3, 45, 0),
('stop_cen_2', 'cl_sevilla_centro_01', 'Flor de Toranzo', 'C. Jimios, 1, 41001 Sevilla', 37.3876, -5.9956, 1, 2, 30, 0),
('stop_cen_3', 'cl_sevilla_centro_01', 'Casa Morales', 'C. García de Vinuesa, 11, 41001 Sevilla', 37.3866, -5.9947, 2, 2, 40, 0),
('stop_cen_4', 'cl_sevilla_centro_01', 'Bodega Santa Cruz "Las Columnas"', 'C. Rodrigo Caro, 1, 41004 Sevilla', 37.3860, -5.9908, 3, 3, 50, 0),
('stop_cen_5', 'cl_sevilla_centro_01', 'El Rinconcillo', 'C. Gerona, 40, 41003 Sevilla', 37.3941, -5.9872, 4, 2, 45, 0);


-- 2. Ruta: Triana Pura
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_sevilla_triana_01', 'Triana Pura 💃', 'Cruza el puente y vive el barrio. Pescaíto, mercado y arte.', true, true, 'manual', 'pending', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds")
VALUES 
('stop_tri_1', 'cl_sevilla_triana_01', 'Las Golondrinas', 'C. Pagés del Corro, 76, 41010 Sevilla', 37.3841, -6.0056, 0, 3, 45, 0),
('stop_tri_2', 'cl_sevilla_triana_01', 'Blanca Paloma', 'C. San Jacinto, 49, 41010 Sevilla', 37.3831, -6.0058, 1, 3, 50, 0),
('stop_tri_3', 'cl_sevilla_triana_01', 'Mercado de Triana', 'C. San Jorge, 6, 41010 Sevilla', 37.3857, -6.0036, 2, 2, 40, 0),
('stop_tri_4', 'cl_sevilla_triana_01', 'Taberna Miami', 'C. San Jacinto, 21, 41010 Sevilla', 37.3843, -6.0043, 3, 2, 40, 0),
('stop_tri_5', 'cl_sevilla_triana_01', 'Casa Ruperto', 'Av. Santa Cecilia, 2, 41010 Sevilla', 37.3819, -6.0086, 4, 2, 30, 0);


-- 3. Ruta: Alameda Vibes
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_sevilla_alameda_01', 'Alameda Vibes 🕶️', 'Fusión y modernidad en la zona más alternativa de la ciudad.', true, true, 'manual', 'pending', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds")
VALUES 
('stop_ala_1', 'cl_sevilla_alameda_01', 'Eslava', 'C. Eslava, 3, 41002 Sevilla', 37.3965, -5.9965, 0, 3, 50, 0),
('stop_ala_2', 'cl_sevilla_alameda_01', 'Bar Antojo', 'C. Calatrava, 44, 41002 Sevilla', 37.4029, -5.9949, 1, 2, 45, 0),
('stop_ala_3', 'cl_sevilla_alameda_01', 'Duo Tapas', 'C. Calatrava, 10, 41002 Sevilla', 37.4014, -5.9939, 2, 2, 45, 0),
('stop_ala_4', 'cl_sevilla_alameda_01', 'La Niña Bonita', 'C. Calatrava, 5, 41002 Sevilla', 37.3986, -5.9961, 3, 2, 40, 0),
('stop_ala_5', 'cl_sevilla_alameda_01', 'Hops & Dreams', 'C. Jesús del Gran Poder, 83, 41002 Sevilla', 37.3995, -5.9950, 4, 2, 60, 0);
