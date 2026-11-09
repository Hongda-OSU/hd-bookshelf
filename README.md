<img src="assets/icon.png" width="128" height="128" alt="Hongda's Shelf icon: a pixel-art navy book with a smiling face and a red bookmark">

# Hongda's Shelf

A personal bookshelf of the books I've read: covers, the month I finished each
one, why I'd recommend it, and the sentences I kept along the way.

## Features

- Shelf grouped into "reading" and "finished", filterable by category and searchable by title or author
- Book page with my recommendation and every sentence I saved, with notes and page numbers
- Monthly reading chart for the current year
- Books added from Claude Code with a `/book` skill that fetches covers and metadata

## Tech Stack

- Frontend: Svelte 5, TypeScript, Vite
- Data: one JSON file per book, no backend
- Hosting: GitHub Pages via GitHub Actions

## Getting Started

### Prerequisites

- Node.js 22.18+
- pnpm 9+

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
