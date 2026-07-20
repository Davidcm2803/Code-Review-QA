import { GitBranch, ShieldAlert, RefreshCw } from 'lucide-react'
import Card from '../layout/Card'

const SEVERITY_COLORS = {
  critical: 'var(--critical)',
  high: 'var(--high)',
  medium: 'var(--medium)',
  low: 'var(--low)',
}

function severityCounts(vulns) {
  return vulns.reduce((acc, v) => {
    acc[v.severity] = (acc[v.severity] ?? 0) + 1
    return acc
  }, {})
}

export default function ContextPanel({
  scans,
  selectedScanId,
  onSelectScan,
  vulnerabilities,
  loadingScans,
  loadingVulns,
  onNewChat,
}) {
  const counts = severityCounts(vulnerabilities)
  const total = vulnerabilities.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 280, flexShrink: 0 }}>
      <Card title="Repositorio">
        {loadingScans ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Cargando scans...</p>
        ) : scans.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            No hay scans todavía. Corré uno primero.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {scans.map((s) => {
              const id = s._id ?? s.scan_id
              const active = id === selectedScanId
              return (
                <button
                  key={id}
                  onClick={() => onSelectScan(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    textAlign: 'left',
                    padding: '9px 10px',
                    borderRadius: 8,
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    background: active
                      ? 'color-mix(in srgb, var(--primary) 12%, var(--card))'
                      : 'var(--card)',
                    cursor: 'pointer',
                    transition: 'border-color .15s, background .15s',
                  }}
                >
                  <GitBranch
                    size={13}
                    style={{ color: active ? 'var(--primary)' : 'var(--muted)', flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--fg)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.repo_name ?? s.name ?? 'scan sin nombre'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {selectedScanId && (
        <Card title="Contexto del chat">
          {loadingVulns ? (
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Indexando hallazgos...</p>
          ) : total === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              Este scan no tiene vulnerabilidades.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--fg)',
                  marginBottom: 10,
                }}
              >
                <ShieldAlert size={13} style={{ color: 'var(--primary)' }} />
                {total} hallazgo{total !== 1 ? 's' : ''} disponibles como contexto
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(counts).map(([sev, n]) => (
                  <span
                    key={sev}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--fg)',
                      background: 'var(--secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 999,
                      padding: '3px 9px',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: SEVERITY_COLORS[sev] ?? 'var(--muted)',
                      }}
                    />
                    {n} {sev}
                  </span>
                ))}
              </div>

              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10, marginBottom: 0, lineHeight: 1.4 }}>
                El asistente busca automáticamente los hallazgos más relevantes para
                cada pregunta — no hace falta elegir uno.
              </p>
            </>
          )}
        </Card>
      )}

      {selectedScanId && (
        <button
          onClick={onNewChat}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--muted)',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 10px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={12} /> Nueva conversación
        </button>
      )}
    </div>
  )
}