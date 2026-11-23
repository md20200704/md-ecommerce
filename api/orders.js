import { pool, query, withTransaction, verifyAuth, getClientIp, writeAuditLog } from './_lib/db.js'

export default async function handler(req, res) {
  try {
    const authUser = verifyAuth(req)
    if (!authUser) {
      return res.status(401).json({ success: false, message: '請先登入' })
    }

    const action = req.query.action || req.body?.action

    if (req.method === 'GET') {
      if (action === 'logs') {
        if (authUser.role !== 'ADMIN') return res.status(403).json({ success: false, message: '無權限' })
        const [auditRes, stockRes] = await Promise.all([
          query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200`),
          query(`SELECT * FROM stock_logs ORDER BY created_at DESC LIMIT 200`)
        ])
        return res.status(200).json({
          success: true,
          auditLogs: auditRes.rows.map(a => ({
            id: a.id,
            operator: a.operator,
            ip: a.ip,
            action: a.action,
            detail: a.detail,
            createdAt: a.created_at.toISOString().slice(0, 16).replace('T', ' ')
          })),
          stockLogs: stockRes.rows.map(s => ({
            id: s.id,
            skuId: s.sku_id,
            productName: s.product_name,
            changeQty: Number(s.change_qty),
            afterStock: Number(s.after_stock),
            reason: s.reason,
            operator: s.operator,
            createdAt: s.created_at.toISOString().slice(0, 16).replace('T', ' ')
          }))
        })
      }

      const isAdmin = authUser.role === 'ADMIN'
      const orderRes = isAdmin
        ? await query(`SELECT * FROM orders ORDER BY created_at DESC`)
        : await query(`SELECT * FROM orders WHERE user_id = $1 OR email = $2 ORDER BY created_at DESC`, [authUser.id, authUser.email])

      const orderIds = orderRes.rows.map(o => o.order_id)
      let itemsMap = {}
      let returnsMap = {}

      if (orderIds.length > 0) {
        const [itemsRes, retRes] = await Promise.all([
          query(`SELECT * FROM order_items WHERE order_id = ANY($1::varchar[])`, [orderIds]),
          query(`SELECT * FROM order_returns WHERE order_id = ANY($1::varchar[])`, [orderIds])
        ])
        for (const it of itemsRes.rows) {
          if (!itemsMap[it.order_id]) itemsMap[it.order_id] = []
          itemsMap[it.order_id].push({
            id: Number(it.product_id),
            skuId: it.sku_id,
            name: it.name,
            color: it.color,
            size: it.size,
            price: Number(it.price),
            cost: Number(it.cost),
            quantity: Number(it.quantity),
            image: it.image,
            reviewed: it.reviewed
          })
        }
        for (const r of retRes.rows) {
          returnsMap[r.order_id] = {
            id: r.id,
            status: r.status,
            reason: `[${r.reason_type}] ${r.detail_reason}`,
            images: Array.isArray(r.images_json) ? r.images_json : [],
            createdAt: r.created_at.toISOString().slice(0, 16).replace('T', ' ')
          }
        }
      }

      const orders = orderRes.rows.map(o => ({
        id: o.order_id,
        orderId: o.order_id,
        customerName: o.customer_name,
        recipientName: o.recipient_name,
        phone: o.phone,
        email: o.email,
        status: o.status,
        subtotal: Number(o.subtotal),
        couponDiscount: Number(o.coupon_discount),
        pointsUsed: Number(o.points_used),
        shippingFee: Number(o.shipping_fee),
        totalAmount: Number(o.total_amount),
        amount: Number(o.total_amount),
        earnedPoints: Number(o.earned_points || 0),
        rewardsSettled: o.rewards_settled,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        shippingMethod: o.shipping_method,
        logisticsSubType: o.logistics_subtype || '',
        storeId: o.store_id || '',
        storeName: o.store_name || '',
        storeAddress: o.store_address || '',
        shippingStatus: o.shipping_status || 'UNCREATED',
        shippingAddress: o.shipping_address,
        trackingNumber: o.tracking_number || '',
        cancelReason: o.cancel_reason || '',
        returnRequest: returnsMap[o.order_id] || null,
        createdAt: o.created_at.toISOString().slice(0, 16).replace('T', ' '),
        items: itemsMap[o.order_id] || []
      }))

      return res.status(200).json({ success: true, orders })
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { orderId } = req.body

      if (action === 'request-cancel') {
        const { reason = '顧客申請取消' } = req.body
        const { rows } = await query(`SELECT status FROM orders WHERE order_id = $1`, [orderId])
        if (!rows[0] || !['待出貨', '處理中', '已付款'].includes(rows[0].status)) {
          return res.status(400).json({ success: false, message: '此訂單無法直接申請取消' })
        }
        await query(
          `UPDATE orders SET status = '申請取消中', cancel_reason = $2, cancel_requested_at = NOW() WHERE order_id = $1`,
          [orderId, reason]
        )
        await writeAuditLog(pool, {
          operator: authUser.name,
          ip: getClientIp(req),
          action: '顧客申請取消訂單',
          detail: `訂單 #${orderId} 提出取消申請（原因：${reason}）`
        })
        return res.status(200).json({ success: true, message: `已送出訂單 #${orderId} 取消申請` })
      }

      if (action === 'approve-cancel') {
        if (authUser.role !== 'ADMIN') return res.status(403).json({ success: false, message: '無權限' })

        const pointsRefunded = await withTransaction(async (client) => {
          const ordRes = await client.query(`SELECT * FROM orders WHERE order_id = $1 FOR UPDATE`, [orderId])
          const ord = ordRes.rows[0]
          if (!ord) throw new Error('找不到該筆訂單')

          await client.query(`UPDATE orders SET status = '已取消', cancelled_at = NOW() WHERE order_id = $1`, [orderId])

          const itemsRes = await client.query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId])
          for (const item of itemsRes.rows) {
            if (item.sku_id) {
              const skuUpd = await client.query(
                `UPDATE product_skus SET stock = stock + $2 WHERE sku_id = $1 RETURNING stock`,
                [item.sku_id, item.quantity]
              )
              if (skuUpd.rows[0]) {
                await client.query(
                  `INSERT INTO stock_logs (id, sku_id, product_name, change_qty, after_stock, reason, operator)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                  ['LOG-' + Date.now().toString().slice(-6), item.sku_id, `${item.name} (${item.color}/${item.size})`, item.quantity, skuUpd.rows[0].stock, `核准取消回補 (訂單 ${orderId})`, authUser.name]
                )
              }
            }
            if (item.product_id) {
              await client.query(
                `UPDATE products SET sales_count = GREATEST(0, sales_count - $2), is_published = TRUE WHERE id = $1`,
                [item.product_id, item.quantity]
              )
            }
          }

          const pts = Number(ord.points_used || 0)
          if (pts > 0 && ord.user_id) {
            await client.query(`UPDATE users SET points = points + $2 WHERE id = $1`, [ord.user_id, pts])
          }

          await writeAuditLog(client, {
            operator: authUser.name,
            ip: getClientIp(req),
            action: '後台核准取消訂單',
            detail: `核准取消 #${orderId}，庫存與 ${pts} 點紅利已自動回補`
          })
          return pts
        })

        return res.status(200).json({
          success: true,
          message: `已核准取消訂單 #${orderId}，庫存已回補${pointsRefunded > 0 ? `並退還 ${pointsRefunded} 點紅利` : ''}。`
        })
      }

      if (action === 'reject-cancel') {
        if (authUser.role !== 'ADMIN') return res.status(403).json({ success: false, message: '無權限' })
        await query(`UPDATE orders SET status = '待出貨', cancel_reason = NULL WHERE order_id = $1`, [orderId])
        await writeAuditLog(pool, {
          operator: authUser.name,
          ip: getClientIp(req),
          action: '後台駁回取消申請',
          detail: `訂單 #${orderId} 取消申請已駁回，恢復為待出貨`
        })
        return res.status(200).json({ success: true, message: `已駁回訂單 #${orderId} 的取消申請` })
      }

      if (action === 'ship') {
        if (authUser.role !== 'ADMIN') return res.status(403).json({ success: false, message: '無權限' })
        const { trackingNumber } = req.body
        await query(
          `UPDATE orders
           SET status = '配送中',
               shipping_status = 'SHIPPED',
               tracking_number = $2,
               logistics_updated_at = NOW()
           WHERE order_id = $1`,
          [orderId, trackingNumber]
        )
        await writeAuditLog(pool, {
          operator: authUser.name,
          ip: getClientIp(req),
          action: '商家更新訂單出貨',
          detail: `訂單 #${orderId} 已寄出並標記為配送中，寄件編號：${trackingNumber}`
        })
        return res.status(200).json({ success: true, message: '已標記為配送中並儲存寄件編號' })
      }

      if (action === 'update-shipping-status') {
        if (authUser.role !== 'ADMIN') return res.status(403).json({ success: false, message: '無權限' })
        const { shippingStatus, trackingNumber } = req.body
        const allowed = ['CREATED', 'SHIPPED', 'ARRIVED', 'PICKED_UP', 'RETURNED']
        if (!allowed.includes(shippingStatus)) {
          return res.status(400).json({ success: false, message: '不支援的物流狀態' })
        }

        const statusLabels = {
          CREATED: '已建立寄件單',
          SHIPPED: '已寄出（配送中）',
          ARRIVED: '已到店（待取件）',
          PICKED_UP: '已取件（已完成）',
          RETURNED: '已退回（逾期未取）'
        }

        const outcome = await withTransaction(async (client) => {
          const ordRes = await client.query(`SELECT * FROM orders WHERE order_id = $1 FOR UPDATE`, [orderId])
          const ord = ordRes.rows[0]
          if (!ord) throw new Error('找不到該筆訂單')

          const finalTracking = trackingNumber ? String(trackingNumber).trim() : (ord.tracking_number || '')
          let nextOrderStatus = ord.status
          if (shippingStatus === 'SHIPPED' || shippingStatus === 'ARRIVED') nextOrderStatus = '配送中'
          if (shippingStatus === 'PICKED_UP') nextOrderStatus = '已完成'
          if (shippingStatus === 'RETURNED') nextOrderStatus = '已退回'

          await client.query(
            `UPDATE orders
             SET shipping_status = $2,
                 status = $3,
                 tracking_number = $4,
                 logistics_updated_at = NOW()
             WHERE order_id = $1`,
            [orderId, shippingStatus, nextOrderStatus, finalTracking]
          )

          let earnedPoints = Number(ord.earned_points || 0)

          if (shippingStatus === 'PICKED_UP' && !ord.rewards_settled && ord.user_id) {
            const userRes = await client.query(`SELECT * FROM users WHERE id = $1 FOR UPDATE`, [ord.user_id])
            const u = userRes.rows[0]
            if (u) {
              const tiersRes = await client.query(`SELECT * FROM vip_tiers ORDER BY min_spend ASC`)
              const tiers = tiersRes.rows
              const currentTier = tiers.find(t => t.id === u.vip_tier_id) || tiers[0]
              earnedPoints = Math.max(1, Math.floor((Number(ord.total_amount) * Number(currentTier?.points_earn_rate || 1)) / 100))
              const newTotalSpent = Number(u.total_spent) + Number(ord.total_amount)

              let qualifiedTier = tiers[0]
              for (const t of tiers) {
                if (newTotalSpent >= Number(t.min_spend)) qualifiedTier = t
              }
              const oldIdx = tiers.findIndex(t => t.id === u.vip_tier_id)
              const newIdx = tiers.findIndex(t => t.id === qualifiedTier?.id)
              const nextTierId = newIdx > oldIdx ? qualifiedTier.id : u.vip_tier_id

              await client.query(
                `UPDATE users SET total_spent = $2, points = points + $3, order_count = order_count + 1, vip_tier_id = $4 WHERE id = $1`,
                [u.id, newTotalSpent, earnedPoints, nextTierId]
              )
              await client.query(
                `UPDATE orders SET earned_points = $2, rewards_settled = TRUE WHERE order_id = $1`,
                [orderId, earnedPoints]
              )
            }
          }

          if (shippingStatus === 'RETURNED' && ord.user_id) {
            await client.query(
              `UPDATE users
               SET abandon_count = COALESCE(abandon_count, 0) + 1,
                   risk_status = CASE
                     WHEN COALESCE(abandon_count, 0) + 1 >= 2 AND risk_status = 'NORMAL' THEN 'BLOCK_ORDER'
                     ELSE risk_status
                   END
               WHERE id = $1`,
              [ord.user_id]
            )
          }

          await writeAuditLog(client, {
            operator: authUser.name,
            ip: getClientIp(req),
            action: `更新物流狀態：${statusLabels[shippingStatus]}`,
            detail: `訂單 #${orderId}${finalTracking ? `（寄件編號：${finalTracking}）` : ''} 狀態更新為「${statusLabels[shippingStatus]}」`
          })

          return { label: statusLabels[shippingStatus], earnedPoints }
        })

        return res.status(200).json({
          success: true,
          message: `訂單 #${orderId} 已更新為「${outcome.label}」`
        })
      }

      if (action === 'complete') {
        const result = await withTransaction(async (client) => {
          const ordRes = await client.query(`SELECT * FROM orders WHERE order_id = $1 FOR UPDATE`, [orderId])
          const ord = ordRes.rows[0]
          if (!ord) throw new Error('找不到該筆訂單')

          let earnedPoints = Number(ord.earned_points || 0)
          let upgradedTier = null

          if (!ord.rewards_settled && ord.user_id) {
            const userRes = await client.query(`SELECT * FROM users WHERE id = $1 FOR UPDATE`, [ord.user_id])
            const u = userRes.rows[0]
            const tiersRes = await client.query(`SELECT * FROM vip_tiers ORDER BY min_spend ASC`)
            const tiers = tiersRes.rows

            const currentTier = tiers.find(t => t.id === u.vip_tier_id) || tiers[0]
            earnedPoints = Math.max(1, Math.floor((Number(ord.total_amount) * Number(currentTier.points_earn_rate)) / 100))
            const newTotalSpent = Number(u.total_spent) + Number(ord.total_amount)

            let qualifiedTier = tiers[0]
            for (const t of tiers) {
              if (newTotalSpent >= Number(t.min_spend)) qualifiedTier = t
            }

            const oldIdx = tiers.findIndex(t => t.id === u.vip_tier_id)
            const newIdx = tiers.findIndex(t => t.id === qualifiedTier.id)
            const nextTierId = newIdx > oldIdx ? qualifiedTier.id : u.vip_tier_id
            if (newIdx > oldIdx) upgradedTier = qualifiedTier

            await client.query(
              `UPDATE users SET total_spent = $2, points = points + $3, order_count = order_count + 1, vip_tier_id = $4 WHERE id = $1`,
              [u.id, newTotalSpent, earnedPoints, nextTierId]
            )
          }

          await client.query(
            `UPDATE orders
             SET status = '已完成',
                 shipping_status = CASE WHEN shipping_method = 'CVS' THEN 'PICKED_UP' ELSE shipping_status END,
                 earned_points = $2,
                 rewards_settled = TRUE
             WHERE order_id = $1`,
            [orderId, earnedPoints]
          )

          await writeAuditLog(client, {
            operator: authUser.name,
            ip: getClientIp(req),
            action: '完成訂單與點數結算',
            detail: `訂單 #${orderId} 已完成，入帳 ${earnedPoints} 點紅利`
          })
          return { earnedPoints, upgradedTier }
        })

        return res.status(200).json({ success: true, ...result })
      }

      if (action === 'request-return') {
        const { reasonType, detailReason, images = [] } = req.body
        const retId = 'RET-' + Date.now().toString().slice(-6)
        await withTransaction(async (client) => {
          await client.query(`UPDATE orders SET status = '退貨審核中' WHERE order_id = $1`, [orderId])
          await client.query(
            `INSERT INTO order_returns (id, order_id, user_id, reason_type, detail_reason, images_json)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
            [retId, orderId, authUser.id, reasonType || '退貨申請', detailReason || '', JSON.stringify(images)]
          )
          await writeAuditLog(client, {
            operator: authUser.name,
            ip: getClientIp(req),
            action: '會員申請售後退貨',
            detail: `訂單 #${orderId} 提出退貨申請（${reasonType}）`
          })
        })
        return res.status(201).json({ success: true, id: retId, message: '退貨申請已送出' })
      }
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}