// Open Library lookups for the /book skill. Prints JSON to stdout.
//
//   pnpm -s book:lookup search "<title or author>"
//   pnpm -s book:lookup isbn <isbn>
//   pnpm -s book:lookup editions <workId>        e.g. OL17892614W
//   pnpm -s book:lookup covers <coverId> [...]   → contact sheet to pick from
//
// Read-only: it never touches data/books. Covers are downloaded to a temp dir.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const OL = 'https://openlibrary.org'
// Open Library asks automated clients to identify themselves.
const HEADERS = {
  'User-Agent':
    'hd-bookshelf/1.0 (+https://github.com/Hongda-OSU/hd-bookshelf)',
}

type Json = Record<string, unknown>

async function getJson(url: string): Promise<Json | null> {
  const res = await fetch(url, { headers: HEADERS })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return (await res.json()) as Json
}

const str = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : undefined
const strs = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
const nums = (v: unknown): number[] =>
  Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : []
const workId = (key: unknown): string | undefined =>
  str(key)?.replace('/works/', '')

async function search(query: string) {
  const fields =
    'key,title,author_name,first_publish_year,edition_count,cover_i'
  const url = `${OL}/search.json?q=${encodeURIComponent(query)}&fields=${fields}&limit=8`
  const data = await getJson(url)
  const docs = Array.isArray(data?.docs) ? (data.docs as Json[]) : []
  return docs.map((d) => ({
    work: workId(d.key),
    title: str(d.title),
    authors: strs(d.author_name),
    firstPublished: d.first_publish_year,
    editions: d.edition_count,
    coverId: d.cover_i ?? null,
  }))
}

async function authorNames(work: Json | null): Promise<string[]> {
  const refs = Array.isArray(work?.authors) ? (work.authors as Json[]) : []
  const names: string[] = []
  for (const ref of refs) {
    const key = str((ref.author as Json | undefined)?.key)
    if (!key) continue
    const author = await getJson(`${OL}${key}.json`)
    const name = str(author?.name)
    if (name) names.push(name)
  }
  return names
}

function edition(e: Json) {
  return {
    title: str(e.title),
    publisher: strs(e.publishers)[0] ?? null,
    published: str(e.publish_date) ?? null,
    physicalFormat: str(e.physical_format) ?? null,
    language:
      str(((e.languages as Json[] | undefined)?.[0] ?? {}).key)?.replace(
        '/languages/',
        '',
      ) ?? null,
    isbn13: strs(e.isbn_13)[0] ?? null,
    isbn10: strs(e.isbn_10)[0] ?? null,
    coverIds: nums(e.covers).filter((c) => c > 0),
  }
}

async function byIsbn(isbn: string) {
  const e = await getJson(`${OL}/isbn/${isbn}.json`)
  if (!e) return null
  const work = workId(((e.works as Json[] | undefined)?.[0] ?? {}).key)
  const w = work ? await getJson(`${OL}/works/${work}.json`) : null
  return {
    work,
    title: str(w?.title) ?? str(e.title),
    authors: await authorNames(w),
    edition: edition(e),
  }
}

async function editions(work: string) {
  const data = await getJson(`${OL}/works/${work}/editions.json?limit=100`)
  const entries = Array.isArray(data?.entries) ? (data.entries as Json[]) : []
  const seen = new Set<number>()
  const out = []
  for (const e of entries) {
    const ed = edition(e)
    const cover = ed.coverIds.find((c) => !seen.has(c))
    if (cover === undefined) continue
    seen.add(cover)
    out.push({ coverId: cover, ...ed })
  }
  // English editions first; otherwise keep Open Library's order.
  return out.sort(
    (a, b) => Number(b.language === 'eng') - Number(a.language === 'eng'),
  )
}

function hasMagick(): boolean {
  try {
    execFileSync('magick', ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/** Download covers and lay them out on the site's dark background, numbered. */
async function covers(ids: string[]) {
  const dir = path.join(os.tmpdir(), `hd-bookshelf-covers-${Date.now()}`)
  await mkdir(dir, { recursive: true })
  const files: {
    n: number
    coverId: string
    url: string
    file: string | null
  }[] = []
  for (const [i, id] of ids.entries()) {
    const url = `https://covers.openlibrary.org/b/id/${id}-L.jpg`
    const res = await fetch(`${url}?default=false`, { headers: HEADERS })
    let file: string | null = null
    if (res.ok) {
      file = path.join(dir, `${i + 1}-${id}.jpg`)
      await writeFile(file, Buffer.from(await res.arrayBuffer()))
    }
    files.push({ n: i + 1, coverId: id, url, file })
  }

  const got = files.filter((f) => f.file)
  let sheet: string | null = null
  if (got.length > 0 && hasMagick()) {
    try {
      sheet = contactSheet(
        dir,
        got as { n: number; coverId: string; file: string }[],
      )
    } catch {
      // No sheet is fine: the files and URLs are still listed.
      sheet = null
    }
  }
  return { sheet, files }
}

// ImageMagick here may have no default font; pick a system one explicitly.
// Labels stay ASCII, so any Latin font works. No font found → no labels.
const LABEL_FONTS = [
  '/System/Library/Fonts/SFNS.ttf',
  '/System/Library/Fonts/Helvetica.ttc',
  '/System/Library/Fonts/Supplemental/Arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
]

function contactSheet(
  dir: string,
  got: { n: number; coverId: string; file: string }[],
): string {
  const font = LABEL_FONTS.find((f) => existsSync(f))
  const BG = '#0f0f11'
  const tiles = got.map((f) => {
    const tile = path.join(dir, `tile-${f.n}.png`)
    const label = font
      ? [
          '-font',
          font,
          '-fill',
          '#cfc8bd',
          '-pointsize',
          '15',
          '-annotate',
          '+0+6',
          `${f.n}  #${f.coverId}`,
        ]
      : []
    execFileSync('magick', [
      f.file,
      '-resize',
      '200x300',
      '-background',
      BG,
      '-gravity',
      'center',
      '-extent',
      '220x310',
      '-gravity',
      'south',
      '-splice',
      '0x28',
      ...label,
      tile,
    ])
    return tile
  })
  const rows: string[] = []
  for (let i = 0; i < tiles.length; i += 4) {
    const row = path.join(dir, `row-${i / 4}.png`)
    execFileSync('magick', [
      ...tiles.slice(i, i + 4),
      '-background',
      BG,
      '+append',
      row,
    ])
    rows.push(row)
  }
  const sheet = path.join(dir, 'covers.png')
  execFileSync('magick', [
    ...rows,
    '-background',
    BG,
    '-gravity',
    'west',
    '-append',
    '-bordercolor',
    BG,
    '-border',
    '14',
    sheet,
  ])
  return sheet
}

const [cmd, ...args] = process.argv.slice(2)
const usage =
  'usage: book-lookup <search "<query>" | isbn <isbn> | editions <workId> | covers <coverId>...>'

let result: unknown
if (cmd === 'search' && args.length > 0) result = await search(args.join(' '))
else if (cmd === 'isbn' && args[0])
  result = await byIsbn(args[0].replace(/[-\s]/g, ''))
else if (cmd === 'editions' && args[0]) result = await editions(args[0])
else if (cmd === 'covers' && args.length > 0) result = await covers(args)
else {
  console.error(usage)
  process.exit(2)
}
console.log(JSON.stringify(result, null, 2))
