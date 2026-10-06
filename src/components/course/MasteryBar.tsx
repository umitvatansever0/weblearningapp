/** Labelled 0–100 bar; `null` means "not practised yet". */
export function MasteryBar({ label, value, compact }: { label: string; value: number | null; compact?: boolean }) {
  const tone =
    value === null ? 'bg-gray-200 dark:bg-neutral-700' : value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-400' : 'bg-rose-400'
  return (
    <div className="flex flex-col gap-1">
      <div className={`flex justify-between gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className="truncate">{label}</span>
        <span className="tabular-nums text-gray-500 dark:text-gray-400">{value === null ? '–' : `${value}%`}</span>
      </div>
      <div
        className={`${compact ? 'h-1.5' : 'h-2'} rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden`}
        role="meter"
        aria-label={label}
        aria-valuenow={value ?? 0}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full ${tone} transition-all`} style={{ width: `${value ?? 0}%` }} />
      </div>
    </div>
  )
}
