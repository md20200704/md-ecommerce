import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID
  const CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET
  const LINE_PAY_SITE = process.env.LINE_PAY_SITE || 'https://sandbox-api-pay.line.me'

  try {
    const { transactionId, amount } = req.body
    if (!transactionId || !amount) {
      return res.status(400).json({ success: false, message: '缺少 transactionId 或 amount' })
    }

    const uri = `/v3/payments/${transactionId}/confirm`
    const nonce = crypto.randomUUID()

    const requestBody = {
      amount: Math.round(Number(amount)),
      currency: 'TWD'
    }

    const bodyString = JSON.stringify(requestBody)
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

    if (data.returnCode === '0000') {
      return res.status(200).json({
        success: true,
        info: data.info,
        message: 'LINE Pay 付款確認成功！'
      })
    } else {
      return res.status(400).json({
        success: false,
        returnCode: data.returnCode,
        message: data.returnMessage || 'LINE Pay 確認付款失敗'
      })
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}