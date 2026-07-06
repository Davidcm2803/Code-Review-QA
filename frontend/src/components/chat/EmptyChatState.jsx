import { MessageSquareText } from 'lucide-react'

export default function EmptyChatState({ hasScan }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: 'var(--muted)',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <MessageSquareText size={22} style={{ opacity: 0.6 }} />
      <p style={{ fontSize: 13, margin: 0 }}>
        {hasScan
          ? 'Preguntá algo sobre el código escaneado o una vulnerabilidad puntual.'
          : 'Elegí un repositorio escaneado a la izquierda para empezar.'}
      </p>
    </div>
  )
}