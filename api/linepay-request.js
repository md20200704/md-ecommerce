import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID
  const CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET
 const rawSite = (process.env.LINE_PAY_SITE || 'https://sandbox-api-pay.line.me').trim()
const matchUrl = rawSite.match(/https?:\/\/[a-zA-Z0-9.-]+/)
const LINE_PAY_SITE = matchUrl ? matchUrl[0] : 'https://sandbox-api-pay.line.me'

  if (!CHANNEL_ID || !CHANNEL_SECRET) {
    return res.status(500).json({
      success: false,
      message: '尚未在 Vercel 環境變數設定 LINE_PAY_CHANNEL_ID 或 LINE_PAY_CHANNEL_SECRET'
    })
  }

  try {
    const { orderId, amount, packages, originUrl } = req.body
    const uri = '/v3/payments/request'
    const nonce = crypto.randomUUID()

    // 組合 LINE Pay v3 Request Body（金額必須為整數，且與 packages 加總完全一致）
    const requestBody = {
      amount: Math.round(Number(amount)),
      currency: 'TWD',
      orderId,
      packages,
      redirectUrls: {
        // 消費者在 LINE Pay 頁面確認付款後，導回網站的確認頁
        confirmUrl: `${originUrl}/order-success?orderId=${encodeURIComponent(orderId)}&amount=${Math.round(Number(amount))}`,
        // 消費者取消付款時導回結帳頁
        cancelUrl: `${originUrl}/checkout?canceled=1`
      }
    }

    const bodyString = JSON.stringify(requestBody)
    // LINE Pay v3 簽章規則：Base64(HMAC-SHA256(ChannelSecret, ChannelSecret + URI + RequestBody + Nonce))
    const rawSignature = CHANNEL_SECRET + uri + bodyString + nonce
    const signature = crypto
      .createHmac('sha256', CHANNEL_SECRET)
      .update(rawSignature)
      .digest('base64')

    const lineRes = await fetch(`${LINE_PAY_SITE}${uri}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': CHANNEL_ID,
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature
      },
      body: bodyString
    })

    const data = await lineRes.json()

    if (data.returnCode === '0000' && data.info?.paymentUrl?.web) {
      return res.status(200).json({
        success: true,
        paymentUrl: data.info.paymentUrl.web,
        transactionId: data.info.transactionId
      })
    } else {
      return res.status(400).json({
        success: false,
        returnCode: data.returnCode,
        message: data.returnMessage || 'LINE Pay 請求失敗'
      })
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}