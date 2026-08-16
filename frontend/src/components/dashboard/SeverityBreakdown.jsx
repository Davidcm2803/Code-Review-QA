import Card from '../layout/Card'

const SEVERITY_CONFIG = [
  { key: 'critical', label: 'Critical', color: 'var(--critical)' },
  { key: 'high',     label: 'High',     color: 'var(--high)'     },
  { key: 'medium',   label: 'Medium',   color: 'var(--medium)'   },
  { key: 'low',      label: 'Low',      color: 'var(--low)'      },
]

export default function SeverityBreakdown({ metrics = {} }) {
  const data = SEVERITY_CONFIG.map(cfg => ({
    ...cfg,
    count: metrics[cfg.key] ?? 0,
  }))

  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <Card title="Vulnerability Breakdown">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map(({ key, label, count, color }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: color }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 12 }}>{label}</span>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color }}>{count}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', background: 'var(--secondary)' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: 2,
                    width: `${(count / maxCount) * 100}%`,
                    background: color,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}