import type { Format } from './book'

export const FORMAT_LABEL: Record<Format, string> = {
  paper: '纸书',
  ebook: '电子书',
  audiobook: '有声书',
}

/** "2026-10" → "2026.10" */
export function dotMonth(ym: string): string {
  return ym.replace('-', '.')
}

/** "2026-10" → "2026 年 10 月" */
export function cnMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return `${y} 年 ${Number(m)} 月`
}

export const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** Link to a book page (hash routing, see App.svelte). */
export function bookHref(id: string): string {
  return `#/book/${id}`
}
