import { query, verifyAuth } from './_lib/db.js'

export default async function handler(req, res) {
  try {
    const authUser = verifyAuth(req)
    if (!authUser) {
      return res.status(401).json({ success: false, message: '請先登入會員' })
    }

    if (req.method === 'GET') {
      const { rows } = await query(
        `SELECT c.cart_item_id, c.product_id, c.sku_id, c.color, c.size, c.quantity, c.selected,
                p.name, p.price, p.cover_image
         FROM cart_items c
         JOIN products p ON p.id = c.product_id
         WHERE c.user_id = $1
         ORDER BY c.updated_at DESC`,
        [authUser.id]
      )
      return res.status(200).json({
        success: true,
        items: rows.map(r => ({
          id: Number(r.product_id),
          cartItemId: r.cart_item_id,
          skuId: r.sku_id,
          name: r.name,
          price: Number(r.price),
          color: r.color,
          size: r.size,
          quantity: Number(r.quantity),
          image: r.cover_image,
          selected: r.selected
        }))
      })
    }

    if (req.method === 'POST') {
      const { productId, skuId, color, size, quantity = 1 } = req.body
      const cartItemId = `${productId}-${color}-${size}`
      await query(
        `INSERT INTO cart_items (cart_item_id, user_id, product_id, sku_id, color, size, quantity, selected)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
         ON CONFLICT (user_id, cart_item_id) DO UPDATE
         SET quantity = cart_items.quantity + EXCLUDED.quantity, selected = TRUE`,
        [cartItemId, authUser.id, Number(productId), skuId || null, color, size, Math.max(1, Number(quantity))]
      )
      return res.status(200).json({ success: true })
    }

    if (req.method === 'PUT') {
      const { cartItemId, quantity, selected, selectAll } = req.body
      if (typeof selectAll === 'boolean') {
        await query(`UPDATE cart_items SET selected = $2 WHERE user_id = $1`, [authUser.id, selectAll])
      } else {
        await query(
          `UPDATE cart_items
           SET quantity = COALESCE($3, quantity), selected = COALESCE($4, selected)
           WHERE user_id = $1 AND cart_item_id = $2`,
          [authUser.id, cartItemId, quantity ?? null, selected ?? null]
        )
      }
      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      const cartItemId = req.query.cartItemId || req.body?.cartItemId
      await query(`DELETE FROM cart_items WHERE user_id = $1 AND cart_item_id = $2`, [authUser.id, cartItemId])
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}