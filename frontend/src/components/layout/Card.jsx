export default function Card({ title, description, titleIcon: Icon, children, style = {} }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        boxSizing: 'border-box',
        minWidth: 0,
        ...style,
      }}
    >
      {(title || description) && (
        <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {Icon && <Icon size={15} />}
              <span style={{ fontSize: 13, fontWeight: 500 }}>{title}</span>
            </div>
          )}
          {description && (
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}