-- CreateEnum
CREATE TYPE "EvidenceOrigin" AS ENUM ('AUDITORIA', 'EMPRESA');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ADJUSTMENT_REQUESTED');

-- CreateTable
CREATE TABLE "ActionPlanNonConformity" (
    "id" TEXT NOT NULL,
    "actionPlanId" TEXT NOT NULL,
    "nonConformityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionPlanNonConformity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NonConformityChecklistItem" (
    "id" TEXT NOT NULL,
    "nonConformityId" TEXT NOT NULL,
    "auditChecklistItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NonConformityChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "actionPlanId" TEXT NOT NULL,
    "nonConformityId" TEXT,
    "auditChecklistItemId" TEXT,
    "attachedById" TEXT,
    "reviewedById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "origin" "EvidenceOrigin" NOT NULL,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- Backfill
INSERT INTO "ActionPlanNonConformity" ("id", "actionPlanId", "nonConformityId")
SELECT concat('apnc_', md5("id" || "nonConformityId")), "id", "nonConformityId"
FROM "ActionPlan"
ON CONFLICT DO NOTHING;

INSERT INTO "NonConformityChecklistItem" ("id", "nonConformityId", "auditChecklistItemId")
SELECT concat('ncci_', md5("id" || "auditChecklistItemId")), "id", "auditChecklistItemId"
FROM "NonConformity"
WHERE "auditChecklistItemId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "ActionPlanNonConformity_actionPlanId_nonConformityId_key" ON "ActionPlanNonConformity"("actionPlanId", "nonConformityId");
CREATE INDEX "ActionPlanNonConformity_actionPlanId_idx" ON "ActionPlanNonConformity"("actionPlanId");
CREATE INDEX "ActionPlanNonConformity_nonConformityId_idx" ON "ActionPlanNonConformity"("nonConformityId");

CREATE UNIQUE INDEX "NonConformityChecklistItem_nonConformityId_auditChecklistItemId_key" ON "NonConformityChecklistItem"("nonConformityId", "auditChecklistItemId");
CREATE INDEX "NonConformityChecklistItem_nonConformityId_idx" ON "NonConformityChecklistItem"("nonConformityId");
CREATE INDEX "NonConformityChecklistItem_auditChecklistItemId_idx" ON "NonConformityChecklistItem"("auditChecklistItemId");

CREATE INDEX "Evidence_auditId_idx" ON "Evidence"("auditId");
CREATE INDEX "Evidence_actionPlanId_idx" ON "Evidence"("actionPlanId");
CREATE INDEX "Evidence_nonConformityId_idx" ON "Evidence"("nonConformityId");
CREATE INDEX "Evidence_auditChecklistItemId_idx" ON "Evidence"("auditChecklistItemId");
CREATE INDEX "Evidence_origin_idx" ON "Evidence"("origin");
CREATE INDEX "Evidence_status_idx" ON "Evidence"("status");
CREATE INDEX "Evidence_createdAt_idx" ON "Evidence"("createdAt");

-- AddForeignKey
ALTER TABLE "ActionPlanNonConformity" ADD CONSTRAINT "ActionPlanNonConformity_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "ActionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionPlanNonConformity" ADD CONSTRAINT "ActionPlanNonConformity_nonConformityId_fkey" FOREIGN KEY ("nonConformityId") REFERENCES "NonConformity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NonConformityChecklistItem" ADD CONSTRAINT "NonConformityChecklistItem_nonConformityId_fkey" FOREIGN KEY ("nonConformityId") REFERENCES "NonConformity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NonConformityChecklistItem" ADD CONSTRAINT "NonConformityChecklistItem_auditChecklistItemId_fkey" FOREIGN KEY ("auditChecklistItemId") REFERENCES "AuditChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "ActionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_nonConformityId_fkey" FOREIGN KEY ("nonConformityId") REFERENCES "NonConformity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_auditChecklistItemId_fkey" FOREIGN KEY ("auditChecklistItemId") REFERENCES "AuditChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_attachedById_fkey" FOREIGN KEY ("attachedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
