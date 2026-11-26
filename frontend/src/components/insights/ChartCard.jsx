import { useState } from 'react'
import { Table2, BarChart3 } from 'lucide-react'
import { Card } from '../common'
import { cn } from '../../utils/cn'

// Wrapper for every chart: title, optional headline value, chart/table toggle for accessibility
export function ChartCard({ title, subtitle, value, valueLabel, children, table, className, legend }) {
  const [showTable, setShowTable] = useState(false)
  return (
    <Card className={cn('p-4 sm:p-5', className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        <div className="flex items-start gap-2">
          {value != null && (
            <div className="text-right">
              <div className="text-xl leading-none font-extrabold text-ink">{value}</div>
              {valueLabel && <div className="mt-1 text-[11px] text-muted">{valueLabel}</div>}
            </div>
          )}
          {table && (
            <button
              onClick={() => setShowTable((s) => !s)}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
              aria-label={showTable ? 'Show chart' : 'Show data table'}
              title={showTable ? 'Show chart' : 'Show data table'}
            >
              {showTable ? <BarChart3 className="size-4" /> : <Table2 className="size-4" />}
            </button>
          )}
        </div>
      </div>
      {legend && !showTable && <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">{legend}</div>}
      {showTable && table ? (
        <div className="max-h-64 overflow-auto rounded-xl border border-line">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-surface-2 text-muted">
              <tr>
                {table.columns.map((c) => (
                  <th key={c} className="px-3 py-2 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-t border-line text-ink">
                  {r.map((v, j) => (
                    <td key={j} className="px-3 py-1.5">
                      {v ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </Card>
  )
}

export function LegendItem({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

export function ChartTooltip({ active, payload, label, format = (v) => v, labelKey }) {
  if (!active || !payload?.length) return null
  const title = labelKey ? payload[0].payload[labelKey] : label
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lift">
      <div className="mb-1 font-semibold text-ink">{title}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-muted">
          <span className="size-2 rounded-full" style={{ background: p.color || p.fill || p.stroke }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-ink">{p.value == null ? '—' : format(p.value, p)}</span>
        </div>
      ))}
    </div>
  )
}

export const axisProps = {
  tick: { fill: 'var(--c-muted)', fontSize: 11 },
  axisLine: false,
  tickLine: false,
}
