import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'

export default function ChatInput({ onSubmit, disabled, placeholder }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`
    }
  }, [value])

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        border: '1px solid var(--border)',
        borderRadius: 10,
        background: 'var(--card)',
        padding: 8,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder={placeholder ?? 'Preguntá algo sobre este scan...'}
        style={{
          flex: 1,
          resize: 'none',
          background: 'transparent',
          color: 'var(--fg)',
          fontSize: 13,
          fontFamily: 'inherit',
          border: 'none',
          outline: 'none',
          padding: '6px 8px',
          maxHeight: 140,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 8,
          background: !value.trim() || disabled ? 'var(--secondary)' : 'var(--primary)',
          color: !value.trim() || disabled ? 'var(--muted)' : 'var(--primary-fg)',
          fontSize: 12,
          fontWeight: 600,
          border: 'none',
          cursor: !value.trim() || disabled ? 'not-allowed' : 'pointer',
          flexShrink: 0,
        }}
      >
        <Send size={13} />
      </button>
    </div>
  )
}