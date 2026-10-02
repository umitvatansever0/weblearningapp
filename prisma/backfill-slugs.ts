/**
 * Backfill human-readable slugs for existing Units and Lessons.
 *
 * Safe to run repeatedly:
 *  - Only rows whose slug IS NULL are updated — existing slugs are never
 *    overwritten (and are seeded into the per-scope "taken" sets so new slugs
 *    don't collide with them).
 *  - Unit slugs are unique within a level (from the English title); lesson
 *    slugs are unique within a unit (from the German grammar topic).
 *
 * Run after applying the migration:
 *   npx tsx prisma/backfill-slugs.ts
 */
import { PrismaClient } from '@prisma/client'
import { slugify, uniqueSlug } from '../src/lib/slug'

const prisma = new PrismaClient()

async function main() {
  let unitsCreated = 0
  let lessonsCreated = 0
  let duplicatesResolved = 0
  let missingTitles = 0
  let errors = 0

  const levels = await prisma.level.findMany({
    orderBy: { order: 'asc' },
    include: {
      units: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  })

  for (const level of levels) {
    const unitSlugs = new Set<string>()
    // Seed already-populated unit slugs so backfilled ones don't collide.
    for (const unit of level.units) {
      if (unit.slug) unitSlugs.add(unit.slug)
    }

    for (const unit of level.units) {
      if (!unit.slug) {
        try {
          const base = slugify(unit.titleEn)
          if (!base) missingTitles += 1
          const slug = uniqueSlug(unit.titleEn, unitSlugs, 'unit')
          if (slug !== (base || 'unit')) duplicatesResolved += 1
          await prisma.unit.update({ where: { id: unit.id }, data: { slug } })
          unitsCreated += 1
        } catch (error) {
          errors += 1
          console.error(`  ✗ unit ${unit.id}:`, error)
        }
      }

      const lessonSlugs = new Set<string>()
      for (const lesson of unit.lessons) {
        if (lesson.slug) lessonSlugs.add(lesson.slug)
      }

      for (const lesson of unit.lessons) {
        if (lesson.slug) continue
        try {
          const base = slugify(lesson.grammarTopic)
          if (!base) missingTitles += 1
          const slug = uniqueSlug(lesson.grammarTopic, lessonSlugs, 'lesson')
          if (slug !== (base || 'lesson')) duplicatesResolved += 1
          await prisma.lesson.update({ where: { id: lesson.id }, data: { slug } })
          lessonsCreated += 1
        } catch (error) {
          errors += 1
          console.error(`  ✗ lesson ${lesson.id}:`, error)
        }
      }
    }
  }

  console.log('\n=== Slug backfill report ===')
  console.log(`Created: ${unitsCreated} unit slugs`)
  console.log(`Created: ${lessonsCreated} lesson slugs`)
  console.log(`Duplicates resolved: ${duplicatesResolved}`)
  console.log(`Missing titles: ${missingTitles}`)
  console.log(`Errors: ${errors}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
