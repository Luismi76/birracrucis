-- Nuevas rutas oficiales para Madrid, Córdoba, Cádiz y Huelva (VARIAS POR CIUDAD)
-- Ejecutar en SQL

-- ==========================================
-- MADRID
-- ==========================================

-- 1. Madrid: La Latina
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_madrid_latina_01', 'La Latina Tapeo 🐻', 'Domingo de Rastro, cañas en la Cava Baja y atardeceres en Las Vistillas.', true, true, 'manual', 'pending', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds")
VALUES 
('stop_mad_lat_1', 'cl_madrid_latina_01', 'El Viajero', 'Plaza de la Cebada, 11, 28005 Madrid', 40.4116, -3.7093, 0, 2, 45, 0),
('stop_mad_lat_2', 'cl_madrid_latina_01', 'Juana la Loca', 'Plaza de Puerta de Moros, 4, 28005 Madrid', 40.4107, -3.7109, 1, 2, 45, 0),
('stop_mad_lat_3', 'cl_madrid_latina_01', 'Casa Lucio', 'C. Cava Baja, 35, 28005 Madrid', 40.4125, -3.7082, 2, 2, 60, 0),
('stop_mad_lat_4', 'cl_madrid_latina_01', 'El Bonanno', 'Plaza del Humilladero, 4, 28005 Madrid', 40.4113, -3.7102, 3, 2, 40, 0);

-- 2. Madrid: Malasaña
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_madrid_malasana_01', 'Malasaña Indie 🎸', 'La Movida madrileña, bares alternativos y mucha historia musical.', true, true, 'manual', 'pending', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds")
VALUES 
('stop_mad_mal_1', 'cl_madrid_malasana_01', 'La Vía Láctea', 'C. Velarde, 18, 28004 Madrid', 40.4265, -3.7025, 0, 2, 50, 0),
('stop_mad_mal_2', 'cl_madrid_malasana_01', 'Tupperware', 'Corredera Alta de San Pablo, 26, 28004 Madrid', 40.4260, -3.7030, 1, 2, 45, 0),
('stop_mad_mal_3', 'cl_madrid_malasana_01', 'Fabuloso', 'C. de la Estrella, 3, 28004 Madrid', 40.4225, -3.7060, 2, 2, 45, 0);

-- 3. Madrid: Ponzano
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_madrid_ponzano_01', 'Ponzano Trendy 👔', 'La calle de moda para el afterwork y el tapeo gourmet.', true, true, 'manual', 'pending', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds")
VALUES 
('stop_mad_pon_1', 'cl_madrid_ponzano_01', 'Sala de Despiece', 'C. de Ponzano, 11, 28010 Madrid', 40.4400, -3.6980, 0, 2, 45, 0),
('stop_mad_pon_2', 'cl_madrid_ponzano_01', 'El Doble', 'C. de Ponzano, 58, 28003 Madrid', 40.4430, -3.6970, 1, 2, 30, 0);


-- ==========================================
-- CÓRDOBA
-- ==========================================

-- 1. Córdoba: Judería
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_cordoba_juderia_01', 'Córdoba Califal 🕌', 'Salmorejo, flamenquín y vinos Montilla-Moriles a los pies de la Mezquita.', true, true, 'manual', 'pending', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds")
VALUES 
('stop_cor_jud_1', 'cl_cordoba_juderia_01', 'Casa Pepe de la Judería', 'C. Romero, 1, 14003 Córdoba', 37.8798, -4.7801, 0, 2, 50, 0),
('stop_cor_jud_2', 'cl_cordoba_juderia_01', 'Bar Santos', 'C. Magistral González Francés, 3, 14003 Córdoba', 37.8792, -4.7795, 1, 1, 20, 0),
('stop_cor_jud_3', 'cl_cordoba_juderia_01', 'Bodegas Mezquita', 'C. Céspedes, 12, 14003 Córdoba', 37.8795, -4.7792, 2, 2, 45, 0);

