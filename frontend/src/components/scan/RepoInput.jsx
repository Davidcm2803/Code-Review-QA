import { Search, GitBranch, Loader2, Zap, Skull } from 'lucide-react'

function getScanStatus(p, liveAttack) {
  if (p < 30) return 'Cloning repository...'
  if (p < 60) return 'Analyzing dependencies...'
  if (p < 85) return liveAttack ? 'Scanning for vulnerabilities...' : 'Scanning for vulnerabilities...'
  if (p < 100 && liveAttack) return 'Running live attack (this can take up to 5 min)...'
  return 'Generating report...'
}

export default function RepoInput({
  url, onUrlChange,
  branch, onBranchChange, branches = ['main'],
  scanning, progress, onScan,
  liveAttack, onLiveAttackChange,
}) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            style={{ width: '100%', height: 46, background: 'var(--input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)', fontSize: 14, paddingLeft: 42, paddingRight: 14, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
            placeholder="https://github.com/owner/repository"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
          />
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <GitBranch size={14} style={{ position: 'absolute', left: 11, color: 'var(--primary)', pointerEvents: 'none', zIndex: 1 }} />
          <select
            style={{ height: 46, background: 'var(--input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--fg)', fontSize: 13, paddingLeft: 32, paddingRight: 28, outline: 'none', cursor: 'pointer', appearance: 'none', minWidth: 130 }}
            value={branch}
            onChange={(e) => onBranchChange(e.target.value)}
          >
            {branches.map(b => <option key={b}>{b}</option>)}
          </select>
          <svg style={{ position: 'absolute', right: 10, color: 'var(--muted)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 8,
          border: `1px solid ${liveAttack ? 'var(--primary)' : 'var(--border)'}`,
          background: liveAttack ? 'rgba(0,255,136,0.06)' : 'var(--input)',
          cursor: scanning ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <input
          type="checkbox"
          checked={liveAttack}
          disabled={scanning}
          onChange={(e) => onLiveAttackChange(e.target.checked)}
          style={{ width: 15, height: 15, accentColor: 'var(--primary)', cursor: scanning ? 'not-allowed' : 'pointer' }}
        />
        <Skull size={14} style={{ color: liveAttack ? 'var(--primary)' : 'var(--muted)', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
            Live attack (DAST)
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            Sandbox aislado para ataques seguros. Requiere Dockerfile en el repo
          </span>
        </div>
      </label>

      {scanning && (
        <div style={{ background: 'var(--input)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--fg)' }}>{getScanStatus(progress, liveAttack)}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--primary)' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(progress, 100)}%`, background: 'var(--primary)', borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          disabled={!url || scanning}
          onClick={onScan}
          style={{ width: 'fit-content', height: 42, padding: '0 20px', background: !url || scanning ? 'rgba(0,255,136,0.12)' : 'var(--primary)', border: 'none', borderRadius: 8, color: !url || scanning ? 'var(--muted)' : 'var(--primary-fg)', fontSize: 14, fontWeight: 600, cursor: !url || scanning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s', whiteSpace: 'nowrap' }}
        >
          {scanning
            ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Scanning...</>
            : <><Zap size={15} /> Start scan</>
          }
        </button>
      </div>

    </div>
  )
}