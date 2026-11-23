import bcrypt from 'bcryptjs'
import { pool, query, withTransaction, signToken, verifyAuth, getClientIp, writeAuditLog } from './_lib/db.js'

async function loadFullUserProfile(userId) {
  const [userRes, relatedRes] = await Promise.all([
    query(
      `SELECT id, name, email, phone, birthday, avatar, role, vip_tier_id,
              total_spent, points, order_count, abandon_count, risk_status, notes
       FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    ),
    query(
      `SELECT
         COALESCE((
           SELECT json_agg(a ORDER BY a.is_default DESC, a.id ASC)
           FROM user_addresses a WHERE a.user_id = $1
         ), '[]'::json) AS addresses,
         COALESCE((
           SELECT json_agg(c ORDER BY c.claimed_at DESC)
           FROM user_coupons c WHERE c.user_id = $1
         ), '[]'::json) AS coupons,
         COALESCE((
           SELECT json_agg(w.product_id)
           FROM user_wishlists w WHERE w.user_id = $1
         ), '[]'::json) AS wishlist`,
      [userId]
    )
  ])

  const u = userRes.rows[0]
  if (!u) return null

  const rel = relatedRes.rows[0] || { addresses: [], coupons: [], wishlist: [] }

  return {
    id: u.id,
    isLoggedIn: true,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    birthday: u.birthday ? String(u.birthday).slice(0, 10) : '',
    avatar: u.avatar,
    role: u.role,
    isAdmin: u.role === 'ADMIN',
    vipTierId: u.vip_tier_id,
    totalSpent: Number(u.total_spent || 0),
    points: Number(u.points || 0),
    orderCount: Number(u.order_count || 0),
    abandonCount: Number(u.abandon_count || 0),
    riskStatus: u.risk_status,
    blockReason: u.notes || '',
    wishlist: (rel.wishlist || []).map(id => Number(id)),
    savedAddresses: (rel.addresses || []).map(a => ({
      id: Number(a.id),
      type: a.type,
      recipientName: a.recipient_name,
      phone: a.phone,
      city: a.city,
      district: a.district,
      detail: a.detail,
      isDefault: Boolean(a.is_default)
    })),
    myCoupons: (rel.coupons || []).map(c => ({
      instanceId: c.instance_id,
      code: c.code,
      title: c.title,
      type: c.type,
      value: Number(c.value),
      maxDiscount: Number(c.max_discount || 0),
      minSpend: Number(c.min_spend || 0),
      expiryDate: c.expiry_date ? String(c.expiry_date).slice(0, 10) : '',
      isUsed: Boolean(c.is_used),
      source: c.source
    }))
  }
}

export default async function handler(req, res) {
  try {
    const authUser = verifyAuth(req)
    const action = req.query.action || req.body?.action

    // GET：取得當前登入者資料 或 後台會員名冊
    if (req.method === 'GET') {
      if (action === 'members') {
        if (!authUser || authUser.role !== 'ADMIN') {
          return res.status(403).json({ success: false, message: '無管理員權限' })
        }
        const { rows } = await query(
          `SELECT id, name, phone, email, birthday, vip_tier_id, total_spent,
                  order_count, abandon_count, risk_status, notes, updated_at
           FROM users ORDER BY created_at DESC`
        )
        return res.status(200).json({
          success: true,
          members: rows.map(m => ({
            id: m.id,
            name: m.name,
            phone: m.phone || '',
            email: m.email,
            birthday: m.birthday ? String(m.birthday).slice(0, 10) : '',
            vipTierId: m.vip_tier_id,
            totalSpent: Number(m.total_spent || 0),
            orderCount: Number(m.order_count || 0),
            abandonCount: Number(m.abandon_count || 0),
            riskStatus: m.risk_status,
            notes: m.notes || '',
            updatedAt: m.updated_at ? String(m.updated_at).slice(0, 10) : ''
          }))
        })
      }

      if (!authUser) {
        return res.status(401).json({ success: false, message: '尚未登入' })
      }
      const user = await loadFullUserProfile(authUser.id)
      return res.status(200).json({ success: true, user })
    }

    // POST：登入、註冊、領券、收藏、新增地址、補貨通知、批次派券
    if (req.method === 'POST') {
      if (action === 'login') {
        const { account, email, password } = req.body
        const identifier = (email || account || '').trim()
        const { rows } = await query(
          `SELECT * FROM users WHERE email = $1 OR phone = $1 LIMIT 1`,
          [identifier]
        )
        const userRow = rows[0]
        if (!userRow) {
          return res.status(401).json({ success: false, message: '帳號或密碼錯誤' })
        }
        if (userRow.risk_status === 'BANNED') {
          return res.status(403).json({ success: false, message: '此帳號已被系統封鎖，請聯繫客服' })
        }

        const passwordOk = await bcrypt.compare(password || '', userRow.password_hash)
        if (!passwordOk) {
          return res.status(401).json({ success: false, message: '帳號或密碼錯誤' })
        }

        const token = signToken(userRow)
        const profile = await loadFullUserProfile(userRow.id)
        return res.status(200).json({ success: true, token, user: profile })
      }

      if (action === 'register') {
        const { name, phone, email, birthday, password } = req.body
        if (!name || !email || !password) {
          return res.status(400).json({ success: false, message: '請填寫完整註冊資料' })
        }
        const exists = await query(
          `SELECT id FROM users WHERE email = $1 OR phone = $2`,
          [email.trim(), phone || null]
        )
        if (exists.rows.length > 0) {
          return res.status(409).json({ success: false, message: '此 Email 或手機號碼已被註冊' })
        }

        const newId = 'MB-' + Date.now().toString().slice(-6)
        const hash = await bcrypt.hash(password, 10)
        await query(
          `INSERT INTO users (id, name, email, phone, password_hash, birthday, role, vip_tier_id, points)
           VALUES ($1, $2, $3, $4, $5, $6, 'MEMBER', 'GENERAL', 100)`,
          [newId, name.trim(), email.trim(), phone || null, hash, birthday || null]
        )

        const token = signToken({ id: newId, email: email.trim(), role: 'MEMBER', name: name.trim() })
        const profile = await loadFullUserProfile(newId)
        return res.status(201).json({ success: true, token, user: profile })
      }

      if (!authUser) {
        return res.status(401).json({ success: false, message: '請先登入會員' })
      }

      if (action === 'claim-coupon') {
        const { code, source = '輸入優惠碼領取' } = req.body
        const cleanCode = (code || '').trim().toUpperCase()
        const userRes = await query(`SELECT risk_status FROM users WHERE id = $1`, [authUser.id])
        if (userRes.rows[0]?.risk_status === 'RESTRICT_PROMO') {
          return res.status(403).json({ success: false, message: '您的帳號目前優惠功能受限，無法領取優惠券' })
        }

        const tplRes = await query(
          `SELECT * FROM coupon_templates WHERE code = $1 AND is_active = TRUE AND expiry_date >= CURRENT_DATE`,
          [cleanCode]
        )
        const tpl = tplRes.rows[0]
        if (!tpl) {
          return res.status(404).json({ success: false, message: '無效或已過期的優惠碼' })
        }

        const dup = await query(
          `SELECT instance_id FROM user_coupons WHERE user_id = $1 AND code = $2 AND is_used = FALSE`,
          [authUser.id, tpl.code]
        )
        if (dup.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: `您的錢包內已有【${tpl.title}】，結帳時可直接選用`
          })
        }

        const instanceId = 'UCPN-' + Date.now() + Math.floor(Math.random() * 100)
        await query(
          `INSERT INTO user_coupons
           (instance_id, user_id, template_id, code, title, type, value, max_discount, min_spend, expiry_date, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [instanceId, authUser.id, tpl.id, tpl.code, tpl.title, tpl.type, tpl.value, tpl.max_discount, tpl.min_spend, tpl.expiry_date, source]
        )
        const user = await loadFullUserProfile(authUser.id)
        return res.status(200).json({
          success: true,
          message: `領取成功！【${tpl.title}】已存入您的錢包`,
          user
        })
      }

      if (action === 'toggle-wishlist') {
        const productId = Number(req.body.productId)
        const exists = await query(
          `SELECT id FROM user_wishlists WHERE user_id = $1 AND product_id = $2`,
          [authUser.id, productId]
        )
        if (exists.rows.length > 0) {
          await query(
            `DELETE FROM user_wishlists WHERE user_id = $1 AND product_id = $2`,
            [authUser.id, productId]
          )
          return res.status(200).json({ success: true, added: false, message: '已從收藏清單移除' })
        }
        await query(
          `INSERT INTO user_wishlists (user_id, product_id) VALUES ($1, $2)`,
          [authUser.id, productId]
        )
        return res.status(200).json({ success: true, added: true, message: '已加入愛心收藏清單！' })
      }

      if (action === 'add-address') {
        const { type = 'HOME', recipientName, phone, city, district, detail, isDefault = false } = req.body
        if (isDefault) {
          await query(`UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1`, [authUser.id])
        }
        const { rows } = await query(
          `INSERT INTO user_addresses (user_id, type, recipient_name, phone, city, district, detail, is_default)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [authUser.id, type, recipientName, phone, city, district, detail, isDefault]
        )
        return res.status(201).json({ success: true, address: rows[0] })
      }

      if (action === 'restock-alert') {
        const { productId, skuId, email, phone } = req.body
        await query(
          `INSERT INTO restock_requests (user_id, product_id, sku_id, notify_email, notify_phone)
           VALUES ($1, $2, $3, $4, $5)`,
          [authUser.id, Number(productId), skuId || null, email || null, phone || null]
        )
        return res.status(201).json({ success: true, message: '已登記貨到通知，補貨時將第一時間通知您！' })
      }

      if (action === 'dispatch-coupons') {
        if (authUser.role !== 'ADMIN') {
          return res.status(403).json({ success: false, message: '無管理員權限' })
        }
        const { couponCode, targetGroup, sourceName = '系統活動派發' } = req.body

        const result = await withTransaction(async (client) => {
          const tplRes = await client.query(
            `SELECT * FROM coupon_templates WHERE code = $1 AND is_active = TRUE`,
            [couponCode.trim().toUpperCase()]
          )
          const tpl = tplRes.rows[0]
          if (!tpl) throw new Error('找不到對應的有效優惠券模板')

          let whereSql = `risk_status <> 'BANNED'`
          const params = []
          if (targetGroup === 'BIRTHDAY_MONTH') {
            whereSql += ` AND EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM CURRENT_DATE)`
          } else if (targetGroup === 'ALL_VIP') {
            whereSql += ` AND vip_tier_id <> 'GENERAL'`
          } else if (targetGroup?.startsWith('TIER:')) {
            params.push(targetGroup.replace('TIER:', ''))
            whereSql += ` AND vip_tier_id = $1`
          }

          const targets = await client.query(`SELECT id FROM users WHERE ${whereSql}`, params)
          for (const m of targets.rows) {
            const instanceId = 'UCPN-' + Date.now() + Math.floor(Math.random() * 10000)
            await client.query(
              `INSERT INTO user_coupons
               (instance_id, user_id, template_id, code, title, type, value, max_discount, min_spend, expiry_date, source)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [instanceId, m.id, tpl.id, tpl.code, tpl.title, tpl.type, tpl.value, tpl.max_discount, tpl.min_spend, tpl.expiry_date, sourceName]
            )
          }

          await writeAuditLog(client, {
            operator: authUser.name,
            ip: getClientIp(req),
            action: '執行派發優惠券',
            detail: `派發【${tpl.title} (${tpl.code})】給 ${targets.rows.length} 位會員`
          })
          return { count: targets.rows.length, title: tpl.title, code: tpl.code }
        })

        return res.status(200).json({
          success: true,
          count: result.count,
          message: `已成功派發【${result.title} (${result.code})】給 ${result.count} 位會員！`
        })
      }
    }

    // PUT：更新個人資料 或 後台更新會員等級/風控狀態
    if (req.method === 'PUT') {
      if (!authUser) return res.status(401).json({ success: false, message: '請先登入' })

      if (action === 'admin-update-member') {
        if (authUser.role !== 'ADMIN') {
          return res.status(403).json({ success: false, message: '無管理員權限' })
        }
        const { memberId, name, phone, birthday, vipTierId, riskStatus, notes } = req.body
        await query(
          `UPDATE users
           SET name = COALESCE($2, name),
               phone = COALESCE($3, phone),
               birthday = COALESCE($4, birthday),
               vip_tier_id = COALESCE($5, vip_tier_id),
               risk_status = COALESCE($6, risk_status),
               notes = COALESCE($7, notes)
           WHERE id = $1`,
          [memberId, name ?? null, phone ?? null, birthday || null, vipTierId ?? null, riskStatus ?? null, notes ?? null]
        )
        await writeAuditLog(pool, {
          operator: authUser.name,
          ip: getClientIp(req),
          action: '更新會員資料/風控',
          detail: `管理員更新會員 ${memberId}（VIP: ${vipTierId || '未變'}, 風控: ${riskStatus || '未變'}）`
        })
        return res.status(200).json({ success: true, message: '會員資料已更新' })
      }

      const { name, phone, birthday } = req.body
      await query(
        `UPDATE users
         SET name = COALESCE($2, name),
             phone = COALESCE($3, phone),
             birthday = COALESCE($4, birthday)
         WHERE id = $1`,
        [authUser.id, name ?? null, phone ?? null, birthday || null]
      )
      const user = await loadFullUserProfile(authUser.id)
      return res.status(200).json({ success: true, user })
    }

    // DELETE：移除常用地址
    if (req.method === 'DELETE' && action === 'remove-address') {
      if (!authUser) return res.status(401).json({ success: false, message: '請先登入' })
      const addressId = Number(req.query.id || req.body?.id)
      await query(
        `DELETE FROM user_addresses WHERE id = $1 AND user_id = $2`,
        [addressId, authUser.id]
      )
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}