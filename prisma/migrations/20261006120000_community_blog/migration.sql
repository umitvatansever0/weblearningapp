-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogAnswer" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogAttachment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "postId" TEXT,
    "answerId" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "BlogReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogPost_hidden_createdAt_idx" ON "BlogPost"("hidden", "createdAt");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_createdAt_idx" ON "BlogPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "BlogAnswer_postId_createdAt_idx" ON "BlogAnswer"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "BlogAnswer_authorId_createdAt_idx" ON "BlogAnswer"("authorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogAttachment_url_key" ON "BlogAttachment"("url");

-- CreateIndex
CREATE INDEX "BlogAttachment_postId_idx" ON "BlogAttachment"("postId");

-- CreateIndex
CREATE INDEX "BlogReport_resolvedAt_idx" ON "BlogReport"("resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogReport_reporterId_postId_key" ON "BlogReport"("reporterId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogReport_reporterId_answerId_key" ON "BlogReport"("reporterId", "answerId");

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogAnswer" ADD CONSTRAINT "BlogAnswer_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogAnswer" ADD CONSTRAINT "BlogAnswer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogAttachment" ADD CONSTRAINT "BlogAttachment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogReport" ADD CONSTRAINT "BlogReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogReport" ADD CONSTRAINT "BlogReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogReport" ADD CONSTRAINT "BlogReport_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "BlogAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

