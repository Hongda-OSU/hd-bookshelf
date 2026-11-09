import type { IndexEntry } from './book'

/** Reading books, most recently touched first. */
export function byReadingRecency(a: IndexEntry, b: IndexEntry): number {
  return (b.lastAddedAt ?? b.dateStarted ?? '').localeCompare(
    a.lastAddedAt ?? a.dateStarted ?? '',
  )
}

/** Finished books, most recently finished first. */
export function byFinishedDesc(a: IndexEntry, b: IndexEntry): number {
  return (b.dateFinished ?? '').localeCompare(a.dateFinished ?? '')
}

/** The order books appear on the shelf: reading first, then finished. */
export function shelfOrder(books: IndexEntry[]): IndexEntry[] {
  return [
    ...books.filter((b) => b.status === 'reading').sort(byReadingRecency),
    ...books.filter((b) => b.status === 'finished').sort(byFinishedDesc),
  ]
}
