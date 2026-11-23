import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiRequest, getAuthToken } from '../services/apiClient'

export const useChatStore = defineStore('chat', () => {
  const threads = ref([])
  const activeUserId = ref('')

  const activeThread = computed(() => {
    return (
      threads.value.find(t => t.userId === activeUserId.value) ||
      threads.value[0] || {
        userId: '',
        userName: '線上客服',
        userEmail: '',
        avatar: '',
        status: 'PENDING',
        messages: []
      }
    )
  })

  const totalUnreadCount = computed(() => {
    return threads.value.reduce((sum, t) => sum + (t.unreadCount || 0), 0)
  })

  const fetchThreads = async () => {
    if (!getAuthToken()) return
    try {
      const res = await apiRequest('/api/chat')
      if (res.success && Array.isArray(res.threads)) {
        threads.value = res.threads
        if (!activeUserId.value && res.threads.length > 0) {
          activeUserId.value = res.threads[0].userId
        }
      }
    } catch (err) {
      console.warn('[chatStore] 載入客服對話失敗:', err.message)
    }
  }

  const sendMessage = async (userId, text = '', sender = 'user', image = null) => {
    const cleanText = (text || '').trim()
    if (!cleanText && !image) return

    try {
      const res = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ userId, text: cleanText, sender, image })
      })
      if (res.success) {
        await fetchThreads()
      }
    } catch (err) {
      console.error('發送客服訊息失敗:', err)
    }
  }

  const markAsRead = async (userId) => {
    const thread = threads.value.find(t => t.userId === userId)
    if (thread) thread.unreadCount = 0
    apiRequest('/api/chat', {
      method: 'PUT',
      body: JSON.stringify({ action: 'mark-read', userId })
    }).catch(() => {})
  }

  const updateThreadStatus = async (userId, newStatus) => {
    const thread = threads.value.find(t => t.userId === userId)
    if (thread) thread.status = newStatus
    apiRequest('/api/chat', {
      method: 'PUT',
      body: JSON.stringify({ userId, status: newStatus })
    }).catch(() => {})
  }

  return {
    threads,
    activeUserId,
    activeThread,
    totalUnreadCount,
    fetchThreads,
    sendMessage,
    markAsRead,
    updateThreadStatus
  }
})