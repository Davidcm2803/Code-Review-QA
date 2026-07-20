import { useEffect, useRef, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import ContextPanel from '../components/chat/ContextPanel'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import TypingIndicator from '../components/chat/TypingIndicator'
import EmptyChatState from '../components/chat/EmptyChatState'
import { scanService, chatbotService } from '../config/Api'
import { useAuth } from '../context/AuthContext'

const DAILY_LIMIT = 10

export default function Chat() {
  const { user } = useAuth()

  const [scans, setScans] = useState([])
  const [loadingScans, setLoadingScans] = useState(true)
  const [selectedScanId, setSelectedScanId] = useState(null)

  const [vulnerabilities, setVulnerabilities] = useState([])
  const [loadingVulns, setLoadingVulns] = useState(false)

  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [backendReady, setBackendReady] = useState(true)
  const [messagesLeft, setMessagesLeft] = useState(DAILY_LIMIT)

  const scrollRef = useRef(null)

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

  useEffect(() => {
    if (!selectedScanId) {
      setVulnerabilities([])
      return
    }
    setLoadingVulns(true)
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
    const created = await chatbotService.createSession(selectedScanId)
    const id = created?._id ?? created?.session_id
    setSessionId(id)
    return id
  }

  const handleNewChat = () => {
    setSessionId(null)
    setMessages([])
  }

  const handleSend = async (question) => {
    if (messagesLeft <= 0) return

    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setSending(true)
    setBackendReady(true)

    try {
      const id = await ensureSession()
      const reply = await chatbotService.sendMessage(id, question)

      if (typeof reply?.messages_left === 'number') {
        setMessagesLeft(reply.messages_left)
      } else {
        setMessagesLeft((prev) => Math.max(prev - 1, 0))
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply?.answer ?? reply?.content ?? 'Sin respuesta del asistente.',
          chunksUsed: reply?.rag_chunks_used,
        },
      ])
    } catch (err) {
      if (err?.status === 429) {
        setMessagesLeft(0)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            error: true,
            content: 'Alcanzaste el límite diario de mensajes. Probá de nuevo mañana.',
          },
        ])
      } else {
        setBackendReady(false)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            error: true,
            content:
              'No se pudo conectar con el endpoint del chatbot todavía. ' +
              'El front ya queda listo para conectarse en cuanto exista.',
          },
        ])
      }
    } finally {
      setSending(false)
    }
  }

  const selectedScan = scans.find((s) => (s._id ?? s.scan_id) === selectedScanId)
  const limitReached = messagesLeft <= 0

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
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

        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: limitReached ? 'var(--high)' : 'var(--muted)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: '5px 10px',
          }}
        >
          {messagesLeft}/{DAILY_LIMIT} mensajes hoy
        </span>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        <ContextPanel
          scans={scans}
          selectedScanId={selectedScanId}
          onSelectScan={setSelectedScanId}
          vulnerabilities={vulnerabilities}
          loadingScans={loadingScans}
          loadingVulns={loadingVulns}
          onNewChat={handleNewChat}
        />

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
              <span>{selectedScan.repo_name ?? selectedScan.name}</span>
              {!backendReady && <span style={{ color: 'var(--high)' }}>backend no disponible</span>}
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
              disabled={!selectedScanId || sending || limitReached}
              placeholder={
                limitReached
                  ? 'Alcanzaste el límite diario de mensajes'
                  : !selectedScanId
                  ? 'Elegí un scan primero...'
                  : 'Preguntá sobre este repositorio...'
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}