import crypto from 'crypto'
import { withTransaction, verifyAuth, getCleanLinePaySite } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' })
  }

  const CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID
  const CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET
  const LINE_PAY_SITE = getCleanLinePaySite()

  if (!CHANNEL_ID || !CHANNEL_SECRET) {
    return res.status(500).json({
      success: false,
      message: '尚未設定 LINE_PAY_CHANNEL_ID 或 LINE_PAY_CHANNEL_SECRET 環境變數'
    })
  }

  try {
    const authUser = verifyAuth(req)
    const {
      orderId: clientOrderId,
      amount: clientAmount,
      packages: clientPackages,
      originUrl,
      orderDraft
    } = req.body

    let finalOrderId = clientOrderId || 'MD-' + Date.now()
    let finalAmount = Math.round(Number(clientAmount || 0))
    let packages = clientPackages

    // 若前端有傳入 orderDraft，則於 PostgreSQL 建立待付款訂單並核對金額
    if (orderDraft && Array.isArray(orderDraft.items) && orderDraft.items.length > 0) {
      const dbResult = await withTransaction(async (client) => {
        // 檢查會員風控狀態
        if (authUser?.id) {
          const uRes = await client.query(`SELECT risk_status FROM users WHERE id = $1`, [authUser.id])
          if (['BLOCK_ORDER', 'BANNED'].includes(uRes.rows[0]?.risk_status)) {
            throw new Error('帳號受風控管制，無法建立新訂單')
          }
        }

        // 以資料庫最新商品售價與成本為準
        let subtotal = 0
        const verifiedItems = []
        for (const item of orderDraft.items) {
          const pRes = await client.query(
            `SELECT id, name, price, cost, cover_image FROM products WHERE id = $1`,
            [Number(item.id)]
          )
          const prod = pRes.rows[0]
          if (!prod) throw new Error(`找不到商品 ID #${item.id}`)

          const skuRes = await client.query(
            `SELECT sku_id, stock FROM product_skus WHERE product_id = $1 AND color = $2 AND size = $3 LIMIT 1`,
            [prod.id, item.color, item.size]
          )
          const sku = skuRes.rows[0]
          if (sku && Number(sku.stock) < Number(item.quantity)) {
            throw new Error(`商品【${prod.name} (${item.color}/${item.size})】庫存不足`)
          }

          const qty = Math.max(1, Number(item.quantity))
          subtotal += Number(prod.price) * qty
          verifiedItems.push({
            productId: prod.id,
            skuId: sku?.sku_id || null,
            name: prod.name,
            color: item.color,
            size: item.size,
            price: Number(prod.price),
            cost: Number(prod.cost || 0),
            quantity: qty,
            image: item.image || prod.cover_image
          })
        }

        const couponDiscount = Math.max(0, Math.round(Number(orderDraft.couponDiscount || 0)))
        const pointsUsed = Math.max(0, Math.round(Number(orderDraft.pointsUsed || 0)))
        const shippingFee = orderDraft.shippingMethod === 'CVS' ? 60 : 100
        const totalAmount = Math.max(0, subtotal - couponDiscount - pointsUsed) + shippingFee

        await client.query(
          `INSERT INTO orders
           (order_id, user_id, customer_name, recipient_name, phone, email, status,
            subtotal, user_coupon_id, coupon_discount, points_used, shipping_fee, total_amount,
            payment_method, payment_status, shipping_method, shipping_address)
           VALUES ($1, $2, $3, $4, $5, $6, '待付款', $7, $8, $9, $10, $11, $12, 'LINE Pay', 'UNPAID', $13, $14)`,
          [
            finalOrderId,
            authUser?.id || null,
            orderDraft.recipientName,
            orderDraft.recipientName,
            orderDraft.phone,
            orderDraft.email,
            subtotal,
            orderDraft.appliedCouponInstanceId || null,
            couponDiscount,
            pointsUsed,
            shippingFee,
            totalAmount,
            orderDraft.shippingMethod || 'HOME',
            orderDraft.shippingAddress
          ]
        )

        for (const vi of verifiedItems) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, sku_id, name, color, size, price, cost, quantity, image)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [finalOrderId, vi.productId, vi.skuId, vi.name, vi.color, vi.size, vi.price, vi.cost, vi.quantity, vi.image]
          )
        }

        const lineProducts = verifiedItems.map(vi => ({
          id: String(vi.productId),
          name: `${vi.name} (${vi.color}/${vi.size})`,
          quantity: vi.quantity,
          price: vi.price
        }))
        if (shippingFee > 0) {
          lineProducts.push({ id: 'SHIPPING', name: '物流運費', quantity: 1, price: shippingFee })
        }
        if (couponDiscount + pointsUsed > 0) {
          lineProducts.push({ id: 'DISCOUNT', name: '優惠券與點數折抵', quantity: 1, price: -(couponDiscount + pointsUsed) })
        }

        return {
          totalAmount,
          packages: [{ id: 'PKG-' + finalOrderId, amount: totalAmount, name: 'M&D SELECT 選品訂單', products: lineProducts }]
        }
      })

      finalAmount = dbResult.totalAmount
      packages = dbResult.packages
    }

    const uri = '/v3/payments/request'
    const nonce = crypto.randomUUID()
    const requestBody = {
      amount: finalAmount,
      currency: 'TWD',
      orderId: finalOrderId,
      packages,
      redirectUrls: {
        confirmUrl: `${originUrl}/order-success?orderId=${encodeURIComponent(finalOrderId)}&amount=${finalAmount}`,
        cancelUrl: `${originUrl}/checkout?canceled=1`
      }
    }

    const bodyString = JSON.stringify(requestBody)
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

    if (data.returnCode === '0000' && data.info?.paymentUrl?.web) {
      // 若資料庫已有該訂單，寫入 LINE Pay 交易追蹤紀錄
      if (orderDraft) {
        await withTransaction(async (client) => {
          await client.query(
            `INSERT INTO payment_transactions (order_id, provider, transaction_id, amount, status, return_code, return_message, raw_response)
             VALUES ($1, 'LINE_PAY', $2, $3, 'REQUESTED', $4, $5, $6::jsonb)`,
            [finalOrderId, String(data.info.transactionId), finalAmount, data.returnCode, data.returnMessage, JSON.stringify(data)]
          )
        })
      }

      return res.status(200).json({
        success: true,
        paymentUrl: data.info.paymentUrl.web,
        transactionId: String(data.info.transactionId)
      })
    }

    return res.status(400).json({
      success: false,
      returnCode: data.returnCode,
      message: data.returnMessage || 'LINE Pay 請求失敗'
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}