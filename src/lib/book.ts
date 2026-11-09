import { z } from 'zod'

const yearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected YYYY-MM')

export const SentenceSchema = z.strictObject({
  text: z.string().min(1),
  note: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  addedAt: z.iso.date(),
})

const common = {
  id: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'expected a lowercase-hyphen slug'),
  title: z.string().min(1),
  author: z.string().min(1).optional(),
  isbn: z
    .string()
    .regex(/^(\d{9}[\dX]|\d{13})$/, 'expected ISBN-10 or ISBN-13, digits only')
    .optional(),
  // Optional: the site draws a placeholder cover when it is missing.
  cover: z.string().min(1).optional(),
  category: z.string().min(1),
  dateStarted: yearMonth.optional(),
  recommendation: z.string().min(1).optional(),
  sentences: z.array(SentenceSchema),
}

// dateFinished is required for finished books and rejected for reading ones.
export const BookSchema = z.discriminatedUnion('status', [
  z.strictObject({ ...common, status: z.literal('reading') }),
  z.strictObject({
    ...common,
    status: z.literal('finished'),
    dateFinished: yearMonth,
  }),
])

export type Sentence = z.infer<typeof SentenceSchema>
export type Book = z.infer<typeof BookSchema>
export type Status = Book['status']

/** One row of the generated index: a book without its sentences. */
export type IndexEntry = {
  id: string
  title: string
  author?: string
  cover?: string
  category: string
  status: Status
  dateStarted?: string
  dateFinished?: string
  recommendation?: string
  sentenceCount: number
  /** Latest sentence, only for books still being read. */
  lastSentence?: string
  lastAddedAt?: string
}
