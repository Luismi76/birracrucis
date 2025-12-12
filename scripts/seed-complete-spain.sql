-- =========================================================================================
-- MASTER SEED: RUTAS DE ESPAÑA (BIRRACRUCIS) - VERSIÓN CORREGIDA (FORCE UPDATE)
-- =========================================================================================

-- ANDALUCÍA

-- 1. SEVILLA: Clásicos del Centro
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_sevilla_centro_01', 'Sevilla Clásica 🏛️', 'Chacina, solera y siglos de historia en el corazón de la ciudad.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_sev_cen_1', 'cl_sevilla_centro_01', 'Flor de Toranzo', 'C. Jimios, 1, 41001 Sevilla', 37.3876, -5.9956, 0, 2, 30, 0),
('stop_sev_cen_2', 'cl_sevilla_centro_01', 'Casa Morales', 'C. García de Vinuesa, 11, 41001 Sevilla', 37.3866, -5.9947, 1, 2, 40, 0),
('stop_sev_cen_3', 'cl_sevilla_centro_01', 'Las Columnas', 'C. Rodrigo Caro, 1, 41004 Sevilla', 37.3860, -5.9908, 2, 3, 50, 0),
('stop_sev_cen_5', 'cl_sevilla_centro_01', 'El Rinconcillo', 'C. Gerona, 40, 41003 Sevilla', 37.3941, -5.9872, 3, 2, 45, 0)
ON CONFLICT ("id") DO NOTHING;

-- 2. SEVILLA: Triana
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_sevilla_triana_01', 'Triana Pura 💃', 'Arte, pescaíto y vida de barrio al otro lado del río.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_sev_tri_1', 'cl_sevilla_triana_01', 'Las Golondrinas', 'C. Pagés del Corro, 76, 41010 Sevilla', 37.3841, -6.0056, 0, 3, 45, 0),
('stop_sev_tri_2', 'cl_sevilla_triana_01', 'Blanca Paloma', 'C. San Jacinto, 49, 41010 Sevilla', 37.3831, -6.0058, 1, 3, 50, 0),
('stop_sev_tri_3', 'cl_sevilla_triana_01', 'Casa Ruperto', 'Av. Santa Cecilia, 2, 41010 Sevilla', 37.3819, -6.0086, 2, 2, 30, 0)
ON CONFLICT ("id") DO NOTHING;

-- 3. SEVILLA: Alameda
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_sevilla_alameda_01', 'Alameda Alternative 🕶️', 'La zona más moderna y vibrante. Cerveza artesana y fusión.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_sev_ala_1', 'cl_sevilla_alameda_01', 'Duo Tapas', 'C. Calatrava, 10, 41002 Sevilla', 37.4014, -5.9939, 0, 2, 45, 0),
('stop_sev_ala_2', 'cl_sevilla_alameda_01', 'Hops & Dreams', 'C. Jesús del Gran Poder, 83, 41002 Sevilla', 37.3995, -5.9950, 1, 2, 60, 0),
('stop_sev_ala_3', 'cl_sevilla_alameda_01', 'Eslava', 'C. Eslava, 3, 41002 Sevilla', 37.3965, -5.9965, 2, 3, 50, 0)
ON CONFLICT ("id") DO NOTHING;

-- 4. GRANADA: Centro
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_granada_centro_01', 'Granada Tapas XXL 🍺', 'La ciudad donde comer es gratis si pides bebida.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_gra_1', 'cl_granada_centro_01', 'Los Diamantes', 'C. Navas, 28, 18009 Granada', 37.1735, -3.5980, 0, 2, 45, 0),
('stop_gra_2', 'cl_granada_centro_01', 'Bodegas Castañeda', 'C. Almireceros, 1, 18010 Granada', 37.1770, -3.5970, 1, 2, 45, 0),
('stop_gra_3', 'cl_granada_centro_01', 'La Bella y La Bestia', 'Carrera del Darro, 37, 18010 Granada', 37.1780, -3.5930, 2, 2, 50, 0)
ON CONFLICT ("id") DO NOTHING;

-- 5. MÁLAGA: Centro
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_malaga_centro_01', 'Málaga Castiza 🌺', 'Vino dulce, ambiente cosmopolita y mucha vida.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_mal_1', 'cl_malaga_centro_01', 'El Pimpi', 'C. Granada, 62, 29015 Málaga', 36.7215, -4.4170, 0, 2, 60, 0),
('stop_mal_2', 'cl_malaga_centro_01', 'Casa Lola', 'C. Granada, 46, 29015 Málaga', 36.7218, -4.4180, 1, 2, 45, 0)
ON CONFLICT ("id") DO NOTHING;

