-- Migración manual para producción
-- Ejecutar en el SQL Editor de Neon: https://console.neon.tech

-- 1. Añadir columna isTemplate
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "isTemplate" BOOLEAN NOT NULL DEFAULT false;

-- 2. Añadir columna templateId
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "templateId" TEXT;

-- 3. Añadir foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Route_templateId_fkey'
    ) THEN
        ALTER TABLE "Route" ADD CONSTRAINT "Route_templateId_fkey" 
            FOREIGN KEY ("templateId") REFERENCES "Route"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. Crear índice
CREATE INDEX IF NOT EXISTS "Route_templateId_idx" ON "Route"("templateId");

-- 5. Marcar rutas existentes como plantillas
UPDATE "Route" SET "isTemplate" = true WHERE "templateId" IS NULL;

-- Verificar que se aplicó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Route' 
  AND column_name IN ('isTemplate', 'templateId')
ORDER BY column_name;
