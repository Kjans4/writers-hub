# Writer's Hub

A full-stack creative writing platform combining a Git-style version control system for chapters with an Obsidian-style world-building knowledge graph.

---

## Features

- **Chapter editor** — TipTap rich-text editor with autosave, focus mode, and keyboard shortcuts
- **Paragraph versioning** — every paragraph gets a stable UUID; rewrites are tracked and restorable
- **Chapter checkpoints** — named snapshots of full chapter state with a visual timeline
- **Story branching** — fork your entire project (Canon + all entities) into alternate timelines
- **World-building entities** — Characters, Locations, Lore, Objects with quick-facts and notes
- **Wikilinks** — type `[[Name]]` in the editor to link entities; hover for a quick-look card
- **Story map** — force-directed graph of chapters and entities built from wikilink connections
- **Publishing** — publish stories publicly with cover image, genre, tags, and per-chapter control
- **Reader experience** — highlights, inline comments, bookmarks, ratings, and Ink tipping

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Supabase (Postgres + Auth + Storage) |
| Editor | TipTap v2 with custom extensions |
| Graph | react-force-graph-2d |
| State | Zustand |
| Styling | Tailwind CSS v4 |
| Fonts | Lora (editor) + Inter (UI) |
| Icons | Lucide React |

---

## Dependencies

### Runtime

| Package | Version | Purpose |
|---|---|---|
| `next` | ^16.2.6 | Framework |
| `react` | ^19.2.6 | UI library |
| `react-dom` | ^19.2.6 | DOM rendering |
| `@supabase/supabase-js` | ^2.105.4 | Supabase client |
| `@supabase/ssr` | ^0.10.3 | Supabase SSR helpers for Next.js |
| `@tiptap/react` | ^3.23.1 | Rich-text editor core |
| `@tiptap/starter-kit` | ^3.23.1 | TipTap default extensions bundle |
| `@tiptap/extension-heading` | ^3.23.1 | Heading nodes (H1–H3) |
| `@tiptap/extension-link` | ^3.23.1 | Hyperlink extension |
| `@tiptap/extension-placeholder` | ^3.23.1 | Editor placeholder text |
| `@tiptap/extension-typography` | ^3.23.1 | Smart quotes, dashes |
| `@tiptap/pm` | ^3.23.1 | ProseMirror core (peer) |
| `react-force-graph-2d` | ^1.29.1 | 2D force-directed story map |
| `react-force-graph` | ^1.48.2 | Force-graph base |
| `zustand` | ^5.0.13 | Global state management |
| `uuid` | ^14.0.0 | Stable paragraph key generation |
| `diff` | ^9.0.0 | Text diffing (paragraph versions) |
| `lucide-react` | ^1.14.0 | Icon set |

### Dev / Build

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5 | Type checking |
| `tailwindcss` | ^4 | Utility CSS |
| `@tailwindcss/postcss` | ^4 | PostCSS integration |
| `eslint` | ^9 | Linting |
| `eslint-config-next` | 16.2.6 | Next.js ESLint rules |
| `@types/node` | ^20 | Node type definitions |
| `@types/react` | ^19 | React type definitions |
| `@types/react-dom` | ^19 | React DOM types |
| `@types/uuid` | ^10.0.0 | UUID types |
| `@types/diff` | ^7.0.2 | Diff types |

---

## Environment Variables

Create a `.env.local` file at the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_ENABLE_TEST_INK=true
```

- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase dashboard → Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key, safe to expose
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never prefix with `NEXT_PUBLIC_`. Used for atomic Ink transactions
- `NEXT_PUBLIC_ENABLE_TEST_INK` — set `true` in dev/staging to enable the test Ink `+` button; omit or set `false` in production

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app runs at `http://localhost:3000`. The home feed is at `/home`, the editor at `/dashboard`.

---

## Project Structure

```
app/
├── (auth)/          # Login, signup pages
├── (editor)/        # Project editor, chapter editor, entity pages
├── (reader)/        # Home feed, story pages, author profiles, library
├── (reading)/       # Chapter reading pages (no nav chrome)
└── api/             # API routes (annotations, bookmarks, ink, publish...)

components/
├── editor/          # TipTap editor, toolbar, extensions, rewrite surface
├── entity/          # Entity pages, quick facts, states
├── feed/            # Story cards, cover placeholders
├── genre/           # Genre badges, pill row, genre page
├── ink/             # Ink balance, shop, tip flow
├── layout/          # Nav, panels, branch dropdown, save indicator
├── library/         # Bookmarks tab, reading lists tab
├── map/             # Story map, legend
├── publish/         # Publish wizard, manage publishing, earnings
├── rating/          # Rating prompt, dimension stars, display
├── reader/          # Selection toolbar, highlight layer, margin bubbles
└── timeline/        # Checkpoint modal, timeline strip, preview

lib/
├── annotations/     # captureAnchor, resolveAnchor utilities
├── hooks/           # useAutosave, useDocument, useBranch, useLinks...
├── ink/             # Bundle definitions
├── supabase/        # Client, server, admin, types
└── utils/           # Tag normalization
```

---

## Key Concepts

**Paragraph keys** — every `<p>` in the editor gets a stable UUID via `ParagraphKeyExtension`. This UUID persists even if the paragraph moves, and is the only authoritative identifier for paragraph version history. Never use paragraph index.

**Branches** — forking creates full copies of all Canon documents with new UUIDs. Link rows are also copied and remapped. Branches never share document rows with Canon.

**Wikilinks** — the `[[Title]]` syntax triggers a search dropdown. On insert, a wikilink node is created. The `links` table is synced on every editor update and drives the story map, hover cards, and "Appears In" on entity pages.

**Annotation anchors** — highlights and inline comments are stored as `paragraph_key + char offset + selected_text`. On re-render, `resolveAnchor` walks the DOM to place the range and detects staleness if the text no longer matches.