-- 6. MÁLAGA: Teatinos
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_malaga_teatinos_01', 'Teatinos Universitario 🎓', 'La zona universitaria. Barato, grandes raciones y juventud.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_mal_tea_1', 'cl_malaga_teatinos_01', 'Refugio', 'Av. de Plutarco, 14, 29010 Málaga', 36.7190, -4.4750, 0, 2, 50, 0),
('stop_mal_tea_2', 'cl_malaga_teatinos_01', 'Molly Malone''s', 'Bulevar Louis Pasteur, 9, 29010 Málaga', 36.7180, -4.4730, 1, 2, 60, 0)
ON CONFLICT ("id") DO NOTHING;

-- 7. CÓRDOBA: Judería
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_cordoba_juderia_01', 'Córdoba Califal 🕌', 'Salmorejo y flamenquín a los pies de la Mezquita.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_cor_1', 'cl_cordoba_juderia_01', 'Casa Pepe de la Judería', 'C. Romero, 1, 14003 Córdoba', 37.8798, -4.7801, 0, 2, 50, 0),
('stop_cor_2', 'cl_cordoba_juderia_01', 'Bar Santos', 'C. Magistral González Francés, 3, 14003 Córdoba', 37.8792, -4.7795, 1, 1, 20, 0)
ON CONFLICT ("id") DO NOTHING;

-- 8. CÁDIZ: La Viña
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_cadiz_vina_01', 'Cádiz La Viña 🎭', 'Tortillitas de camarones y carnaval todo el año.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_cad_1', 'cl_cadiz_vina_01', 'Taberna Casa Manteca', 'C. Corralón de los Carros, 66, 11002 Cádiz', 36.5298, -6.3025, 0, 2, 45, 0),
('stop_cad_2', 'cl_cadiz_vina_01', 'El Faro de Cádiz', 'C. San Félix, 15, 11002 Cádiz', 36.5289, -6.3031, 1, 3, 60, 0)
ON CONFLICT ("id") DO NOTHING;

-- 9. HUELVA: Centro
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_huelva_centro_01', 'Huelva Gambitas 🦐', 'Sabor atlántico puro.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_huv_1', 'cl_huelva_centro_01', 'Restaurante Azabache', 'C. Vázquez López, 22, 21001 Huelva', 37.2555, -6.9480, 0, 3, 50, 0),
('stop_huv_2', 'cl_huelva_centro_01', 'Bar Paco Moreno', 'Paseo de la Independencia, 18, 21001 Huelva', 37.2560, -6.9450, 1, 2, 40, 0)
ON CONFLICT ("id") DO NOTHING;

-- 10. JAÉN: Tascas
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_jaen_tascas_01', 'Tascas de Jaén 🦎', 'Tapas gratis legendarias.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_jaen_1', 'cl_jaen_tascas_01', 'Bar Alarcón', 'C. San Clemente, 3, 23001 Jaén', 37.7680, -3.7900, 0, 2, 40, 0)
ON CONFLICT ("id") DO NOTHING;

-- 11. MADRID: La Latina
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_mad_latina_01', 'Domingo de Rastro 🐻', 'El plan por excelencia de Madrid. Cava Baja y Alta.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_mad_lat_1', 'cl_mad_latina_01', 'El Viajero', 'Plaza de la Cebada, 11, 28005 Madrid', 40.4116, -3.7093, 0, 2, 45, 0),
('stop_mad_lat_2', 'cl_mad_latina_01', 'Juana la Loca', 'Pl. Puerta de Moros, 4, 28005 Madrid', 40.4107, -3.7109, 1, 2, 45, 0),
('stop_mad_lat_3', 'cl_mad_latina_01', 'Casa Lucio', 'C. Cava Baja, 35, 28005 Madrid', 40.4125, -3.7082, 2, 2, 60, 0)
ON CONFLICT ("id") DO NOTHING;

-- 12. MADRID: Malasaña
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_mad_malasana_01', 'Malasaña Indie 🎸', 'La Movida, bares con historia musical y copas.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_mad_mal_1', 'cl_mad_malasana_01', 'La Vía Láctea', 'C. Velarde, 18, 28004 Madrid', 40.4265, -3.7025, 0, 2, 50, 0),
('stop_mad_mal_2', 'cl_mad_malasana_01', 'Tupperware', 'Corredera Alta de San Pablo, 26, 28004 Madrid', 40.4260, -3.7030, 1, 2, 45, 0)
ON CONFLICT ("id") DO NOTHING;

