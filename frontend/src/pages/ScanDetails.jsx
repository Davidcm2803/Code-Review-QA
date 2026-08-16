import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, GitBranch, Calendar, Download, Loader2, ShieldAlert } from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import SeverityBreakdown from '../components/dashboard/SeverityBreakdown'
import SeverityBadge from '../components/reports/SeverityBadge'
import ReportPrintable from '../components/reports/ReportPrintable'
import { scanService } from '../config/Api'
import { formatDate } from '../lib/date'
import { exportNodeToPdf } from '../lib/pdf'
import { Shield, AlertTriangle, Clock } from 'lucide-react'

const ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

const SEVERITY_FILTER_COLORS = {
  critical: 'var(--critical)',
  high: 'var(--high)',
  medium: 'var(--medium)',
  low: 'var(--low)',
}

function ExploitedBadge() {
  return (
    <span
      style={{
        borderRadius: 4,
        padding: '2px 6px',
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        background: 'rgba(139,92,246,0.12)',
        color: '#a78bfa',
      }}
      title="Confirmado mediante ataque en vivo (DAST), no solo análisis estático"
    >
      Exploited
    </span>
  )
}

export default function ScanDetails() {
  const { scanId } = useParams()
  const navigate = useNavigate()
  const printRef = useRef(null)

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    setError(null)
    scanService
      .getResults(scanId)
      .then((data) => setReport(data))
      .catch((err) => setError(err?.message ?? 'No se pudo cargar el scan'))
      .finally(() => setLoading(false))
  }, [scanId])

  const handleDownloadPdf = async () => {
    if (!report || report.status !== 'completed') return
    setExporting(true)
    try {
      await exportNodeToPdf(printRef.current, `${report.repo_name}-report`)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 32, color: 'var(--muted)', fontSize: 13 }}>
        Loading...
      </div>
    )
  }

  if (error || !report) {
    return (
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link
          to="/reports"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}
        >
          <ArrowLeft size={13} /> Back to reports
        </Link>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {error ?? 'Scan no encontrado'}
        </p>
      </div>
    )
  }

  const metrics = report.metrics ?? { critical: 0, high: 0, medium: 0, low: 0 }
  const total = Object.values(metrics).reduce((a, b) => a + b, 0)
  const vulnerabilities = report.vulnerabilities ?? []
  const filteredVulns =
    severityFilter === 'all'
      ? vulnerabilities
      : vulnerabilities.filter((v) => v.severity === severityFilter)
  const sortedVulns = [...filteredVulns].sort(
    (a, b) => (ORDER[a.severity] ?? 9) - (ORDER[b.severity] ?? 9)
  )

  const STATS = [
    {
      label: 'Security Score',
      value: report.security_score !== null && report.security_score !== undefined
        ? `${report.security_score}/100`
        : '—',
      icon: Shield,
      trend:
        report.security_score >= 70 ? 'Good' : report.security_score >= 40 ? 'Fair' : 'Critical',
    },
    {
      label: 'Vulnerabilities',
      value: total.toString(),
      icon: AlertTriangle,
      trend: `${metrics.critical} critical`,
    },
    {
      label: 'Repository',
      value: report.repo_name ?? '—',
      icon: GitBranch,
      trend: '',
    },
    {
      label: 'Completed',
      value: report.completed_at ? formatDate(report.completed_at) : '—',
      icon: Clock,
      trend: '',
    },
  ]

  return (
    <div
      style={{
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        width: '100%',
        maxWidth: 1320,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <Link
            to="/reports"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--muted)',
              marginBottom: 10,
            }}
          >
            <ArrowLeft size={13} /> Back to reports
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg)', margin: 0 }}>
            {report.repo_name}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={12} />
            {formatDate(report.completed_at)}
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={exporting || report.status !== 'completed'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--fg)',
            fontSize: 12,
            fontWeight: 600,
            cursor: exporting ? 'wait' : 'pointer',
            flexShrink: 0,
          }}
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {exporting ? 'Generando...' : 'Download PDF'}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <SeverityBreakdown metrics={metrics} />

      {report.summary && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--fg)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '14px 16px',
            lineHeight: 1.6,
          }}
        >
          {report.summary}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={14} style={{ color: 'var(--primary)' }} />
            Vulnerabilities ({filteredVulns.length}{severityFilter !== 'all' ? ` / ${vulnerabilities.length}` : ''})
          </h2>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSeverityFilter('all')}
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.3,
                borderRadius: 999,
                padding: '4px 10px',
                border: `1px solid ${severityFilter === 'all' ? 'var(--primary)' : 'var(--border)'}`,
                background: severityFilter === 'all' ? 'var(--secondary)' : 'transparent',
                color: severityFilter === 'all' ? 'var(--fg)' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              All ({vulnerabilities.length})
            </button>
            {['critical', 'high', 'medium', 'low'].map((sev) => {
              const count = metrics[sev] ?? 0
              const active = severityFilter === sev
              return (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  disabled={count === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                    borderRadius: 999,
                    padding: '4px 10px',
                    border: `1px solid ${active ? SEVERITY_FILTER_COLORS[sev] : 'var(--border)'}`,
                    background: active ? 'var(--secondary)' : 'transparent',
                    color: count === 0 ? 'var(--muted)' : active ? 'var(--fg)' : 'var(--muted)',
                    opacity: count === 0 ? 0.4 : 1,
                    cursor: count === 0 ? 'default' : 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: SEVERITY_FILTER_COLORS[sev],
                    }}
                  />
                  {sev} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {sortedVulns.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            {severityFilter === 'all' ? 'No vulnerabilities found.' : `No ${severityFilter} vulnerabilities.`}
          </p>
        ) : (
          sortedVulns.map((v) => (
            <div
              key={v._id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--card)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <SeverityBadge level={v.severity} />
                {v.confirmed_by_exploit && <ExploitedBadge />}
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{v.title}</span>
              </div>

              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                {v.file_path}
                {v.line_start ? `:${v.line_start}` : ''}
              </div>

              {v.description && (
                <p style={{ fontSize: 12, color: 'var(--fg)', margin: 0, lineHeight: 1.5 }}>
                  {v.description}
                </p>
              )}

              {v.remediation_recommendation && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    background: 'var(--secondary)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Remediation: </span>
                  {v.remediation_recommendation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ position: 'absolute', left: -9999, top: 0 }}>
        <ReportPrintable ref={printRef} report={report} />
      </div>
    </div>
  )
}