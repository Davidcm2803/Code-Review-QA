import { XCircle, AlertCircle, Info, X, GitBranch } from 'lucide-react'
import Card from '../layout/Card'

const ICON = {
  critical: <XCircle size={12} style={{ color: 'var(--critical)', flexShrink: 0 }} />,
  high: <XCircle size={12} style={{ color: 'var(--high)', flexShrink: 0 }} />,
  medium: <AlertCircle size={12} style={{ color: 'var(--medium)', flexShrink: 0 }} />,
  low: <Info size={12} style={{ color: 'var(--low)', flexShrink: 0 }} />,
}

export default function ContextPanel({
  scans,
  selectedScanId,
  onSelectScan,
  vulnerabilities,
  selectedVulnId,
  onSelectVuln,
  loadingScans,
  loadingVulns,
}) {
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
          <select
            value={selectedScanId ?? ''}
            onChange={(e) => onSelectScan(e.target.value)}
            style={{
              width: '100%',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              background: 'var(--secondary)',
              color: 'var(--fg)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '7px 8px',
            }}
          >
            <option value="" disabled>
              Seleccioná un scan
            </option>
            {scans.map((s) => (
              <option key={s._id ?? s.scan_id} value={s._id ?? s.scan_id}>
                {s.repo_name ?? s.name ?? 'scan sin nombre'}
              </option>
            ))}
          </select>
        )}
      </Card>

      <Card title="Contexto (opcional)">
        {!selectedScanId ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            Elegí un scan para ver sus vulnerabilidades.
          </p>
        ) : loadingVulns ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Cargando hallazgos...</p>
        ) : vulnerabilities.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            Este scan no tiene vulnerabilidades.
          </p>
        ) : (
          <>
            {selectedVulnId && (
              <button
                onClick={() => onSelectVuln(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: 'var(--muted)',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '5px 8px',
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
              >
                <X size={11} /> Quitar contexto puntual
              </button>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {vulnerabilities.map((v) => {
                const id = v._id ?? v.id
                const active = id === selectedVulnId
                return (
                  <button
                    key={id}
                    onClick={() => onSelectVuln(id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 7,
                      textAlign: 'left',
                      padding: '7px 8px',
                      borderRadius: 6,
                      border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                      background: active ? 'var(--secondary)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {ICON[v.severity] ?? ICON.low}
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--fg)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {v.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </Card>

      {selectedScanId && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--muted)',
            padding: '0 2px',
          }}
        >
          <GitBranch size={11} />
          Preguntando sobre {vulnerabilities.length} hallazgo(s) indexados
        </div>
      )}
    </div>
  )
}