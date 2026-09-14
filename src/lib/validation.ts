import { z } from 'zod'

export const registerSchema = z.object({
  email: z
    .string()
    .email()
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const userRoleUpdateSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
})

export const unitInputSchema = z.object({
  levelCode: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  order: z.number().int().positive(),
  titleDe: z.string().min(1),
  titleEn: z.string().min(1),
  titleTr: z.string().min(1),
})

export const unitUpdateSchema = unitInputSchema.partial()

export const lessonInputSchema = z.object({
  order: z.number().int().positive(),
  grammarTopic: z.string().min(1),
  explanationDe: z.string().min(1),
  explanationEn: z.string().min(1),
  explanationTr: z.string().min(1),
})

export const lessonUpdateSchema = lessonInputSchema.partial()

export const exerciseInputSchema = z.object({
  order: z.number().int().positive(),
  type: z.enum(['MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'MATCHING', 'SENTENCE_ORDER', 'SHORT_ANSWER']),
  data: z.record(z.string(), z.unknown()),
  correctAnswer: z.record(z.string(), z.unknown()),
  explanation: z.string().min(1),
})

export const exerciseUpdateSchema = exerciseInputSchema.partial()

export const vocabWordInputSchema = z.object({
  word: z.string().min(1),
  translationEn: z.string().min(1),
  translationTr: z.string().min(1),
  exampleSentence: z.string().min(1),
})

export const vocabWordUpdateSchema = vocabWordInputSchema.partial()
