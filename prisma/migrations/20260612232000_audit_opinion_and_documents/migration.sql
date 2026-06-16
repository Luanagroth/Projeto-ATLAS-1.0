-- CreateEnum
CREATE TYPE "AuditOpinionStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AuditDocumentOrigin" AS ENUM ('AUDITORIA', 'EMPRESA', 'TERCEIRO');

-- CreateTable
CREATE TABLE "AuditOpinion" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "responsibleId" TEXT,
    "companyBrief" TEXT,
    "generalCare" TEXT,
    "positivePoints" TEXT,
    "criticalPoints" TEXT,
    "overallPerformance" TEXT,
    "identifiedRisks" TEXT,
    "recommendations" TEXT,
    "finalOpinion" TEXT,
    "status" "AuditOpinionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditOpinion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditOpinionHistory" (
    "id" TEXT NOT NULL,
    "auditOpinionId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "changes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditOpinionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditDocument" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "auditChecklistId" TEXT,
    "auditChecklistItemId" TEXT,
    "nonConformityId" TEXT,
    "actionPlanId" TEXT,
    "evidenceId" TEXT,
    "attachedById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "fileUrl" TEXT,
    "origin" "AuditDocumentOrigin" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditOpinion_auditId_key" ON "AuditOpinion"("auditId");
CREATE INDEX "AuditOpinion_auditId_idx" ON "AuditOpinion"("auditId");
CREATE INDEX "AuditOpinion_responsibleId_idx" ON "AuditOpinion"("responsibleId");
CREATE INDEX "AuditOpinion_status_idx" ON "AuditOpinion"("status");

CREATE INDEX "AuditOpinionHistory_auditOpinionId_idx" ON "AuditOpinionHistory"("auditOpinionId");
CREATE INDEX "AuditOpinionHistory_userId_idx" ON "AuditOpinionHistory"("userId");
CREATE INDEX "AuditOpinionHistory_createdAt_idx" ON "AuditOpinionHistory"("createdAt");

CREATE INDEX "AuditDocument_auditId_idx" ON "AuditDocument"("auditId");
CREATE INDEX "AuditDocument_auditChecklistId_idx" ON "AuditDocument"("auditChecklistId");
CREATE INDEX "AuditDocument_auditChecklistItemId_idx" ON "AuditDocument"("auditChecklistItemId");
CREATE INDEX "AuditDocument_nonConformityId_idx" ON "AuditDocument"("nonConformityId");
CREATE INDEX "AuditDocument_actionPlanId_idx" ON "AuditDocument"("actionPlanId");
CREATE INDEX "AuditDocument_evidenceId_idx" ON "AuditDocument"("evidenceId");
CREATE INDEX "AuditDocument_attachedById_idx" ON "AuditDocument"("attachedById");
CREATE INDEX "AuditDocument_category_idx" ON "AuditDocument"("category");
CREATE INDEX "AuditDocument_origin_idx" ON "AuditDocument"("origin");
CREATE INDEX "AuditDocument_createdAt_idx" ON "AuditDocument"("createdAt");

-- AddForeignKey
ALTER TABLE "AuditOpinion" ADD CONSTRAINT "AuditOpinion_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditOpinion" ADD CONSTRAINT "AuditOpinion_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditOpinionHistory" ADD CONSTRAINT "AuditOpinionHistory_auditOpinionId_fkey" FOREIGN KEY ("auditOpinionId") REFERENCES "AuditOpinion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditOpinionHistory" ADD CONSTRAINT "AuditOpinionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditDocument" ADD CONSTRAINT "AuditDocument_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditDocument" ADD CONSTRAINT "AuditDocument_auditChecklistId_fkey" FOREIGN KEY ("auditChecklistId") REFERENCES "AuditChecklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditDocument" ADD CONSTRAINT "AuditDocument_auditChecklistItemId_fkey" FOREIGN KEY ("auditChecklistItemId") REFERENCES "AuditChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditDocument" ADD CONSTRAINT "AuditDocument_nonConformityId_fkey" FOREIGN KEY ("nonConformityId") REFERENCES "NonConformity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditDocument" ADD CONSTRAINT "AuditDocument_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "ActionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditDocument" ADD CONSTRAINT "AuditDocument_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditDocument" ADD CONSTRAINT "AuditDocument_attachedById_fkey" FOREIGN KEY ("attachedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
