import { query, withTransaction, verifyAuth } from './_lib/db.js'

function handleCors(req, res) {
  const origin = req.headers?.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  try {
    const authUser = verifyAuth(req)
    if (!authUser) {
      return res.status(401).json({ success: false, message: '尚未登入或登入已逾期' })
    }

    const action = req.query?.action || req.body?.action
    const isAdmin = authUser.role === 'ADMIN'

    // GET：取得對話列表與訊息明細（非管理員嚴格限縮為自己的 user_id）
    if (req.method === 'GET') {
      const requestedUserId = req.query?.userId
      const targetUserId = isAdmin && requestedUserId ? requestedUserId : authUser.id

      const threadsRes = isAdmin && !requestedUserId
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
      const { userId, text = '', sender = 'user', image = null, isAutoReply = false } = req.body || {}
      const cleanText = String(text || '').trim()

      // 允許一般會員在自己的對話串觸發系統自動回覆（sender='admin' 且 isAutoReply=true）
      const canSendAdmin = isAdmin || (sender === 'admin' && Boolean(isAutoReply))
      const targetUserId = isAdmin ? (userId || authUser.id) : authUser.id
      const normalizedSender = canSendAdmin && sender === 'admin' ? 'admin' : 'user'
      const autoReplyFlag = normalizedSender === 'admin' && Boolean(isAutoReply)

      if (!targetUserId || (!cleanText && !image)) {
        return res.status(400).json({ success: false, message: '缺少對話對象或訊息內容' })
      }

      const now = new Date()
      const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const summary = cleanText || '📷 [圖片訊息]'

      const result = await withTransaction(async (client) => {
        const uRes = await client.query(
          `SELECT id, name, email, avatar FROM users WHERE id = $1 LIMIT 1`,
          [targetUserId]
        )
        const u = uRes.rows[0] || {
          id: targetUserId,
          name: authUser.name || '會員',
          email: authUser.email || '',
          avatar: null
        }

        const initialUnread = normalizedSender === 'user' ? 1 : 0
        const initialStatus = normalizedSender === 'user' ? 'PENDING' : 'PROCESSING'

        // 規則：
        // 1. 消費者發送（user）：後台未讀 +1，狀態 PENDING
        // 2. 系統自動回覆（admin + autoReplyFlag）：保留後台未讀數不歸零，狀態維持 PENDING
        // 3. 真實商家回覆（admin 且非自動回覆）：後台未讀歸 0，狀態 PROCESSING
        const threadRes = await client.query(
          `INSERT INTO chat_threads (user_id, user_name, user_email, avatar, last_message, last_time, unread_count, status, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (user_id) DO UPDATE
           SET user_name = EXCLUDED.user_name,
               user_email = EXCLUDED.user_email,
               avatar = COALESCE(EXCLUDED.avatar, chat_threads.avatar),
               last_message = EXCLUDED.last_message,
               last_time = EXCLUDED.last_time,
               unread_count = CASE
                 WHEN $9 = 'user' THEN chat_threads.unread_count + 1
                 WHEN $10 = TRUE THEN chat_threads.unread_count
                 ELSE 0
               END,
               status = CASE
                 WHEN $9 = 'user' THEN 'PENDING'
                 WHEN $10 = TRUE THEN chat_threads.status
                 ELSE 'PROCESSING'
               END,
               updated_at = NOW()
           RETURNING *`,
          [
            targetUserId,
            u.name,
            u.email,
            u.avatar,
            summary,
            timeLabel,
            initialUnread,
            initialStatus,
            normalizedSender,
            autoReplyFlag
          ]
        )

        const mRes = await client.query(
          `INSERT INTO chat_messages (thread_user_id, sender, text, image, time_label)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [targetUserId, normalizedSender, cleanText, image, timeLabel]
        )
        return {
          message: mRes.rows[0],
          thread: threadRes.rows[0]
        }
      })

      return res.status(201).json({
        success: true,
        unreadCount: Number(result.thread?.unread_count || 0),
        message: {
          id: Number(result.message.id),
          sender: result.message.sender,
          text: result.message.text || '',
          image: result.message.image || null,
          time: result.message.time_label
        }
      })
    }

    // PUT：標記已讀或更新客服單狀態
    if (req.method === 'PUT') {
      const { userId, status } = req.body || {}
      const targetUserId = isAdmin ? (userId || authUser.id) : authUser.id

      if (!targetUserId) {
        return res.status(400).json({ success: false, message: '缺少對話對象編號' })
      }

      if (action === 'mark-read') {
        await query(`UPDATE chat_threads SET unread_count = 0 WHERE user_id = $1`, [targetUserId])
        return res.status(200).json({ success: true })
      }

      if (status && isAdmin) {
        await query(`UPDATE chat_threads SET status = $2, updated_at = NOW() WHERE user_id = $1`, [targetUserId, status])
        return res.status(200).json({ success: true })
      }
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}