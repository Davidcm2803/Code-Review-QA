import { useEffect, useRef, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import ContextPanel from '../components/chat/ContextPanel'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import TypingIndicator from '../components/chat/TypingIndicator'
import EmptyChatState from '../components/chat/EmptyChatState'
import { scanService, chatbotService } from '../config/Api'
import { useAuth } from '../context/AuthContext'

export default function Chat() {
  const { user } = useAuth()

  const [scans, setScans] = useState([])
  const [loadingScans, setLoadingScans] = useState(true)
  const [selectedScanId, setSelectedScanId] = useState(null)

  const [vulnerabilities, setVulnerabilities] = useState([])
  const [loadingVulns, setLoadingVulns] = useState(false)
  const [selectedVulnId, setSelectedVulnId] = useState(null)

  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [backendReady, setBackendReady] = useState(true)

  const scrollRef = useRef(null)

  // Cargar historial de scans para elegir sobre cuál preguntar
  useEffect(() => {
    if (!user) {
      setLoadingScans(false)
      return
    }
    scanService
      .getHistory()
      .then((data) => setScans(Array.isArray(data) ? data : (data?.scans ?? [])))
      .catch(() => setScans([]))
      .finally(() => setLoadingScans(false))
  }, [user])

  // Cargar vulnerabilidades del scan seleccionado (para elegir contexto puntual)
  useEffect(() => {
    if (!selectedScanId) {
      setVulnerabilities([])
      return
    }
    setLoadingVulns(true)
    setSelectedVulnId(null)
    setMessages([])
    setSessionId(null)

    scanService
      .getResults(selectedScanId)
      .then((data) => setVulnerabilities(data?.vulnerabilities ?? []))
      .catch(() => setVulnerabilities([]))
      .finally(() => setLoadingVulns(false))
  }, [selectedScanId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const ensureSession = async () => {
    if (sessionId) return sessionId
    const created = await chatbotService.createSession(selectedScanId, selectedVulnId)
    const id = created?._id ?? created?.session_id
    setSessionId(id)
    return id
  }

  const handleSend = async (question) => {
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setSending(true)
    setBackendReady(true)

    try {
      const id = await ensureSession()
      const reply = await chatbotService.sendMessage(id, question, selectedVulnId)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply?.answer ?? reply?.content ?? 'Sin respuesta del asistente.',
          chunksUsed: reply?.rag_chunks_used,
        },
      ])
    } catch (err) {
      setBackendReady(false)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          error: true,
          content:
            'No se pudo conectar con el endpoint del chatbot todavía (app/routes/chatbot.py sigue en construcción). ' +
            'El front ya queda listo para conectarse en cuanto exista.',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const selectedScan = scans.find((s) => (s._id ?? s.scan_id) === selectedScanId)
  const selectedVuln = vulnerabilities.find((v) => (v._id ?? v.id) === selectedVulnId)

  return (
    <div
      style={{
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        width: '100%',
        maxWidth: 1320,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--fg)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <MessageSquareText size={20} style={{ color: 'var(--primary)' }} />
          Chat de seguridad
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, marginBottom: 0 }}>
          Preguntá sobre el código escaneado usando contexto real (RAG) en vez de adivinar.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        <ContextPanel
          scans={scans}
          selectedScanId={selectedScanId}
          onSelectScan={setSelectedScanId}
          vulnerabilities={vulnerabilities}
          selectedVulnId={selectedVulnId}
          onSelectVuln={setSelectedVulnId}
          loadingScans={loadingScans}
          loadingVulns={loadingVulns}
        />

        {/* Ventana de chat */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--border)',
            borderRadius: 10,
            background: 'var(--card)',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {/* Barra de contexto activo */}
          {selectedScan && (
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>
                {selectedScan.repo_name ?? selectedScan.name}
                {selectedVuln && (
                  <span style={{ color: 'var(--fg)' }}> · {selectedVuln.title}</span>
                )}
              </span>
              {!backendReady && (
                <span style={{ color: 'var(--high)' }}>backend no disponible</span>
              )}
            </div>
          )}

          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {messages.length === 0 ? (
              <EmptyChatState hasScan={!!selectedScanId} />
            ) : (
              messages.map((m, i) => <ChatMessage key={i} {...m} />)
            )}
            {sending && <TypingIndicator />}
          </div>

          <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
            <ChatInput
              onSubmit={handleSend}
              disabled={!selectedScanId || sending}
              placeholder={
                !selectedScanId
                  ? 'Elegí un scan primero...'
                  : selectedVuln
                  ? `Preguntá sobre "${selectedVuln.title}"...`
                  : 'Preguntá sobre este repositorio...'
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}