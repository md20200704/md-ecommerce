import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiRequest, getAuthToken } from '../services/apiClient'
import { useAuthStore } from './authStore'

const READ_STORAGE_KEY = 'md_select_cs_customer_read_v1'
const POLL_INTERVAL_MS = 3500

function loadReadMap() {
  try {
    return JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveReadMap(map) {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // 忽略儲存限制
  }
}

export const useChatStore = defineStore('chat', () => {
  const threads = ref([])
  const activeUserId = ref('')
  const lastReadAdminMsgIdByUser = ref(loadReadMap())
  let pollTimer = null

  const buildEmptyThread = (authStore) => ({
    userId: authStore.user?.id || '',
    userName: authStore.user?.name || '線上客服',
    userEmail: authStore.user?.email || '',
    avatar: authStore.user?.avatar || '',
    status: 'PENDING',
    unreadCount: 0,
    lastMessage: '',
    lastTime: '',
    messages: []
  })

  const activeThread = computed(() => {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn || !authStore.user?.id) {
      return buildEmptyThread(authStore)
    }

    if (!authStore.isAdmin) {
      const ownThread = threads.value.find(t => t.userId === authStore.user.id)
      return ownThread || buildEmptyThread(authStore)
    }

    return (
      threads.value.find(t => t.userId === activeUserId.value) ||
      threads.value[0] ||
      buildEmptyThread(authStore)
    )
  })

  // 消費者未讀數：統計該會員對話串中、客服 ('admin') 發送且大於已讀訊息 ID 的則數
  const customerUnreadCount = computed(() => {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn || !authStore.user?.id || authStore.isAdmin) return 0

    const ownThread = threads.value.find(t => t.userId === authStore.user.id)
    if (!ownThread || !Array.isArray(ownThread.messages)) return 0

    const lastReadId = Number(lastReadAdminMsgIdByUser.value[authStore.user.id] || 0)
    return ownThread.messages.filter(
      m => m.sender === 'admin' && Number(m.id || 0) > lastReadId
    ).length
  })

  // 後台管理員未讀數：加總所有客戶未回覆的未讀數
  const adminUnreadCount = computed(() => {
    const authStore = useAuthStore()
    if (!authStore.isAdmin) return 0
    return threads.value.reduce((sum, t) => sum + Number(t.unreadCount || 0), 0)
  })

  const totalUnreadCount = computed(() => {
    const authStore = useAuthStore()
    return authStore.isAdmin ? adminUnreadCount.value : customerUnreadCount.value
  })

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const resetChatState = () => {
    stopPolling()
    threads.value = []
    activeUserId.value = ''
  }

  const fetchThreads = async () => {
    const authStore = useAuthStore()
    if (!getAuthToken() || !authStore.isLoggedIn || !authStore.user?.id) {
      resetChatState()
      return
    }

    try {
      const res = await apiRequest('/api/chat')
      if (res.success && Array.isArray(res.threads)) {
        if (!authStore.isAdmin) {
          threads.value = res.threads.filter(t => t.userId === authStore.user.id)
          activeUserId.value = authStore.user.id
        } else {
          threads.value = res.threads
          const exists = threads.value.some(t => t.userId === activeUserId.value)
          if (!exists) {
            activeUserId.value = threads.value[0]?.userId || ''
          }
        }
      }
    } catch (err) {
      console.warn('[chatStore] 載入客服對話失敗:', err.message)
    }
  }

  const startPolling = () => {
    stopPolling()
    const authStore = useAuthStore()
    if (!getAuthToken() || !authStore.isLoggedIn) return
    pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchThreads()
      }
    }, POLL_INTERVAL_MS)
  }

  const appendMessageLocally = (
    targetUserId,
    msgObj,
    unreadCountFromServer = null,
    isAutoReply = false
  ) => {
    const authStore = useAuthStore()
    let thread = threads.value.find(t => t.userId === targetUserId)

    if (!thread) {
      thread = {
        userId: targetUserId,
        userName: authStore.user?.name || targetUserId,
        userEmail: authStore.user?.email || '',
        avatar: authStore.user?.avatar || '',
        status: msgObj.sender === 'user' ? 'PENDING' : 'PROCESSING',
        unreadCount: msgObj.sender === 'user' ? 1 : 0,
        lastMessage: msgObj.text || '📷 [圖片訊息]',
        lastTime: msgObj.time,
        messages: []
      }
      threads.value = [thread, ...threads.value]
    } else {
      const alreadyExists = (thread.messages || []).some(m => Number(m.id) === Number(msgObj.id))
      if (!alreadyExists) {
        thread.messages = [...(thread.messages || []), msgObj]
      }
      thread.lastMessage = msgObj.text || '📷 [圖片訊息]'
      thread.lastTime = msgObj.time
      if (typeof unreadCountFromServer === 'number') {
        thread.unreadCount = unreadCountFromServer
      } else if (msgObj.sender === 'admin' && !isAutoReply) {
        thread.unreadCount = 0
      } else if (msgObj.sender === 'user') {
        thread.unreadCount = Number(thread.unreadCount || 0) + 1
      }
      if (msgObj.sender === 'user') {
        thread.status = 'PENDING'
      } else if (!isAutoReply) {
        thread.status = 'PROCESSING'
      }
    }

    if (authStore.isAdmin && !activeUserId.value) {
      activeUserId.value = targetUserId
    }
  }

  const sendMessage = async (
    userId,
    text = '',
    sender = 'user',
    image = null,
    isAutoReply = false
  ) => {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn || !authStore.user?.id) return null

    const cleanText = String(text || '').trim()
    if (!cleanText && !image) return null

    const targetUserId = authStore.isAdmin ? (userId || activeUserId.value) : authStore.user.id
    const canSendAdmin = authStore.isAdmin || (sender === 'admin' && Boolean(isAutoReply))
    const normalizedSender = canSendAdmin && sender === 'admin' ? 'admin' : 'user'
    const autoFlag = normalizedSender === 'admin' && Boolean(isAutoReply)
    if (!targetUserId) return null

    try {
      const res = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          userId: targetUserId,
          text: cleanText,
          sender: normalizedSender,
          image,
          isAutoReply: autoFlag
        })
      })
      if (res.success && res.message) {
        appendMessageLocally(targetUserId, res.message, res.unreadCount, autoFlag)
        return res.message
      }
    } catch (err) {
      console.error('發送客服訊息失敗:', err)
    }
    return null
  }

  // 消費者標記目前已存在的客服回覆已讀
  const markCustomerAsRead = (userId) => {
    const authStore = useAuthStore()
    const targetId = userId || authStore.user?.id
    if (!targetId) return

    const ownThread = threads.value.find(t => t.userId === targetId)
    const msgs = Array.isArray(ownThread?.messages) ? ownThread.messages : []
    const maxAdminId = msgs
      .filter(m => m.sender === 'admin')
      .reduce((max, m) => Math.max(max, Number(m.id || 0)), 0)

    const currentMax = Number(lastReadAdminMsgIdByUser.value[targetId] || 0)
    if (maxAdminId > currentMax) {
      lastReadAdminMsgIdByUser.value = {
        ...lastReadAdminMsgIdByUser.value,
        [targetId]: maxAdminId
      }
      saveReadMap(lastReadAdminMsgIdByUser.value)
    }
  }

  // 後台標記某位客戶對話已讀
  const markAsRead = async (userId) => {
    const authStore = useAuthStore()
    if (!authStore.isAdmin) {
      markCustomerAsRead(userId)
      return
    }
    const targetId = userId || activeThread.value?.userId
    if (!targetId) return

    const thread = threads.value.find(t => t.userId === targetId)
    if (thread) thread.unreadCount = 0

    try {
      await apiRequest('/api/chat', {
        method: 'PUT',
        body: JSON.stringify({ action: 'mark-read', userId: targetId })
      })
    } catch {
      // 忽略背景已讀同步錯誤
    }
  }

  const updateThreadStatus = async (userId, newStatus) => {
    const thread = threads.value.find(t => t.userId === userId)
    if (thread) thread.status = newStatus

    try {
      await apiRequest('/api/chat', {
        method: 'PUT',
        body: JSON.stringify({ userId, status: newStatus })
      })
    } catch {
      // 忽略狀態更新錯誤
    }
  }

  return {
    threads,
    activeUserId,
    activeThread,
    customerUnreadCount,
    adminUnreadCount,
    totalUnreadCount,
    resetChatState,
    fetchThreads,
    startPolling,
    stopPolling,
    sendMessage,
    markCustomerAsRead,
    markAsRead,
    updateThreadStatus
  }
})