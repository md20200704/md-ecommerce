import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMarketingStore = defineStore('marketing', () => {
  // 1. 首頁輪播與分類樹（保留原有結構防呆）
  const banners = ref([
    {
      id: 1,
      tag: 'NEW ARRIVAL · 2026',
      title: '首爾晨霧微光特輯，\n探索冬日極簡鬆弛感。',
      subtitle: '全館冬季新品結帳享免運，滿額 NT$ 2,500 再贈精緻羊毛圍巾。',
      buttonText: '探索新品',
      linkType: 'category',
      linkUrl: 'Top 上衣',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
      isActive: true
    }
  ])

  const categoryTree = ref([
    {
      name: 'Top 上衣',
      subcategories: [
        { name: '季節精選', items: ['針織毛衣', '氣質襯衫', '修身內搭'] },
        { name: '風格分類', items: ['韓系極簡', '法式慵懶'] }
      ]
    },
    {
      name: 'Outer 外套',
      subcategories: [
        { name: '大衣系列', items: ['羊毛長大衣', '西裝外套', '短版夾克'] }
      ]
    },
    {
      name: 'Bottom 下身',
      subcategories: [
        { name: '褲裝與裙裝', items: ['直筒西裝褲', '牛仔寬褲', '長裙'] }
      ]
    }
  ])

  // 2. ★ VIP 階級與紅利點數回饋趴數制度 (後台可即時調整) ★
  const vipTiers = ref([
    {
      id: 'GENERAL',
      name: '一般會員 (GENERAL)',
      minSpend: 0,
      discountRate: 1.0, // 1.0 = 無折扣 (原價), 0.95 = 95折
      pointsEarnRate: 1, // 消費回饋 1% 紅利點數
      badgeColor: 'bg-secondary-subtle text-secondary',
      description: '註冊即享基礎會員資格，消費回饋 1% 紅利點數'
    },
    {
      id: 'SILVER',
      name: '白銀 VIP (SILVER)',
      minSpend: 5000,
      discountRate: 0.95, // 95 折
      pointsEarnRate: 3, // 消費回饋 3% 紅利點數
      badgeColor: 'bg-info-subtle text-info-emphasis',
      description: '累積消費滿 NT$ 5,000，全館享 95 折與 3% 點數回饋'
    },
    {
      id: 'GOLD',
      name: '黃金 VIP (GOLD)',
      minSpend: 12000,
      discountRate: 0.9, // 9 折
      pointsEarnRate: 5, // 消費回饋 5% 紅利點數
      badgeColor: 'bg-warning-subtle text-warning-emphasis',
      description: '累積消費滿 NT$ 12,000，全館享 9 折、5% 點數回饋與每月專屬禮券'
    },
    {
      id: 'DIAMOND',
      name: '黑鑽 VIP (DIAMOND)',
      minSpend: 30000,
      discountRate: 0.85, // 85 折
      pointsEarnRate: 8, // 消費回饋 8% 紅利點數
      badgeColor: 'bg-dark text-white',
      description: '累積消費滿 NT$ 30,000，全館享 85 折、8% 點數回饋與生日豪華禮金'
    }
  ])

  // 3. ★ 全館優惠券庫 (整合優惠碼輸入領取與自動派發) ★
  const couponTemplates = ref([
    {
      id: 'CPN-001',
      code: 'SEOUL100',
      title: '首爾新客見面禮',
      type: 'FIXED', // FIXED (定額折抵) | PERCENT (折數折扣)
      value: 100, // 折抵 100 元
      minSpend: 500,
      expiryDate: '2026-12-31',
      isActive: true,
      autoTrigger: 'NONE', // NONE | BIRTHDAY | MONTHLY_VIP
      description: '全館單筆消費滿 NT$ 500 現折 NT$ 100'
    },
    {
      id: 'CPN-002',
      code: 'VIP200',
      title: 'VIP 尊榮月度禮金',
      type: 'FIXED',
      value: 200,
      minSpend: 1200,
      expiryDate: '2026-12-31',
      isActive: true,
      autoTrigger: 'MONTHLY_VIP',
      description: 'VIP 專屬每月福利，滿 NT$ 1,200 折抵 NT$ 200'
    },
    {
      id: 'CPN-003',
      code: 'HBD300',
      title: '壽星專屬生日禮券',
      type: 'FIXED',
      value: 300,
      minSpend: 1000,
      expiryDate: '2026-12-31',
      isActive: true,
      autoTrigger: 'BIRTHDAY',
      description: '祝您生日快樂！當月壽星滿 NT$ 1,000 現折 NT$ 300'
    },
    {
      id: 'CPN-004',
      code: 'WINTER88',
      title: '冬季新品 88 折券',
      type: 'PERCENT',
      value: 0.88, // 88 折
      minSpend: 1500,
      expiryDate: '2026-12-31',
      isActive: true,
      autoTrigger: 'NONE',
      description: '冬裝全系列滿 NT$ 1,500 享 88 折優惠'
    }
  ])

  // 4. 自動化發送優惠券規則開關 (後台可設定開關與對應優惠券)
  const autoDispatchRules = ref({
    birthdayEnabled: true,
    birthdayCouponCode: 'HBD300',
    monthlyVipEnabled: true,
    monthlyVipCouponCode: 'VIP200',
    monthlyVipMinTier: 'SILVER' // SILVER 以上自動派發
  })

  // 依照累積消費金額取得對應 VIP 階級物件
  const getTierBySpend = (totalSpent = 0) => {
    const sorted = [...vipTiers.value].sort((a, b) => b.minSpend - a.minSpend)
    return sorted.find(t => totalSpent >= t.minSpend) || vipTiers.value[0]
  }

  // 依照階級 ID 取得 VIP 階級物件
  const getTierById = (tierId) => {
    return vipTiers.value.find(t => t.id === tierId) || vipTiers.value[0]
  }

  // 透過優惠碼查詢有效優惠券模板
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
    getTierBySpend,
    getTierById,
    findCouponByCode
  }
})