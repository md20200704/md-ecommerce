import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useChatStore = defineStore('chat', () => {
  const threads = ref([
    {
      userId: 'USER-001',
      userName: '陳哲偉',
      userEmail: 'david860318@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      lastMessage: '請問這款燕麥白針織開襟衫 S 號還有現貨嗎？',
      lastTime: '10:42',
      unreadCount: 1,
      status: 'PENDING', // PENDING, PROCESSING, RESOLVED
      messages: [
        { id: 1, sender: 'user', text: '請問這款燕麥白針織開襟衫 S 號還有現貨嗎？', time: '10:42', image: null }
      ]
    },
    {
      userId: 'USER-002',
      userName: '林小美',
      userEmail: 'mi.lin@example.com',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      lastMessage: '已收到商品，版型非常好看！謝謝賣家',
      lastTime: '昨天',
      unreadCount: 0,
      status: 'RESOLVED',
      messages: [
        { id: 1, sender: 'user', text: '請問出貨後大約幾天會到超商？', time: '昨天 14:10', image: null },
        { id: 2, sender: 'admin', text: '您好，正常寄出後約 2-3 個工作天會送達指定門市喔！', time: '昨天 14:15', image: null },
        { id: 3, sender: 'user', text: '已收到商品，版型非常好看！謝謝賣家', time: '昨天 18:20', image: null }
      ]
    }
  ])

  const activeUserId = ref('USER-001')

  const activeThread = computed(() => {
    return threads.value.find(t => t.userId === activeUserId.value) || threads.value[0]
  })

  const totalUnreadCount = computed(() => {
    return threads.value.reduce((sum, t) => sum + (t.unreadCount || 0), 0)
  })

  // 支援純文字、純圖片或圖文同時發送
  const sendMessage = (userId, text = '', sender = 'user', image = null) => {
    const cleanText = (text || '').trim()
    if (!cleanText && !image) return

    let thread = threads.value.find(t => t.userId === userId)
    const summaryText = cleanText || '📷 [圖片訊息]'

    if (!thread) {
      thread = {
        userId,
        userName: '訪客會員',
        userEmail: 'guest@example.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        lastMessage: summaryText,
        lastTime: '剛剛',
        unreadCount: sender === 'user' ? 1 : 0,
        status: 'PENDING',
        messages: []
      }
      threads.value.unshift(thread)
    }

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    thread.messages.push({
      id: Date.now() + Math.random(),
      sender,
      text: cleanText,
      time: timeStr,
      image
    })

    thread.lastMessage = summaryText
    thread.lastTime = timeStr

    if (sender === 'user') {
      thread.unreadCount += 1
      thread.status = 'PENDING'
    } else {
      thread.status = 'PROCESSING'
    }
  }

  const markAsRead = (userId) => {
    const thread = threads.value.find(t => t.userId === userId)
    if (thread) {
      thread.unreadCount = 0
    }
  }

  const updateThreadStatus = (userId, newStatus) => {
    const thread = threads.value.find(t => t.userId === userId)
    if (thread) {
      thread.status = newStatus
    }
  }

  return {
    threads,
    activeUserId,
    activeThread,
    totalUnreadCount,
    sendMessage,
    markAsRead,
    updateThreadStatus
  }
})