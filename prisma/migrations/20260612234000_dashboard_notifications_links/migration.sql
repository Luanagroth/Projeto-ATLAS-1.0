-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'AUDIT_DUE_SOON';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'AUDIT_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POSSIBLE_IRREGULARITY_CREATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACTION_PLAN_DUE_SOON';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACTION_PLAN_OVERDUE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACTION_PLAN_ANSWERED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVIDENCE_CREATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVIDENCE_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVIDENCE_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVIDENCE_ADJUSTMENT_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OPINION_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DOCUMENT_CREATED';

-- AlterTable
ALTER TABLE "Notification"
ADD COLUMN "relatedCompanyId" TEXT,
ADD COLUMN "relatedEvidenceId" TEXT,
ADD COLUMN "relatedDocumentId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_relatedCompanyId_idx" ON "Notification"("relatedCompanyId");
CREATE INDEX "Notification_relatedAuditId_idx" ON "Notification"("relatedAuditId");
CREATE INDEX "Notification_relatedNCId_idx" ON "Notification"("relatedNCId");
CREATE INDEX "Notification_relatedEvidenceId_idx" ON "Notification"("relatedEvidenceId");
CREATE INDEX "Notification_relatedDocumentId_idx" ON "Notification"("relatedDocumentId");
