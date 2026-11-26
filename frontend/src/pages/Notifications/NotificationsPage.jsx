import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BellOff, BellRing, CheckCheck, Lightbulb, BookOpen, Trash2, CalendarClock } from 'lucide-react'
import { Button, EmptyState, Page, PageHeader } from '../../components/common'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { relTime } from '../../utils/date'
import { cn } from '../../utils/cn'

const ICON = { reminder: BellRing, insight: Lightbulb, content: BookOpen, session: CalendarClock }

export default function NotificationsPage() {
  const nav = useNavigate()
  const toast = useToast()
  const { notifications, markRead, clearNotifications, pushNotification } = useData()
  const unread = notifications.filter((n) => !n.read).length
  return (
    <Page className="max-w-3xl">
      <PageHeader
        back
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'You’re all caught up'}
        actions={
          notifications.length > 0 && (
            <Button size="sm" variant="secondary" icon={CheckCheck} disabled={!unread} onClick={() => markRead()}>
              <span className="max-sm:hidden">Mark all read</span>
            </Button>
          )
        }
      />
      {notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No notifications"
          message="Reminders, insights and session updates will show up here."
          action="Send a test reminder"
          onAction={() => {
            pushNotification({ title: 'Test reminder', body: 'This is how AIDEN reminders will look.', to: '/rhythm', kind: 'reminder' })
            toast('Test notification added')
          }}
        />
      ) : (
        <>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {notifications.map((n) => {
                const Icon = ICON[n.kind] || BellRing
                return (
                  <motion.li layout key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <button
                      onClick={() => {
                        markRead(n.id)
                        if (n.to) nav(n.to)
                      }}
                      className={cn('flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition', n.read ? 'border-line bg-surface' : 'border-primary/30 bg-lavender/30 dark:bg-primary/10')}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-primary shadow-soft">
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-ink">{n.title}</span>
                        <span className="block text-[13px] text-muted">{n.body}</span>
                        <span className="mt-1 block text-[11px] text-muted">{relTime(n.at)}</span>
                      </span>
                      {!n.read && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-coral" aria-label="Unread" />}
                    </button>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
          <Button variant="ghost" className="mt-4 w-full" icon={Trash2} onClick={() => { clearNotifications(); toast('Notifications cleared') }}>
            Clear all
          </Button>
        </>
      )}
    </Page>
  )
}
