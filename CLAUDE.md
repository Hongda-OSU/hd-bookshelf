# hd-bookshelf

A read-only personal bookshelf site: each book has a cover, finish month, a
recommendation, and sentences I saved while reading. Data is written only by
the `/book` skill; the site never writes.

## Stack

- Runtime: Node 22+
- Framework: Svelte 5 + Vite, TypeScript
- Package manager: **pnpm** (not npm, not yarn)
- Hosting: GitHub Pages via GitHub Actions, served under `/hd-bookshelf/`
- Data: one JSON file per book in `data/books/<id>.json`; no backend, no database

## Commands

| Purpose      | Command             |
| ------------ | ------------------- |
| Install      | `pnpm install`      |
| Dev server   | `pnpm dev`          |
| Build        | `pnpm build`        |
| Types        | `pnpm check`        |
| Format       | `pnpm format`       |
| Format check | `pnpm format:check` |

## Rules

- Before every commit run `pnpm format:check`, `pnpm check` and `pnpm build`.
  Do not commit if any fails. No ESLint in this project; don't add it.
- Each book has exactly one `category` (a string, not an array).
- Never generate or rewrite a recommendation with AI. It is always my own words;
  if I don't give one, leave it empty.
- `index.json` is generated at build time. Never hand-edit it.
- The `/book` skill commits but never pushes. I push myself.
- Asset URLs must respect Vite `base` (`/hd-bookshelf/`); don't hardcode `/`.
- Ask before adding a new dependency or changing the book JSON schema.

## Product spec

The PRD lives in Notion ("读书记录站 · 产品文档"). The design mock (shelf page +
book page) is a claude.ai Design artifact. Treat the PRD as the source of truth
for scope; the mock for layout and visual style.

## When unsure

If a change touches more than three files, or the book schema, propose the
approach before writing code.
