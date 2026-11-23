import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMarketingStore } from './marketingStore'
import { useCartStore } from './cartStore'
import { useChatStore } from './chatStore'
import { useAdminStore } from './adminStore'
import { apiRequest, getAuthToken, setAuthToken } from '../services/apiClient'
import { showToast } from '../composables/useToast'

const SESSION_DURATION_MS = 15 * 60 * 1000
const TOKEN_REFRESH_INTERVAL_MS = 8 * 60 * 1000
const ACTIVITY_THROTTLE_MS = 30 * 1000

const SESSION_EXPIRES_KEY = 'md_select_session_expires_at'
const TOKEN_ISSUED_AT_KEY = 'md_select_token_issued_at'
const USER_CACHE_KEY = 'md_select_user_cache_v1'

const DEFAULT_USER_STATE = () => ({
  id: '',
  isLoggedIn: false,
  name: '',
  phone: '',
  email: '',
  birthday: '',
  totalSpent: 0,
  vipTierId: 'GENERAL',
  points: 0,
  wishlist: [],
  restockRequests: [],
  riskStatus: 'NORMAL',
  blockReason: '',
  myCoupons: [],
  savedAddresses: []
})

function setSessionExpiry(ttlMs = SESSION_DURATION_MS) {
  try {
    localStorage.setItem(SESSION_EXPIRES_KEY, String(Date.now() + ttlMs))
  } catch {
    // 忽略儲存限制
  }
}

function clearSessionExpiry() {
  try {
    localStorage.removeItem(SESSION_EXPIRES_KEY)
    localStorage.removeItem(TOKEN_ISSUED_AT_KEY)
  } catch {
    // 忽略儲存限制
  }
}

function isSessionExpired() {
  try {
    const raw = localStorage.getItem(SESSION_EXPIRES_KEY)
    if (!raw) return false
    const expiresAt = Number(raw)
    if (!Number.isFinite(expiresAt) || expiresAt <= 0) return false
    return Date.now() >= expiresAt
  } catch {
    return false
  }
}

function setTokenIssuedAt(ts = Date.now()) {
  try {
    localStorage.setItem(TOKEN_ISSUED_AT_KEY, String(ts))
  } catch {
    // 忽略儲存限制
  }
}

function getTokenIssuedAt() {
  try {
    return Number(localStorage.getItem(TOKEN_ISSUED_AT_KEY) || 0)
  } catch {
    return 0
  }
}

function saveUserCache(profile) {
  if (!profile || !profile.id) return
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(profile))
  } catch {
    // 忽略儲存限制
  }
}

function loadUserCache() {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && parsed.id ? parsed : null
  } catch {
    return null
  }
}

function clearUserCache() {
  try {
    localStorage.removeItem(USER_CACHE_KEY)
  } catch {
    // 忽略儲存限制
  }
}

