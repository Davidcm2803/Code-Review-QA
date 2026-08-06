import Toggle from './Toggle'

export default function SettingRow({ icon: Icon, label, description, checked, onChange, last = false }) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-3"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon && <Icon size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--muted)' }} />}
        <div className="min-w-0">
          <p className="text-[13px] font-medium">{label}</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}