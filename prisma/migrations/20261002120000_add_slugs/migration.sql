-- Add human-readable slug columns for Unit and Lesson.
-- Nullable so the migration is non-destructive: existing rows get NULL and are
-- populated afterwards by `prisma/backfill-slugs.ts`. Postgres treats NULLs as
-- distinct, so the unique indexes below tolerate un-backfilled rows.

ALTER TABLE "Unit" ADD COLUMN "slug" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "slug" TEXT;

-- Unit slug is unique within a level; Lesson slug is unique within a unit.
CREATE UNIQUE INDEX "Unit_levelId_slug_key" ON "Unit"("levelId", "slug");
CREATE UNIQUE INDEX "Lesson_unitId_slug_key" ON "Lesson"("unitId", "slug");