-- 13. BARCELONA: Born
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_bcn_born_01', 'Born & Gótico 🏰', 'Encanto medieval, vermut y bares con personalidad.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_bcn_born_1', 'cl_bcn_born_01', 'El Xampanyet', 'Carrer de Montcada, 22, 08003 Barcelona', 41.3840, 2.1810, 0, 2, 40, 0),
('stop_bcn_born_2', 'cl_bcn_born_01', 'Bar del Pla', 'Carrer de Montcada, 2, 08003 Barcelona', 41.3835, 2.1800, 1, 2, 45, 0)
ON CONFLICT ("id") DO NOTHING;

-- 14. SAN SEBASTIÁN
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_donosti_viejo_01', 'Donosti Pintxos 🌟', 'La meca mundial del pintxo. Parte Vieja.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_don_1', 'cl_donosti_viejo_01', 'Bar Nestor', 'Arrandegi Kalea, 11, 20003 Donostia', 43.3230, -1.9840, 0, 1, 30, 0),
('stop_don_2', 'cl_donosti_viejo_01', 'La Cuchara de San Telmo', 'Santa Korda Kalea, 4, 20003 Donostia', 43.3240, -1.9830, 1, 2, 40, 0)
ON CONFLICT ("id") DO NOTHING;

-- 15. BILBAO
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_bilbao_casco_01', 'Bilbao Siete Calles 🦁', 'Txakoli y pintxos en la Plaza Nueva.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_bil_1', 'cl_bilbao_casco_01', 'Gure Toki', 'Plaza Nueva, 12, 48005 Bilbao', 43.2590, -2.9240, 0, 2, 40, 0),
('stop_bil_2', 'cl_bilbao_casco_01', 'Bar Bacaicoa', 'Plaza Miguel de Unamuno, 2, 48005 Bilbao', 43.2580, -2.9230, 1, 2, 35, 0)
ON CONFLICT ("id") DO NOTHING;

-- 16. SANTIAGO
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_santiago_franco_01', 'Rúa do Franco 🐚', 'La meta del camino. Pulpo, pimientos y ribeiro.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_san_1', 'cl_santiago_franco_01', 'Bar La Tita', 'Rúa Nova, 46, 15705 Santiago de Compostela', 42.8790, -8.5440, 0, 2, 40, 0)
ON CONFLICT ("id") DO NOTHING;

-- 17. LEÓN: Húmedo
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_leon_humedo_01', 'Barrio Húmedo 🦁', 'Tapas gratis. Morcilla, cecina y cortos.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_leo_1', 'cl_leon_humedo_01', 'La Bicha', 'Pl. San Martín, 4, 24003 León', 42.5970, -5.5680, 0, 2, 35, 0)
ON CONFLICT ("id") DO NOTHING;

-- 18. VALENCIA: Carmen
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_valencia_carmen_01', 'El Carmen 🦇', 'Agua de Valencia y tapas en callejuelas con encanto.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_val_1', 'cl_valencia_carmen_01', 'Tasquita La Estrecha', 'Pl. Lope de Vega, 9, 46001 Valencia', 39.4740, -0.3760, 0, 2, 40, 0)
ON CONFLICT ("id") DO NOTHING;

-- 19. ZARAGOZA: El Tubo
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_zaragoza_tubo_01', 'El Tubo Maño 🦁', 'Migas, champiñones y ambiente aragonés único.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_zar_1', 'cl_zaragoza_tubo_01', 'El Champi', 'C. Libertad, 16, 50003 Zaragoza', 41.6520, -0.8790, 0, 2, 40, 0)
ON CONFLICT ("id") DO NOTHING;

-- 20. BADAJOZ, TOLEDO, MURCIA...
-- Asegurándonos de que todo el mundo está invitado a la fiesta 🥳

INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_toledo_casco_01', 'Toledo Imperial ⚔️', 'Carcamusas y vinos en la ciudad de las tres culturas.', true, true, 'manual', 'active', NOW())
ON CONFLICT ("id") DO UPDATE SET "isPublic" = true, "status" = 'active', "createdAt" = NOW();

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds") VALUES 
('stop_tol_1', 'cl_toledo_casco_01', 'Bar Ludeña', 'Pl. de la Magdalena, 10, 45001 Toledo', 39.8570, -4.0230, 0, 2, 45, 0)
ON CONFLICT ("id") DO NOTHING;
