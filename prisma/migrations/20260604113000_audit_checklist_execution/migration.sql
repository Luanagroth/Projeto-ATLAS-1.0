CREATE TYPE "AuditChecklistStatus" AS ENUM (
  'DRAFT',
  'IN_PROGRESS',
  'COMPLETED'
);

CREATE TABLE "AuditChecklist" (
  "id" TEXT NOT NULL,
  "auditId" TEXT NOT NULL,
  "checklistId" TEXT,
  "checklistName" TEXT NOT NULL,
  "checklistDescription" TEXT,
  "checklistCategory" TEXT,
  "checklistVersion" INTEGER,
  "status" "AuditChecklistStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AuditChecklist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditChecklistItem" (
  "id" TEXT NOT NULL,
  "auditChecklistId" TEXT NOT NULL,
  "sourceItemId" TEXT,
  "question" TEXT NOT NULL,
  "description" TEXT,
  "type" "ChecklistItemType" NOT NULL,
  "options" JSONB,
  "order" INTEGER NOT NULL,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AuditChecklistItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ChecklistResponse"
DROP CONSTRAINT IF EXISTS "ChecklistResponse_checklistItemId_fkey";

DROP INDEX IF EXISTS "ChecklistResponse_auditId_checklistItemId_key";

ALTER TABLE "ChecklistResponse"
ADD COLUMN "auditChecklistItemId" TEXT NOT NULL,
ADD COLUMN "updatedById" TEXT,
ADD COLUMN "answerBoolean" BOOLEAN,
ADD COLUMN "answerText" TEXT,
ADD COLUMN "answerNumber" DOUBLE PRECISION,
ADD COLUMN "answerDate" TIMESTAMP(3),
ADD COLUMN "answerChoice" TEXT,
DROP COLUMN "checklistItemId",
DROP COLUMN "answer";

CREATE UNIQUE INDEX "ChecklistResponse_auditId_auditChecklistItemId_key"
ON "ChecklistResponse"("auditId", "auditChecklistItemId");

CREATE INDEX "ChecklistResponse_updatedById_idx"
ON "ChecklistResponse"("updatedById");

CREATE INDEX "AuditChecklist_auditId_idx"
ON "AuditChecklist"("auditId");

CREATE INDEX "AuditChecklist_checklistId_idx"
ON "AuditChecklist"("checklistId");

CREATE INDEX "AuditChecklist_status_idx"
ON "AuditChecklist"("status");

CREATE INDEX "AuditChecklistItem_auditChecklistId_idx"
ON "AuditChecklistItem"("auditChecklistId");

CREATE INDEX "AuditChecklistItem_sourceItemId_idx"
ON "AuditChecklistItem"("sourceItemId");

ALTER TABLE "AuditChecklist"
ADD CONSTRAINT "AuditChecklist_auditId_fkey"
FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditChecklist"
ADD CONSTRAINT "AuditChecklist_checklistId_fkey"
FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditChecklistItem"
ADD CONSTRAINT "AuditChecklistItem_auditChecklistId_fkey"
FOREIGN KEY ("auditChecklistId") REFERENCES "AuditChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditChecklistItem"
ADD CONSTRAINT "AuditChecklistItem_sourceItemId_fkey"
FOREIGN KEY ("sourceItemId") REFERENCES "ChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChecklistResponse"
ADD CONSTRAINT "ChecklistResponse_auditChecklistItemId_fkey"
FOREIGN KEY ("auditChecklistItemId") REFERENCES "AuditChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChecklistResponse"
ADD CONSTRAINT "ChecklistResponse_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
