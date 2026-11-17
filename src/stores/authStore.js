import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMarketingStore } from './marketingStore'

export const useAuthStore = defineStore('auth', () => {
  const marketingStore = useMarketingStore()

  // 1. 會員個人資料狀態
  const user = ref({
    isLoggedIn: true,
    name: '陳哲偉',
    phone: '0912345678',
    email: 'user@md-korea.com',
    birthday: '1997-03-18',
    totalSpent: 14850,
    vipTierId: 'GOLD',
    points: 1250,
    wishlist: [1, 2],
    restockRequests: [],
    riskStatus: 'NORMAL',
    blockReason: '',
    myCoupons: [
      {
        instanceId: 'UCPN-101',
        code: 'SEOUL100',
        title: '首爾新客見面禮',
        type: 'FIXED',
        value: 100,
        maxDiscount: 0,
        minSpend: 500,
        expiryDate: '2026-12-31',
        isUsed: false,
        source: '輸入優惠碼領取'
      },
      {
        instanceId: 'UCPN-102',
        code: 'WINTER88',
        title: '冬季新品 88 折券',
        type: 'PERCENT',
        value: 0.88,
        maxDiscount: 500,
        minSpend: 1500,
        expiryDate: '2026-12-31',
        isUsed: false,
        source: '冬季活動禮遇'
      }
    ],
    savedAddresses: [
      {
        id: 1,
        type: 'HOME',
        recipientName: '陳哲偉',
        phone: '0912345678',
        city: '台北市',
        district: '中正區',
        detail: '忠孝西路一段 100 號 8 樓',
        isDefault: true
      }
    ]
  })

  const isAdmin = ref(true)

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

  // 2. 後台全體會員名冊
  const memberList = ref([
    {
      id: 'MB-1001',
      name: '陳哲偉',
      phone: '0912345678',
      email: 'user@md-korea.com',
      birthday: '1997-03-18',
      vipTierId: 'GOLD',
      totalSpent: 14850,
      orderCount: 8,
      abandonCount: 0,
      riskStatus: 'NORMAL',
      notes: '核心常客，偏好韓國東大門外套',
      updatedAt: '2026-11-01'
    },
    {
      id: 'MB-1002',
      name: '黃小芬',
      phone: '0922111333',
      email: 'fen@gmail.com',
      birthday: '1995-11-24',
      vipTierId: 'SILVER',
      totalSpent: 6200,
      orderCount: 5,
      abandonCount: 3,
      riskStatus: 'RESTRICT_COD',
      notes: '7-11 逾期未取 3 次導致退貨逆物流，已關閉超取到付',
      updatedAt: '2026-11-08'
    },
    {
      id: 'MB-1003',
      name: '張惡霸',
      phone: '0988777666',
      email: 'badguy@fake.com',
      birthday: '1990-05-12',
      vipTierId: 'GENERAL',
      totalSpent: 0,
      orderCount: 2,
      abandonCount: 2,
      riskStatus: 'BANNED',
      notes: '多次惡意下單後退貨並於客服辱罵，全面封鎖登入與購買',
      updatedAt: '2026-11-05'
    },
    {
      id: 'MB-1004',
      name: '李刷卡',
      phone: '0933444555',
      email: 'cardtest@yahoo.com.tw',
      birthday: '1998-11-18',
      vipTierId: 'DIAMOND',
      totalSpent: 35800,
      orderCount: 15,
      abandonCount: 0,
      riskStatus: 'BLOCK_ORDER',
      notes: '疑似盜刷爭議款未清，待金融機構照會前暫停下單',
      updatedAt: '2026-11-09'
    }
  ])

  const login = (loginData = {}) => {
    const matched = memberList.value.find(
      m => m.email === loginData.email || m.phone === loginData.account || m.phone === loginData.phone
    )

    if (matched && matched.riskStatus === 'BANNED') {
      alert('【帳號已被封鎖】此帳號因重大違規已被系統全面禁止登入，如有疑問請洽客服。')
      return false
    }

    if (loginData.isRegister && !matched) {
      const nextId = 'MB-' + (1000 + memberList.value.length + 1)
      memberList.value.unshift({
        id: nextId,
        name: loginData.name || '新會員',
        phone: loginData.phone || '',
        email: loginData.email || '',
        birthday: loginData.birthday || '',
        vipTierId: marketingStore.vipTiers[0]?.id || 'GENERAL',
        totalSpent: 0,
        orderCount: 0,
        abandonCount: 0,
        riskStatus: 'NORMAL',
        notes: '前台自行註冊新會員',
        updatedAt: new Date().toISOString().slice(0, 10)
      })
    }

    user.value = {
      isLoggedIn: true,
      name: loginData.name || (matched ? matched.name : '測試會員'),
      phone: loginData.phone || (matched ? matched.phone : '0912345678'),
      email: loginData.email || (matched ? matched.email : 'user@md-korea.com'),
      birthday: loginData.birthday || (matched ? matched.birthday : ''),
      totalSpent: matched?.totalSpent ?? 0,
      vipTierId: matched?.vipTierId || marketingStore.vipTiers[0]?.id || 'GENERAL',
      points: user.value?.points ?? 100,
      wishlist: user.value?.wishlist ?? [],
      restockRequests: user.value?.restockRequests ?? [],
      riskStatus: matched ? matched.riskStatus : 'NORMAL',
      blockReason: matched ? matched.notes : '',
      myCoupons: user.value?.myCoupons ?? [],
      savedAddresses: user.value?.savedAddresses ?? []
    }
    return true
  }

  const logout = () => {
    user.value.isLoggedIn = false
  }

  const updateProfile = (profileData = {}) => {
    if (!user.value) return
    Object.assign(user.value, profileData)
    const target = memberList.value.find(m => m.email === user.value.email || m.phone === user.value.phone)
    if (target) {
      if (profileData.name !== undefined) target.name = profileData.name
      if (profileData.phone !== undefined) target.phone = profileData.phone
      if (profileData.birthday !== undefined) target.birthday = profileData.birthday
      target.updatedAt = new Date().toISOString().slice(0, 10)
    }
  }

  const adminUpdateMemberInfo = (memberId, payload) => {
    const target = memberList.value.find(m => m.id === memberId)
    if (!target) return { success: false, message: '找不到該會員' }

    if (payload.name !== undefined) target.name = payload.name
    if (payload.phone !== undefined) target.phone = payload.phone
    if (payload.birthday !== undefined) target.birthday = payload.birthday
    if (payload.vipTierId !== undefined) target.vipTierId = payload.vipTierId
    target.updatedAt = new Date().toISOString().slice(0, 10)

    if (user.value && (user.value.email === target.email || user.value.phone === target.phone)) {
      user.value.name = target.name
      user.value.phone = target.phone
      user.value.birthday = target.birthday
      user.value.vipTierId = target.vipTierId
    }

    return { success: true, message: `已更新會員【${target.name}】的基本資料與生日設定` }
  }

  // 輸入優惠碼領取優惠券（完整攜帶 maxDiscount 上限）
  const claimCouponByCode = (code, sourceLabel = '輸入優惠碼領取') => {
    if (!user.value?.isLoggedIn) {
      return { success: false, message: '請先登入會員帳號再領取優惠券！' }
    }
    if (user.value.riskStatus === 'RESTRICT_PROMO') {
      return { success: false, message: '您的帳號目前優惠功能受限，無法領取優惠券。' }
    }

    const template = marketingStore.findCouponByCode(code)
    if (!template) {
      return { success: false, message: '無效或已過期的優惠碼，請確認輸入是否正確！' }
    }

    const alreadyHas = user.value.myCoupons.some(c => c.code === template.code && !c.isUsed)
    if (alreadyHas) {
      return { success: false, message: `您的優惠券錢包內已有【${template.title}】，結帳時可直接選用！` }
    }

    const newCouponInstance = {
      instanceId: 'UCPN-' + Date.now() + Math.floor(Math.random() * 100),
      code: template.code,
      title: template.title,
      type: template.type,
      value: template.value,
      maxDiscount: Number(template.maxDiscount) || 0,
      minSpend: template.minSpend,
      expiryDate: template.expiryDate,
      isUsed: false,
      source: sourceLabel
    }

    user.value.myCoupons.unshift(newCouponInstance)
    return {
      success: true,
      message: `領取成功！【${template.title}】已存入您的優惠券帳戶`,
      coupon: newCouponInstance
    }
  }

  const markCouponAsUsed = (instanceId) => {
    const cpn = user.value?.myCoupons?.find(c => c.instanceId === instanceId)
    if (cpn) cpn.isUsed = true
  }

  // ★ 支援多對象分類派發優惠券（本月壽星 / 全體會員 / 全體 VIP / 指定特定 VIP 階級 TIER:XXX） ★
  const dispatchCouponToMembers = ({ couponCode, targetGroup, sourceName = '系統活動派發' }) => {
    const template = marketingStore.findCouponByCode(couponCode)
    if (!template) return { success: false, message: '找不到對應的有效優惠券模板！' }

    const currentMonth = new Date().getMonth() + 1
    let targetMembers = []

    if (targetGroup === 'BIRTHDAY_MONTH') {
      targetMembers = memberList.value.filter(m => {
        if (!m.birthday) return false
        const bMonth = Number(m.birthday.split('-')[1])
        return bMonth === currentMonth && m.riskStatus !== 'BANNED'
      })
    } else if (targetGroup === 'ALL_VIP') {
      targetMembers = memberList.value.filter(
        m => (m.vipTierId && m.vipTierId !== 'GENERAL') && m.riskStatus !== 'BANNED'
      )
    } else if (targetGroup === 'ALL_ACTIVE') {
      targetMembers = memberList.value.filter(m => m.riskStatus !== 'BANNED')
    } else if (targetGroup && targetGroup.startsWith('TIER:')) {
      const targetTierId = targetGroup.replace('TIER:', '')
      targetMembers = memberList.value.filter(
        m => (m.vipTierId || 'GENERAL') === targetTierId && m.riskStatus !== 'BANNED'
      )
    }

    const isCurrentUserIncluded = targetMembers.some(
      m => m.email === user.value?.email || m.phone === user.value?.phone
    )
    if (isCurrentUserIncluded && user.value?.isLoggedIn) {
      user.value.myCoupons.unshift({
        instanceId: 'UCPN-' + Date.now(),
        code: template.code,
        title: template.title,
        type: template.type,
        value: template.value,
        maxDiscount: Number(template.maxDiscount) || 0,
        minSpend: template.minSpend,
        expiryDate: template.expiryDate,
        isUsed: false,
        source: sourceName
      })
    }

    return {
      success: true,
      count: targetMembers.length,
      message: `已成功執行規則，派發【${template.title} (${template.code})】給符合條件的 ${targetMembers.length} 位會員！`
    }
  }

  const updateMemberTier = (memberId, newTierId) => {
    const target = memberList.value.find(m => m.id === memberId)
    if (target) {
      target.vipTierId = newTierId
      target.updatedAt = new Date().toISOString().slice(0, 10)
      if (user.value && user.value.email === target.email) {
        user.value.vipTierId = newTierId
      }
      return { success: true }
    }
    return { success: false }
  }

  const isInWishlist = (productId) => Boolean(user.value?.wishlist?.includes(Number(productId)))

  const toggleWishlist = (productId) => {
    if (!user.value.wishlist) user.value.wishlist = []
    const id = Number(productId)
    const index = user.value.wishlist.indexOf(id)
    if (index > -1) user.value.wishlist.splice(index, 1)
    else user.value.wishlist.push(id)
  }

  const addAddress = (address) => {
    if (!user.value.savedAddresses) user.value.savedAddresses = []
    user.value.savedAddresses.push({ id: Date.now(), ...address })
  }

  const removeAddress = (addressId) => {
    if (!user.value.savedAddresses) return
    user.value.savedAddresses = user.value.savedAddresses.filter(a => a.id !== addressId)
  }

  const updateMemberRisk = (memberId, { riskStatus, notes }) => {
    const target = memberList.value.find(m => m.id === memberId)
    if (target) {
      target.riskStatus = riskStatus
      if (notes !== undefined) target.notes = notes
      target.updatedAt = new Date().toISOString().slice(0, 10)

      if (user.value && (user.value.email === target.email || user.value.phone === target.phone)) {
        user.value.riskStatus = riskStatus
        user.value.blockReason = notes || ''
      }
      return { success: true, message: `會員【${target.name}】管制狀態已更新為【${riskStatus}】` }
    }
    return { success: false, message: '找不到該會員' }
  }

  const checkCheckoutEligibility = (paymentMethod) => {
    const status = user.value?.riskStatus || 'NORMAL'
    if (status === 'BANNED') {
      return { allowed: false, reason: '您的帳號已被系統安全凍結，無法使用結帳功能，請聯繫官方客服。' }
    }
    if (status === 'BLOCK_ORDER') {
      return { allowed: false, reason: '很抱歉，此帳號目前暫停下單權限，請先聯繫客服完成身分照會。' }
    }
    if (status === 'RESTRICT_COD' && (paymentMethod === 'COD' || paymentMethod === 'CVS_COD')) {
      return { allowed: false, reason: '因您先前有多次包裹未取紀錄，本帳號暫停「貨到付款 / 超取付款」，請改用線上預先支付。' }
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
    addAddress,
    removeAddress,
    updateMemberRisk,
    checkCheckoutEligibility
  }
})

export default useAuthStore