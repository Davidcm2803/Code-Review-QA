import { useMemo, useState } from 'react'
import { GitBranch, ChevronRight, Loader2, Search } from 'lucide-react'

export default function RecentRepos({ repos, loading, hasGithub, onSelect }) {
  const [query, setQuery] = useState('')

  const filteredRepos = useMemo(() => {
    if (!query.trim()) return repos
    const q = query.trim().toLowerCase()
    return repos.filter(({ full_name }) => full_name.toLowerCase().includes(q))
  }, [repos, query])

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
      {!loading && hasGithub && repos.length > 0 && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, color: 'var(--primary)', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search repository..."
            style={{
              width: '100%', height: 38, background: 'var(--input)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--fg)', fontSize: 13, paddingLeft: 36, paddingRight: 12,
              outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--muted)', fontSize: 13 }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          Loading repositories...
        </div>
      )}
      {!loading && !hasGithub && (
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          Connect your GitHub account to see your repositories.
        </p>
      )}
      {!loading && hasGithub && repos.length > 0 && filteredRepos.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          No se encontraron repositorios que coincidan con "{query}".
        </p>
      )}
      {!loading && filteredRepos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredRepos.map(({ full_name, name, private: isPrivate, updated_at, clone_url }) => (
            <button
              key={full_name}
              onClick={() => onSelect(full_name, clone_url)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '11px 12px', borderRadius: 8, border: '1px solid transparent', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s, border-color 0.12s' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,255,136,0.06)'
                e.currentTarget.style.borderColor = 'rgba(0,255,136,0.25)'
                const icon = e.currentTarget.querySelector('[data-branch-icon]')
                const chevron = e.currentTarget.querySelector('[data-chevron]')
                if (icon) icon.style.color = 'var(--primary)'
                if (chevron) chevron.style.color = 'var(--primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
                const icon = e.currentTarget.querySelector('[data-branch-icon]')
                const chevron = e.currentTarget.querySelector('[data-chevron]')
                if (icon) icon.style.color = 'var(--muted)'
                if (chevron) chevron.style.color = 'var(--muted)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GitBranch data-branch-icon size={14} style={{ color: 'var(--muted)', flexShrink: 0, transition: 'color 0.12s' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', fontFamily: 'monospace' }}>{full_name}</span>
                {isPrivate && (
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,255,136,0.08)', color: 'var(--primary)', border: '1px solid rgba(0,255,136,0.25)' }}>
                    private
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {new Date(updated_at).toLocaleDateString()}
                </span>
                <ChevronRight data-chevron size={13} style={{ color: 'var(--muted)', transition: 'color 0.12s' }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}