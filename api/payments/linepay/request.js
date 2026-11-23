import { query, verifyAuth } from '../../_lib/db.js'
import { callLinePayApi, getLinePayConfig } from '../../_lib/linePay.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' })
  }

  const authUser = verifyAuth(req)
  if (!authUser) {
    return res.status(401).json({ success: false, message: '尚未登入或登入已逾期' })
  }

  try {
    const { orderId } = req.body || {}
    if (!orderId) {
      return res.status(400).json({ success: false, message: '缺少訂單編號' })
    }

    const orderRes = await query(
      `SELECT id, user_id, total_amount, payment_status FROM orders WHERE id = $1 LIMIT 1`,
      [orderId]
    )
    const order = orderRes.rows[0]

    if (!order || order.user_id !== authUser.id) {
      return res.status(404).json({ success: false, message: '找不到對應訂單' })
    }

    if (order.payment_status === 'PAID') {
      return res.status(400).json({ success: false, message: '此訂單已完成付款' })
    }

    const { appBaseUrl } = getLinePayConfig()
    const amount = Math.round(Number(order.total_amount))
    const uri = '/v3/payments/request'

    const linePayPayload = {
      amount,
      currency: 'TWD',
      orderId: String(order.id),
      packages: [
        {
          id: `pkg-${order.id}`,
          amount,
          name: 'M & D 品牌選物',
          products: [
            {
              name: `訂單 #${order.id}`,
              quantity: 1,
              price: amount
            }
          ]
        }
      ],
      redirectUrls: {
        confirmUrl: `${appBaseUrl}/api/payments/linepay/confirm`,
        cancelUrl: `${appBaseUrl}/checkout?payment=cancelled&orderId=${encodeURIComponent(order.id)}`
      }
    }

    const lpRes = await callLinePayApi('POST', uri, linePayPayload)

    if (lpRes.returnCode !== '0000' || !lpRes.info?.paymentUrl?.web) {
      return res.status(400).json({
        success: false,
        message: lpRes.returnMessage || 'LINE Pay 交易建立失敗',
        code: lpRes.returnCode
      })
    }

    const transactionId = String(lpRes.info.transactionId)
    await query(
      `UPDATE orders
       SET payment_method = 'LINE_PAY',
           line_pay_transaction_id = $2
       WHERE id = $1`,
      [order.id, transactionId]
    )

    return res.status(200).json({
      success: true,
      transactionId,
      paymentUrl: lpRes.info.paymentUrl.web
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}