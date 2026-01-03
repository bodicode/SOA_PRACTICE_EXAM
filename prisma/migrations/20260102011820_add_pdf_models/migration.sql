-- CreateTable
CREATE TABLE "PdfAsset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bucket" TEXT NOT NULL DEFAULT 'exam-pdfs',
    "storagePath" TEXT NOT NULL,
    "pageCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdfAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdfRegionQuestion" (
    "id" TEXT NOT NULL,
    "pdfAssetId" TEXT NOT NULL,
    "questionNo" INTEGER NOT NULL,
    "pageIndex" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "w" DOUBLE PRECISION NOT NULL,
    "h" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdfRegionQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PdfAsset_bucket_storagePath_key" ON "PdfAsset"("bucket", "storagePath");

-- CreateIndex
CREATE UNIQUE INDEX "PdfRegionQuestion_pdfAssetId_questionNo_key" ON "PdfRegionQuestion"("pdfAssetId", "questionNo");

-- AddForeignKey
ALTER TABLE "PdfAsset" ADD CONSTRAINT "PdfAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfRegionQuestion" ADD CONSTRAINT "PdfRegionQuestion_pdfAssetId_fkey" FOREIGN KEY ("pdfAssetId") REFERENCES "PdfAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
