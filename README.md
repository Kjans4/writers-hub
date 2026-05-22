# Writer's Hub

A full-stack creative writing platform combining a Git-style version control system for chapters with an Obsidian-style world-building knowledge graph, plus a complete reader experience with annotations, ratings, and a virtual tipping economy.

---

## Features

### Writing & Versioning
- **Chapter editor** — TipTap rich-text editor with autosave, focus mode, and keyboard shortcuts
- **Paragraph versioning** — every paragraph gets a stable UUID; rewrites are tracked and restorable via a history drawer
- **Rewrite surface** — write up to 3 alternative versions of a paragraph and compare them side-by-side in clean prose (no diff markup)
- **Chapter checkpoints** — named snapshots of full chapter state with a visual timeline strip and read-only preview
- **Story branching** — fork your entire project (Canon + all entities) into alternate timelines; promote any branch to Canon

### World-Building
- **World-building entities** — Characters, Locations, Lore, Objects with inline notes editor and quick-facts sidebar
- **Entity states** — tag entities with colored labels at specific chapters ("Dead from Chapter 7") with timeline view
- **Wikilinks** — type `[[Name]]` in the editor to link entities; hover for a quick-look card showing quick facts
- **Inline autocomplete** — typing 3+ characters suggests matching entity names; Tab to insert as a wikilink
- **Story map** — force-directed graph of chapters and entities built from wikilink connections, color-coded by type

### Publishing
- **Publish wizard** — multi-step: story details (title, hook, description, content rating, status), cover image upload, chapter selection
- **Genre & tags** — assign a genre and up to 5 searchable tags; editable from the Manage Publishing page
- **Per-chapter control** — publish or unpublish individual chapters independently
- **Story page** — public-facing page with cover, author bio, chapter list, community ratings, and resume reading CTA

### Reader Experience
- **Highlights** — select any single-paragraph passage to highlight in yellow; persists across sessions via DOM anchor (paragraph key + char offset); stale detection when authors edit
- **Inline comments** — select a passage and leave a public reaction; margin bubbles (●N) show comment counts; flat thread drawer with appreciation hearts, edit, and soft-delete
- **Bookmarks** — bookmark any chapter from the reading header or selection toolbar; accessible from `/library`
- **Ratings** — five-dimension rating system (Prose, Plot, Characters, Pacing, World); prompt appears after 3 completed chapters; aggregate display on story page with per-dimension bars; star score on story cards (shown when ≥5 ratings)
- **Ink economy** — virtual currency tipping system; readers tip authors with Ink; atomic balance transfers; author earnings dashboard; `/shop` page with bundle UI (payment stubs for prototype)

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
| Fonts | Lora (editor body) + Inter (UI chrome) |
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
ENABLE_TEST_INK=true
NEXT_PUBLIC_ENABLE_TEST_INK=true
```

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL — from Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Public anon key, safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Service role key for atomic Ink transactions — never prefix with `NEXT_PUBLIC_` |
| `ENABLE_TEST_INK` | Server only | Set `true` to enable `POST /api/ink/test-add`; omit in production |
| `NEXT_PUBLIC_ENABLE_TEST_INK` | Client | Set `true` to show the `+` test Ink button in the nav; omit in production |

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

The app runs at `http://localhost:3000`.

| Path | Description |
|---|---|
| `/home` | Public reader feed |
| `/dashboard` | Writer's project dashboard |
| `/story/[slug]` | Public story page |
| `/story/[slug]/chapter/[n]` | Chapter reading page |
| `/library` | Reader's bookmarks and reading lists |
| `/shop` | Ink shop (public) |
| `/project/[id]` | Project editor shell |
| `/project/[id]/chapter/[id]` | Chapter editor |
| `/project/[id]/entity/[id]` | Entity (character/location/etc.) editor |
| `/project/[id]/map` | Full-screen story map |
| `/publish/[projectId]` | Publish wizard / manage publishing + earnings |

---

## Database Migrations

Migrations are in `supabase/migrations/` and should be applied in order:

| File | Phase | Contents |
|---|---|---|
| *(Chunks 1–2 migrations)* | Setup | Projects, branches, documents, links, snapshots, profiles, published stories, reading progress, notifications, reading lists |
| `phase_a_highlights.sql` | Chunk 3A | `highlights` table, RLS, indexes |
| `phase_b_inline_comments.sql` | Chunk 3B | `inline_comments`, `inline_comment_appreciations`, appreciation count trigger, RLS |
| `phase_c_bookmarks.sql` | Chunk 3C | `bookmarks` table, RLS |
| `phase_d_ratings.sql` | Chunk 3D | `ratings` table, `ratings_score`/`ratings_count` columns on `published_stories`, `sync_story_rating` trigger, RLS |
| `phase_e_ink.sql` | Chunk 3E | `ink_balances`, `ink_transactions`, `increment_ink_balance` + `decrement_ink_balance` functions, updated `handle_new_user` trigger, 500 Ink backfill, RLS |

Run each migration in the Supabase SQL editor. All migrations are idempotent — safe to re-run.

---

## Project Structure

