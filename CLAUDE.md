# hd-bookshelf

A read-only personal bookshelf site: each book has a cover, finish month, a
recommendation, and sentences I saved while reading. Data is written only by
the `/book` skill; the site never writes.

## Stack

- Runtime: Node 22.18+ (scripts in `scripts/*.ts` run with native type stripping, no tsx)
- Framework: Svelte 5 + Vite, TypeScript
- Package manager: **pnpm** (not npm, not yarn)
- Hosting: GitHub Pages via GitHub Actions, served under `/hd-bookshelf/`
- Data: one JSON file per book in `data/books/<id>.json`; no backend, no database

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

## Gotchas

- Routing is hash-based (`#/book/<id>`) in `src/App.svelte`. The shelf stays
  mounted (hidden) while a book is open so its filters survive.
- Scroll with `jumpTo()` from `src/lib/smooth-scroll.ts`, never
  `window.scrollTo`: Lenis caches the page height and clamps stale jumps.

## Product spec

The PRD lives in Notion ("读书记录站 · 产品文档"). The design mock (shelf page +
book page) is a claude.ai Design artifact. Treat the PRD as the source of truth
for scope; the mock for layout and visual style.

## When unsure

If a change touches more than three files, or the book schema, propose the
approach before writing code.
