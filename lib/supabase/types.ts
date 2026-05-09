// lib/supabase/types.ts
// All database types for Writer's Hub.
// Manually maintained for the prototype. In production, generate via: npx supabase gen types typescript

export type DocumentType = 'chapter' | 'character' | 'location' | 'lore' | 'object'

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

// Supabase Database shape — used when initializing typed clients
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
    }
  }
}