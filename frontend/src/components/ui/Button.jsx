//  variant: primary | ghost | danger  /  size: sm | md | lg
const VARIANTS = {
  primary: 'bg-[var(--primary)] text-[var(--primary-fg)] hover:opacity-85',
  ghost:   'bg-transparent text-[var(--muted)] border border-[var(--border)] hover:text-[var(--fg)] hover:bg-[var(--secondary)]',
  danger:  'text-[var(--destructive)] border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 hover:bg-[var(--destructive)]/20',
}
const SIZES = {
  sm: 'h-[30px] px-3 text-xs',
  md: 'h-9 px-4 text-[13px]',
  lg: 'h-11 px-6 text-[15px]',
}

export default function Button({ children, variant = 'primary', size = 'md', full = false, disabled = false, onClick, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all whitespace-nowrap',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        full ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  )
}
