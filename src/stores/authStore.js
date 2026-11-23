import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMarketingStore } from './marketingStore'
import { apiRequest, getAuthToken, setAuthToken } from '../services/apiClient'

export const useAuthStore = defineStore('auth', () => {
  const marketingStore = useMarketingStore()

  const user = ref({
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

  const isAdmin = ref(false)
  const memberList = ref([])

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
    user.value = {
      ...user.value,
      ...profile,
      isLoggedIn: true
    }
    isAdmin.value = Boolean(profile.isAdmin || profile.role === 'ADMIN')
  }

  // 啟動 App 時還原 JWT 登入狀態
  const initSession = async () => {
    if (!getAuthToken()) return false
    try {
      const res = await apiRequest('/api/auth')
      if (res.success && res.user) {
        applyUserPayload(res.user)
        if (isAdmin.value) fetchMemberList()
        return true
      }
    } catch {
      setAuthToken('')
      user.value.isLoggedIn = false
      isAdmin.value = false
    }
    return false
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
        setAuthToken(res.token)
        applyUserPayload(res.user)
        if (isAdmin.value) fetchMemberList()
        return true
      }
      return false
    } catch (err) {
      alert(err.message || '登入失敗，請確認帳號與密碼')
      return false
    }
  }

  const logout = () => {
    setAuthToken('')
    isAdmin.value = false
    user.value = {
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
    }
  }

  const updateProfile = async (profileData = {}) => {
    Object.assign(user.value, profileData)
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
      return { success: true, message: `已更新會員資料並寫入資料庫` }
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
    if (cpn) cpn.isUsed = true
  }

  const dispatchCouponToMembers = async ({ couponCode, targetGroup, sourceName = '系統活動派發' }) => {
    try {
      const res = await apiRequest('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'dispatch-coupons', couponCode, targetGroup, sourceName })
      })
      await initSession()
      return res
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  const isInWishlist = (productId) => Boolean(user.value?.wishlist?.includes(Number(productId)))

  const toggleWishlist = (productId) => {
    if (!user.value.isLoggedIn) {
      return { added: false, message: '請先登入會員以使用收藏功能' }
    }
    const id = Number(productId)
    const index = user.value.wishlist.indexOf(id)
    const added = index === -1
    if (added) user.value.wishlist.push(id)
    else user.value.wishlist.splice(index, 1)

    apiRequest('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle-wishlist', productId: id })
    }).catch(err => console.error('同步收藏清單失敗:', err))

    return { added, message: added ? '已加入愛心收藏清單！' : '已從收藏清單移除' }
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
      if (res.success) await initSession()
    } catch (err) {
      console.error('新增地址失敗:', err)
    }
  }

  const removeAddress = async (addressId) => {
    user.value.savedAddresses = user.value.savedAddresses.filter(a => a.id !== addressId)
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