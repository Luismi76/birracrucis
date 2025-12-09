-- Migración para agregar fotos de prueba a desafíos

-- Agregar challengeId a Photo
ALTER TABLE "Photo" 
  ADD COLUMN "challengeId" TEXT;

-- Agregar photoUrl a BarChallenge
ALTER TABLE "BarChallenge" 
  ADD COLUMN "photoUrl" TEXT;

-- Crear foreign key
ALTER TABLE "Photo" 
  ADD CONSTRAINT "Photo_challengeId_fkey" 
  FOREIGN KEY ("challengeId") 
  REFERENCES "BarChallenge"("id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Crear índice
CREATE INDEX IF NOT EXISTS "Photo_challengeId_idx" 
  ON "Photo"("challengeId");
