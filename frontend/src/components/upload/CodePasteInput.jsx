import { useMemo } from 'react'
import { MAX_PASTE_LINES, SUPPORTED_EXTENSIONS } from '../../lib/scan'

export default function CodePasteInput({ value, filename, onChange, onFilenameChange }) {
  const lineCount = useMemo(() => (value ? value.split('\n').length : 0), [value])
  const overLimit = lineCount > MAX_PASTE_LINES

  return (
    <div style={{
      minHeight: 260, display: 'flex', flexDirection: 'column',
      background: 'var(--card)',
      border: `1px solid ${overLimit ? 'var(--critical)' : 'var(--border)'}`,
      borderRadius: 8, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
      }}>
        <input
          value={filename}
          onChange={(e) => onFilenameChange(e.target.value)}
          placeholder="archivo.py"
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'monospace', fontSize: 13, color: 'var(--foreground)',
          }}
        />
        <span style={{ fontSize: 12, fontFamily: 'monospace', color: overLimit ? 'var(--critical)' : 'var(--muted)' }}>
          {lineCount}/{MAX_PASTE_LINES} líneas
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder={`Pega tu código aquí (máx. ${MAX_PASTE_LINES} líneas)...`}
        style={{
          flex: 1, resize: 'none', background: 'transparent', border: 'none', outline: 'none',
          padding: 14, fontFamily: 'monospace', fontSize: 13, color: 'var(--foreground)', minHeight: 180,
          boxSizing: 'border-box',
        }}
      />
      {overLimit && (
        <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--critical)' }}>
          Supera el máximo de {MAX_PASTE_LINES} líneas.
        </div>
      )}
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--muted)', margin: 0 }}>
          Extensiones válidas: {SUPPORTED_EXTENSIONS.join(', ')}
        </p>
      </div>
    </div>
  )
}