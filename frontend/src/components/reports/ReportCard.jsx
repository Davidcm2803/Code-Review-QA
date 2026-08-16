import { useRef, useState } from 'react'
import { GitBranch, Calendar, AlertTriangle, ChevronDown, Download, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SeverityBadge from './SeverityBadge'
import ReportPrintable from './ReportPrintable'
import { formatDate } from '../../lib/date'
import { scanService } from '../../config/Api'
import { exportNodeToPdf } from '../../lib/pdf'

const ORDER = ['critical', 'high', 'medium', 'low']

export default function ReportCard({ report }) {
  const navigate = useNavigate()
  const printRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [fullReport, setFullReport] = useState(null)

  const {
    scan_id,
    repo_name,
    branch = 'main',
    status,
    total_issues = 0,
    severities = [],
    completed_at,
    started_at,
  } = report

  const clean = total_issues === 0 && status === 'completed'
  const sortedSeverities = [...severities].sort(
    (a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)
  )

  const handleViewDetails = () => navigate(`/scan/${scan_id}/results`)

  const handleDownloadPdf = async () => {
    if (status !== 'completed') return
    setExporting(true)
    try {
      const results = await scanService.getResults(scan_id)
      setFullReport({ ...report, ...results })
      await new Promise((resolve) => requestAnimationFrame(resolve))
      await exportNodeToPdf(printRef.current, `${repo_name}-report`)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

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
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{repo_name}</p>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
              <GitBranch size={11} />
              {branch}
            </span>
          </div>
          <p style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
            <Calendar size={11} />
            {formatDate(completed_at ?? started_at)}
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={exporting || status !== 'completed'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--muted)',
            fontSize: 11,
            fontWeight: 600,
            cursor: exporting ? 'wait' : status !== 'completed' ? 'not-allowed' : 'pointer',
          }}
        >
          {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          {exporting ? 'Generando...' : 'PDF'}
        </button>
      </div>

      {clean ? (
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--safe)', margin: 0 }}>
          No vulnerabilities found
        </p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12 }}>
          <AlertTriangle size={12} style={{ color: 'var(--muted)' }} />
          <span>{total_issues} issues</span>
          {sortedSeverities.map((level) => (
            <SeverityBadge key={level} level={level} />
          ))}
        </div>
      )}

      <button
        onClick={handleViewDetails}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--safe)',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          width: 'fit-content',
        }}
      >
        <ChevronDown size={12} />
        View Details
      </button>

      {fullReport && (
        <div style={{ position: 'absolute', left: -9999, top: 0 }}>
          <ReportPrintable ref={printRef} report={fullReport} />
        </div>
      )}
    </div>
  )
}