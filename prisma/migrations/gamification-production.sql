-- Migración de Gamificación para Producción
-- Ejecutar en Neon SQL Editor: https://console.neon.tech

-- 1. Añadir columnas de gamificación al modelo User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1;

-- 2. Crear tabla Achievement
CREATE TABLE IF NOT EXISTS "Achievement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Achievement_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_userId_routeId_type_key" ON "Achievement"("userId", "routeId", "type");
CREATE INDEX IF NOT EXISTS "Achievement_userId_idx" ON "Achievement"("userId");
CREATE INDEX IF NOT EXISTS "Achievement_routeId_idx" ON "Achievement"("routeId");

-- 3. Crear tabla BeerConsumption
CREATE TABLE IF NOT EXISTS "BeerConsumption" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "stopId" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BeerConsumption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BeerConsumption_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BeerConsumption_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "Stop"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BeerConsumption_userId_routeId_idx" ON "BeerConsumption"("userId", "routeId");
CREATE INDEX IF NOT EXISTS "BeerConsumption_routeId_idx" ON "BeerConsumption"("routeId");

-- 4. Crear tabla Prediction
CREATE TABLE IF NOT EXISTS "Prediction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "prediction" TEXT NOT NULL,
  "result" TEXT,
  "points" INTEGER NOT NULL DEFAULT 0,
  "isCorrect" BOOLEAN,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Prediction_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Prediction_userId_routeId_idx" ON "Prediction"("userId", "routeId");
CREATE INDEX IF NOT EXISTS "Prediction_routeId_idx" ON "Prediction"("routeId");

-- 5. Crear tabla BarReaction
CREATE TABLE IF NOT EXISTS "BarReaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "stopId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BarReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BarReaction_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BarReaction_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "Stop"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "BarReaction_userId_routeId_stopId_type_key" ON "BarReaction"("userId", "routeId", "stopId", "type");
CREATE INDEX IF NOT EXISTS "BarReaction_routeId_stopId_idx" ON "BarReaction"("routeId", "stopId");

-- Verificar que se aplicó correctamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name IN ('User', 'Achievement', 'BeerConsumption', 'Prediction', 'BarReaction')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
