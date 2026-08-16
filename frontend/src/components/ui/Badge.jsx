const COLOR = {
  critical: 'var(--critical)',
  high:     'var(--high)',
  medium:   'var(--medium)',
  low:      'var(--low)',
  safe:     'var(--safe)',
  muted:    'var(--muted)',
}

export default function Badge({ label, variant = 'muted', icon: Icon }) {
  const color = COLOR[variant] ?? COLOR.muted
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium font-mono"
      style={{ color, background: `color-mix(in srgb, ${color} 15%, transparent)` }}
    >
      {Icon && <Icon size={11} />}
      {label}
    </span>
  )
}
