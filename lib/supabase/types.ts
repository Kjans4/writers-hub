// lib/supabase/types.ts
// All database types for Writer's Hub.
// Updated for Chunk 1: adds Profile, PublishedStory, Follow,
// ReadingProgress, CompletedChapter types.
// Also adds is_published / published_at to Document.

export type DocumentType = 'chapter' | 'character' | 'location' | 'lore' | 'object'

export type ContentRating = 'all_ages' | 'teen' | 'mature'
export type StoryStatus   = 'ongoing' | 'completed' | 'hiatus'

// ── Existing tables ───────────────────────────────────────────

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

// ── Chunk 1 new tables ────────────────────────────────────────

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

// ── Convenience types for API responses ──────────────────────

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

// New
// ── Update PublishedStory — add genre_id ──────────────────────────
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
  genre_id: string | null   // ← added Phase A
}

// ── Chunk 2 Phase A new types ─────────────────────────────────────

export interface Genre {
  id: string
  name: string
  slug: string
  color: string
  sort_order: number
}

export interface Tag {
  id: string
  name: string
  use_count: number
  created_at: string
}

export interface StoryTag {
  id: string
  published_story_id: string
  tag_id: string
  created_at: string
}

// Story card shape with genre + tags — used in feeds and browse pages
export interface StoryCardData {
  id: string
  slug: string
  title: string
  hook: string | null
  cover_url: string | null
  status: string
  content_rating: string
  genre_name: string | null
  genre_slug: string | null
  genre_color: string | null
  tag_names: string[]
  author_name: string | null
  author_username: string | null
  author_avatar: string | null
}


// ── Supabase Database shape ───────────────────────────────────

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
        Insert: Omit<PublishedStory, 'id' | 'published_at' | 'updated_at'>
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
    }
  }
}