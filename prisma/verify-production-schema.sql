-- Verificar que los campos isTemplate y templateId existen en la tabla Route
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Route' 
  AND column_name IN ('isTemplate', 'templateId')
ORDER BY column_name;

-- Si los campos no existen, ejecutar:
-- ALTER TABLE "Route" ADD COLUMN "isTemplate" BOOLEAN NOT NULL DEFAULT false;
-- ALTER TABLE "Route" ADD COLUMN "templateId" TEXT;
-- ALTER TABLE "Route" ADD CONSTRAINT "Route_templateId_fkey" 
--   FOREIGN KEY ("templateId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- CREATE INDEX "Route_templateId_idx" ON "Route"("templateId");