export const useAuthStore = defineStore('auth', () => {
  const marketingStore = useMarketingStore()

  // Store 建立當下即同步讀取本機快取，避免重新整理或路由跳轉時出現「尚未登入」延遲閃爍
  const initialToken = getAuthToken()
  const initialExpired = isSessionExpired()
  const initialCache = initialToken && !initialExpired ? loadUserCache() : null

  if (initialToken && initialExpired) {
    setAuthToken('')
    clearSessionExpiry()
    clearUserCache()
  }

  const user = ref(
    initialCache
      ? { ...DEFAULT_USER_STATE(), ...initialCache, isLoggedIn: true }
      : DEFAULT_USER_STATE()
  )

  const isAdmin = ref(Boolean(initialCache && (initialCache.isAdmin || initialCache.role === 'ADMIN')))
  const memberList = ref([])
  const isSessionInitialized = ref(false)
  let initPromise = null
  let isRefreshingToken = false
  let idleCheckTimer = null
  let activityBound = false
  let lastActivityTouchAt = 0

  const isLoggedIn = computed({
    get: () => Boolean(user.value && user.value.isLoggedIn),
    set: (val) => {
      if (user.value) user.value.isLoggedIn = val
    }
  })

  const isAuthenticated = computed(() => isLoggedIn.value)

  const isCurrentUserBirthdayMonth = computed(() => {
    if (!user.value?.birthday) return false
    const currentMonth = new Date().getMonth() + 1
    const bMonth = Number(user.value.birthday.split('-')[1])
    return currentMonth === bMonth
  })

  const currentVipTier = computed(() => {
    const tierId = user.value?.vipTierId || 'GENERAL'
    return marketingStore.getTierById(tierId)
  })

  const availableUserCoupons = computed(() => {
    return (user.value?.myCoupons || []).filter(c => !c.isUsed)
  })

  const applyUserPayload = (profile) => {
    if (!profile) return
    const nextUser = {
      ...user.value,
      ...profile,
      isLoggedIn: true
    }
    user.value = nextUser
    isAdmin.value = Boolean(profile.isAdmin || profile.role === 'ADMIN')
    saveUserCache(nextUser)
  }

  const clearLocalSession = () => {
    setAuthToken('')
    clearSessionExpiry()
    clearUserCache()
    isAdmin.value = false
    memberList.value = []
    user.value = DEFAULT_USER_STATE()

    const cartStore = useCartStore()
    const chatStore = useChatStore()
    const adminStore = useAdminStore()

    cartStore.items = []
    cartStore.closeDrawer()

    if (typeof chatStore.resetChatState === 'function') {
      chatStore.resetChatState()
    } else {
      chatStore.threads = []
      chatStore.activeUserId = ''
    }

    adminStore.orders = []
    adminStore.stockLogs = []
    adminStore.auditLogs = []
  }

  // 靜默向後端換發新的 15 分鐘 JWT（活躍使用時維持不登出）
  const refreshSessionToken = async () => {
    if (!isLoggedIn.value || !getAuthToken() || isRefreshingToken) return
    isRefreshingToken = true
    try {
      const res = await apiRequest('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'refresh' })
      })
      if (res?.success && res.token) {
        setAuthToken(res.token)
        setTokenIssuedAt(Date.now())
        setSessionExpiry(SESSION_DURATION_MS)
      }
    } catch (err) {
      const msg = String(err?.message || '')
      if (/401|尚未登入|登入已逾期|無效|jwt|expired/i.test(msg)) {
        clearLocalSession()
      }
    } finally {
      isRefreshingToken = false
    }
  }

  // 使用者有操作時：順延 15 分鐘閒置計時，並於需要時靜默更新 JWT
  const recordUserActivity = () => {
    if (!isLoggedIn.value || !getAuthToken()) return
    const now = Date.now()
    if (now - lastActivityTouchAt < ACTIVITY_THROTTLE_MS) return
    lastActivityTouchAt = now

    if (isSessionExpired()) {
      clearLocalSession()
      showToast('您已閒置超過 15 分鐘，系統已自動登出以保護帳號安全。', 'warning', '閒置自動登出')
      return
    }

    setSessionExpiry(SESSION_DURATION_MS)

    const issuedAt = getTokenIssuedAt()
    if (!issuedAt || now - issuedAt >= TOKEN_REFRESH_INTERVAL_MS) {
      refreshSessionToken()
    }
  }

  const startSessionActivityMonitor = () => {
    if (typeof window === 'undefined') return

    if (!activityBound) {
      activityBound = true
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
      events.forEach((evt) => {
        window.addEventListener(evt, recordUserActivity, { passive: true })
      })
      window.addEventListener('storage', (e) => {
        if (e.key === USER_CACHE_KEY && !e.newValue && isLoggedIn.value) {
          clearLocalSession()
        }
      })
    }

    if (!idleCheckTimer) {
      idleCheckTimer = window.setInterval(() => {
        if (!isLoggedIn.value || !getAuthToken()) return
        if (isSessionExpired()) {
          clearLocalSession()
          showToast('您已閒置超過 15 分鐘，系統已自動登出以保護帳號安全。', 'warning', '閒置自動登出')
        }
      }, 15000)
    }
  }

  startSessionActivityMonitor()

  const initSession = async (forceRefresh = false) => {
    if (!getAuthToken()) {
      clearLocalSession()
      isSessionInitialized.value = true
      return false
    }

    if (isSessionExpired()) {
      clearLocalSession()
      isSessionInitialized.value = true
      return false
    }

    // 若本次網頁生命週期已驗證過且非強制重刷，直接沿用記憶體中的登入狀態，不在頁面切換時重跑
    if (isSessionInitialized.value && isLoggedIn.value && !forceRefresh) {
      return true
    }

    if (initPromise && !forceRefresh) {
      return initPromise
    }

    const cached = loadUserCache()
    const hasCached = Boolean(cached)
    if (hasCached && !isLoggedIn.value) {
      user.value = {
        ...user.value,
        ...cached,
        isLoggedIn: true
      }
      isAdmin.value = Boolean(cached.isAdmin || cached.role === 'ADMIN')
    }

    initPromise = (async () => {
      try {
        const res = await apiRequest('/api/auth')
        if (res.success && res.user) {
          applyUserPayload(res.user)
          setSessionExpiry(SESSION_DURATION_MS)
          // 頁面重整時順便續期一次 JWT，確保接下來的操作有完整 15 分鐘效期
          refreshSessionToken()
          isSessionInitialized.value = true
          if (isAdmin.value) fetchMemberList()
          return true
        }
        clearLocalSession()
        isSessionInitialized.value = true
        return false
      } catch (err) {
        const msg = String(err?.message || '')
        const isAuthInvalid = /401|尚未登入|登入已逾期|無效|jwt|expired/i.test(msg)
        if (isAuthInvalid || !hasCached) {
          clearLocalSession()
          isSessionInitialized.value = true
          return false
        }
        isSessionInitialized.value = true
        return true
      } finally {
        initPromise = null
      }
    })()

    return initPromise
  }

  const fetchMemberList = async () => {
    if (!isAdmin.value) return
    try {
      const res = await apiRequest('/api/auth?action=members')
      if (res.success) memberList.value = res.members || []
    } catch (err) {
      console.warn('[authStore] 無法載入會員名冊:', err.message)
    }
  }

  const login = async (loginData = {}) => {
    try {
      const action = loginData.isRegister ? 'register' : 'login'
      const res = await apiRequest('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action, ...loginData })
      })
      if (res.success && res.token) {
        const now = Date.now()
        setAuthToken(res.token)
        setTokenIssuedAt(now)
        setSessionExpiry(SESSION_DURATION_MS)
        lastActivityTouchAt = now
        isSessionInitialized.value = true
        applyUserPayload(res.user)
        if (isAdmin.value) fetchMemberList()
        return true
      }
      return false
    } catch (err) {
      showToast(err.message || '登入失敗，請確認帳號與密碼', 'error', '登入失敗')
      return false
    }
  }

  const logout = () => {
    isSessionInitialized.value = false
    clearLocalSession()
  }

  const updateProfile = async (profileData = {}) => {
    Object.assign(user.value, profileData)
    saveUserCache(user.value)
    try {
      const res = await apiRequest('/api/auth', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      })
      if (res.success && res.user) applyUserPayload(res.user)
    } catch (err) {
      console.error('更新個人資料失敗:', err)
    }
  }

  const adminUpdateMemberInfo = async (memberId, payload) => {
    const target = memberList.value.find(m => m.id === memberId)
    if (target) Object.assign(target, payload)
    try {
      await apiRequest('/api/auth', {
        method: 'PUT',
        body: JSON.stringify({ action: 'admin-update-member', memberId, ...payload })
      })
      await fetchMemberList()
      return { success: true, message: '已更新會員資料並寫入資料庫' }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  const updateMemberTier = async (memberId, newTierId) => {
    return adminUpdateMemberInfo(memberId, { vipTierId: newTierId })
  }

  const updateMemberRisk = async (memberId, { riskStatus, notes }) => {
    return adminUpdateMemberInfo(memberId, { riskStatus, notes })
  }

  const claimCouponByCode = async (code, sourceLabel = '輸入優惠碼領取') => {
    if (!user.value?.isLoggedIn) {
      return { success: false, message: '請先登入會員帳號再領取優惠券！' }
    }
    try {
      const res = await apiRequest('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'claim-coupon', code, source: sourceLabel })
      })
      if (res.success && res.user) applyUserPayload(res.user)
      return { success: res.success, message: res.message }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  const markCouponAsUsed = (instanceId) => {
    const cpn = user.value?.myCoupons?.find(c => c.instanceId === instanceId)
    if (cpn) {
      cpn.isUsed = true
      saveUserCache(user.value)
    }
  }

  const dispatchCouponToMembers = async ({ couponCode, targetGroup, sourceName = '系統活動派發' }) => {
    try {
      const res = await apiRequest('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'dispatch-coupons', couponCode, targetGroup, sourceName })
      })
      await initSession(true)
      return res
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  const isInWishlist = (productId) => Boolean(user.value?.wishlist?.includes(Number(productId)))

  const toggleWishlist = (productId) => {
    if (!user.value?.isLoggedIn) {
      return {
        success: false,
        requiresLogin: true,
        added: false,
        message: '請先登入會員以使用收藏功能'
      }
    }

    const id = Number(productId)
    const index = user.value.wishlist.indexOf(id)
    const added = index === -1
    if (added) user.value.wishlist.push(id)
    else user.value.wishlist.splice(index, 1)
    saveUserCache(user.value)

    apiRequest('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle-wishlist', productId: id })
    }).catch(err => console.error('同步收藏清單失敗:', err))

    return {
      success: true,
      requiresLogin: false,
      added,
      message: added ? '已加入愛心收藏清單！' : '已從收藏清單移除'
    }
  }

  const registerRestockAlert = async (product, sku, form) => {
    try {
      const res = await apiRequest('/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'restock-alert',
          productId: product.id,
          skuId: sku?.skuId || null,
          email: form.email,
          phone: form.phone
        })
      })
      return res
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  const addAddress = async (address) => {
    try {
      const res = await apiRequest('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'add-address', ...address })
      })
      if (res.success) await initSession(true)
    } catch (err) {
      console.error('新增地址失敗:', err)
    }
  }

  const removeAddress = async (addressId) => {
    user.value.savedAddresses = user.value.savedAddresses.filter(a => a.id !== addressId)
    saveUserCache(user.value)
    apiRequest(`/api/auth?action=remove-address&id=${addressId}`, {
      method: 'DELETE'
    }).catch(err => console.error('刪除地址失敗:', err))
  }

  const checkCheckoutEligibility = (paymentMethod) => {
    const status = user.value?.riskStatus || 'NORMAL'
    if (status === 'BANNED') return { allowed: false, reason: '您的帳號已被系統安全凍結，無法使用結帳功能。' }
    if (status === 'BLOCK_ORDER') return { allowed: false, reason: '此帳號目前暫停下單權限，請聯繫客服。' }
    if (status === 'RESTRICT_COD' && (paymentMethod === 'COD' || paymentMethod === 'CVS_COD')) {
      return { allowed: false, reason: '本帳號暫停貨到付款，請改用 LINE Pay 線上支付。' }
    }
    return { allowed: true }
  }

  return {
    user,
    isAdmin,
    isLoggedIn,
    isAuthenticated,
    isCurrentUserBirthdayMonth,
    currentVipTier,
    availableUserCoupons,
    memberList,
    initSession,
    fetchMemberList,
    claimCouponByCode,
    markCouponAsUsed,
    dispatchCouponToMembers,
    login,
    logout,
    updateProfile,
    adminUpdateMemberInfo,
    updateMemberTier,
    isInWishlist,
    toggleWishlist,
    registerRestockAlert,
    addAddress,
    removeAddress,
    updateMemberRisk,
    checkCheckoutEligibility
  }
})

export default useAuthStore