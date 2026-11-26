import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft, History, MessageSquarePlus, MoreVertical, SendHorizontal, Trash2, User, Globe, Compass, ShieldCheck, Info, Brain,
} from 'lucide-react'
import { ChatMessage, TypingIndicator } from '../../components/ai/ChatMessage'
import { ConversationList } from '../../components/ai/ConversationList'
import { AidenBot } from '../../components/illustrations/AidenBot'
import { ConfirmDialog, DemoBadge, DynamicIcon, Modal, Segmented } from '../../components/common'
import { useApp } from '../../context/AppContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { aiService } from '../../services/ai'
import { GUIDED_STARTERS, PERSONAL_CONTEXT, QUICK_PROMPTS } from '../../mock/ai'
import { uid } from '../../utils/id'
import { cn } from '../../utils/cn'

const MODES = [
  { value: 'personal', label: 'Personal', icon: User },
  { value: 'general', label: 'General', icon: Globe },
  { value: 'guided', label: 'Guided', icon: Compass },
]
const MODE_INFO = {
  personal: { icon: Brain, text: 'Personal mode uses context you approve to keep conversations connected.' },
  general: { icon: Globe, text: 'Temporary chat — no personal history is used and nothing is saved.' },
  guided: { icon: Compass, text: 'Pick a guided path and Aiden will walk you through it step by step.' },
}

function newConv(mode) {
  return { id: uid('conv'), title: 'New conversation', mode, messages: [], updatedAt: new Date().toISOString() }
}

