const TOKEN_KEY = 'md_select_jwt_token'
const DEFAULT_TIMEOUT_MS = 12000

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY) || ''

export const setAuthToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('伺服器連線逾時，請檢查網路狀態或稍後再試')
    }
    throw new Error('無法連線至伺服器，請確認網路或 API 服務狀態')
  } finally {
    clearTimeout(timer)
  }
}

export async function apiRequest(url, options = {}, retries = null) {
  const method = (options.method || 'GET').toUpperCase()
  const maxRetries = retries ?? (method === 'GET' ? 1 : 0)

  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let lastError = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, { ...options, headers })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        // 502 / 503 / 504 若有重試機會可再嘗試一次
        if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 250))
          continue
        }
        throw new Error(data.message || data.error || `請求失敗 (HTTP ${response.status})`)
      }

      return data
    } catch (err) {
      lastError = err
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 250))
        continue
      }
    }
  }

  throw lastError
}