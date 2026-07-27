-- CreateTable
CREATE TABLE "Investor" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "organisationName" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "country" TEXT,
    "interestType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "totalCommitted" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "InvestorEnquiry" ADD COLUMN "investorId" TEXT;

-- CreateTable
CREATE TABLE "InvestorTransactionReceipt" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "investorEnquiryId" TEXT,
    "amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "transactionDate" TIMESTAMP(3),
    "originalFileName" TEXT NOT NULL,
    "storedFileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "uploadedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorTransactionReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Investor_email_organisationName_key" ON "Investor"("email", "organisationName");

-- CreateIndex
CREATE INDEX "Investor_email_idx" ON "Investor"("email");

-- CreateIndex
CREATE INDEX "Investor_status_idx" ON "Investor"("status");

-- CreateIndex
CREATE INDEX "InvestorTransactionReceipt_investorId_idx" ON "InvestorTransactionReceipt"("investorId");

-- CreateIndex
CREATE INDEX "InvestorTransactionReceipt_investorEnquiryId_idx" ON "InvestorTransactionReceipt"("investorEnquiryId");

-- CreateIndex
CREATE INDEX "InvestorTransactionReceipt_status_idx" ON "InvestorTransactionReceipt"("status");

-- AddForeignKey
ALTER TABLE "InvestorEnquiry" ADD CONSTRAINT "InvestorEnquiry_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorTransactionReceipt" ADD CONSTRAINT "InvestorTransactionReceipt_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorTransactionReceipt" ADD CONSTRAINT "InvestorTransactionReceipt_investorEnquiryId_fkey" FOREIGN KEY ("investorEnquiryId") REFERENCES "InvestorEnquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
