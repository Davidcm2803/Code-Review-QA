import { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import Card from '../layout/Card'

const ICON = {
  critical: <XCircle     size={14} style={{ color: 'var(--critical)', flexShrink: 0 }} />,
  high:     <XCircle     size={14} style={{ color: 'var(--high)',     flexShrink: 0 }} />,
  medium:   <AlertCircle size={14} style={{ color: 'var(--medium)',   flexShrink: 0 }} />,
  low:      <Info        size={14} style={{ color: 'var(--low)',      flexShrink: 0 }} />,
}
const SEVERITY_COLOR = {
  critical: 'var(--critical)',
  high:     'var(--high)',
  medium:   'var(--medium)',
  low:      'var(--low)',
}

const COLLAPSED_COUNT = 8

export default function ActivityList({ scanData }) {
  const [showAll, setShowAll] = useState(false)
  const vulns = scanData?.vulnerabilities ?? []

  if (!scanData) {
    return (
      <Card title="Recent Findings">
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          No scan data available. Run a scan to see results.
        </p>
      </Card>
    )
  }

  if (vulns.length === 0) {
    return (
      <Card title="Recent Findings">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', color: 'var(--safe)', fontSize: 12 }}>
          <CheckCircle size={14} />
          No vulnerabilities found — repository looks clean!
        </div>
      </Card>
    )
  }

  const ORDER = ['critical', 'high', 'medium', 'low']
  const sortedAll = [...vulns].sort(
    (a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity)
  )
  const hasMore = sortedAll.length > COLLAPSED_COUNT
  const visible = showAll ? sortedAll : sortedAll.slice(0, COLLAPSED_COUNT)
  const hiddenCount = sortedAll.length - COLLAPSED_COUNT

  return (
    <Card title={`Recent Findings${hasMore ? ` (${sortedAll.length})` : ''}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: showAll ? 480 : 'none',
            overflowY: showAll ? 'auto' : 'visible',
          }}
        >
          {visible.map((vuln, i) => (
            <div
              key={vuln._id ?? i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--secondary)',
                transition: 'background 0.15s',
                boxSizing: 'border-box',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--card)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--secondary)'}
            >
              {ICON[vuln.severity] ?? ICON['low']}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 12, fontFamily: 'monospace', margin: 0,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {vuln.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, marginTop: 2 }}>
                  {vuln.file_path}{vuln.line_start ? `:${vuln.line_start}` : ''}
                </p>
              </div>
              <div
                style={{
                  fontSize: 10, fontFamily: 'monospace', textAlign: 'right',
                  whiteSpace: 'nowrap', textTransform: 'capitalize',
                  color: SEVERITY_COLOR[vuln.severity] ?? 'var(--muted)',
                }}
              >
                {vuln.severity}
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setShowAll(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--muted)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 0',
              marginTop: 4,
              cursor: 'pointer',
            }}
          >
            {showAll ? (
              <>
                <ChevronUp size={12} /> Ver menos
              </>
            ) : (
              <>
                <ChevronDown size={12} /> Ver todas (+{hiddenCount} más)
              </>
            )}
          </button>
        )}
      </div>
    </Card>
  )
}