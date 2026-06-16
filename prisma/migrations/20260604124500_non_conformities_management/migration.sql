ALTER TYPE "NonConformityStatus" RENAME TO "NonConformityStatus_old";

CREATE TYPE "NonConformityStatus" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED'
);

ALTER TABLE "NonConformity"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "NonConformity"
ALTER COLUMN "status" TYPE "NonConformityStatus"
USING (
  CASE "status"::text
    WHEN 'PENDING' THEN 'IN_PROGRESS'
    WHEN 'REJECTED' THEN 'RESOLVED'
    ELSE "status"::text
  END
)::"NonConformityStatus";

ALTER TABLE "NonConformity"
ALTER COLUMN "status" SET DEFAULT 'OPEN';

DROP TYPE "NonConformityStatus_old";

ALTER TABLE "NonConformity"
ADD COLUMN "auditChecklistItemId" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "responsibleId" TEXT;

CREATE INDEX "NonConformity_auditChecklistItemId_idx"
ON "NonConformity"("auditChecklistItemId");

CREATE INDEX "NonConformity_createdById_idx"
ON "NonConformity"("createdById");

CREATE INDEX "NonConformity_responsibleId_idx"
ON "NonConformity"("responsibleId");

ALTER TABLE "NonConformity"
ADD CONSTRAINT "NonConformity_auditChecklistItemId_fkey"
FOREIGN KEY ("auditChecklistItemId") REFERENCES "AuditChecklistItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NonConformity"
ADD CONSTRAINT "NonConformity_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NonConformity"
ADD CONSTRAINT "NonConformity_responsibleId_fkey"
FOREIGN KEY ("responsibleId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
