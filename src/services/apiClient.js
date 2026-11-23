const TOKEN_KEY = 'md_select_jwt_token'

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY) || ''
export const setAuthToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(url, options = {}) {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP ${response.status}`)
  }
  return data
}