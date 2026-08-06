export default function Toggle({ checked = false, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange?.(!checked)}
      className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
      style={{ background: checked ? 'var(--primary)' : 'var(--border)' }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  )
}