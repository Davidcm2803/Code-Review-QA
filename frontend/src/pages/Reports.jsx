import { useState, useEffect, useRef } from 'react'
import { Download, Loader2 } from 'lucide-react'
import ReportList from '../components/reports/ReportList'
import ReportPrintable from '../components/reports/ReportPrintable'
import { exportMultipleToPdf } from '../lib/pdf'
import { scanService } from '../config/Api'

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [exportingAll, setExportingAll] = useState(false)
  const [fullReports, setFullReports] = useState([])
  const nodeRefs = useRef([])

  useEffect(() => {
    scanService.getHistory()
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [])

  const handleExportAll = async () => {
    const completed = reports.filter((r) => r.status === 'completed')
    if (completed.length === 0) return

    setExportingAll(true)
    try {
      const details = await Promise.all(
        completed.map(async (r) => {
          const results = await scanService.getResults(r.scan_id)
          return { ...r, ...results }
        })
      )
      setFullReports(details)
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const nodes = nodeRefs.current.filter(Boolean)
      await exportMultipleToPdf(nodes, 'all-reports')
    } catch (err) {
      console.error(err)
    } finally {
      setExportingAll(false)
    }
  }

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 1320 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#e2e8e4', margin: 0 }}>Reports</h1>
          <p style={{ fontSize: 13, color: '#5a6b60', marginTop: 6, marginBottom: 0 }}>
            View and download security scan reports
          </p>
        </div>
        <button
          onClick={handleExportAll}
          disabled={reports.length === 0 || exportingAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 8, border: '1px solid #1e2420', background: 'transparent',
            color: reports.length === 0 ? '#3a4a3f' : '#5a6b60',
            fontSize: 12, fontWeight: 600,
            cursor: reports.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {exportingAll ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {exportingAll ? 'Exportando...' : 'Export All'}
        </button>
      </div>

      <ReportList reports={reports} loading={loading} />

      {fullReports.length > 0 && (
        <div style={{ position: 'absolute', left: -9999, top: 0 }}>
          {fullReports.map((report, i) => (
            <ReportPrintable
              key={report.scan_id}
              report={report}
              ref={(el) => (nodeRefs.current[i] = el)}
            />
          ))}
        </div>
      )}
    </div>
  )
}