export default function AICompanionPage() {
  const { conversationId } = useParams()
  const nav = useNavigate()
  const { user, prefs } = useApp()
  const { conversations, upsertConversation, deleteConversation } = useData()
  const toast = useToast()

  const [mode, setMode] = useState(() => conversations.find((c) => c.id === conversationId)?.mode || 'personal')
  const [active, setActive] = useState(() => conversations.find((c) => c.id === conversationId) || newConv(mode))
  const [typing, setTyping] = useState(false)
  const [text, setText] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // {type:'clear'|'delete', id}
  const [context, setContext] = useState(PERSONAL_CONTEXT)
  const [contextOpen, setContextOpen] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Load conversation when the URL changes
  useEffect(() => {
    if (!conversationId) return
    const c = conversations.find((x) => x.id === conversationId)
    if (c && c.id !== active.id) {
      setActive(c)
      setMode(c.mode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  // Persist (in memory) — General mode is never saved
  useEffect(() => {
    if (active.mode !== 'general' && active.messages.length > 0) upsertConversation(active)
  }, [active, upsertConversation])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [active.messages.length, typing])

  const switchMode = (m) => {
    setMode(m)
    if (active.messages.length === 0) setActive((a) => ({ ...a, mode: m }))
    else {
      setActive(newConv(m))
      nav('/ai', { replace: true })
      toast(`Switched to ${m} mode — new conversation started`, { type: 'info' })
    }
  }

  const startNew = () => {
    setActive(newConv(mode))
    setHistoryOpen(false)
    nav('/ai')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const ask = async (content, convId) => {
    setTyping(true)
    try {
      const r = await aiService.reply(content, mode)
      setActive((a) =>
        a.id !== convId ? a : { ...a, updatedAt: new Date().toISOString(), messages: [...a.messages, { id: uid('m'), role: 'ai', text: r.text, actions: r.actions, crisis: r.crisis, at: new Date().toISOString() }] },
      )
    } catch (e) {
      setActive((a) => (a.id !== convId ? a : { ...a, messages: [...a.messages, { id: uid('m'), role: 'ai', error: true, retryOf: content, text: e.message, at: new Date().toISOString() }] }))
    } finally {
      setTyping(false)
    }
  }

  const send = (raw) => {
    const content = (raw ?? text).trim()
    if (!content || typing) return
    if (content.length > 1000) {
      toast('Messages can be up to 1000 characters', { type: 'error' })
      return
    }
    const msg = { id: uid('m'), role: 'user', text: content, at: new Date().toISOString() }
    const convId = active.id
    setActive((a) => ({
      ...a,
      mode,
      title: a.messages.length === 0 ? content.slice(0, 42) + (content.length > 42 ? '…' : '') : a.title,
      updatedAt: new Date().toISOString(),
      messages: [...a.messages, msg],
    }))
    if (mode !== 'general' && conversationId !== convId) nav(`/ai/${convId}`, { replace: true })
    setText('')
    ask(content, convId)
  }

  const retry = (m) => {
    setActive((a) => ({ ...a, messages: a.messages.filter((x) => x.id !== m.id) }))
    ask(m.retryOf, active.id)
  }

  const doConfirm = () => {
    if (confirm.type === 'clear') {
      setActive((a) => ({ ...a, messages: [] }))
      if (active.mode !== 'general') deleteConversation(active.id)
      toast('Conversation cleared')
    } else {
      deleteConversation(confirm.id)
      if (confirm.id === active.id) startNew()
      toast('Conversation deleted')
    }
    setConfirm(null)
  }

  const empty = active.messages.length === 0
  const info = MODE_INFO[mode]
  const memoryOn = prefs.ai.personalMemory

  const list = (
    <ConversationList
      conversations={conversations}
      activeId={active.id}
      onNew={startNew}
      onSelect={(id) => {
        setHistoryOpen(false)
        nav(`/ai/${id}`)
      }}
      onDelete={(id) => setConfirm({ type: 'delete', id })}
    />
  )

  return (
    <div className="flex h-dvh lg:h-dvh">
      {/* Desktop conversation list */}
      <aside className="hidden w-[290px] shrink-0 flex-col border-r border-line/70 bg-surface/60 p-4 pt-8 backdrop-blur xl:flex">
        <h2 className="mb-4 px-1 text-lg font-extrabold text-ink">Conversations</h2>
        {list}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="glass z-10 border-b border-line/70 px-3 pt-[calc(0.75rem+var(--safe-top))] pb-3 sm:px-5 lg:pt-5">
          <div className="flex items-center gap-2">
            <button onClick={() => nav('/')} className="grid size-10 place-items-center rounded-xl text-ink hover:bg-surface-2 lg:hidden" aria-label="Back to home">
              <ChevronLeft className="size-5" />
            </button>
            <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#5B3F8C] to-[#2A1F4E]">
              <AidenBot size={44} />
              <span className="absolute right-0.5 bottom-0.5 size-2.5 rounded-full bg-mint ring-2 ring-surface" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-ink">Aiden</h1>
                <DemoBadge>Demo AI</DemoBadge>
              </div>
              <p className="truncate text-xs text-muted">{empty ? 'Emotional support & reflection companion' : active.title}</p>
            </div>
            <button onClick={() => setHistoryOpen(true)} className="grid size-10 place-items-center rounded-xl text-ink hover:bg-surface-2 xl:hidden" aria-label="Conversation history">
              <History className="size-5" />
            </button>
            <button onClick={startNew} className="grid size-10 place-items-center rounded-xl text-ink hover:bg-surface-2" aria-label="New conversation">
              <MessageSquarePlus className="size-5" />
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="grid size-10 place-items-center rounded-xl text-ink hover:bg-surface-2" aria-label="More options" aria-expanded={menuOpen}>
                <MoreVertical className="size-5" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
                    >
                      <button
                        disabled={empty}
                        onClick={() => {
                          setMenuOpen(false)
                          setConfirm({ type: 'clear' })
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="size-4" /> Clear conversation
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          nav('/settings#ai')
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2"
                      >
                        <ShieldCheck className="size-4" /> AI & privacy settings
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Segmented options={MODES} value={mode} onChange={switchMode} className="w-full sm:w-auto" size="sm" />
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex items-start gap-2 rounded-2xl border border-line/70 bg-surface/70 px-3.5 py-2.5 text-xs text-muted">
              <info.icon className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="flex-1">
                {info.text}{' '}
                {mode === 'personal' && (
                  <button onClick={() => setContextOpen(true)} className="font-semibold text-primary">
                    {memoryOn ? 'Review what Aiden remembers' : 'Memory is off — manage'}
                  </button>
                )}
              </span>
            </div>

            {empty && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-4 text-center">
                <div className="grid size-28 place-items-center rounded-full bg-gradient-to-br from-[#5B3F8C] to-[#2A1F4E] shadow-lift">
                  <AidenBot size={110} />
                </div>
                <h2 className="mt-4 text-xl font-extrabold text-ink">Hi {user.name}, I’m here for you.</h2>
                <p className="mt-1 max-w-sm text-sm text-muted">Share what’s on your mind. I can help you reflect, untangle thoughts and find a next step.</p>

                {mode === 'guided' ? (
                  <div className="mt-6 grid w-full gap-2.5 sm:grid-cols-2">
                    {GUIDED_STARTERS.map((g, i) => (
                      <motion.button
                        key={g.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => send(g.label)}
                        className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left shadow-soft hover:border-primary/40"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lavender/50 text-primary-700 dark:bg-primary/20 dark:text-lavender">
                          <DynamicIcon name={g.icon} className="size-5" />
                        </span>
                        <span className="text-sm font-semibold text-ink">{g.label}</span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button key={p} onClick={() => send(p)} className="rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink shadow-soft hover:border-primary/40">
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {active.messages.map((m) => (
              <ChatMessage key={m.id} msg={m} user={user} onRetry={m.error ? () => retry(m) : undefined} />
            ))}
            <AnimatePresence>{typing && <TypingIndicator />}</AnimatePresence>
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-line/70 bg-surface/80 px-3 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] backdrop-blur sm:px-6">
          {!empty && mode === 'guided' && (
            <div className="no-scrollbar mx-auto mb-2 flex max-w-3xl gap-2 overflow-x-auto">
              {GUIDED_STARTERS.slice(0, 4).map((g) => (
                <button key={g.id} onClick={() => send(g.label)} className="shrink-0 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink">
                  {g.label}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            className="mx-auto flex max-w-3xl items-end gap-2"
          >
            <div className="flex flex-1 items-end rounded-3xl border border-line bg-surface px-4 py-1.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                rows={1}
                maxLength={1000}
                placeholder="Message Aiden…"
                aria-label="Message Aiden"
                className="max-h-[140px] flex-1 resize-none bg-transparent py-2 text-ink outline-none placeholder:text-muted/70"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="submit"
              disabled={!text.trim() || typing}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-[#A97FD6] text-white shadow-glow disabled:opacity-40 disabled:shadow-none"
              aria-label="Send message"
            >
              <SendHorizontal className="size-5" />
            </motion.button>
          </form>
          <p className="mx-auto mt-2 flex max-w-3xl items-center justify-center gap-1 text-center text-[10.5px] text-muted">
            <Info className="size-3 shrink-0" /> Aiden is a support companion, not a licensed therapist. Replies here are demo responses.
          </p>
        </div>
      </section>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Conversations">
        <div className="h-[60dvh]">{list}</div>
      </Modal>

      <Modal open={contextOpen} onClose={() => setContextOpen(false)} title="What Aiden remembers" subtitle="Only context you approve is used in Personal mode. (Demo data)">
        <div className={cn('space-y-2 pt-2', !memoryOn && 'pointer-events-none opacity-50')}>
          {context.map((c) => (
            <label key={c.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
              <input
                type="checkbox"
                checked={c.on}
                onChange={() => setContext((l) => l.map((x) => (x.id === c.id ? { ...x, on: !x.on } : x)))}
                className="size-5 accent-[#8B72C7]"
              />
              <span className="flex-1 text-sm text-ink">{c.label}</span>
              <button
                type="button"
                onClick={() => {
                  setContext((l) => l.filter((x) => x.id !== c.id))
                  toast('Memory removed')
                }}
                className="text-muted hover:text-rose-500"
                aria-label={`Forget: ${c.label}`}
              >
                <Trash2 className="size-4" />
              </button>
            </label>
          ))}
          {context.length === 0 && <p className="py-4 text-center text-sm text-muted">Aiden doesn’t remember anything yet.</p>}
        </div>
        {!memoryOn && <p className="mt-3 text-sm text-muted">Personal memory is turned off in Settings.</p>}
        <button
          onClick={() => {
            setContextOpen(false)
            nav('/settings#ai')
          }}
          className="mt-4 text-sm font-semibold text-primary"
        >
          Manage AI personalization →
        </button>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doConfirm}
        title={confirm?.type === 'clear' ? 'Clear this conversation?' : 'Delete conversation?'}
        message="This removes the messages from this demo session."
        confirmLabel={confirm?.type === 'clear' ? 'Clear' : 'Delete'}
      />
    </div>
  )
}
