# hd-bookshelf

A read-only personal bookshelf site: each book has a cover, finish month, a
recommendation, and sentences I saved while reading. Books are JSON files in
the repo, written by the `/book` skill (`.claude/skills/book/`) or by hand. The
site never writes data.

## Stack

- Runtime: Node 22.18+ (scripts in `scripts/*.ts` run with native type stripping, no tsx)
- Framework: Svelte 5 + Vite, TypeScript; Lenis for smooth scrolling
- Package manager: **pnpm** 12, pinned by `packageManager` (not npm, not yarn)
- Hosting: GitHub Pages, served under `/hd-bookshelf/`. Every push to `main`
  runs `.github/workflows/deploy.yml` (format check, types, build, deploy).
- Data: one JSON file per book in `data/books/<id>.json`, schema in zod; no backend

## Commands

| Purpose                          | Command             |
| -------------------------------- | ------------------- |
| Install                          | `pnpm install`      |
| Dev server                       | `pnpm dev`          |
| Build                            | `pnpm build`        |
| Validate data + regenerate index | `pnpm build:index`  |
| Types                            | `pnpm check`        |
| Format                           | `pnpm format`       |
| Format check                     | `pnpm format:check` |
| Open Library lookup (`/book`)    | `pnpm book:lookup`  |

## Rules

- Before every commit run `pnpm format:check`, `pnpm check` and `pnpm build`.
  Do not commit if any fails. No ESLint in this project; don't add it.
- The book schema is the zod `BookSchema` in `src/lib/book.ts`; types are inferred
  from it. Frontend code imports types only, so zod stays out of the bundle.
- Each book has exactly one `category` (a string, not an array).
- Never generate or rewrite a recommendation with AI. It is always my own words;
  if I don't give one, leave it empty.
- `src/generated/` (index.json, quotes.json) is generated and gitignored. Never hand-edit it.
  `pnpm dev` doesn't watch `data/`; rerun `pnpm build:index` after editing a book.
- The `/book` skill commits but never pushes. I push myself.
- Asset URLs must respect Vite `base` (`/hd-bookshelf/`); don't hardcode `/`.
- Ask before adding a new dependency or changing the book JSON schema.
- UI changes: touch only what I asked for. For anything visual, show rendered
  options first and let me pick.

## Gotchas

- Routing is hash-based (`#/book/<id>`) in `src/App.svelte`. The shelf stays
  mounted (hidden) while a book is open so its filters survive.
- Scroll with `jumpTo()` from `src/lib/smooth-scroll.ts`, never
  `window.scrollTo`: it stops a Lenis ease still in flight and drops trailing
  trackpad momentum, either of which otherwise scrolls the new page.
- The shelf→book cover morph uses the view-transition name `book-cover`; only
  one visible element may hold it at a time (`nameShelfCover` in `App.svelte`).
- Chinese text has no italic: anything set in italic needs an upright CJK
  fallback (see `.cjk` classes), or the browser slants the glyphs.
- The site is named `hd-bookshelf` (tab title, README); the header wordmark
  deliberately shows "HD Bookshelf" in Cormorant SC.
- Covers: remote Open Library URLs by cover id. Prefer clean publisher scans;
  dark user photos vanish on the dark page. Google Books' keyless API is often
  over quota (HTTP 429).
- Headless Chrome with `--virtual-time-budget` never delivers scroll events or
  finishes view transitions. To test those, drive real-time headless Chrome
  over CDP (`--remote-debugging-port` + Node's built-in WebSocket).

## Product spec

The PRD lives in Notion ("读书记录站 · 产品文档"): scope, schema and milestones.
The original claude.ai design mock is outdated; the current UI is the reference
for layout and visual style.

## When unsure

If a change touches more than three files, or the book schema, propose the
approach before writing code.
