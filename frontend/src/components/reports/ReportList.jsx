import { ShieldOff } from 'lucide-react'
import ReportCard from './ReportCard'

function SkeletonCard() {
  return (
    <div
      style={{
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--card)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
      className="animate-pulse"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 12, width: '60%', borderRadius: 4, background: 'var(--secondary)' }} />
          <div style={{ height: 10, width: '35%', borderRadius: 4, background: 'var(--secondary)' }} />
        </div>
        <div style={{ height: 24, width: 50, borderRadius: 6, background: 'var(--secondary)' }} />
      </div>
      <div style={{ height: 10, width: '45%', borderRadius: 4, background: 'var(--secondary)' }} />
    </div>
  )
}

export default function ReportList({ reports, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!reports || reports.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '48px 0',
        }}
      >
        <ShieldOff size={28} style={{ color: 'var(--muted)' }} />
        <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>No scans yet</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          Run your first scan to see reports here
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {reports.map((report) => (
        <ReportCard key={report.scan_id} report={report} />
      ))}
    </div>
  )
}