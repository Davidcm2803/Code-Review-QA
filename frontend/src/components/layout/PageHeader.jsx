export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-[22px] font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-[13px] mt-1" style={{ color: 'var(--muted)' }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}