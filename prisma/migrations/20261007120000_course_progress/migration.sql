-- CreateTable
CREATE TABLE "CourseSectionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "unitSlug" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseSectionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseMistake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "exerciseKey" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "wrongAnswer" TEXT NOT NULL,
    "stage" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 1,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseMistake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseSectionProgress_userId_level_unitSlug_sectionKey_key" ON "CourseSectionProgress"("userId", "level", "unitSlug", "sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "TopicMastery_userId_level_topic_key" ON "TopicMastery"("userId", "level", "topic");

-- CreateIndex
CREATE UNIQUE INDEX "CourseMistake_userId_exerciseKey_key" ON "CourseMistake"("userId", "exerciseKey");

-- CreateIndex
CREATE INDEX "CourseMistake_userId_resolvedAt_dueAt_idx" ON "CourseMistake"("userId", "resolvedAt", "dueAt");

-- AddForeignKey
ALTER TABLE "CourseSectionProgress" ADD CONSTRAINT "CourseSectionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMastery" ADD CONSTRAINT "TopicMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseMistake" ADD CONSTRAINT "CourseMistake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
