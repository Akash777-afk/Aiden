import {
  Home, MessageCircleHeart, Compass, BarChart3, User, Users, CalendarCheck2, Moon, Flower2, GitBranch, NotebookPen,
  LineChart, GraduationCap, Settings, HeartPulse,
} from 'lucide-react'

export const BOTTOM_NAV = [
  { to: '/', label: 'Home', icon: Home, match: (p) => p === '/' },
  { to: '/ai', label: 'Chat', icon: MessageCircleHeart, match: (p) => p.startsWith('/ai') },
  {
    to: '/explore',
    label: 'Explore',
    icon: Compass,
    match: (p) => ['/explore', '/connect', '/rhythm', '/sleep', '/pause', '/clarity', '/pulse', '/journal', '/learn'].some((x) => p.startsWith(x)),
  },
  { to: '/insights', label: 'Progress', icon: BarChart3, match: (p) => p.startsWith('/insights') },
  { to: '/profile', label: 'You', icon: User, match: (p) => ['/profile', '/settings', '/notifications'].some((x) => p.startsWith(x)) },
]

export const SIDEBAR_NAV = [
  {
    group: 'Main',
    items: [
      { to: '/', label: 'Home', icon: Home, end: true },
      { to: '/ai', label: 'AI Companion', icon: MessageCircleHeart },
      { to: '/connect', label: 'Connect', icon: Users },
    ],
  },
  {
    group: 'Toolkit',
    items: [
      { to: '/rhythm', label: 'Rhythm', icon: CalendarCheck2 },
      { to: '/sleep', label: 'Sleep', icon: Moon },
      { to: '/pause', label: 'Pause', icon: Flower2 },
      { to: '/clarity', label: 'Clarity', icon: GitBranch },
      { to: '/pulse', label: 'Pulse', icon: HeartPulse },
      { to: '/journal', label: 'Journal', icon: NotebookPen },
    ],
  },
  {
    group: 'Grow',
    items: [
      { to: '/insights', label: 'Insights', icon: LineChart },
      { to: '/learn', label: 'Learn', icon: GraduationCap },
    ],
  },
  {
    group: 'Account',
    items: [
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

// Mobile routes that render full-screen (no bottom bar)
export const FULLSCREEN_PATTERNS = [/^\/ai/, /^\/connect\/session/, /^\/pause\/(play|breathe|grounding|relax|mindful)/, /^\/clarity\/(new|edit)/, /^\/connect\/[^/]+\/book/]
