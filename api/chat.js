import { query, withTransaction, verifyAuth } from './_lib/db.js'

export default async function handler(req, res) {
  try {
    const authUser = verifyAuth(req)
    const action = req.query.action || req.body?.action

    // GET：取得對話列表與訊息明細
    if (req.method === 'GET') {
      const isAdmin = authUser?.role === 'ADMIN'
      const targetUserId = req.query.userId || authUser?.id

      const threadsRes = isAdmin
        ? await query(`SELECT * FROM chat_threads ORDER BY updated_at DESC`)
        : await query(`SELECT * FROM chat_threads WHERE user_id = $1`, [targetUserId])

      const userIds = threadsRes.rows.map(t => t.user_id)
      let msgMap = {}

      if (userIds.length > 0) {
        const msgsRes = await query(
          `SELECT * FROM chat_messages WHERE thread_user_id = ANY($1::varchar[]) ORDER BY created_at ASC`,
          [userIds]
        )
        for (const m of msgsRes.rows) {
          if (!msgMap[m.thread_user_id]) msgMap[m.thread_user_id] = []
          msgMap[m.thread_user_id].push({
            id: Number(m.id),
            sender: m.sender,
            text: m.text || '',
            image: m.image || null,
            time: m.time_label
          })
        }
      }

      const threads = threadsRes.rows.map(t => ({
        userId: t.user_id,
        userName: t.user_name,
        userEmail: t.user_email,
        avatar: t.avatar,
        lastMessage: t.last_message || '',
        lastTime: t.last_time || '',
        unreadCount: Number(t.unread_count || 0),
        status: t.status,
        messages: msgMap[t.user_id] || []
      }))

      return res.status(200).json({ success: true, threads })
    }

    // POST：發送文字或圖片訊息
    if (req.method === 'POST') {
      const { userId, text = '', sender = 'user', image = null } = req.body
      const targetUserId = userId || authUser?.id
      if (!targetUserId || (!text.trim() && !image)) {
        return res.status(400).json({ success: false, message: '缺少對話對象或訊息內容' })
      }

      const now = new Date()
      const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const summary = text.trim() || '📷 [圖片訊息]'

      const message = await withTransaction(async (client) => {
        const uRes = await client.query(`SELECT name, email, avatar FROM users WHERE id = $1`, [targetUserId])
        const u = uRes.rows[0] || { name: '訪客會員', email: 'guest@example.com', avatar: null }

        await client.query(
          `INSERT INTO chat_threads (user_id, user_name, user_email, avatar, last_message, last_time, unread_count, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (user_id) DO UPDATE
           SET last_message = EXCLUDED.last_message,
               last_time = EXCLUDED.last_time,
               unread_count = CASE WHEN $9 = 'user' THEN chat_threads.unread_count + 1 ELSE chat_threads.unread_count END,
               status = CASE WHEN $9 = 'user' THEN 'PENDING' ELSE 'PROCESSING' END`,
          [targetUserId, u.name, u.email, u.avatar, summary, timeLabel, sender === 'user' ? 1 : 0, sender === 'user' ? 'PENDING' : 'PROCESSING', sender]
        )

        const mRes = await client.query(
          `INSERT INTO chat_messages (thread_user_id, sender, text, image, time_label)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [targetUserId, sender, text.trim(), image, timeLabel]
        )
        return mRes.rows[0]
      })

      return res.status(201).json({
        success: true,
        message: {
          id: Number(message.id),
          sender: message.sender,
          text: message.text || '',
          image: message.image || null,
          time: message.time_label
        }
      })
    }

    // PUT：標記已讀或更新客服單狀態
    if (req.method === 'PUT') {
      const { userId, status } = req.body
      if (action === 'mark-read') {
        await query(`UPDATE chat_threads SET unread_count = 0 WHERE user_id = $1`, [userId])
        return res.status(200).json({ success: true })
      }
      if (status) {
        await query(`UPDATE chat_threads SET status = $2 WHERE user_id = $1`, [userId, status])
        return res.status(200).json({ success: true })
      }
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}