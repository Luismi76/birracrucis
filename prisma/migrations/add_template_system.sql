-- Add template system fields to Route table
ALTER TABLE "Route" ADD COLUMN "isTemplate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Route" ADD COLUMN "templateId" TEXT;

-- Add foreign key constraint for template relationship
ALTER TABLE "Route" ADD CONSTRAINT "Route_templateId_fkey" 
  FOREIGN KEY ("templateId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for template queries
CREATE INDEX "Route_templateId_idx" ON "Route"("templateId");

-- Convert existing routes to templates (routes without a templateId become templates)
-- This makes all current routes available as templates for future editions
UPDATE "Route" SET "isTemplate" = true WHERE "templateId" IS NULL;
