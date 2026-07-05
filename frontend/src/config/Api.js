const API_BASE_URL = import.meta.env.VITE_API_URL

export async function apiRequest(path, opts = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  }
  const res = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail ?? `Error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get:    (path, opts = {})       => apiRequest(path, { method: 'GET', ...opts }),
  post:   (path, body, opts = {}) => apiRequest(path, { method: 'POST',  body: JSON.stringify(body), ...opts }),
  put:    (path, body, opts = {}) => apiRequest(path, { method: 'PUT',   body: JSON.stringify(body), ...opts }),
  patch:  (path, body, opts = {}) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(body), ...opts }),
  delete: (path, opts = {})       => apiRequest(path, { method: 'DELETE', ...opts }),
}

export const githubApi = {
  get: (path) => {
    const githubToken = localStorage.getItem('github_token')
    return apiRequest(path, {
      method: 'GET',
      headers: { 'x-github-token': githubToken },
    })
  },
}

export const authService = {
  register: (payload)      => api.post('/api/auth/register', payload),
  login:    (payload)      => api.post('/api/auth/login', payload),
  oauth:    (firebaseUser) => api.post('/api/auth/oauth', firebaseUser),
  me:       ()             => api.get('/api/auth/me'),
}

export const scanService = {
  startFromGithub: (payload) => api.post('/api/scan/start', payload),
  uploadFiles: async (files) => {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    const res = await fetch(`${API_BASE_URL}/api/scan/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(error.detail ?? `Error ${res.status}`)
    }
    return res.json()
  },

  pasteCode: (code, filename) => api.post('/api/scan/paste', { code, filename }),
  getStatus:  (scanId) => api.get(`/api/scan/${scanId}/status`),
  getResults: (scanId) => api.get(`/api/scan/${scanId}/results`),
  getHistory: ()       => api.get('/api/scan/history'),
  getLatest:  ()       => api.get('/api/scan/latest'),

  pollUntilDone: (scanId, { intervalMs = 2000, onProgress } = {}) =>
    new Promise((resolve, reject) => {
      const tick = async () => {
        try {
          const status = await api.get(`/api/scan/${scanId}/status`)
          onProgress?.(status)
          if (status.status === 'completed') resolve(await api.get(`/api/scan/${scanId}/results`))
          else if (status.status === 'failed') reject(new Error(status.message || 'El scan falló'))
          else setTimeout(tick, intervalMs)
        } catch (err) {
          reject(err)
        }
      }
      tick()
    }),
}