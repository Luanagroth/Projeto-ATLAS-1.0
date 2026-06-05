ALTER TABLE "Company"
ADD COLUMN "tradeName" TEXT,
ADD COLUMN "legalName" TEXT,
ADD COLUMN "documentType" TEXT,
ADD COLUMN "legalType" TEXT,
ADD COLUMN "segment" TEXT,
ADD COLUMN "employeeCount" INTEGER,
ADD COLUMN "responsibleName" TEXT,
ADD COLUMN "responsibleRole" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "zipCode" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "country" TEXT DEFAULT 'Brasil',
ADD COLUMN "notes" TEXT,
ADD COLUMN "extraFields" JSONB;

CREATE INDEX "Company_organizationId_name_idx"
ON "Company"("organizationId", "name");

CREATE UNIQUE INDEX "Company_organizationId_name_without_cnpj_key"
ON "Company"("organizationId", lower("name"))
WHERE "cnpj" IS NULL;
