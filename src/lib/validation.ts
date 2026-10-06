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

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email()
    .transform((email) => email.toLowerCase()),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

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

// --- Community blog ---------------------------------------------------------

export const blogAttachmentSchema = z.object({
  url: z.string().url(),
  pathname: z.string().min(1).max(500),
  contentType: z.string().min(1).max(200),
  size: z.number().int().positive(),
  fileName: z.string().trim().min(1).max(200),
})

export const blogPostInputSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150),
  body: z.string().trim().min(10, 'Text must be at least 10 characters').max(10000),
  attachments: z.array(blogAttachmentSchema).max(5).default([]),
})

export type BlogPostInput = z.infer<typeof blogPostInputSchema>

export const blogAnswerInputSchema = z.object({
  body: z.string().trim().min(2, 'Answer must be at least 2 characters').max(5000),
})

export const blogReportInputSchema = z
  .object({
    postId: z.string().min(1).optional(),
    answerId: z.string().min(1).optional(),
    reason: z.string().trim().min(3, 'Please describe the problem').max(500),
  })
  .refine((value) => Boolean(value.postId) !== Boolean(value.answerId), {
    message: 'Report exactly one post or answer',
  })

export const blogModerationSchema = z.object({
  hidden: z.boolean(),
})
