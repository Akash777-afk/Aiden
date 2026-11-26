import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const VARIANTS = {
  primary: 'bg-gradient-to-r from-primary to-[#A97FD6] text-white shadow-glow hover:brightness-105',
  secondary: 'bg-surface-2 text-ink hover:bg-lavender/50 dark:hover:bg-white/10',
  outline: 'border border-line bg-surface text-ink hover:border-primary/50',
  ghost: 'text-ink hover:bg-surface-2',
  light: 'bg-white text-primary-700 shadow-soft hover:bg-white/90',
  danger: 'bg-rose-500 text-white hover:bg-rose-600',
  'danger-soft': 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300',
}
const SIZES = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-2xl',
  lg: 'h-[52px] px-6 text-[15px] gap-2 rounded-2xl',
  icon: 'size-10 rounded-xl justify-center',
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading, icon: Icon, iconRight: IconRight, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold transition-[background,box-shadow,filter,color] disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className={size === 'icon' ? 'size-5' : 'size-4'} />}
      {children}
      {IconRight && !loading && <IconRight className="size-4" />}
    </motion.button>
  )
})
