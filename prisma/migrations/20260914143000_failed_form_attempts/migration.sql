CREATE TABLE "FailedFormAttempt" (
    "id" TEXT NOT NULL,
    "formType" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT,
    "businessName" TEXT,
    "errorCode" TEXT NOT NULL,
    "errorDetails" JSONB,
    "origin" TEXT,
    "referer" TEXT,
    "host" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedFormAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FailedFormAttempt_formType_createdAt_idx" ON "FailedFormAttempt"("formType", "createdAt");
CREATE INDEX "FailedFormAttempt_email_idx" ON "FailedFormAttempt"("email");
