-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NON_CONFORMITY_CREATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACTION_PLAN_CREATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACTION_PLAN_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACTION_PLAN_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACTION_PLAN_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SYSTEM';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "href" TEXT;
ALTER TABLE "Notification" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Notification" ADD COLUMN "relatedActionPlanId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_relatedActionPlanId_idx" ON "Notification"("relatedActionPlanId");
