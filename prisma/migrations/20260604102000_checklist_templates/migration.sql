CREATE TYPE "ChecklistItemType" AS ENUM (
  'SIM_NAO',
  'TEXTO',
  'NUMERO',
  'DATA',
  'MULTIPLA_ESCOLHA'
);

ALTER TABLE "Checklist"
ADD COLUMN "category" TEXT;

ALTER TABLE "ChecklistItem"
ADD COLUMN "type" "ChecklistItemType" NOT NULL DEFAULT 'SIM_NAO',
ADD COLUMN "options" JSONB;

CREATE INDEX "Checklist_organizationId_category_idx"
ON "Checklist"("organizationId", "category");
