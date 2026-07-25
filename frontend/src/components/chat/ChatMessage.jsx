import { Bot, User, AlertTriangle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ChatMessage({ role, content, error, chunksUsed }) {
  const isUser = role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        gap: 8,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: 'var(--secondary)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          {error ? (
            <AlertTriangle size={13} style={{ color: 'var(--high)' }} />
          ) : (
            <Bot size={13} style={{ color: 'var(--primary)' }} />
          )}
        </div>
      )}

      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          className="chat-markdown"
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            padding: '9px 12px',
            borderRadius: 10,
            borderBottomRightRadius: isUser ? 2 : 10,
            borderBottomLeftRadius: isUser ? 10 : 2,
            wordBreak: 'break-word',
            background: isUser
              ? 'var(--primary)'
              : error
              ? 'rgba(255,68,68,0.08)'
              : 'var(--card)',
            color: isUser ? 'var(--primary-fg)' : 'var(--fg)',
            border: isUser
              ? 'none'
              : error
              ? '1px solid rgba(255,68,68,0.3)'
              : '1px solid var(--border)',
          }}
        >
          {isUser ? (
            <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          )}
        </div>

        {!isUser && chunksUsed?.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              paddingLeft: 2,
            }}
          >
            {chunksUsed.map((c, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--muted)',
                  background: 'var(--secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '2px 6px',
                }}
              >
                {c.file_path}:{c.start_line}-{c.end_line}
              </span>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: 'var(--secondary)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <User size={13} style={{ color: 'var(--muted)' }} />
        </div>
      )}
    </div>
  )
}