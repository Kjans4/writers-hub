// lib/guides/index.ts
// Server-side utilities for reading guide MDX files and their frontmatter.
// All functions are async and run only on the server (Node.js fs APIs).

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const GUIDES_DIR = path.join(process.cwd(), 'content', 'guides')

export interface GuideMeta {
  slug: string
  title: string
  description: string
  order: number
}

export interface GuideWithContent extends GuideMeta {
  content: string
}

// ── Get all guide metadata, sorted by order ───────────────────
export function getAllGuides(): GuideMeta[] {
  const files = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.mdx'))

  const guides = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, '')
    const raw = fs.readFileSync(path.join(GUIDES_DIR, filename), 'utf8')
    const { data } = matter(raw)

    return {
      slug,
      title:       data.title       as string,
      description: data.description as string,
      order:       (data.order as number) ?? 99,
    }
  })

  return guides.sort((a, b) => a.order - b.order)
}

// ── Get a single guide with its MDX content ───────────────────
export function getGuide(slug: string): GuideWithContent | null {
  const filepath = path.join(GUIDES_DIR, `${slug}.mdx`)

  if (!fs.existsSync(filepath)) return null

  const raw = fs.readFileSync(filepath, 'utf8')
  const { data, content } = matter(raw)

  return {
    slug,
    title:       data.title       as string,
    description: data.description as string,
    order:       (data.order as number) ?? 99,
    content,
  }
}

// ── Get prev / next guides for navigation ────────────────────
export function getAdjacentGuides(slug: string): {
  prev: GuideMeta | null
  next: GuideMeta | null
} {
  const all = getAllGuides()
  const index = all.findIndex((g) => g.slug === slug)

  return {
    prev: index > 0 ? all[index - 1] : null,
    next: index < all.length - 1 ? all[index + 1] : null,
  }
}