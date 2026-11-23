import crypto from 'crypto'

export function getLinePayConfig() {
  return {
    channelId: process.env.LINE_PAY_CHANNEL_ID || '',
    channelSecret: process.env.LINE_PAY_CHANNEL_SECRET || '',
    site: (process.env.LINE_PAY_SITE || 'https://sandbox-api-pay.line.me').replace(/\/+$/, ''),
    appBaseUrl: (process.env.APP_BASE_URL || 'https://md-ecommerce-psi.vercel.app').replace(/\/+$/, '')
  }
}

export function signLinePayRequest(channelSecret, uri, bodyOrQueryString, nonce) {
  const payloadStr =
    typeof bodyOrQueryString === 'string'
      ? bodyOrQueryString
      : JSON.stringify(bodyOrQueryString)

  const authMacText = `${channelSecret}${uri}${payloadStr}${nonce}`
  return crypto
    .createHmac('sha256', channelSecret)
    .update(authMacText)
    .digest('base64')
}

export async function callLinePayApi(method, uri, payload = null) {
  const { channelId, channelSecret, site } = getLinePayConfig()
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const upperMethod = method.toUpperCase()

  let fullPath = uri
  let signTarget = ''
  let fetchBody = undefined

  if (upperMethod === 'GET') {
    const queryString = payload ? new URLSearchParams(payload).toString() : ''
    if (queryString) {
      fullPath = `${uri}?${queryString}`
      signTarget = queryString
    }
  } else {
    signTarget = JSON.stringify(payload || {})
    fetchBody = signTarget
  }

  const signature = signLinePayRequest(channelSecret, uri, signTarget, nonce)

  const response = await fetch(`${site}${fullPath}`, {
    method: upperMethod,
    headers: {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': channelId,
      'X-LINE-Authorization-Nonce': nonce,
      'X-LINE-Authorization': signature
    },
    body: fetchBody
  })

  return response.json()
}