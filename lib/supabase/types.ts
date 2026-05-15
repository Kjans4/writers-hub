// lib/supabase/types.ts
// All database types for Writer's Hub.
// Updated for Chunk 3: adds Highlight, InlineComment, InlineCommentAppreciation,
// Bookmark, Rating, InkBalance, InkTransaction, Notification types.
// Also adds ratings_score / ratings_count to PublishedStory,
// and the Notification type introduced in Chunk 2.

export type DocumentType = 'chapter' | 'character' | 'location' | 'lore' | 'object'

export type ContentRating = 'all_ages' | 'teen' | 'mature'
export type StoryStatus   = 'ongoing' | 'completed' | 'hiatus'

// Notification types — extended in Chunk 3 with 'new_tip'
export type NotificationType =
  | 'new_follower'
  | 'new_comment'
  | 'new_chapter'
  | 'new_tip'

// Ink transaction types
export type InkTransactionType = 'tip' | 'purchase' | 'test_add'

// ── Existing tables (Chunk 1) ─────────────────────────────────────

export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  project_id: string
  name: string
  is_canon: boolean
  parent_branch_id: string | null
  forked_at_snapshot_id: string | null
  created_at: string
}

export interface Document {
  id: string
  project_id: string
  branch_id: string
  type: DocumentType
  title: string
  content: string | null
  metadata: Record<string, unknown> | null
  order_index: number | null
  // Chunk 1 additions
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Link {
  id: string
  project_id: string
  branch_id: string
  source_doc_id: string
  target_doc_id: string
  created_at: string
}

export interface Snapshot {
  id: string
  document_id: string
  branch_id: string
  content: string
  message: string | null
  created_at: string
}

export interface ParagraphVersion {
  id: string
  document_id: string
  paragraph_key: string
  content: string
  is_current: boolean
  created_at: string
}

// ── Chunk 1 new tables ────────────────────────────────────────────

export interface Profile {
  id: string              // matches auth.users.id
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface PublishedStory {
  id: string
  project_id: string
  user_id: string
  slug: string
  title: string
  hook: string | null
  description: string | null
  cover_url: string | null
  content_rating: ContentRating
  status: StoryStatus
  is_published: boolean
  published_at: string
  updated_at: string
  // Chunk 3 additions — added via ALTER TABLE migration
  ratings_score: number | null
  ratings_count: number
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface ReadingProgress {
  id: string
  user_id: string
  published_story_id: string
  current_document_id: string | null   // null → start from chapter 1
  last_read_at: string
}

export interface CompletedChapter {
  id: string
  user_id: string
  document_id: string
  completed_at: string
}

// ── Chunk 2 new tables ────────────────────────────────────────────

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  link: string | null
  actor_id: string | null    // null for anonymous (e.g. tip notifications)
  entity_id: string | null   // e.g. transaction ID for tips
  is_read: boolean
  created_at: string
}

export interface ReadingList {
  id: string
  user_id: string
  name: string
  is_default: boolean
  sort_order: number
  created_at: string
}

export interface ReadingListItem {
  id: string
  list_id: string
  published_story_id: string
  added_at: string
}

// ── Chunk 3 new tables ────────────────────────────────────────────

// Phase A — Highlights
export interface Highlight {
  id: string
  user_id: string
  document_id: string
  paragraph_key: string
  start_offset: number
  end_offset: number
  selected_text: string
  color: string            // '#FEF08A' for prototype
  note: string | null
  is_public: boolean
  is_stale: boolean
  created_at: string
}

// Phase B — Inline Comments
export interface InlineComment {
  id: string
  user_id: string
  document_id: string
  paragraph_key: string
  start_offset: number
  end_offset: number
  selected_text: string
  content: string
  appreciation_count: number
  is_deleted: boolean
  is_stale: boolean
  created_at: string
  updated_at: string
}

export interface InlineCommentAppreciation {
  id: string
  comment_id: string
  user_id: string
  created_at: string
}

// Phase C — Bookmarks
export interface Bookmark {
  id: string
  user_id: string
  document_id: string
  published_story_id: string
  created_at: string
}

// Phase D — Ratings
// NOTE: dismissed_count rows (all dimensions NULL) are allowed by the
// relaxed constraint — see schema notes in chunk 3 spec.
export interface Rating {
  id: string
  user_id: string
  published_story_id: string
  prose: number | null        // 1–5 or null if not rated
  plot: number | null
  characters: number | null
  pacing: number | null
  world: number | null
  dismissed_count: number     // tracks "maybe later" dismissals, max 3
  created_at: string
  updated_at: string
}

// Phase E — Ink Economy
export interface InkBalance {
  user_id: string
  balance: number
  total_earned: number
  total_spent: number
  updated_at: string
}

export interface InkTransaction {
  id: string
  from_user_id: string | null
  to_user_id: string | null
  type: InkTransactionType
  amount: number
  document_id: string | null
  created_at: string
}

// ── Convenience types for API responses ──────────────────────────

// Published chapter as returned by the chapter-list API
export interface PublishedChapter {
  document_id: string
  position: number       // 1-based, computed server-side from order_index sort
  title: string
  published_at: string
}

// Single chapter with full content for the reading page
export interface ChapterWithContent extends PublishedChapter {
  content: string        // raw TipTap HTML — rendered with prose-reading CSS
}

// Story card shape used in home feed and author profile
export interface StoryCard {
  id: string
  slug: string
  title: string
  hook: string | null
  cover_url: string | null
  content_rating: ContentRating
  status: StoryStatus
  published_chapter_count: number
  // Chunk 3 additions
  ratings_score: number | null
  ratings_count: number
  author: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

// Continue Reading item used in home feed
export interface ContinueReadingItem {
  published_story_id: string
  slug: string
  title: string
  cover_url: string | null
  current_document_id: string | null
  resume_position: number     // 1-based chapter position to resume at
  resume_chapter_title: string
  chapters_completed: number
  total_published: number
  last_read_at: string
}

// Inline comment thread response shape (from GET /api/annotations/inline-comments/[documentId]/[paragraphKey])
export interface InlineCommentThread {
  paragraph_key: string
  selected_text: string
  is_stale: boolean
  comments: Array<{
    id: string
    user_id: string
    author_name: string
    author_avatar: string | null
    content: string
    appreciation_count: number
    appreciated_by_me: boolean
    is_mine: boolean
    created_at: string
  }>
  total: number
  has_more: boolean
}

// Margin bubble summary (from GET /api/annotations/inline-comments/[documentId]/summary)
export interface BubbleSummary {
  paragraph_key: string
  count: number
  has_mine: boolean
}

// Bookmark with resolved chapter/story data (from GET /api/bookmarks)
export interface BookmarkWithMeta {
  id: string
  document_id: string
  chapter_number: number
  chapter_title: string
  story_slug: string
  story_title: string
  story_cover_url: string | null
  created_at: string
}

// Author earnings response (from GET /api/ink/earnings/[projectId])
export interface EarningsResponse {
  total_earned: number
  available: number      // total_earned * 0.9 (10% platform fee)
  by_chapter: Array<{
    document_id: string
    chapter_number: number
    chapter_title: string
    total_tips: number
  }>
  recent_tips: Array<{
    amount: number
    chapter_title: string
    created_at: string
  }>
}

// ── Entity States (from previous chunks) ─────────────────────────

export interface MarkLabel {
  id: string
  project_id: string
  name: string
  color: string
  created_at: string
}

export interface EntityState {
  id: string
  entity_id: string
  branch_id: string
  chapter_id: string
  label_id: string
  note: string | null
  created_at: string
  // Joined relations
  mark_labels?: { id: string; name: string; color: string } | null
  chapter?: { id: string; title: string; order_index: number | null } | null
}

// ── Supabase Database shape ───────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id'>>
      }
      branches: {
        Row: Branch
        Insert: Omit<Branch, 'id' | 'created_at'>
        Update: Partial<Omit<Branch, 'id'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Document, 'id'>>
      }
      links: {
        Row: Link
        Insert: Omit<Link, 'id' | 'created_at'>
        Update: Partial<Omit<Link, 'id'>>
      }
      snapshots: {
        Row: Snapshot
        Insert: Omit<Snapshot, 'id' | 'created_at'>
        Update: Partial<Omit<Snapshot, 'id'>>
      }
      paragraph_versions: {
        Row: ParagraphVersion
        Insert: Omit<ParagraphVersion, 'id' | 'created_at'>
        Update: Partial<Omit<ParagraphVersion, 'id'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      published_stories: {
        Row: PublishedStory
        Insert: Omit<PublishedStory, 'id' | 'published_at' | 'updated_at' | 'ratings_score' | 'ratings_count'>
        Update: Partial<Omit<PublishedStory, 'id' | 'published_at'>>
      }
      follows: {
        Row: Follow
        Insert: Omit<Follow, 'id' | 'created_at'>
        Update: never
      }
      reading_progress: {
        Row: ReadingProgress
        Insert: Omit<ReadingProgress, 'id'>
        Update: Partial<Omit<ReadingProgress, 'id' | 'user_id' | 'published_story_id'>>
      }
      completed_chapters: {
        Row: CompletedChapter
        Insert: Omit<CompletedChapter, 'id' | 'completed_at'>
        Update: never
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at' | 'is_read'>
        Update: Partial<Pick<Notification, 'is_read'>>
      }
      reading_lists: {
        Row: ReadingList
        Insert: Omit<ReadingList, 'id' | 'created_at'>
        Update: Partial<Omit<ReadingList, 'id'>>
      }
      reading_list_items: {
        Row: ReadingListItem
        Insert: Omit<ReadingListItem, 'id'>
        Update: never
      }
      highlights: {
        Row: Highlight
        Insert: Omit<Highlight, 'id' | 'created_at'>
        Update: Partial<Omit<Highlight, 'id' | 'user_id' | 'document_id'>>
      }
      inline_comments: {
        Row: InlineComment
        Insert: Omit<InlineComment, 'id' | 'created_at' | 'updated_at' | 'appreciation_count'>
        Update: Partial<Pick<InlineComment, 'content' | 'is_deleted'>>
      }
      inline_comment_appreciations: {
        Row: InlineCommentAppreciation
        Insert: Omit<InlineCommentAppreciation, 'id' | 'created_at'>
        Update: never
      }
      bookmarks: {
        Row: Bookmark
        Insert: Omit<Bookmark, 'id' | 'created_at'>
        Update: never
      }
      ratings: {
        Row: Rating
        Insert: Omit<Rating, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Rating, 'id' | 'user_id' | 'published_story_id' | 'created_at'>>
      }
      ink_balances: {
        Row: InkBalance
        Insert: Pick<InkBalance, 'user_id'>   // trigger handles seeding — no client insert needed
        Update: never                          // service role only via RPC
      }
      ink_transactions: {
        Row: InkTransaction
        Insert: Omit<InkTransaction, 'id' | 'created_at'>
        Update: never
      }
      mark_labels: {
        Row: MarkLabel
        Insert: Omit<MarkLabel, 'id' | 'created_at'>
        Update: Partial<Omit<MarkLabel, 'id'>>
      }
      entity_states: {
        Row: EntityState
        Insert: Omit<EntityState, 'id' | 'created_at' | 'mark_labels' | 'chapter'>
        Update: never
      }
    }
  }
}