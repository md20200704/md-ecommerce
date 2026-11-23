import { query, withTransaction, verifyAuth, getClientIp, writeAuditLog } from './_lib/db.js'

function buildCategoryTree(rows) {
  const primaries = rows.filter(r => r.level === 1)
  return primaries.map(p => {
    const groups = rows.filter(r => r.level === 2 && r.parent_id === p.id)
    return {
      id: p.id,
      name: p.name,
      subcategories: groups.map(g => ({
        id: g.id,
        name: g.name,
        items: rows.filter(r => r.level === 3 && r.parent_id === g.id).map(i => i.name)
      }))
    }
  })
}

export default async function handler(req, res) {
  try {
    const authUser = verifyAuth(req)
    const resource = req.query.resource || req.body?.resource

    // GET：一次載入所有前台/後台行銷與 CMS 設定
    if (req.method === 'GET') {
      const [bannersRes, catsRes, tiersRes, couponsRes, rulesRes] = await Promise.all([
        query(`SELECT * FROM cms_banners ORDER BY sort_order ASC, id ASC`),
        query(`SELECT * FROM categories WHERE is_active = TRUE ORDER BY level ASC, sort_order ASC, id ASC`),
        query(`SELECT * FROM vip_tiers ORDER BY min_spend ASC`),
        query(`SELECT * FROM coupon_templates ORDER BY created_at DESC`),
        query(`SELECT * FROM auto_dispatch_rules ORDER BY created_at DESC`)
      ])

      return res.status(200).json({
        success: true,
        banners: bannersRes.rows.map(b => ({
          id: b.id,
          tag: b.tag || '',
          title: b.title,
          subtitle: b.subtitle || '',
          buttonText: b.button_text,
          linkType: b.link_type,
          linkUrl: b.link_url,
          image: b.image,
          sortOrder: b.sort_order,
          isExternal: b.is_external,
          isActive: b.is_active
        })),
        categoryTree: buildCategoryTree(catsRes.rows),
        vipTiers: tiersRes.rows.map(t => ({
          id: t.id,
          name: t.name,
          minSpend: Number(t.min_spend),
          discountRate: Number(t.discount_rate),
          pointsEarnRate: Number(t.points_earn_rate),
          badgeColor: t.badge_color,
          description: t.description
        })),
        couponTemplates: couponsRes.rows.map(c => ({
          id: c.id,
          code: c.code,
          title: c.title,
          type: c.type,
          value: Number(c.value),
          maxDiscount: Number(c.max_discount),
          minSpend: Number(c.min_spend),
          expiryDate: c.expiry_date ? c.expiry_date.toISOString().slice(0, 10) : '',
          isActive: c.is_active,
          description: c.description
        })),
        autoDispatchRules: rulesRes.rows.map(r => ({
          id: r.id,
          name: r.name,
          targetGroup: r.target_group,
          scheduleType: r.schedule_type,
          specificDate: r.specific_date ? r.specific_date.toISOString().slice(0, 10) : '',
          couponCode: r.coupon_code,
          isActive: r.is_active
        }))
      })
    }

    if (!authUser || authUser.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: '僅限管理員操作' })
    }

    // VIP 階級 CRUD
    if (resource === 'vip-tier') {
      if (req.method === 'POST' || req.method === 'PUT') {
        const t = req.body
        const id = (t.id || 'TIER_' + Date.now()).trim().toUpperCase()
        await query(
          `INSERT INTO vip_tiers (id, name, min_spend, discount_rate, points_earn_rate, badge_color, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name, min_spend = EXCLUDED.min_spend,
               discount_rate = EXCLUDED.discount_rate, points_earn_rate = EXCLUDED.points_earn_rate,
               badge_color = EXCLUDED.badge_color, description = EXCLUDED.description`,
          [id, t.name, Number(t.minSpend || 0), Number(t.discountRate || 1), Number(t.pointsEarnRate || 1), t.badgeColor || 'bg-secondary-subtle text-secondary', t.description || '']
        )
        return res.status(200).json({ success: true })
      }
      if (req.method === 'DELETE') {
        await query(`DELETE FROM vip_tiers WHERE id = $1`, [req.query.id || req.body?.id])
        return res.status(200).json({ success: true })
      }
    }

    // 優惠券模板 CRUD
    if (resource === 'coupon') {
      if (req.method === 'POST' || req.method === 'PUT') {
        const c = req.body
        const id = c.id || 'CPN-' + Date.now().toString().slice(-5)
        await query(
          `INSERT INTO coupon_templates (id, code, title, type, value, max_discount, min_spend, expiry_date, is_active, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE
           SET code = EXCLUDED.code, title = EXCLUDED.title, type = EXCLUDED.type, value = EXCLUDED.value,
               max_discount = EXCLUDED.max_discount, min_spend = EXCLUDED.min_spend,
               expiry_date = EXCLUDED.expiry_date, is_active = EXCLUDED.is_active, description = EXCLUDED.description`,
          [id, c.code.trim().toUpperCase(), c.title, c.type, Number(c.value), Number(c.maxDiscount || 0), Number(c.minSpend || 0), c.expiryDate, c.isActive !== false, c.description || '']
        )
        return res.status(200).json({ success: true, id })
      }
      if (req.method === 'DELETE') {
        await query(`DELETE FROM coupon_templates WHERE id = $1`, [req.query.id || req.body?.id])
        return res.status(200).json({ success: true })
      }
    }

    // 自動發券規則 CRUD
    if (resource === 'rule') {
      if (req.method === 'POST') {
        const r = req.body
        const id = 'RULE-' + Date.now().toString().slice(-6)
        await query(
          `INSERT INTO auto_dispatch_rules (id, name, target_group, schedule_type, specific_date, coupon_code, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
          [id, r.name, r.targetGroup, r.scheduleType, r.specificDate || null, r.couponCode]
        )
        return res.status(201).json({ success: true, id })
      }
      if (req.method === 'DELETE') {
        await query(`DELETE FROM auto_dispatch_rules WHERE id = $1`, [req.query.id || req.body?.id])
        return res.status(200).json({ success: true })
      }
    }

    // CMS 首頁 Banner CRUD
    if (resource === 'banner') {
      if (req.method === 'POST') {
        const b = req.body
        const { rows } = await query(
          `INSERT INTO cms_banners (tag, title, subtitle, button_text, link_type, link_url, image, sort_order, is_external, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
          [b.tag || '', b.title, b.subtitle || '', b.buttonText || '探索新品', b.linkType || 'category', b.linkUrl, b.image, Number(b.sortOrder || 1), Boolean(b.isExternal), b.isActive !== false]
        )
        return res.status(201).json({ success: true, id: rows[0].id })
      }
      if (req.method === 'PUT') {
        const b = req.body
        await query(
          `UPDATE cms_banners
           SET tag = $2, title = $3, subtitle = $4, button_text = $5, link_type = $6,
               link_url = $7, image = $8, sort_order = $9, is_external = $10, is_active = $11
           WHERE id = $1`,
          [Number(b.id), b.tag || '', b.title, b.subtitle || '', b.buttonText || '探索新品', b.linkType || 'category', b.linkUrl, b.image, Number(b.sortOrder || 1), Boolean(b.isExternal), b.isActive !== false]
        )
        return res.status(200).json({ success: true })
      }
      if (req.method === 'DELETE') {
        await query(`DELETE FROM cms_banners WHERE id = $1`, [Number(req.query.id || req.body?.id)])
        return res.status(200).json({ success: true })
      }
    }

    // CMS 分類樹儲存（整棵主分類取代更新）
    if (resource === 'category' && (req.method === 'POST' || req.method === 'PUT')) {
      const { id, name, subcategories = [] } = req.body
      await withTransaction(async (client) => {
        if (id) {
          await client.query(`DELETE FROM categories WHERE id = $1`, [Number(id)])
        }
        const pRes = await client.query(
          `INSERT INTO categories (parent_id, level, name, sort_order) VALUES (NULL, 1, $1, 1) RETURNING id`,
          [name]
        )
        const primaryId = pRes.rows[0].id
        for (let i = 0; i < subcategories.length; i++) {
          const g = subcategories[i]
          const gRes = await client.query(
            `INSERT INTO categories (parent_id, level, name, sort_order) VALUES ($1, 2, $2, $3) RETURNING id`,
            [primaryId, g.name || '精選分類', i + 1]
          )
          const groupId = gRes.rows[0].id
          for (let j = 0; j < (g.items || []).length; j++) {
            await client.query(
              `INSERT INTO categories (parent_id, level, name, sort_order) VALUES ($1, 3, $2, $3)`,
              [groupId, g.items[j], j + 1]
            )
          }
        }
        await writeAuditLog(client, {
          operator: authUser.name,
          ip: getClientIp(req),
          action: '更新導覽分類樹',
          detail: `更新主分類【${name}】`
        })
      })
      return res.status(200).json({ success: true })
    }

    if (resource === 'category' && req.method === 'DELETE') {
      await query(`DELETE FROM categories WHERE id = $1`, [Number(req.query.id || req.body?.id)])
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}