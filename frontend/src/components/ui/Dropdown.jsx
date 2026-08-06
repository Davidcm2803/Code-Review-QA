import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Dropdown({ value, options, onChange, icon: Icon }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 h-10 px-3.5 bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--fg)] text-[13px] font-mono hover:bg-[var(--border)] transition-colors"
        onClick={() => setOpen(!open)}
      >
        {Icon && <Icon size={15} style={{ color: 'var(--primary)' }} />}
        <span>{value}</span>
        <ChevronDown size={14} className="text-[var(--muted)]" />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] right-0 min-w-[180px] bg-[var(--card)] border border-[var(--border)] rounded-md shadow-[0_8px_24px_rgba(0,0,0,.5)] z-50 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt}
              className="w-full px-3.5 py-2 text-left text-[13px] font-mono text-[var(--fg)] hover:bg-[var(--secondary)] transition-colors"
              onClick={() => { onChange(opt); setOpen(false) }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
