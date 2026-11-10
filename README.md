<img src="assets/icon.png" width="128" height="128" alt="hd-bookshelf icon: a pixel-art navy book with a smiling face and a red bookmark">

# hd-bookshelf

A personal bookshelf of the books I've read: covers, the month I finished each
one, why I'd recommend it, and the sentences I kept along the way.

**Demo:** https://hongdalin.blog/hd-bookshelf/

## Features

- Shelf of books I'm reading and have finished, filterable by status and category, searchable by title or author
- Book page with my recommendation and every sentence I saved, with notes and page numbers
- Monthly reading chart for the year, and a random saved sentence in the footer
- Cover morphs between shelf and book page (View Transitions), with smooth scrolling
- One JSON file per book, validated at build time; every push to `main` deploys

## Tech Stack

- Frontend: Svelte 5, TypeScript, Vite, Lenis
- Data: one JSON file per book, validated with zod; no backend
- Hosting: GitHub Pages via GitHub Actions

## Getting Started

### Prerequisites

- Node.js 22.18+
- pnpm 12 (the exact version is pinned in `package.json`; `corepack enable` picks it up)

### Installation

```bash
git clone https://github.com/Hongda-OSU/hd-bookshelf.git
cd hd-bookshelf
pnpm install
```

## Usage

```bash
pnpm dev
```

Open http://localhost:5173/hd-bookshelf/.

To add a book, create `data/books/<id>.json` (fields are defined by `BookSchema`
in `src/lib/book.ts`), then check it:

```bash
pnpm build:index
```

It validates every book and fails with the file and field at fault.
