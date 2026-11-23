import { query, withTransaction, verifyAuth, getClientIp, writeAuditLog } from './_lib/db.js'

export default async function handler(req, res) {
  try {
    const authUser = verifyAuth(req)
    const action = req.query.action || req.body?.action

    // GET：讀取全部商品（含多圖、SKU 明細）與評價
    if (req.method === 'GET') {
      const [prodRes, imgRes, skuRes, revRes] = await Promise.all([
        query(`SELECT * FROM products ORDER BY featured_order ASC, id DESC`),
        query(`SELECT * FROM product_images ORDER BY sort_order ASC, id ASC`),
        query(`SELECT * FROM product_skus ORDER BY sku_id ASC`),
        query(`SELECT * FROM product_reviews ORDER BY created_at DESC`)
      ])

      const imagesMap = {}
      for (const img of imgRes.rows) {
        if (!imagesMap[img.product_id]) imagesMap[img.product_id] = []
        imagesMap[img.product_id].push(img.image_url)
      }

      const skusMap = {}
      for (const s of skuRes.rows) {
        if (!skusMap[s.product_id]) skusMap[s.product_id] = []
        skusMap[s.product_id].push({
          skuId: s.sku_id,
          color: s.color,
          size: s.size,
          stock: Number(s.stock)
        })
      }

      const products = prodRes.rows.map(p => ({
        id: Number(p.id),
        name: p.name,
        category: p.category,
        subcategory: p.subcategory || '',
        price: Number(p.price),
        cost: Number(p.cost),
        salesCount: Number(p.sales_count || 0),
        tag: p.tag || '',
        image: p.cover_image,
        images: imagesMap[p.id]?.length ? imagesMap[p.id] : [p.cover_image],
        description: p.description || '',
        isPublished: p.is_published,
        isHotRanking: p.is_hot_ranking,
        isSeasonalNew: p.is_seasonal_new,
        featuredOrder: Number(p.featured_order || 99),
        skus: skusMap[p.id] || []
      }))

      const reviews = revRes.rows.map(r => ({
        id: r.id,
        orderId: r.order_id,
        productId: Number(r.product_id),
        userName: r.user_name,
        rating: Number(r.rating),
        content: r.content,
        images: Array.isArray(r.images_json) ? r.images_json : [],
        createdAt: r.created_at ? r.created_at.toISOString().slice(0, 16).replace('T', ' ') : ''
      }))

      return res.status(200).json({ success: true, products, reviews })
    }

    // POST：新增商品評價 或 管理員新增商品
    if (req.method === 'POST') {
      if (action === 'add-review') {
        const { orderId, productId, userName, rating, content, images = [] } = req.body
        const revId = 'REV-' + Date.now().toString().slice(-6)
        await withTransaction(async (client) => {
          await client.query(
            `INSERT INTO product_reviews (id, order_id, product_id, user_id, user_name, rating, content, images_json)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
            [revId, orderId || null, Number(productId), authUser?.id || null, userName || authUser?.name || '認證會員', Number(rating || 5), content, JSON.stringify(images)]
          )
          if (orderId) {
            await client.query(
              `UPDATE order_items SET reviewed = TRUE WHERE order_id = $1 AND product_id = $2`,
              [orderId, Number(productId)]
            )
          }
        })
        return res.status(201).json({ success: true, id: revId, message: '評價已成功發布！' })
      }

      if (!authUser || authUser.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: '僅限管理員操作' })
      }

      const p = req.body
      const createdId = await withTransaction(async (client) => {
        const cover = p.image || (Array.isArray(p.images) && p.images[0]) || ''
        const totalStock = (p.skus || []).reduce((sum, s) => sum + Number(s.stock || 0), 0)
        const isPublished = p.isPublished !== false && totalStock > 0

        const { rows } = await client.query(
          `INSERT INTO products (name, category, subcategory, price, cost, tag, cover_image, description, is_published, is_hot_ranking, is_seasonal_new, featured_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
          [p.name, p.category, p.subcategory || null, Number(p.price), Number(p.cost || 0), p.tag || null, cover, p.description || '', isPublished, Boolean(p.isHotRanking), Boolean(p.isSeasonalNew), Number(p.featuredOrder || 99)]
        )
        const newId = rows[0].id

        const imgList = Array.isArray(p.images) && p.images.length ? p.images : [cover]
        for (let i = 0; i < imgList.length; i++) {
          await client.query(
            `INSERT INTO product_images (product_id, image_url, is_cover, sort_order) VALUES ($1, $2, $3, $4)`,
            [newId, imgList[i], i === 0, i]
          )
        }

        for (let i = 0; i < (p.skus || []).length; i++) {
          const s = p.skus[i]
          const skuId = s.skuId || `SKU-${newId}-${Date.now().toString().slice(-3)}${i}`
          await client.query(
            `INSERT INTO product_skus (sku_id, product_id, color, size, stock) VALUES ($1, $2, $3, $4, $5)`,
            [skuId, newId, s.color, s.size, Math.max(0, Number(s.stock || 0))]
          )
        }

        await writeAuditLog(client, {
          operator: authUser.name,
          ip: getClientIp(req),
          action: '新增商品',
          detail: `新增商品【${p.name}】（售價 NT$ ${p.price}，成本 NT$ ${p.cost || 0}）`
        })
        return newId
      })

      return res.status(201).json({ success: true, id: Number(createdId) })
    }

    // PUT：管理員編輯商品、上下架或切換首頁精選
    if (req.method === 'PUT') {
      if (!authUser || authUser.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: '僅限管理員操作' })
      }
      const p = req.body
      const prodId = Number(p.id)

      await withTransaction(async (client) => {
        if (action === 'toggle-featured') {
          const col = p.field === 'isHotRanking' ? 'is_hot_ranking' : 'is_seasonal_new'
          await client.query(`UPDATE products SET ${col} = NOT ${col} WHERE id = $1`, [prodId])
          return
        }

        const cover = p.image || (Array.isArray(p.images) && p.images[0]) || ''
        const totalStock = Array.isArray(p.skus)
          ? p.skus.reduce((sum, s) => sum + Number(s.stock || 0), 0)
          : 1
        const isPublished = p.isPublished !== false && totalStock > 0

        await client.query(
          `UPDATE products
           SET name = $2, category = $3, subcategory = $4, price = $5, cost = $6,
               tag = $7, cover_image = $8, description = $9, is_published = $10,
               is_hot_ranking = COALESCE($11, is_hot_ranking),
               is_seasonal_new = COALESCE($12, is_seasonal_new),
               featured_order = COALESCE($13, featured_order)
           WHERE id = $1`,
          [prodId, p.name, p.category, p.subcategory || null, Number(p.price), Number(p.cost || 0), p.tag || null, cover, p.description || '', isPublished, p.isHotRanking ?? null, p.isSeasonalNew ?? null, p.featuredOrder ?? null]
        )

        if (Array.isArray(p.images)) {
          await client.query(`DELETE FROM product_images WHERE product_id = $1`, [prodId])
          for (let i = 0; i < p.images.length; i++) {
            await client.query(
              `INSERT INTO product_images (product_id, image_url, is_cover, sort_order) VALUES ($1, $2, $3, $4)`,
              [prodId, p.images[i], i === 0, i]
            )
          }
        }

        if (Array.isArray(p.skus)) {
          const incomingIds = p.skus.map(s => s.skuId).filter(Boolean)
          if (incomingIds.length > 0) {
            await client.query(
              `DELETE FROM product_skus WHERE product_id = $1 AND NOT (sku_id = ANY($2::varchar[]))`,
              [prodId, incomingIds]
            )
          }
          for (let i = 0; i < p.skus.length; i++) {
            const s = p.skus[i]
            const skuId = s.skuId || `SKU-${prodId}-${Date.now().toString().slice(-3)}${i}`
            await client.query(
              `INSERT INTO product_skus (sku_id, product_id, color, size, stock)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (sku_id) DO UPDATE
               SET color = EXCLUDED.color, size = EXCLUDED.size, stock = EXCLUDED.stock`,
              [skuId, prodId, s.color, s.size, Math.max(0, Number(s.stock || 0))]
            )
          }
        }

        await writeAuditLog(client, {
          operator: authUser.name,
          ip: getClientIp(req),
          action: '更新商品資料',
          detail: `更新商品 #${prodId}【${p.name}】與規格庫存`
        })
      })

      return res.status(200).json({ success: true, message: '商品已更新' })
    }

    // DELETE：永久刪除商品
    if (req.method === 'DELETE') {
      if (!authUser || authUser.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: '僅限管理員操作' })
      }
      const prodId = Number(req.query.id || req.body?.id)
      await query(`DELETE FROM products WHERE id = $1`, [prodId])
      await writeAuditLog(pool, {
        operator: authUser.name,
        ip: getClientIp(req),
        action: '永久刪除商品',
        detail: `刪除商品 ID #${prodId}`
      })
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}