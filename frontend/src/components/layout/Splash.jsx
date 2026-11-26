import { motion } from 'framer-motion'
import { LogoMark } from '../illustrations/Logo'

export function Splash() {
  return (
    <motion.div
      className="fixed inset-0 z-[200] grid place-items-center bg-[radial-gradient(circle_at_50%_35%,#5B3F8C,#2A1F4E_55%,#1A1430)]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45 } }}
    >
      <div className="flex flex-col items-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
          <LogoMark size={84} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-5 text-3xl font-extrabold tracking-[0.12em] text-white">
          AIDEN
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-2 text-sm text-white/75">
          A better connection with yourself.
        </motion.div>
      </div>
    </motion.div>
  )
}
