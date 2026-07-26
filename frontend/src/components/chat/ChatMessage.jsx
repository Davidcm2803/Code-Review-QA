import { Bot, User, AlertTriangle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function normalizeMarkdown(md) {
  if (!md) return md
  const lines = md.replace(/\t/g, '  ').split('\n')
  const out = []
  let inFence = false
  let itemIndent = null

  for (const raw of lines) {
    const trimmed = raw.trim()

    if (/^```/.test(trimmed)) {
      out.push(itemIndent !== null ? ' '.repeat(itemIndent) + trimmed : trimmed)
      inFence = !inFence
      continue
    }
    if (inFence) {
      out.push(raw)
      continue
    }

    const bulletMatch = trimmed.match(/^([-*]|\d+\.)\s+(.*)$/)
    if (bulletMatch) {
      itemIndent = 2
      out.push(`${bulletMatch[1]} ${bulletMatch[2]}`)
      continue
    }

    if (trimmed === '') {
      out.push('')
      continue
    }

    out.push(itemIndent !== null ? ' '.repeat(itemIndent) + trimmed : trimmed)
  }

  return out.join('\n')
}

const markdownComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-2 last:mb-0 pl-5 list-disc space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 last:mb-0 flex flex-col gap-3 pl-5 list-decimal marker:font-semibold marker:text-[var(--primary)]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
  h1: ({ children }) => <h1 className="mt-3 first:mt-0 mb-1.5 text-[1em] font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-3 first:mt-0 mb-1.5 text-[1em] font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 first:mt-0 mb-1.5 text-[1em] font-semibold">{children}</h3>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 pl-3 border-l-2 border-[var(--border)] text-[var(--muted)]">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-[var(--primary)] underline underline-offset-2 break-all"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => <img src={src} alt={alt} className="max-w-full h-auto rounded-md my-2" />,
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code
          className="font-mono text-[0.85em] bg-[var(--secondary)] border border-[var(--border)] rounded px-1.5 py-0.5 break-words"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code className="font-mono text-[0.82em] leading-relaxed whitespace-pre" {...props}>
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-2 max-w-full overflow-x-auto rounded-lg border border-[var(--border)] bg-black/30 p-3">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-2 max-w-full overflow-x-auto">
      <table className="border-collapse text-[0.85em]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-[var(--border)] px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-[var(--border)] px-2 py-1 text-left">{children}</td>,
}

export default function ChatMessage({ role, content, error, chunksUsed }) {
  const isUser = role === 'user'
  const safeContent = !isUser && !error ? normalizeMarkdown(content) : content

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--secondary)] mt-0.5">
          {error ? (
            <AlertTriangle size={13} className="text-[var(--high)]" />
          ) : (
            <Bot size={13} className="text-[var(--primary)]" />
          )}
        </div>
      )}

      <div className="flex min-w-0 max-w-[78%] flex-col gap-1">
        <div
          className={[
            'min-w-0 rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed break-words',
            isUser
              ? 'rounded-br-[2px] bg-[var(--primary)] text-[var(--primary-fg)]'
              : error
              ? 'rounded-bl-[2px] border border-[rgba(255,68,68,0.3)] bg-[rgba(255,68,68,0.08)] text-[var(--fg)]'
              : 'rounded-bl-[2px] border border-[var(--border)] bg-[var(--card)] text-[var(--fg)]',
          ].join(' ')}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap break-words">{content}</span>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {safeContent}
            </ReactMarkdown>
          )}
        </div>

        {!isUser && chunksUsed?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-0.5">
            {chunksUsed.map((c, i) => (
              <span
                key={i}
                className="rounded border border-[var(--border)] bg-[var(--secondary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]"
              >
                {c.file_path}:{c.start_line}-{c.end_line}
              </span>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--secondary)] mt-0.5">
          <User size={13} className="text-[var(--muted)]" />
        </div>
      )}
    </div>
  )
}