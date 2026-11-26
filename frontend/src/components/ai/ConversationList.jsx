import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquarePlus, Search, Trash2, User, Compass } from 'lucide-react'
import { EmptyState } from '../common'
import { relTime } from '../../utils/date'
import { cn } from '../../utils/cn'

const MODE_ICON = { personal: User, guided: Compass }

export function ConversationList({ conversations, activeId, onSelect, onNew, onDelete }) {
  const [q, setQ] = useState('')
  const list = conversations.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="flex h-full flex-col">
      <button
        onClick={onNew}
        className="mb-3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-[#A97FD6] py-3 text-sm font-bold text-white shadow-glow"
      >
        <MessageSquarePlus className="size-4" /> New conversation
      </button>
      <div className="relative mb-3">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search conversations"
          className="h-10 w-full rounded-xl border border-line bg-surface pr-3 pl-9 text-sm text-ink outline-none focus:border-primary"
        />
      </div>
      <div className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1">
        {list.length === 0 && <EmptyState title={q ? 'No matches' : 'No conversations yet'} message={q ? 'Try a different search.' : 'Start a conversation with Aiden.'} className="py-6" />}
        {list.map((c) => {
          const Icon = MODE_ICON[c.mode] || User
          const active = c.id === activeId
          return (
            <motion.div
              layout
              key={c.id}
              className={cn('group flex items-center gap-2 rounded-xl px-2.5 py-2.5 transition', active ? 'bg-lavender/50 dark:bg-primary/20' : 'hover:bg-surface-2')}
            >
              <button onClick={() => onSelect(c.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-primary shadow-soft">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{c.title}</span>
                  <span className="block text-[11px] text-muted capitalize">
                    {c.mode} · {relTime(c.updatedAt)}
                  </span>
                </span>
              </button>
              <button
                onClick={() => onDelete(c.id)}
                className="rounded-lg p-1.5 text-muted opacity-100 hover:bg-rose-50 hover:text-rose-500 lg:opacity-0 lg:group-hover:opacity-100 dark:hover:bg-rose-500/10"
                aria-label={`Delete ${c.title}`}
              >
                <Trash2 className="size-4" />
              </button>
            </motion.div>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] leading-snug text-muted">Demo: conversations are kept in memory only and reset when you reload.</p>
    </div>
  )
}
