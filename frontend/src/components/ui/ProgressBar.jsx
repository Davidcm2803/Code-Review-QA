import { Loader2 } from 'lucide-react'

export default function ProgressBar({ value, label, statusText }) {
  const pct = Math.min(100, Math.round(value))
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[13px]">
        <span className="text-[var(--muted)]">{label}</span>
        <span className="font-mono text-[var(--primary)]">{pct}%</span>
      </div>
      <div className="h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--primary)] rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {statusText && (
        <div className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--muted)]">
          <Loader2 size={12} className="spin" />
          {statusText}
        </div>
      )}
    </div>
  )
}
