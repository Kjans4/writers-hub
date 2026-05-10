// components/map/MapLegend.tsx
// Small legend showing node type → color mapping.
// Rendered inside the StoryMap as an overlay.

import { NODE_COLORS } from '@/lib/hooks/useStoryMap'
import { DocumentType } from '@/lib/supabase/types'

const LEGEND_ITEMS: { type: DocumentType; label: string }[] = [
  { type: 'chapter',   label: 'Chapter' },
  { type: 'character', label: 'Character' },
  { type: 'location',  label: 'Location' },
  { type: 'lore',      label: 'Lore' },
  { type: 'object',    label: 'Object' },
]

export default function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-stone-200 rounded-xl px-3 py-2.5 shadow-sm">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] mb-2">
        Legend
      </p>
      <div className="space-y-1.5">
        {LEGEND_ITEMS.map(({ type, label }) => (
          <div key={type} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: NODE_COLORS[type] }}
            />
            <span className="text-xs text-stone-600 font-['Inter']">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}