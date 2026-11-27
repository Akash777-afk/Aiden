import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BOTTOM_NAV } from '../../routes/nav'
import { cn } from '../../utils/cn'

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav
      className="bg-surface fixed inset-x-0 bottom-0 z-40 border-t border-line/70 shadow-[0_-8px_30px_-12px_rgba(76,52,140,0.25)] lg:hidden"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
      aria-label="Primary"
    >
      <ul className="mx-auto grid h-[68px] max-w-lg grid-cols-5">
        {BOTTOM_NAV.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <li key={to}>
              <NavLink to={to} className="relative flex h-full flex-col items-center justify-center gap-1" aria-current={active ? 'page' : undefined}>
                {active && (
                  <motion.span
                    layoutId="bn-pill"
                    className="absolute top-1.5 h-9 w-14 rounded-2xl bg-lavender/60 dark:bg-primary/25"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <motion.span whileTap={{ scale: 0.85 }} className="relative mt-0.5">
                  <Icon className={cn('size-[22px] transition-colors', active ? 'text-primary-700 dark:text-lavender' : 'text-muted')} strokeWidth={active ? 2.4 : 2} />
                </motion.span>
                <span className={cn('relative text-[11px] font-semibold', active ? 'text-primary-700 dark:text-lavender' : 'text-muted')}>{label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
