import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiRequest } from '../services/apiClient'

export const useMarketingStore = defineStore('marketing', () => {
  const banners = ref([])
  const categoryTree = ref([
    {
      name: 'Top 上衣',
      subcategories: [
        { name: '季節精選', items: ['針織毛衣', '氣質襯衫', '修身內搭', '大學T / 衛衣'] }
      ]
    },
    {
      name: 'Outer 外套',
      subcategories: [
        { name: '大衣與外套', items: ['羊毛長大衣', '西裝外套', '短版夾克'] }
      ]
    },
    {
      name: 'Bottom 下身',
      subcategories: [
        { name: '褲裝與裙裝', items: ['直筒西裝褲', '牛仔寬褲', 'A字長裙'] }
      ]
    }
  ])

  const vipTiers = ref([
    {
      id: 'GENERAL',
      name: '一般會員 (GENERAL)',
      minSpend: 0,
      discountRate: 1.0,
      pointsEarnRate: 1,
      badgeColor: 'bg-secondary-subtle text-secondary',
      description: '註冊即享基礎會員資格，消費回饋 1% 紅利點數'
    }
  ])

  const couponTemplates = ref([])
  const autoDispatchRules = ref([])
  const isLoaded = ref(false)

  const fetchMarketingConfig = async () => {
    try {
      const res = await apiRequest('/api/marketing-cms')
      if (res.success) {
        if (Array.isArray(res.banners)) banners.value = res.banners
        if (Array.isArray(res.categoryTree) && res.categoryTree.length > 0) {
          categoryTree.value = res.categoryTree
        }
        if (Array.isArray(res.vipTiers) && res.vipTiers.length > 0) {
          vipTiers.value = res.vipTiers
        }
        if (Array.isArray(res.couponTemplates)) couponTemplates.value = res.couponTemplates
        if (Array.isArray(res.autoDispatchRules)) autoDispatchRules.value = res.autoDispatchRules
        isLoaded.value = true
      }
    } catch (err) {
      console.warn('[marketingStore] 載入資料庫行銷設定失敗：', err.message)
    }
  }

  const getSubItemsByCategory = (categoryName) => {
    const cat = categoryTree.value.find(c => c.name === categoryName)
    if (!cat || !cat.subcategories) return []
    const items = []
    cat.subcategories.forEach(group => {
      if (Array.isArray(group.items)) items.push(...group.items)
    })
    return items
  }

  // VIP 階級 CRUD
  const addVipTier = (newTier) => {
    const cleanId = (newTier.id || 'TIER_' + Date.now()).trim().toUpperCase()
    if (vipTiers.value.some(t => t.id === cleanId)) {
      return { success: false, message: `階級代碼 ${cleanId} 已存在，請更換其他代碼！` }
    }
    const payload = {
      id: cleanId,
      name: newTier.name.trim(),
      minSpend: Number(newTier.minSpend) || 0,
      discountRate: Number(newTier.discountRate) || 1.0,
      pointsEarnRate: Number(newTier.pointsEarnRate) || 1,
      badgeColor: newTier.badgeColor || 'bg-primary-subtle text-primary',
      description: newTier.description || '專屬 VIP 尊榮禮遇'
    }
    vipTiers.value.push(payload)
    vipTiers.value.sort((a, b) => a.minSpend - b.minSpend)

    apiRequest('/api/marketing-cms', {
      method: 'POST',
      body: JSON.stringify({ resource: 'vip-tier', ...payload })
    }).catch(err => console.error('新增 VIP 階級同步失敗:', err))

    return { success: true, message: `已新增 VIP 階級【${payload.name}】` }
  }

  const saveVipTier = async (tier) => {
    await apiRequest('/api/marketing-cms', {
      method: 'PUT',
      body: JSON.stringify({ resource: 'vip-tier', ...tier })
    })
  }

  const removeVipTier = (tierId) => {
    if (vipTiers.value.length <= 1) {
      return { success: false, message: '系統至少須保留一個會員階級，無法全部刪除！' }
    }
    const idx = vipTiers.value.findIndex(t => t.id === tierId)
    if (idx > -1) {
      const removedName = vipTiers.value[idx].name
      vipTiers.value.splice(idx, 1)
      apiRequest(`/api/marketing-cms?resource=vip-tier&id=${encodeURIComponent(tierId)}`, {
        method: 'DELETE'
      }).catch(err => console.error('刪除 VIP 階級同步失敗:', err))
      return { success: true, message: `已刪除 VIP 階級【${removedName}】` }
    }
    return { success: false, message: '找不到該階級' }
  }

  // 自動派發規則 CRUD
  const addAutoDispatchRule = (rule) => {
    const payload = {
      id: 'RULE-' + Date.now(),
      name: rule.name.trim(),
      targetGroup: rule.targetGroup,
      scheduleType: rule.scheduleType,
      specificDate: rule.scheduleType === 'SPECIFIC_DATE' ? rule.specificDate : '',
      couponCode: rule.couponCode,
      isActive: true
    }
    autoDispatchRules.value.unshift(payload)
    apiRequest('/api/marketing-cms', {
      method: 'POST',
      body: JSON.stringify({ resource: 'rule', ...payload })
    }).then(() => fetchMarketingConfig()).catch(err => console.error('新增規則失敗:', err))
  }

  const removeAutoDispatchRule = (ruleId) => {
    autoDispatchRules.value = autoDispatchRules.value.filter(r => r.id !== ruleId)
    apiRequest(`/api/marketing-cms?resource=rule&id=${encodeURIComponent(ruleId)}`, {
      method: 'DELETE'
    }).catch(err => console.error('刪除規則失敗:', err))
  }

  // CMS 主分類樹 CRUD
  const addPrimaryCategory = (payload) => {
    categoryTree.value.push(payload)
    apiRequest('/api/marketing-cms', {
      method: 'POST',
      body: JSON.stringify({ resource: 'category', ...payload })
    }).then(() => fetchMarketingConfig()).catch(err => console.error('新增分類失敗:', err))
  }

  const updatePrimaryCategory = (idx, payload) => {
    const existing = categoryTree.value[idx]
    categoryTree.value[idx] = { ...existing, ...payload }
    apiRequest('/api/marketing-cms', {
      method: 'PUT',
      body: JSON.stringify({ resource: 'category', id: existing?.id, ...payload })
    }).then(() => fetchMarketingConfig()).catch(err => console.error('更新分類失敗:', err))
  }

  const deletePrimaryCategory = (idx) => {
    const target = categoryTree.value[idx]
    categoryTree.value.splice(idx, 1)
    if (target?.id) {
      apiRequest(`/api/marketing-cms?resource=category&id=${target.id}`, {
        method: 'DELETE'
      }).catch(err => console.error('刪除分類失敗:', err))
    }
  }

  // CMS Banner CRUD
  const addBanner = (bannerForm) => {
    const payload = { ...bannerForm, id: Date.now() }
    banners.value.push(payload)
    apiRequest('/api/marketing-cms', {
      method: 'POST',
      body: JSON.stringify({ resource: 'banner', ...bannerForm })
    }).then(() => fetchMarketingConfig()).catch(err => console.error('新增輪播失敗:', err))
  }

  const updateBanner = (id, bannerForm) => {
    const idx = banners.value.findIndex(b => b.id === id)
    if (idx > -1) banners.value[idx] = { ...banners.value[idx], ...bannerForm }
    apiRequest('/api/marketing-cms', {
      method: 'PUT',
      body: JSON.stringify({ resource: 'banner', id, ...bannerForm })
    }).catch(err => console.error('更新輪播失敗:', err))
  }

  const deleteBanner = (id) => {
    banners.value = banners.value.filter(b => b.id !== id)
    apiRequest(`/api/marketing-cms?resource=banner&id=${id}`, {
      method: 'DELETE'
    }).catch(err => console.error('刪除輪播失敗:', err))
  }

  const getTierById = (tierId) => {
    return vipTiers.value.find(t => t.id === tierId) || vipTiers.value[0]
  }

  const findCouponByCode = (code) => {
    if (!code) return null
    const cleanCode = code.trim().toUpperCase()
    return couponTemplates.value.find(c => c.code === cleanCode && c.isActive) || null
  }

  return {
    banners,
    categoryTree,
    vipTiers,
    couponTemplates,
    autoDispatchRules,
    isLoaded,
    fetchMarketingConfig,
    getSubItemsByCategory,
    addVipTier,
    saveVipTier,
    removeVipTier,
    addAutoDispatchRule,
    removeAutoDispatchRule,
    addPrimaryCategory,
    updatePrimaryCategory,
    deletePrimaryCategory,
    addBanner,
    updateBanner,
    deleteBanner,
    getTierById,
    findCouponByCode
  }
})