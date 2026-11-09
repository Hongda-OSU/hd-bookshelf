// Placeholder covers for books without a cover image, in the mock's style.
// Colors and layout are derived from the book id, so a book keeps the same
// look across builds.

export type CoverVariant = 'band' | 'frame' | 'block'

export type Placeholder = {
  variant: CoverVariant
  bg: string
  ink: string
  mark: string
  cjk: boolean
}

// [background, text, accent mark]
const PALETTE: [string, string, string][] = [
  ['#20324a', '#e8edf3', '#e7a45a'],
  ['#e9e3d6', '#1f2a25', '#b6452c'],
  ['#2f4a3c', '#eef2e6', '#eef2e6'],
  ['#5b2a3a', '#f6e9ec', '#f0b86e'],
  ['#e4e9ec', '#14212b', '#2c7a7b'],
  ['#6b4a2b', '#f4e7d3', '#f4e7d3'],
  ['#1d2230', '#e9e6f2', '#8fa6d8'],
  ['#c9cfd6', '#1b2230', '#d0562c'],
  ['#d9c7a8', '#2a2219', '#2a2219'],
  ['#2c3e36', '#e6efe9', '#e3b04b'],
  ['#efe9df', '#1d1b18', '#3a6ea5'],
  ['#3c3557', '#efeaf8', '#f3c26b'],
  ['#111827', '#e5e7eb', '#f59e0b'],
]

const VARIANTS: CoverVariant[] = ['band', 'frame', 'block']

// FNV-1a: small, stable string hash.
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function placeholderCover(id: string, title: string): Placeholder {
  const h = hash(id)
  const [bg, ink, mark] = PALETTE[h % PALETTE.length]
  return {
    variant: VARIANTS[(h >>> 8) % VARIANTS.length],
    bg,
    ink,
    mark,
    cjk: /[㐀-鿿]/.test(title),
  }
}

/** Remote URLs are used as-is; repo paths are served from public/. */
export function coverUrl(cover: string): string {
  if (/^https?:\/\//.test(cover)) return cover
  return import.meta.env.BASE_URL + cover.replace(/^\//, '')
}
