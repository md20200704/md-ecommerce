import { query } from '../../_lib/db.js'
import { callLinePayApi, getLinePayConfig } from '../../_lib/linePay.js'

export default async function handler(req, res) {
  const { appBaseUrl } = getLinePayConfig()
  const transactionId = String(req.query?.transactionId || '')
  const orderId = String(req.query?.orderId || '')

  if (!transactionId || !orderId) {
    return res.redirect(302, `${appBaseUrl}/checkout?payment=failed`)
  }

  try {
    const orderRes = await query(
      `SELECT id, total_amount, payment_status FROM orders WHERE id = $1 LIMIT 1`,
      [orderId]
    )
    const order = orderRes.rows[0]

    if (!order) {
      return res.redirect(302, `${appBaseUrl}/checkout?payment=failed`)
    }

    // 冪等保護：若已付款完成，直接導向成功頁
    if (order.payment_status === 'PAID') {
      return res.redirect(302, `${appBaseUrl}/profile?order=${encodeURIComponent(order.id)}&payment=success`)
    }

    const amount = Math.round(Number(order.total_amount))
    const uri = `/v3/payments/${encodeURIComponent(transactionId)}/confirm`
    const confirmRes = await callLinePayApi('POST', uri, {
      amount,
      currency: 'TWD'
    })

    if (confirmRes.returnCode === '0000') {
      await query(
        `UPDATE orders
         SET payment_status = 'PAID',
             line_pay_transaction_id = $2,
             paid_at = NOW()
         WHERE id = $1`,
        [order.id, transactionId]
      )
      return res.redirect(302, `${appBaseUrl}/profile?order=${encodeURIComponent(order.id)}&payment=success`)
    }

    await query(
      `UPDATE orders SET payment_status = 'FAILED' WHERE id = $1 AND payment_status = 'UNPAID'`,
      [order.id]
    )
    return res.redirect(302, `${appBaseUrl}/checkout?payment=failed&orderId=${encodeURIComponent(order.id)}`)
  } catch (err) {
    console.error('[LINE Pay Confirm Error]', err)
    return res.redirect(302, `${appBaseUrl}/checkout?payment=failed&orderId=${encodeURIComponent(orderId)}`)
  }
}