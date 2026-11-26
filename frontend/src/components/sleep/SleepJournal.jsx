import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { Button, Input, Modal, Textarea } from '../common'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { addDays, fmtClock, fmtDate, isoDay, startOfDay } from '../../utils/date'
import { cn } from '../../utils/cn'

const QUALITY = ['😫', '😕', '😐', '🙂', '😴']
const QUALITY_LABEL = ['Very poor', 'Poor', 'Okay', 'Good', 'Great']

function hoursBetween(bed, wake) {
  const [bh, bm] = bed.split(':').map(Number)
  const [wh, wm] = wake.split(':').map(Number)
  let mins = wh * 60 + wm - (bh * 60 + bm)
  if (mins <= 0) mins += 24 * 60
  return +(mins / 60).toFixed(1)
}

export function SleepLogModal({ open, onClose }) {
  const { addSleepLog } = useData()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { bedtime: '23:00', wake: '07:00', quality: 3, note: '' } })
  const [bed, wake] = watch(['bedtime', 'wake'])
  const hrs = bed && wake ? hoursBetween(bed, wake) : 0

  const submit = handleSubmit((v) => {
    addSleepLog({ date: isoDay(addDays(startOfDay(), -1)), bedtime: v.bedtime, wake: v.wake, hours: hoursBetween(v.bedtime, v.wake), quality: v.quality + 1, note: v.note.trim() })
    toast('Sleep logged — thank you for reflecting')
    reset()
    onClose()
  })

  return (
    <Modal open={open} onClose={onClose} title="Log last night" subtitle="A quick reflection helps you spot patterns." footer={<Button className="w-full" type="submit" form="sleep-form">Save sleep log</Button>}>
      <form id="sleep-form" onSubmit={submit} className="space-y-4 pt-2" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Went to bed" type="time" icon={Moon} error={errors.bedtime?.message} {...register('bedtime', { required: 'Required' })} />
          <Input label="Woke up" type="time" icon={Sun} error={errors.wake?.message} {...register('wake', { required: 'Required', validate: (w) => hoursBetween(bed, w) <= 16 || 'That’s over 16 hours — check times' })} />
        </div>
        <div className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-ink">
          ≈ <b>{hrs} hours</b> of sleep {hrs < 6 ? '· shorter than recommended' : hrs <= 9 ? '· in a healthy range' : ''}
        </div>
        <div>
          <div className="mb-2 text-[13px] font-semibold text-ink">How rested do you feel?</div>
          <Controller
            name="quality"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-5 gap-2">
                {QUALITY.map((q, i) => (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    key={i}
                    onClick={() => field.onChange(i)}
                    aria-pressed={field.value === i}
                    aria-label={QUALITY_LABEL[i]}
                    className={cn('flex flex-col items-center gap-1 rounded-2xl border py-2.5 text-2xl', field.value === i ? 'border-primary bg-lavender/40 dark:bg-primary/20' : 'border-line')}
                  >
                    {q}
                    <span className="text-[10px] font-semibold text-muted">{QUALITY_LABEL[i]}</span>
                  </motion.button>
                ))}
              </div>
            )}
          />
        </div>
        <Textarea label="Notes (optional)" rows={3} placeholder="Anything that affected your sleep?" error={errors.note?.message} {...register('note', { maxLength: { value: 280, message: 'Max 280 characters' } })} />
      </form>
    </Modal>
  )
}

export function SleepLogList() {
  const { sleepLogs } = useData()
  const [all, setAll] = useState(false)
  const list = all ? sleepLogs : sleepLogs.slice(0, 4)
  return (
    <div className="space-y-2">
      {list.map((l) => (
        <div key={l.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-2.5">
          <span className="text-2xl">{QUALITY[(l.quality || 3) - 1]}</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">{fmtDate(l.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            <div className="text-xs text-muted">
              {fmtClock(l.bedtime)} → {fmtClock(l.wake)}
              {l.note && ` · ${l.note}`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold text-ink">{l.hours}h</div>
          </div>
        </div>
      ))}
      {sleepLogs.length > 4 && (
        <button onClick={() => setAll((a) => !a)} className="w-full py-2 text-sm font-semibold text-primary">
          {all ? 'Show less' : `Show all ${sleepLogs.length}`}
        </button>
      )}
    </div>
  )
}
