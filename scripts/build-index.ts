// Validate every data/books/*.json, then write src/generated/index.json and quotes.json.
// Exits non-zero on any invalid book so a bad file can never be deployed.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  BookSchema,
  type Book,
  type IndexEntry,
  type Quote,
} from '../src/lib/book.ts'

const root = path.resolve(import.meta.dirname, '..')
const booksDir = path.join(root, 'data/books')
const outFile = path.join(root, 'src/generated/index.json')
// Kept out of the index so the shelf doesn't load every sentence up front.
const quotesFile = path.join(root, 'src/generated/quotes.json')

const errors: string[] = []
const books: Book[] = []

const files = (await readdir(booksDir)).filter((f) => f.endsWith('.json'))
for (const file of files.sort()) {
  const rel = `data/books/${file}`
  let raw: unknown
  try {
    raw = JSON.parse(await readFile(path.join(booksDir, file), 'utf8'))
  } catch (e) {
    errors.push(`${rel}: invalid JSON (${(e as Error).message})`)
    continue
  }

  const id = (raw as { id?: unknown } | null)?.id
  if (id !== path.basename(file, '.json')) {
    errors.push(`${rel}: id ${JSON.stringify(id)} must match the file name`)
  }

  const result = BookSchema.safeParse(raw)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const where = issue.path.join('.') || '(root)'
      errors.push(`${rel}: ${where}: ${issue.message}`)
    }
    continue
  }
  books.push(result.data)
}

if (errors.length > 0) {
  console.error(`✗ ${errors.length} problem(s) in book data:`)
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}

function toEntry(book: Book): IndexEntry {
  const entry: IndexEntry = {
    id: book.id,
    title: book.title,
    author: book.author,
    cover: book.cover,
    coverColor: book.coverColor,
    category: book.category,
    status: book.status,
    dateStarted: book.dateStarted,
    format: book.format,
    dateFinished: book.status === 'finished' ? book.dateFinished : undefined,
    recommendation: book.recommendation,
    sentenceCount: book.sentences.length,
  }
  if (book.status === 'reading' && book.sentences.length > 0) {
    const latest = book.sentences.reduce((a, b) =>
      b.addedAt >= a.addedAt ? b : a,
    )
    entry.lastSentence = latest.text
    entry.lastAddedAt = latest.addedAt
  }
  return entry
}

await mkdir(path.dirname(outFile), { recursive: true })
await writeFile(outFile, JSON.stringify(books.map(toEntry), null, 2) + '\n')

const quotes: Quote[] = books.flatMap((b) =>
  b.sentences.map((s) => ({ text: s.text, id: b.id, title: b.title })),
)
await writeFile(quotesFile, JSON.stringify(quotes, null, 2) + '\n')
console.log(
  `✓ ${books.length} book(s), ${quotes.length} sentence(s) → src/generated/`,
)
