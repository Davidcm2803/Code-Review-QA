import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import ReportList from '../components/reports/ReportList'
import { api } from '../config/Api'

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/scan/history')
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      style={{
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        width: '100%',
        maxWidth: 1320,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#e2e8e4', margin: 0 }}>
            Reports
          </h1>
          <p style={{ fontSize: 13, color: '#5a6b60', marginTop: 6, marginBottom: 0 }}>
            View and download security scan reports
          </p>
        </div>
        <button
          disabled={reports.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 8,
            border: '1px solid #1e2420',
            background: 'transparent',
            color: reports.length === 0 ? '#3a4a3f' : '#5a6b60',
            fontSize: 12,
            fontWeight: 600,
            cursor: reports.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <Download size={13} />
          Export All
        </button>
      </div>
      <ReportList reports={reports} loading={loading} />
    </div>
  )
}