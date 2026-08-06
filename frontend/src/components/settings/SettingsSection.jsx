export default function SettingsSection({ icon: Icon, title, subtitle, children, className = '' }) {
  return (
    <div
      className={`min-w-0 rounded-xl border p-6 ${className}`}
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="mb-5 flex items-center gap-2">
        {Icon && <Icon size={16} style={{ color: 'var(--primary)' }} />}
        <div>
          <p className="text-[15px] font-semibold">{title}</p>
          {subtitle && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}