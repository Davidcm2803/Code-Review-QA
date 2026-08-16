const SEVERITY_STYLES = {
  critical: { bg: 'rgba(255,68,68,0.12)', fg: 'var(--critical)' },
  high:     { bg: 'rgba(255,136,0,0.12)', fg: 'var(--high)' },
  medium:   { bg: 'rgba(255,204,0,0.12)', fg: 'var(--medium)' },
  low:      { bg: 'rgba(0,204,255,0.12)', fg: 'var(--low)' },
}

export default function SeverityBadge({ level }) {
  const style = SEVERITY_STYLES[level] ?? SEVERITY_STYLES.low
  return (
    <span
      style={{
        borderRadius: 4,
        padding: '2px 6px',
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 500,
        textTransform: 'uppercase',
        background: style.bg,
        color: style.fg,
      }}
    >
      {level}
    </span>
  )
}