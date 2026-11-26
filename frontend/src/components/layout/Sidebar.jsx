import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, LifeBuoy } from 'lucide-react'
import { SIDEBAR_NAV } from '../../routes/nav'
import { Logo } from '../illustrations/Logo'
import { UserAvatar } from '../common'
import { useApp } from '../../context/AppContext'
import { useData } from '../../context/DataContext'
import { openSupport } from './SupportSheet'
import { cn } from '../../utils/cn'

export function Sidebar() {
  const { user } = useApp()
  const { notifications } = useData()
  const nav = useNavigate()
  const unread = notifications.filter((n) => !n.read).length
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-line/70 bg-surface/80 backdrop-blur-xl lg:flex">
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => nav('/')} aria-label="AIDEN home">
          <Logo size={34} tagline={false} />
        </button>
        <button onClick={() => nav('/notifications')} className="relative rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label={`Notifications (${unread} unread)`}>
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-coral ring-2 ring-surface" />}
        </button>
      </div>
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        {SIDEBAR_NAV.map((g) => (
          <div key={g.group} className="mt-3">
            <div className="px-3 pb-1.5 text-[11px] font-bold tracking-wider text-muted/80 uppercase">{g.group}</div>
            <ul className="space-y-0.5">
              {g.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn('relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors', isActive ? 'text-primary-700 dark:text-white' : 'text-muted hover:bg-surface-2 hover:text-ink')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="sb-pill"
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-lavender/70 to-lavender/20 dark:from-primary/35 dark:to-primary/5"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          />
                        )}
                        <Icon className="relative size-[18px]" />
                        <span className="relative">{label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="space-y-3 border-t border-line/70 p-4">
        <button onClick={openSupport} className="flex w-full items-center gap-2.5 rounded-xl bg-coral/15 px-3 py-2.5 text-sm font-semibold text-rose-700 hover:bg-coral/25 dark:text-coral">
          <LifeBuoy className="size-[18px]" /> Need urgent help?
        </button>
        <button onClick={() => nav('/profile')} className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left hover:bg-surface-2">
          <UserAvatar user={user} size={38} />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-ink">{user.fullName || user.name}</div>
            <div className="truncate text-xs text-muted">{user.email}</div>
          </div>
        </button>
      </div>
    </aside>
  )
}
