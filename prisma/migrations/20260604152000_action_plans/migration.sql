-- CreateEnum
CREATE TYPE "ActionPlanStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ActionPlan" (
    "id" TEXT NOT NULL,
    "nonConformityId" TEXT NOT NULL,
    "createdById" TEXT,
    "responsibleId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ActionPlanStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionPlanHistory" (
    "id" TEXT NOT NULL,
    "actionPlanId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionPlanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionPlan_nonConformityId_idx" ON "ActionPlan"("nonConformityId");

-- CreateIndex
CREATE INDEX "ActionPlan_createdById_idx" ON "ActionPlan"("createdById");

-- CreateIndex
CREATE INDEX "ActionPlan_responsibleId_idx" ON "ActionPlan"("responsibleId");

-- CreateIndex
CREATE INDEX "ActionPlan_status_idx" ON "ActionPlan"("status");

-- CreateIndex
CREATE INDEX "ActionPlan_priority_idx" ON "ActionPlan"("priority");

-- CreateIndex
CREATE INDEX "ActionPlan_dueDate_idx" ON "ActionPlan"("dueDate");

-- CreateIndex
CREATE INDEX "ActionPlanHistory_actionPlanId_idx" ON "ActionPlanHistory"("actionPlanId");

-- CreateIndex
CREATE INDEX "ActionPlanHistory_userId_idx" ON "ActionPlanHistory"("userId");

-- CreateIndex
CREATE INDEX "ActionPlanHistory_createdAt_idx" ON "ActionPlanHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_nonConformityId_fkey" FOREIGN KEY ("nonConformityId") REFERENCES "NonConformity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlanHistory" ADD CONSTRAINT "ActionPlanHistory_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "ActionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlanHistory" ADD CONSTRAINT "ActionPlanHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
