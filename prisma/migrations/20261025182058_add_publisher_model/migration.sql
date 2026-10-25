-- AlterTable
ALTER TABLE "FeedSource" ADD COLUMN     "category" TEXT,
ADD COLUMN     "feedType" TEXT,
ADD COLUMN     "publisherSlug" TEXT;

-- AlterTable
ALTER TABLE "RawArticle" ADD COLUMN     "publisherSlug" TEXT;

-- CreateTable
CREATE TABLE "Publisher" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "publisherCountry" TEXT NOT NULL,
    "sourceRegion" TEXT NOT NULL,
    "ownershipType" TEXT NOT NULL,
    "publisherType" TEXT NOT NULL,
    "editorialStyle" TEXT,
    "coverageScope" TEXT NOT NULL,
    "originality" TEXT,
    "politicalLeaning" TEXT,
    "economicPerspective" TEXT,
    "reliability" TEXT,
    "reliabilityConfidence" DOUBLE PRECISION,
    "stateFunded" BOOLEAN NOT NULL DEFAULT false,
    "profile" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_slug_key" ON "Publisher"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_name_key" ON "Publisher"("name");

-- CreateIndex
CREATE INDEX "Publisher_sourceRegion_idx" ON "Publisher"("sourceRegion");

-- CreateIndex
CREATE INDEX "Publisher_publisherCountry_idx" ON "Publisher"("publisherCountry");

-- CreateIndex
CREATE INDEX "Publisher_politicalLeaning_idx" ON "Publisher"("politicalLeaning");

-- CreateIndex
CREATE INDEX "Publisher_ownershipType_idx" ON "Publisher"("ownershipType");

-- CreateIndex
CREATE INDEX "FeedSource_publisherSlug_idx" ON "FeedSource"("publisherSlug");

-- CreateIndex
CREATE INDEX "RawArticle_publisherSlug_idx" ON "RawArticle"("publisherSlug");

-- AddForeignKey
ALTER TABLE "RawArticle" ADD CONSTRAINT "RawArticle_publisherSlug_fkey" FOREIGN KEY ("publisherSlug") REFERENCES "Publisher"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedSource" ADD CONSTRAINT "FeedSource_publisherSlug_fkey" FOREIGN KEY ("publisherSlug") REFERENCES "Publisher"("slug") ON DELETE SET NULL ON UPDATE CASCADE;
