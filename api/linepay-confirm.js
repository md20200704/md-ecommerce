import crypto from 'crypto'
import { withTransaction, getClientIp, writeAuditLog, getCleanLinePaySite } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' })
  }

  const CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID
  const CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET
  const LINE_PAY_SITE = getCleanLinePaySite()

  try {
    const { transactionId, amount, orderId } = req.body
    if (!transactionId || !amount) {
      return res.status(400).json({ success: false, message: '缺少 transactionId 或 amount' })
    }

    const uri = `/v3/payments/${transactionId}/confirm`
    const nonce = crypto.randomUUID()
    const bodyString = JSON.stringify({
      amount: Math.round(Number(amount)),
      currency: 'TWD'
    })

    const signature = crypto
      .createHmac('sha256', CHANNEL_SECRET)
      .update(CHANNEL_SECRET + uri + bodyString + nonce)
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

    if (data.returnCode !== '0000') {
      return res.status(400).json({
        success: false,
        returnCode: data.returnCode,
        message: data.returnMessage || 'LINE Pay 確認扣款失敗'
      })
    }

    // 付款成功：原子化更新訂單、扣減 SKU 庫存（歸零自動下架）、核銷優惠券與點數、清空已結帳購物車
    const targetOrderId = orderId || data.info?.orderId
    if (targetOrderId) {
      await withTransaction(async (client) => {
        const ordRes = await client.query(`SELECT * FROM orders WHERE order_id = $1 FOR UPDATE`, [targetOrderId])
        const ord = ordRes.rows[0]
        if (!ord || ord.payment_status === 'PAID') return

        await client.query(
          `UPDATE orders SET status = '待出貨', payment_status = 'PAID' WHERE order_id = $1`,
          [targetOrderId]
        )

        await client.query(
          `UPDATE payment_transactions
           SET status = 'CONFIRMED', return_code = $2, return_message = $3, raw_response = $4::jsonb
           WHERE transaction_id = $1`,
          [String(transactionId), data.returnCode, data.returnMessage, JSON.stringify(data)]
        )

        const itemsRes = await client.query(`SELECT * FROM order_items WHERE order_id = $1`, [targetOrderId])
        for (const item of itemsRes.rows) {
          if (item.sku_id) {
            const skuUpd = await client.query(
              `UPDATE product_skus SET stock = GREATEST(0, stock - $2) WHERE sku_id = $1 RETURNING stock`,
              [item.sku_id, item.quantity]
            )
            if (skuUpd.rows[0]) {
              await client.query(
                `INSERT INTO stock_logs (id, sku_id, product_name, change_qty, after_stock, reason, operator)
                 VALUES ($1, $2, $3, $4, $5, $6, '系統自動')`,
                ['LOG-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 10), item.sku_id, `${item.name} (${item.color}/${item.size})`, -item.quantity, skuUpd.rows[0].stock, `顧客結帳扣除 (訂單 ${targetOrderId})`]
              )
            }
          }
          if (item.product_id) {
            await client.query(
              `UPDATE products
               SET sales_count = sales_count + $2,
                   is_published = CASE
                     WHEN (SELECT COALESCE(SUM(stock), 0) FROM product_skus WHERE product_id = $1) = 0 THEN FALSE
                     ELSE is_published
                   END
               WHERE id = $1`,
              [item.product_id, item.quantity]
            )
          }
        }

        if (ord.user_coupon_id) {
          await client.query(
            `UPDATE user_coupons SET is_used = TRUE, used_at = NOW() WHERE instance_id = $1`,
            [ord.user_coupon_id]
          )
        }

        if (Number(ord.points_used) > 0 && ord.user_id) {
          await client.query(
            `UPDATE users SET points = GREATEST(0, points - $2) WHERE id = $1`,
            [ord.user_id, Number(ord.points_used)]
          )
        }

        if (ord.user_id) {
          await client.query(`DELETE FROM cart_items WHERE user_id = $1 AND selected = TRUE`, [ord.user_id])
        }

        await writeAuditLog(client, {
          operator: 'LINE Pay 金流系統',
          ip: getClientIp(req),
          action: 'LINE Pay 付款完成',
          detail: `訂單 #${targetOrderId} 扣款完成（序號：${transactionId}），實付 NT$ ${ord.total_amount}`
        })
      })
    }

    return res.status(200).json({
      success: true,
      info: data.info,
      message: 'LINE Pay 付款確認成功！'
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}