```
app/
├── (auth)/                    # Login, signup
├── (editor)/                  # Project editor, chapter editor, entity pages, publish wizard
├── (reader)/                  # Home feed, story pages, author profiles, library, shop
├── (reading)/                 # Chapter reading pages (no nav chrome)
└── api/
    ├── annotations/
    │   ├── highlights/        # GET by document, POST create, PATCH/DELETE by id
    │   └── inline-comments/   # POST create, GET summary, GET thread, PATCH/DELETE/appreciate by id
    ├── bookmarks/             # GET all, GET/POST toggle by documentId
    ├── genres/                # GET all genres, GET tags by slug
    ├── ink/
    │   ├── balance/           # GET current balance
    │   ├── tip/               # POST atomic tip (service role)
    │   ├── test-add/          # POST add test Ink (env-gated)
    │   ├── earnings/          # GET author earnings by projectId
    │   └── transactions/      # GET sent tip history
    ├── lists/                 # Reading list CRUD
    ├── publish/               # Publish story, publish/unpublish chapters
    ├── ratings/               # GET aggregate, GET mine, POST upsert, DELETE, POST dismiss
    ├── story/                 # Story tag management
    └── tags/                  # Tag suggest, tag page data

components/
├── editor/                    # TipTap editor, toolbar, extensions, rewrite surface, hover card
│   └── extensions/            # WikilinkExtension, HoverCardExtension, ParagraphKeyExtension, InlineAutocompleteExtension
├── entity/                    # Entity pages, quick facts, states, label management
├── feed/                      # StoryCard, CoverPlaceholder
├── genre/                     # GenreBadge, GenrePillRow, GenrePage
├── ink/                       # InkBalance, InkShop, InkBundle, TipSection, TipSelector, TipConfirmation, TipSuccess
├── layout/                    # ReaderNav, LeftPanel, RightPanel, BranchDropdown, SaveIndicator, ForkModal
├── library/                   # BookmarksTabContent, BookmarkCard, ReadingListsTab, AddToListDropdown
├── map/                       # StoryMap, MapLegend
├── publish/                   # PublishWizard, ManagePublishing, EarningsDashboard, StepDetails, StepCover, StepChapters
├── rating/                    # RatingPrompt, DimensionStars, RatingDisplay, RatingBars
├── reader/                    # SelectionToolbar, HighlightLayer, StaleHighlightBanner, ChapterAnnotationShell
│                              # MarginBubble, MarginBubbleLayer, MarginDrawer, InlineCommentWrite, ReadingHeader
├── story/                     # StoryPage
├── tag/                       # TagPill, TagList, TagInput, TagPage
└── timeline/                  # CheckpointModal, TimelineStrip, CheckpointPreview

lib/
├── annotations/               # captureAnchor.ts, resolveAnchor.ts
├── hooks/                     # useAutosave, useDocument, useBranch, useLinks, useSnapshots,
│                              # useParagraphVersions, useEntityStates, useMarkLabels, useStoryMap
├── ink/                       # bundles.ts (INK_BUNDLES constant, calculateAvailable)
├── supabase/                  # client.ts, server.ts, admin.ts, types.ts
└── utils/                     # normalizeTag.ts

store/
└── editorStore.ts             # Zustand store — active project/branch/document, panel state, save status
```

---

## Key Concepts

**Paragraph keys** — every `<p>` in the TipTap editor gets a stable UUID via `ParagraphKeyExtension`. This UUID persists even if the paragraph moves, and is the authoritative identifier for both paragraph version history and annotation anchors. Never use paragraph index.

**Branches** — forking creates full copies of all Canon documents with new UUIDs. `links` rows are also copied and remapped so each branch has independent link state. Branches never share document rows with Canon.

**Wikilinks** — the `[[Title]]` syntax triggers a search dropdown (`WikilinkDropdown`). On insert, an inline wikilink node is created in the ProseMirror document. The `links` table is synced on every editor update via `WikilinkExtension` and drives the story map, hover cards, and "Appears In" on entity pages.

**Annotation anchors** — highlights and inline comments are stored as `paragraph_key + start_offset + end_offset + selected_text`. On every chapter page load, `resolveAnchor` walks the DOM text nodes to reconstruct the range. If the text at those offsets no longer matches `selected_text`, the annotation is marked stale. Cross-paragraph selections are rejected at the `captureAnchor` level.

**Ink economy** — `ink_balances` has no client INSERT/UPDATE RLS policies. All balance mutations go through `SECURITY DEFINER` Postgres functions (`increment_ink_balance`, `decrement_ink_balance`) called via `supabaseAdmin` (service role) in the tip API route. This guarantees atomicity without a transaction-style multi-step approach that could leave balances inconsistent.

**Ratings eligibility** — the `ratings_insert_own` RLS policy enforces that a reader must have 3+ completed chapters before inserting a rating row. The `dismissed_count` upsert pattern uses a relaxed `at_least_one_dimension` constraint that allows rows where all dimension columns are NULL as long as `dismissed_count > 0`.

---

## What's Not Built (Prototype Scope)

- Real payment processing (Stripe) — Ink shop "Buy" buttons are stubs
- Cash payouts / tax / compliance — "Convert to cash" is a disabled UI placeholder
- Fraud prevention on tips
- Cross-paragraph highlights — single paragraph only (DOM limitation)
- Inline comment reply threading — flat reactions only
- Admin moderation tools
- Full-text search across stories
- Email notifications