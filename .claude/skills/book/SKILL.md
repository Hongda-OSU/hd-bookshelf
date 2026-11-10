---
name: book
description: Add a book to hd-bookshelf, save a sentence from it, mark it finished, or edit its data. Writes data/books/<id>.json, validates it, and commits (never pushes). Use when the user runs /book or asks to add a book, record a quote, or finish a book on this shelf.
argument-hint: 'add <title|ISBN> | quote <book> "<sentence>" | finish <book> | edit <book> <field> <value>'
---

# /book

Writes book data for this site. The schema is `BookSchema` in
`src/lib/book.ts`; read it before writing anything. It is the source of truth,
not this file.

## Hard rules

- **Never write a recommendation or a note for the user.** Use their exact
  words. No drafting, polishing, translating or "suggesting one". If they give
  none, leave the field out.
- Never invent metadata (author, ISBN, dates). Unknown: ask, or leave it out.
- Only touch `data/books/` and the book's image in `public/covers/`. One book
  change per commit.
- After every write: `pnpm build:index` must pass, then commit. **Never push.**
  Tell the user to push; pushing to `main` deploys the site.
- Commit messages (the commit-msg hook enforces Conventional Commits and a
  72-character subject; shorten the title if needed):
  - `chore(data): add "<title>"`
  - `chore(data): add a sentence from "<title>"`
  - `chore(data): finish "<title>"`
  - `chore(data): update "<title>"`
- Talk to the user in Chinese. Keep questions short; batch them in one message.

## Picking the book (`<book>` argument)

Match case-insensitively against `id` and `title` in `data/books/*.json`; a
substring is enough. No match: say so and list the closest. More than one:
ask which.

## `/book add <title or ISBN>`

1. **Find it.** `pnpm -s book:lookup isbn <ISBN>` or
   `pnpm -s book:lookup search "<title author>"`. Show the top candidates
   (title, author, first published) and confirm which work it is. Open
   Library rarely has Chinese titles or editions: for a translated book,
   search by the original title and author instead, and ask which edition
   the user read (publisher, translator, ISBN from the copyright page).
2. **Confirm the details in one message**, with what you found filled in:
   - `title`: the short title, without the subtitle unless the user wants it.
   - `author`, `isbn` (ISBN-13 of the edition they read if known, else the
     original edition's; digits only).
   - `status`: `reading` (default) or `finished` with `dateFinished` (YYYY-MM).
   - `dateStarted` (YYYY-MM, optional).
   - `format`: `paper` / `ebook` / `audiobook` (纸书 / 电子书 / 有声书).
   - `category`: list the categories already used in `data/books/` and suggest
     one of them. Propose a new one only when none fits; the user decides.
3. **id**: lowercase-hyphen slug of the English title (`bad-blood`); for a
   Chinese title use its English edition title or pinyin, and confirm. The
   file `data/books/<id>.json` must not exist yet.
4. **Pick a cover and keep it in the repo.** `pnpm -s book:lookup editions <work>`,
   choose up to 8 cover ids (prefer the edition they read and clean
   publisher covers), then `pnpm -s book:lookup covers <id> <id> ...` and
   `open -a Preview <sheet>`. Ask for a number, or "none" (the site then
   draws a placeholder cover; leave `cover` and `coverColor` out). Warn when
   the candidates are dark user photos: they look black on this site's dark
   background. When Open Library lacks the edition read (e.g. a Chinese
   edition), ask the user for an image of it instead.
   Then `pnpm -s book:lookup save <coverId or image path> <id>`: it writes
   `public/covers/<id>.jpg` (metadata stripped) and prints the `cover`
   (`covers/<id>.jpg`, no leading slash) and `coverColor` to use; leave
   `coverColor` out when it is null. Mention if the image is under ~560px
   wide (soft on the book page). Commit the image together with the JSON.
5. **Write** `data/books/<id>.json`, omitting unset optional keys, in this
   order:
   `id title author isbn cover coverColor category status dateStarted dateFinished format recommendation sentences`.
   `sentences` is `[]` when empty. 2-space indent, UTF-8 (not escaped),
   trailing newline.
6. Validate, commit, report the commit hash, remind to push.

## `/book quote <book> "<sentence>" [location] [note]`

Append to `sentences`: `text` (exact, as given), `location` if given
(e.g. `p. 12`), `note` only if the user wrote one, `addedAt` = today's local
date (YYYY-MM-DD). Allowed on finished books too. Validate, commit.

## `/book finish <book> [YYYY-MM] [recommendation]`

Set `status: "finished"` and `dateFinished` (given, else the current month);
keep `dateStarted`. If no recommendation was given, ask once ("推荐语？可以留空");
use the reply verbatim or leave it out. Validate, commit.

## `/book edit <book> <field> <value>`

Change one field and keep the rest. `cover`: use the cover step from `add`
(`save` overwrites `public/covers/<id>.jpg`; update `coverColor` too).
`status` back to `reading`: remove `dateFinished` (the schema rejects it on
reading books). Validate, commit with `update`.

## No arguments

Show the four commands above with one example each, in Chinese.

## When validation fails

`pnpm build:index` prints `data/books/<file>: <field>: <problem>`. Show it,
fix it with the user, and do not commit until it passes.
