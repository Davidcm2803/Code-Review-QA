import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Dropzone from '../components/upload/Dropzone'
import FileQueue from '../components/upload/FileQueue'
import CodePasteInput from '../components/upload/CodePasteInput'
import { scanService } from '../config/Api'
import { MAX_FILES, MAX_PASTE_LINES } from '../lib/scan'

let nextId = 1

export default function UploadCode() {
  const navigate = useNavigate()

  const [mode, setMode] = useState('upload')
  const [queue, setQueue] = useState([])
  const [pasteCode, setPasteCode] = useState('')
  const [pasteFilename, setPasteFilename] = useState('pasted_code.py')
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [progressMessage, setProgressMessage] = useState('')

  const handleFilesAdded = (files) => {
    setError(null)
    setQueue((prev) => {
      const room = MAX_FILES - prev.length
      if (room <= 0) {
        setError(`Máximo ${MAX_FILES} archivos por scan`)
        return prev
      }
      const accepted = files.slice(0, room).map((file) => ({
        id: nextId++,
        file,
        name: file.name,
        size: file.size,
        status: 'pending',
      }))
      if (files.length > room) setError(`Solo se agregaron ${room} de ${files.length} archivos`)
      return [...prev, ...accepted]
    })
  }

  // Dropzone manda un array de mensajes
  const handleFilesError = (errors) => setError(errors.join(' · '))

  const handleRemove = (id) => setQueue((prev) => prev.filter((f) => f.id !== id))

  const runPolling = async (scanId) => {
    const results = await scanService.pollUntilDone(scanId, {
      onProgress: (status) => setProgressMessage(status.message),
    })
    navigate('/', { state: { scanId, results } })
  }

  const handleUploadSubmit = async () => {
    if (queue.length === 0 || scanning) return
    setScanning(true)
    setError(null)
    setQueue((prev) => prev.map((f) => ({ ...f, status: 'uploading' })))
    try {
      const { scan_id } = await scanService.uploadFiles(queue.map((f) => f.file))
      setQueue((prev) => prev.map((f) => ({ ...f, status: 'done' })))
      await runPolling(scan_id)
    } catch (err) {
      setQueue((prev) => prev.map((f) => ({ ...f, status: 'error', error: err.message })))
      setError(err?.message ?? 'No se pudo subir los archivos.')
    } finally {
      setScanning(false)
      setProgressMessage('')
    }
  }

  const handlePasteSubmit = async () => {
    if (!pasteCode.trim() || scanning) return
    setScanning(true)
    setError(null)
    try {
      const { scan_id } = await scanService.pasteCode(pasteCode, pasteFilename)
      await runPolling(scan_id)
    } catch (err) {
      setError(err?.message ?? 'No se pudo iniciar el scan.')
    } finally {
      setScanning(false)
      setProgressMessage('')
    }
  }

  const pasteOverLimit = pasteCode.split('\n').length > MAX_PASTE_LINES
  const canSubmit = mode === 'upload' ? queue.length > 0 : pasteCode.trim() && !pasteOverLimit

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
      <PageHeader
        title="Upload Code"
        subtitle="Upload files or paste code for security analysis"
      />

      <div
        style={{
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['upload', 'paste'].map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                style={{
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'colors 0.15s',
                  background: mode === tab ? 'var(--primary-muted)' : 'transparent',
                  color: mode === tab ? 'var(--primary)' : 'var(--muted)',
                  border: `1px solid ${mode === tab ? 'var(--primary-border)' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}
              >
                {tab === 'upload' ? 'Upload Files' : 'Paste Code'}
              </button>
            ))}
          </div>

          <button
            disabled={!canSubmit || scanning}
            onClick={mode === 'upload' ? handleUploadSubmit : handlePasteSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              background: 'var(--primary)',
              color: 'var(--primary-fg)',
              fontSize: 13,
              fontWeight: 600,
              cursor: !canSubmit || scanning ? 'not-allowed' : 'pointer',
              border: 'none',
              opacity: !canSubmit || scanning ? 0.45 : 1,
            }}
          >
            <Zap size={14} />
            {scanning ? 'Scanning...' : 'Start scan'}
          </button>
        </div>

        <p style={{ marginBottom: 16, fontSize: 13, color: 'var(--muted)' }}>
          {mode === 'upload'
            ? 'Drag and drop files, or click to browse'
            : `Paste up to ${MAX_PASTE_LINES} lines of code directly`}
        </p>

        {mode === 'upload' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Dropzone onFilesAdded={handleFilesAdded} onError={handleFilesError} />
            <FileQueue files={queue} onRemove={handleRemove} />
          </div>
        ) : (
          <CodePasteInput
            value={pasteCode}
            filename={pasteFilename}
            onChange={setPasteCode}
            onFilenameChange={setPasteFilename}
          />
        )}

        {error && (
          <div
            style={{
              marginTop: 16,
              borderRadius: 6,
              border: '1px solid var(--critical)',
              background: 'var(--critical-muted)',
              padding: '8px 12px',
              fontSize: 13,
              color: 'var(--critical)',
            }}
          >
            {error}
          </div>
        )}

        {scanning && progressMessage && (
          <p style={{ marginTop: 12, fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>
            {progressMessage}
          </p>
        )}
      </div>
    </div>
  )
}