-- 2. Córdoba: Centro/Tendillas
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_cordoba_centro_01', 'Córdoba Moderna 🏛️', 'El ambiente del centro, desde las Tendillas hasta el Ayuntamiento.', true, true, 'manual', 'pending', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds")
VALUES 
('stop_cor_cen_1', 'cl_cordoba_centro_01', 'Bar Correo', 'C. Jesús y María, 2, 14003 Córdoba', 37.8845, -4.7760, 0, 2, 40, 0),
('stop_cor_cen_2', 'cl_cordoba_centro_01', 'Moriles', 'C. Antonio Maura, 21, 14004 Córdoba', 37.8860, -4.7820, 1, 3, 50, 0);


-- ==========================================
-- CÁDIZ
-- ==========================================

-- 1. Cádiz: La Viña
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_cadiz_vina_01', 'Cádiz La Viña 🎭', 'Tortillitas de camarones y alegría en el barrio más gaditano.', true, true, 'manual', 'pending', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds")
VALUES 
('stop_cad_vina_1', 'cl_cadiz_vina_01', 'Taberna Casa Manteca', 'C. Corralón de los Carros, 66, 11002 Cádiz', 36.5298, -6.3025, 0, 2, 45, 0),
('stop_cad_vina_2', 'cl_cadiz_vina_01', 'El Faro de Cádiz', 'C. San Félix, 15, 11002 Cádiz', 36.5289, -6.3031, 1, 3, 60, 0),
('stop_cad_vina_3', 'cl_cadiz_vina_01', 'Taberna La Manzanilla', 'C. Feduchy, 19, 11001 Cádiz', 36.5310, -6.2950, 2, 2, 40, 0);

-- 2. Cádiz: Pópulo
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_cadiz_populo_01', 'El Pópulo Histórico 🏰', 'El barrio más antiguo de Europa. Arcos, piedras y vinos.', true, true, 'manual', 'pending', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds")
VALUES 
('stop_cad_pop_1', 'cl_cadiz_populo_01', 'Taberna del Almirante', 'C. San Juan de Dios, 3, 11005 Cádiz', 36.5285, -6.2930, 0, 2, 40, 0),
('stop_cad_pop_2', 'cl_cadiz_populo_01', 'La Tapería de Columela', 'C. Columela, 4, 11001 Cádiz', 36.5300, -6.2950, 1, 2, 45, 0);


-- ==========================================
-- HUELVA
-- ==========================================

-- 1. Huelva: Centro
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_huelva_centro_01', 'Huelva Marinera 🦐', 'La capital de la gamba blanca y el choco. Sabor atlántico.', true, true, 'manual', 'pending', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds")
VALUES 
('stop_huv_cen_1', 'cl_huelva_centro_01', 'Bar Paco Moreno', 'Paseo de la Independencia, 18, 21001 Huelva', 37.2560, -6.9450, 0, 2, 40, 0),
('stop_huv_cen_2', 'cl_huelva_centro_01', 'Restaurante Azabache', 'C. Vázquez López, 22, 21001 Huelva', 37.2555, -6.9480, 1, 3, 60, 0),
('stop_huv_cen_3', 'cl_huelva_centro_01', 'Cervecería Bonilla', 'Pl. las Monjas, 1, 21001 Huelva', 37.2570, -6.9500, 2, 2, 45, 0);

-- 2. Huelva: Isla Chica
INSERT INTO "Route" ("id", "name", "description", "isPublic", "isTemplate", "startMode", "status", "createdAt")
VALUES ('cl_huelva_isla_01', 'Isla Chica y Tapas 🍺', 'El ambiente de barrio, bares de toda la vida y buen precio.', true, true, 'manual', 'pending', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RouteStop" ("id", "routeId", "name", "address", "lat", "lng", "order", "plannedRounds", "stayDuration", "actualRounds")
VALUES 
('stop_huv_isla_1', 'cl_huelva_isla_01', 'Bar Los Cuartelillos', 'C. Roque Barcia, 15, 21006 Huelva', 37.2500, -6.9400, 0, 2, 40, 0),
('stop_huv_isla_2', 'cl_huelva_isla_01', 'Cervecería La Ría', 'Av. Federico Molina, 40, 21006 Huelva', 37.2510, -6.9390, 1, 2, 40, 0);
