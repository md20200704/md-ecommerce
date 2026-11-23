import querystring from 'querystring'

function parseFormBody(req) {
  if (!req || !req.body) return {}
  if (typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return querystring.parse(req.body)
    }
  }
  return {}
}

function getPublicOrigin(req) {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/+$/, '')
  }
  const proto = req.headers['x-forwarded-proto'] || (req.socket?.encrypted ? 'https' : 'http')
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'md-ecommerce-psi.vercel.app'
  return `${proto}://${host}`
}

function redirectTo(res, location) {
  if (typeof res.redirect === 'function') {
    return res.redirect(302, location)
  }
  res.writeHead(302, { Location: location })
  res.end()
}

/**
 * 接收 7-11 官方電子地圖 (emap.presco.com.tw) POST 回傳的門市資訊
 * 並導回前端 /checkout 自動帶入門市代號、名稱與地址
 */
export default async function handler(req, res) {
  const origin = getPublicOrigin(req)
  const data = { ...(req.query || {}), ...parseFormBody(req) }

  const storeId = String(data.storeid || data.CVSStoreID || data.storeId || '').trim()
  const storeName = String(data.storename || data.CVSStoreName || data.storeName || '').trim()
  const storeAddress = String(data.storeaddress || data.CVSAddress || data.storeAddress || '').trim()

  const params = new URLSearchParams()
  if (storeId) {
    params.set('cvsSelected', '1')
    params.set('brand', '7-11')
    params.set('storeId', storeId)
    params.set('storeName', storeName)
    params.set('storeAddress', storeAddress)
  } else {
    params.set('cvsError', '1')
  }

  return redirectTo(res, `${origin}/checkout?${params.toString()}`)
}