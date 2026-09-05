import { useState, useEffect } from 'react'
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

const COLLAPSED_COUNT_DESKTOP = 8
const COLLAPSED_COUNT_MOBILE = 4

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function ActivityList({ scanData }) {
  const [showAll, setShowAll] = useState(false)
  const isMobile = useIsMobile()
  const vulns = scanData?.vulnerabilities ?? []

  const COLLAPSED_COUNT = isMobile ? COLLAPSED_COUNT_MOBILE : COLLAPSED_COUNT_DESKTOP
  const itemPadding = isMobile ? '7px 10px' : '10px 12px'
  const titleSize = isMobile ? 11 : 12
  const subSize = isMobile ? 10 : 11
  const severitySize = isMobile ? 9 : 10
  const gap = isMobile ? 4 : 6

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
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap,
            maxHeight: showAll ? (isMobile ? 360 : 480) : 'none',
            overflowY: showAll ? 'auto' : 'visible',
          }}
        >
          {visible.map((vuln, i) => (
            <div
              key={vuln._id ?? i}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: isMobile ? 6 : 8,
                padding: itemPadding,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--secondary)',
                transition: 'background 0.15s',
                boxSizing: 'border-box',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--card)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--secondary)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, flex: '1 1 200px', minWidth: 0 }}>
                {ICON[vuln.severity] ?? ICON['low']}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: titleSize, fontFamily: 'monospace', margin: 0,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {vuln.title}
                  </p>
                  <p style={{
                    fontSize: subSize, color: 'var(--muted)', margin: 0, marginTop: 2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {vuln.file_path}{vuln.line_start ? `:${vuln.line_start}` : ''}
                  </p>
                </div>
              </div>
              <div
                style={{
                  fontSize: severitySize, fontFamily: 'monospace', textAlign: 'right',
                  whiteSpace: 'nowrap', textTransform: 'capitalize',
                  marginLeft: 'auto',
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
              fontSize: isMobile ? 10 : 11,
              color: 'var(--muted)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: isMobile ? '5px 0' : '6px 0',
              marginTop: 4,
              cursor: 'pointer',
            }}
          >
            {showAll ? (
              <>
                <ChevronUp size={12} /> View less
              </>
            ) : (
              <>
                <ChevronDown size={12} /> View All (+{hiddenCount} más)
              </>
            )}
          </button>
        )}
      </div>
    </Card>
  )
}