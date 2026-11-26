import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Button, Input, Modal, Select, Toggle } from '../common'
import { HABIT_CATEGORIES } from '../../mock/seed'
import { cn } from '../../utils/cn'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function HabitFormModal({ open, onClose, onSave, habit }) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (open)
      reset(
        habit
          ? { name: habit.name, category: habit.category, time: habit.time, frequency: habit.frequency, reminder: habit.reminder }
          : { name: '', category: 'mindfulness', time: '08:00', frequency: [0, 1, 2, 3, 4, 5, 6], reminder: true },
      )
  }, [open, habit, reset])

  const freq = watch('frequency') || []
  const preset = (days) => setValue('frequency', days, { shouldValidate: true })

  const submit = handleSubmit((v) => {
    onSave({ ...v, name: v.name.trim(), frequency: [...v.frequency].sort(), target: v.frequency.length === 7 ? 'Daily' : v.frequency.length === 5 && !v.frequency.includes(0) && !v.frequency.includes(6) ? 'Weekdays' : `${v.frequency.length}× a week` })
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={habit ? 'Edit habit' : 'New habit'}
      subtitle="Small and specific works best."
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" type="submit" form="habit-form">
            {habit ? 'Save changes' : 'Add habit'}
          </Button>
        </div>
      }
    >
      <form id="habit-form" onSubmit={submit} className="space-y-4 pt-2" noValidate>
        <Input
          label="Habit"
          required
          placeholder="e.g. 10-minute evening walk"
          error={errors.name?.message}
          {...register('name', {
            required: 'Give your habit a name',
            validate: (v) => v.trim().length >= 3 || 'At least 3 characters',
            maxLength: { value: 60, message: 'Keep it under 60 characters' },
          })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" options={HABIT_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} {...register('category')} />
          <Input label="Time" type="time" required error={errors.time?.message} {...register('time', { required: 'Pick a time' })} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink">Frequency</span>
            <span className="flex gap-2 text-xs font-semibold">
              <button type="button" className="text-primary" onClick={() => preset([0, 1, 2, 3, 4, 5, 6])}>
                Daily
              </button>
              <button type="button" className="text-primary" onClick={() => preset([1, 2, 3, 4, 5])}>
                Weekdays
              </button>
              <button type="button" className="text-primary" onClick={() => preset([0, 6])}>
                Weekends
              </button>
            </span>
          </div>
          <Controller
            name="frequency"
            control={control}
            rules={{ validate: (v) => (v && v.length > 0) || 'Choose at least one day' }}
            render={({ field }) => (
              <div className="flex justify-between gap-1.5">
                {DAYS.map((d, i) => {
                  const on = field.value?.includes(i)
                  return (
                    <button
                      type="button"
                      key={i}
                      aria-pressed={on}
                      aria-label={DAY_NAMES[i]}
                      onClick={() => field.onChange(on ? field.value.filter((x) => x !== i) : [...(field.value || []), i])}
                      className={cn('size-10 rounded-full text-sm font-bold transition', on ? 'bg-primary text-white shadow-glow' : 'bg-surface-2 text-muted')}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            )}
          />
          {errors.frequency && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.frequency.message}</p>}
          <p className="mt-1.5 text-xs text-muted">{freq.length} day{freq.length === 1 ? '' : 's'} a week</p>
        </div>
        <Controller
          name="reminder"
          control={control}
          render={({ field }) => <Toggle checked={!!field.value} onChange={field.onChange} label="Reminder" description="Get a gentle nudge at this time (demo notification)" />}
        />
      </form>
    </Modal>
  )
}
