-- CreateTable
CREATE TABLE "TierChange" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "fromTier" "Tier" NOT NULL,
    "toTier" "Tier" NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "reprint" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TierChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TierChange_pageId_createdAt_idx" ON "TierChange"("pageId", "createdAt");

-- AddForeignKey
ALTER TABLE "TierChange" ADD CONSTRAINT "TierChange_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
