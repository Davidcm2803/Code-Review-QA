import { forwardRef } from 'react'
import { formatDate } from '../../lib/date'

const SEVERITY_COLORS = {
  critical: { bg: '#2a1414', border: '#ff4444', fg: '#ff8080' },
  high:     { bg: '#2a1f0f', border: '#ff8800', fg: '#ffb366' },
  medium:   { bg: '#2a2510', border: '#ffcc00', fg: '#ffe066' },
  low:      { bg: '#0f2429', border: '#00ccff', fg: '#66e0ff' },
}

const SEVERITY_LABELS = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
}

const ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

function ScoreRing({ score }) {
  const color = score >= 70 ? '#4ade80' : score >= 40 ? '#ffcc00' : '#ff4444'
  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        border: `4px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 8, color: '#5a6b60', marginTop: 2 }}>/ 100</span>
    </div>
  )
}

function VulnCard({ vuln }) {
  const c = SEVERITY_COLORS[vuln.severity] ?? SEVERITY_COLORS.low
  return (
    <div
      style={{
        border: `1px solid ${c.border}33`,
        borderLeft: `4px solid ${c.border}`,
        borderRadius: 6,
        background: '#12161a',
        padding: '14px 16px',
        marginBottom: 10,
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: c.fg,
            background: c.bg,
            border: `1px solid ${c.border}55`,
            borderRadius: 4,
            padding: '2px 8px',
            flexShrink: 0,
          }}
        >
          {SEVERITY_LABELS[vuln.severity] ?? vuln.severity}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8e4', wordBreak: 'break-word' }}>
          {vuln.title}
        </span>
      </div>

      <div
        style={{
          fontSize: 11,
          fontFamily: 'monospace',
          color: '#8fa39a',
          marginBottom: 8,
          wordBreak: 'break-all',
        }}
      >
        {vuln.file_path}{vuln.line_start ? `:${vuln.line_start}` : ''}
      </div>

      {vuln.description && (
        <p style={{ fontSize: 12, color: '#c4d4cb', margin: '0 0 8px', lineHeight: 1.5, wordBreak: 'break-word' }}>
          {vuln.description}
        </p>
      )}

      {vuln.remediation_recommendation && (
        <div
          style={{
            fontSize: 11.5,
            color: '#a8b8ae',
            background: '#0b0f0d',
            borderRadius: 4,
            padding: '8px 10px',
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}
        >
          <span style={{ fontWeight: 700, color: '#e2e8e4' }}>Remediación: </span>
          {vuln.remediation_recommendation}
        </div>
      )}
    </div>
  )
}

const ReportPrintable = forwardRef(({ report }, ref) => {
  const {
    repo_name,
    branch = 'main',
    security_score,
    metrics,
    summary,
    vulnerabilities = [],
    completed_at,
    started_at,
  } = report

  const sorted = [...vulnerabilities].sort(
    (a, b) => (ORDER[a.severity] ?? 9) - (ORDER[b.severity] ?? 9)
  )

  return (
    <div
      ref={ref}
      style={{
        width: 700,
        boxSizing: 'border-box',
        padding: 36,
        background: '#0b0f0d',
        color: '#e2e8e4',
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingBottom: 20,
          borderBottom: '1px solid #1e2420',
          marginBottom: 20,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, wordBreak: 'break-word' }}>
            {repo_name}
          </h1>
          <p style={{ fontSize: 12, color: '#5a6b60', margin: '6px 0 0' }}>
            Rama: {branch} · {formatDate(completed_at ?? started_at)}
          </p>
        </div>
        {typeof security_score === 'number' && <ScoreRing score={security_score} />}
      </div>

      {metrics && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {Object.entries(metrics).map(([level, count]) => {
            const c = SEVERITY_COLORS[level] ?? SEVERITY_COLORS.low
            return (
              <div
                key={level}
                style={{
                  flex: '1 1 100px',
                  textAlign: 'center',
                  background: c.bg,
                  border: `1px solid ${c.border}33`,
                  borderRadius: 6,
                  padding: '10px 8px',
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: c.fg }}>{count}</div>
                <div style={{ fontSize: 10, color: '#8fa39a', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                  {SEVERITY_LABELS[level] ?? level}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {summary && (
        <div
          style={{
            fontSize: 12.5,
            color: '#c4d4cb',
            background: '#12161a',
            border: '1px solid #1e2420',
            borderRadius: 6,
            padding: '12px 14px',
            marginBottom: 24,
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}
        >
          {summary}
        </div>
      )}

      <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>
        Vulnerabilidades detectadas ({vulnerabilities.length})
      </h2>

      {sorted.length === 0 ? (
        <p style={{ fontSize: 12, color: '#5a6b60' }}>No se encontraron vulnerabilidades.</p>
      ) : (
        sorted.map((v) => <VulnCard key={v._id} vuln={v} />)
      )}
    </div>
  )
})

export default ReportPrintable