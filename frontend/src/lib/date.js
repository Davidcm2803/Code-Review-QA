export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CR', {
    timeZone: 'America/Costa_Rica',
    year:   'numeric',
    month:  'short',
    day:    '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CR', {
    timeZone: 'America/Costa_Rica',
    hour:   '2-digit',
    minute: '2-digit',
  })
}