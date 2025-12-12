-- RUTA MASIVA DE CIUDADES ESPAÑOLAS
-- Copia y pega en tu consola SQL

-- ==========================================
-- ANDALUCÍA (Resto)
-- ==========================================

-- JAÉN: Tascas y Catedral
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_jaen_centro_01', 'Jaén de Tascas 🦎', 'La capital del Santo Reino. Tapas gratis con cada bebida.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_jan_1', 'cl_jaen_centro_01', 'Bar Alarcón', 'C. San Clemente, 3, 23001 Jaén', 37.7680, -3.7900, 0, 2, 40, 0),
('stop_jan_2', 'cl_jaen_centro_01', 'La Manchega', 'C. Bernardo López, 8, 23001 Jaén', 37.7670, -3.7910, 1, 2, 45, 0);

-- ALMERÍA: Cherigan y Tapas
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_almeria_centro_01', 'Almería Indalo 🏜️', 'Ruta por el centro buscando el mejor Cherigan de la ciudad.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_alm_1', 'cl_almeria_centro_01', 'Casa Puga', 'C. Jovellanos, 7, 04003 Almería', 36.8390, -2.4640, 0, 2, 50, 0),
('stop_alm_2', 'cl_almeria_centro_01', 'El Quinto Toro', 'C. Juan Leal, 6, 04003 Almería', 36.8400, -2.4630, 1, 2, 40, 0);

-- MÁLAGA: Pimpi y Centro
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_malaga_centro_01', 'Málaga La Bella 🌺', 'Vino dulce, pescaíto y ambiente cosmopolita ceca de Larios.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_mal_1', 'cl_malaga_centro_01', 'El Pimpi', 'C. Granada, 62, 29015 Málaga', 36.7215, -4.4170, 0, 2, 60, 0),
('stop_mal_2', 'cl_malaga_centro_01', 'Casa Lola', 'C. Granada, 46, 29015 Málaga', 36.7218, -4.4180, 1, 2, 45, 0);


-- ==========================================
-- EXTREMADURA
-- ==========================================

-- BADAJOZ: Casco Antiguo
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_badajoz_centro_01', 'Badajoz Frontera 🏰', 'Jamón, quesos y tostadas en el corazón de Extremadura.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_bad_1', 'cl_badajoz_centro_01', 'La Corchuela', 'C. Meléndez Valdés, 12, 06002 Badajoz', 38.8780, -6.9700, 0, 2, 45, 0),
('stop_bad_2', 'cl_badajoz_centro_01', 'Bar El Tronco', 'C. Muñoz Torrero, 16, 06002 Badajoz', 38.8785, -6.9710, 1, 2, 40, 0);


-- ==========================================
-- CASTILLA - LA MANCHA
-- ==========================================

-- TOLEDO: Imperial
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_toledo_casco_01', 'Toledo Imperial ⚔️', 'Carcamusas y vinos en callejuelas con siglos de historia.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_tol_1', 'cl_toledo_casco_01', 'Bar Ludeña', 'Pl. de la Magdalena, 10, 45001 Toledo', 39.8570, -4.0230, 0, 2, 45, 0),
('stop_tol_2', 'cl_toledo_casco_01', 'Cervecería El Trébol', 'C. de Sta. Fe, 1, 45001 Toledo', 39.8580, -4.0220, 1, 2, 40, 0);


-- ==========================================
-- COMUNIDAD VALENCIANA
-- ==========================================

-- VALENCIA: Carmen y Ruzafa
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_valencia_carmen_01', 'El Carmen Clásico 🦇', 'Agua de Valencia y tapas en el barrio milenario.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_val_1', 'cl_valencia_carmen_01', 'Tasquita La Estrecha', 'Pl. Lope de Vega, 9, 46001 Valencia', 39.4740, -0.3760, 0, 2, 40, 0),
('stop_val_2', 'cl_valencia_carmen_01', 'Bodega La Pascuala', 'C. Eugenia Viñes, 177, 46011 Valencia', 39.4650, -0.3300, 1, 2, 50, 0); -- Un poco lejos pero clásico

INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_valencia_ruzafa_01', 'Ruzafa Moderno 🎨', 'El barrio de moda, tardeo y cosmopolitismo.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_val_ruz_1', 'cl_valencia_ruzafa_01', 'Ubik Café', 'C. del Literato Azorín, 13, 46006 Valencia', 39.4620, -0.3730, 0, 2, 45, 0),
('stop_val_ruz_2', 'cl_valencia_ruzafa_01', 'Olhöps Craft Beer', 'C. Sueca, 21, 46006 Valencia', 39.4610, -0.3750, 1, 2, 45, 0);


-- ==========================================
-- CASTILLA Y LEÓN
-- ==========================================

-- ZAMORA: Zona de Lobos
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_zamora_lobos_01', 'Zamora Zona Lobos 🐺', 'Pinchos morunos legendarios en los alrededores de Santa Clara.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_zam_1', 'cl_zamora_lobos_01', 'El Lobo', 'C. Horno de San Cipriano, s/n, 49003 Zamora', 41.5030, -5.7440, 0, 2, 30, 0),
('stop_zam_2', 'cl_zamora_lobos_01', 'El Caballero', 'C. Flores de San Pablo, 4, 49003 Zamora', 41.5032, -5.7445, 1, 2, 30, 0);

-- LEÓN: Barrio Húmedo
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_leon_humedo_01', 'León Húmedo 🦁', 'La catedral del tapeo. Morcilla, cecina y cortos de cerveza.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_leo_1', 'cl_leon_humedo_01', 'La Bicha', 'Pl. San Martín, 4, 24003 León', 42.5970, -5.5680, 0, 2, 35, 0),
('stop_leo_2', 'cl_leon_humedo_01', 'El Rebote', 'Pl. San Martín, 9, 24003 León', 42.5972, -5.5682, 1, 2, 35, 0);


-- ==========================================
-- GALICIA
-- ==========================================

-- SANTIAGO: Rúa do Franco
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_santiago_franco_01', 'Santiago O Franco 🐚', 'Vino turbio y pulpo tras llegar a la plaza del Obradoiro.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_san_1', 'cl_santiago_franco_01', 'Bar La Tita', 'Rúa Nova, 46, 15705 Santiago de Compostela', 42.8790, -8.5440, 0, 2, 40, 0),
('stop_san_2', 'cl_santiago_franco_01', 'O Gato Negro', 'Rúa da Raíña, s/n, 15705 Santiago de Compostela', 42.8785, -8.5450, 1, 2, 40, 0);

-- VIGO: Casco Vello
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_vigo_vello_01', 'Vigo Casco Vello ⚓', 'Ostras en A Pedra y vinos en la plaza de la Constitución.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_vig_1', 'cl_vigo_vello_01', 'Taberna A Pedra', 'Rúa das Ostras, 2, 36202 Vigo', 42.2380, -8.7250, 0, 2, 40, 0),
('stop_vig_2', 'cl_vigo_vello_01', 'La Aldeana', 'Rúa Real, 8, 36202 Vigo', 42.2390, -8.7260, 1, 2, 40, 0);


-- ==========================================
-- CANTABRIA & PAÍS VASCO
-- ==========================================

-- SANTANDER: Cañadío
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_santander_centro_01', 'Santander Cañadío 🌊', 'Rabas y vinos en la plaza más animada de la ciudad.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_snt_1', 'cl_santander_centro_01', 'Cañadío', 'Pl. Cañadío, 5, 39003 Santander', 43.4620, -3.8030, 0, 2, 45, 0),
('stop_snt_2', 'cl_santander_centro_01', 'Bodega del Riojano', 'C. Río de la Pila, 5, 39003 Santander', 43.4630, -3.8020, 1, 2, 50, 0);

-- BILBAO: Casco Viejo
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_bilbao_casco_01', 'Bilbao Seven Streets 🦁', 'Pintxos de alta cocina en el corazón histórico. Txakoli time.', true, true, 'manual', 'pending', NOW()) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_bil_1', 'cl_bilbao_casco_01', 'Bar Bacaicoa', 'Plaza Miguel de Unamuno, 2, 48005 Bilbao', 43.2580, -2.9230, 0, 2, 40, 0),
('stop_bil_2', 'cl_bilbao_casco_01', 'Gure Toki', 'Plaza Nueva, 12, 48005 Bilbao', 43.2590, -2.9240, 1, 2, 40, 0),
('stop_bil_3', 'cl_bilbao_casco_01', 'Sorginzulo', 'Plaza Nueva, 12, 48005 Bilbao', 43.2591, -2.9241, 1, 2, 40, 0);
