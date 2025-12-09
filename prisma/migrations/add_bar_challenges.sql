-- Migración para Sistema de Desafíos Dinámicos
-- Ejecutar en Neon SQL Editor o mediante prisma migrate

-- Crear tabla BarChallenge
CREATE TABLE IF NOT EXISTS "BarChallenge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "routeId" TEXT NOT NULL,
  "stopId" TEXT NOT NULL,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 50,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "completedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "BarChallenge_routeId_fkey" 
    FOREIGN KEY ("routeId") REFERENCES "Route"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BarChallenge_stopId_fkey" 
    FOREIGN KEY ("stopId") REFERENCES "RouteStop"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BarChallenge_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS "BarChallenge_routeId_stopId_idx" 
  ON "BarChallenge"("routeId", "stopId");

CREATE INDEX IF NOT EXISTS "BarChallenge_userId_completed_idx" 
  ON "BarChallenge"("userId", "completed");

CREATE INDEX IF NOT EXISTS "BarChallenge_stopId_completed_idx" 
  ON "BarChallenge"("stopId", "completed");

-- Verificar que se creó correctamente
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'BarChallenge'
  AND table_schema = 'public'
ORDER BY ordinal_position;
