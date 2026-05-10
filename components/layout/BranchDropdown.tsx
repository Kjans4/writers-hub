// components/layout/BranchDropdown.tsx
// Branch switcher shown in the top chrome bar.
// Shows: current branch name + Canon badge.
// Dropdown options: switch to any branch, fork new branch, set as Canon,
// delete non-Canon branch.
// Switching branch reloads all documents via LeftPanel (branchId change in store).

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBranch } from '@/lib/hooks/useBranch'
import { useEditorStore } from '@/store/editorStore'
import { Branch } from '@/lib/supabase/types'
import ForkModal from './ForkModal'
import {
  GitBranch,
  ChevronDown,
  Check,
  Plus,
  Star,
  Trash2,
  Loader2,
} from 'lucide-react'

interface BranchDropdownProps {
  projectId: string
}

export default function BranchDropdown({ projectId }: BranchDropdownProps) {
  const router = useRouter()
  const { activeBranchId, setActiveBranch } = useEditorStore()
  const { getBranches, createBranch, setAsCanon, deleteBranch } = useBranch()

  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [showForkModal, setShowForkModal] = useState(false)
  const [settingCanon, setSettingCanon] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeBranch = branches.find((b) => b.id === activeBranchId)
  const canonBranch = branches.find((b) => b.is_canon)

  // ── Load branches ─────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getBranches(projectId)
      setBranches(data)

      // If no active branch set, default to Canon
      if (!activeBranchId) {
        const canon = data.find((b) => b.is_canon)
        if (canon) setActiveBranch(canon.id)
      }

      setLoading(false)
    }
    load()
  }, [projectId])

  // ── Close on outside click ────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // ── Switch branch ─────────────────────────────────────────
  function handleSwitch(branch: Branch) {
    setActiveBranch(branch.id)
    setOpen(false)
    // Navigate to project root — LeftPanel will reload with new branch
    router.push(`/project/${projectId}`)
  }

  // ── Fork new branch ───────────────────────────────────────
  async function handleFork(name: string) {
    if (!canonBranch) return

    const newBranch = await createBranch({
      projectId,
      canonBranchId: canonBranch.id,
      name,
    })

    if (newBranch) {
      setBranches((prev) => [...prev, newBranch])
      setActiveBranch(newBranch.id)
      router.push(`/project/${projectId}`)
    }
  }

  // ── Set as Canon ──────────────────────────────────────────
  async function handleSetCanon(branchId: string) {
    setSettingCanon(branchId)
    const success = await setAsCanon({ projectId, newCanonBranchId: branchId })
    if (success) {
      setBranches((prev) =>
        prev.map((b) => ({
          ...b,
          is_canon: b.id === branchId,
        }))
      )
    }
    setSettingCanon(null)
  }

  // ── Delete branch ─────────────────────────────────────────
  async function handleDelete(branchId: string) {
    const success = await deleteBranch(branchId)
    if (success) {
      setBranches((prev) => prev.filter((b) => b.id !== branchId))
      // If deleted branch was active, switch to Canon
      if (activeBranchId === branchId && canonBranch) {
        setActiveBranch(canonBranch.id)
        router.push(`/project/${projectId}`)
      }
    }
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-stone-400 text-xs font-['Inter']">
        <Loader2 size={12} className="animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div ref={dropdownRef} className="relative">

        {/* Trigger button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-['Inter'] text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <GitBranch size={12} />
          <span className="max-w-[120px] truncate">
            {activeBranch?.name ?? 'Canon'}
          </span>
          {activeBranch?.is_canon && (
            <span className="text-amber-500">
              <Star size={10} />
            </span>
          )}
          <ChevronDown size={11} className="text-stone-300" />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">

            {/* Branch list */}
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="group flex items-center gap-2 px-3 py-2 hover:bg-stone-50 transition-colors"
              >
                {/* Switch button */}
                <button
                  onClick={() => handleSwitch(branch)}
                  className="flex-1 flex items-center gap-2 text-left min-w-0"
                >
                  {/* Active check */}
                  <span className="w-3 flex-shrink-0">
                    {branch.id === activeBranchId && (
                      <Check size={11} className="text-emerald-500" />
                    )}
                  </span>

                  <span className="text-xs text-stone-700 font-['Inter'] truncate">
                    {branch.name}
                  </span>

                  {branch.is_canon && (
                    <span className="flex items-center gap-0.5 text-xs text-amber-500 font-['Inter'] flex-shrink-0">
                      <Star size={9} />
                      Canon
                    </span>
                  )}
                </button>

                {/* Branch actions — show on hover, only for non-Canon */}
                {!branch.is_canon && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {/* Set as Canon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetCanon(branch.id)
                      }}
                      disabled={settingCanon === branch.id}
                      title="Set as Canon"
                      className="p-1 text-stone-300 hover:text-amber-500 transition-colors"
                    >
                      {settingCanon === branch.id ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Star size={10} />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingId(branch.id)
                      }}
                      title="Delete branch"
                      className="p-1 text-stone-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="border-t border-stone-100 mt-1 pt-1">
              {/* Fork new branch */}
              <button
                onClick={() => {
                  setOpen(false)
                  setShowForkModal(true)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-500 hover:text-violet-700 hover:bg-violet-50 font-['Inter'] transition-colors"
              >
                <Plus size={11} />
                Fork new branch
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deletingId && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setDeletingId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg text-stone-800 mb-2">
              Delete branch?
            </h3>
            <p className="text-stone-400 text-sm font-['Inter'] mb-5">
              All chapters and entities on this branch will be permanently
              deleted. Canon is unaffected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 border border-stone-200 text-stone-500 text-sm font-medium rounded-lg font-['Inter'] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fork modal */}
      {showForkModal && canonBranch && (
        <ForkModal
          canonBranchName={canonBranch.name}
          onFork={handleFork}
          onClose={() => setShowForkModal(false)}
        />
      )}
    </>
  )
}