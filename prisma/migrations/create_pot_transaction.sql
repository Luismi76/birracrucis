-- Create PotTransaction table
CREATE TABLE IF NOT EXISTS "PotTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PotTransaction_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index
CREATE INDEX IF NOT EXISTS "PotTransaction_routeId_createdAt_idx" ON "PotTransaction"("routeId", "createdAt" DESC);
