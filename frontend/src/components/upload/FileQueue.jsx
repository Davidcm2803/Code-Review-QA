import { File, X, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StatusIcon({ status }) {
  if (status === 'done') return <CheckCircle2 size={15} color="#22c55e" />
  if (status === 'error') return <XCircle size={15} color="#f87171" />
  if (status === 'uploading') return <Loader2 size={15} color="#8fa894" style={{ animation: 'spin 1s linear infinite' }} />
  return <File size={14} color="#4a5c50" />
}

export default function FileQueue({ files, onRemove }) {
  if (!files || files.length === 0) {
    return (
      <div style={{
        minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
        boxSizing: 'border-box',
      }}>
        <p style={{ fontSize: 13, color: '#4a5c50', margin: 0 }}>No hay archivos seleccionados</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: 260, display: 'flex', flexDirection: 'column',
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#c8d8cc' }}>Archivos a escanear</span>
        <span style={{ fontSize: 12, color: '#4a5c50', fontFamily: 'monospace' }}>
          {files.length} {files.length === 1 ? 'archivo' : 'archivos'}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
        {files.map((file) => (
          <div
            key={file.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <StatusIcon status={file.status} />
              <div style={{ overflow: 'hidden' }}>
                <p style={{
                  fontSize: 13, fontFamily: 'monospace', color: '#c8d8cc', margin: 0,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {file.name}
                </p>
                <p style={{ fontSize: 11, color: file.status === 'error' ? '#f87171' : '#4a5c50', margin: 0 }}>
                  {file.status === 'error' ? file.error : formatSize(file.size)}
                </p>
              </div>
            </div>
            {file.status !== 'uploading' && (
              <button
                onClick={() => onRemove?.(file.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <X size={13} color="#4a5c50" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}