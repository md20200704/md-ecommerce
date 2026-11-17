<template>
  <main class="container py-4 py-md-5" style="max-width: 1200px; margin: 0 auto;">
    <!-- 麵包屑與分類標題 -->
    <div class="mb-4 pb-3 border-bottom">
      <nav class="small text-muted mb-2" aria-label="breadcrumb">
        <ol class="breadcrumb mb-0">
          <li class="breadcrumb-item">
            <router-link to="/" class="text-decoration-none text-muted">首頁</router-link>
          </li>
          <li v-if="activeMainCategory" class="breadcrumb-item">
            <button
              type="button"
              class="btn btn-link p-0 text-decoration-none text-muted small"
              @click="selectSubcategory('ALL')"
            >
              {{ activeMainCategory }}
            </button>
          </li>
          <li class="breadcrumb-item active text-dark fw-semibold" aria-current="page">
            {{ activeSubcategory !== 'ALL' ? activeSubcategory : (activeMainCategory || '全站精選商品') }}
          </li>
        </ol>
      </nav>

      <div class="d-flex justify-content-between align-items-end flex-wrap gap-2">
        <div>
          <h1 class="h3 fw-bold text-dark font-serif mb-1">
            {{ activeSubcategory !== 'ALL' ? activeSubcategory : (activeMainCategory || '全站精選服飾') }}
          </h1>
          <p class="small text-muted mb-0">
            {{ activeMainCategory ? `${activeMainCategory} 系列精選單品` : '探索首爾同步最新設計款與質感基礎單品' }}
          </p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small font-monospace">共 {{ displayedProducts.length }} 件商品</span>
          <select v-model="sortBy" class="form-select form-select-sm rounded-pill font-sans" style="width: 155px;">
            <option value="NEWEST">最新上架優先</option>
            <option value="PRICE_ASC">價格：由低到高</option>
            <option value="PRICE_DESC">價格：由高到低</option>
          </select>
        </div>
      </div>

      <!-- 細項子分類快速切換膠囊列 -->
      <div v-if="currentSubcategoryPills.length > 0" class="d-flex flex-wrap gap-2 mt-3 pt-2">
        <button
          type="button"
          class="btn btn-sm rounded-pill px-3.5 py-1 font-sans"
          :class="activeSubcategory === 'ALL' ? 'btn-dark fw-bold' : 'btn-outline-secondary'"
          @click="selectSubcategory('ALL')"
        >
          全部 {{ activeMainCategory || '商品' }}
        </button>

        <button
          v-for="sub in currentSubcategoryPills"
          :key="sub"
          type="button"
          class="btn btn-sm rounded-pill px-3.5 py-1 font-sans"
          :class="activeSubcategory === sub ? 'btn-dark fw-bold' : 'btn-outline-secondary'"
          @click="selectSubcategory(sub)"
        >
          {{ sub }}
        </button>
      </div>
    </div>

    <!-- 商品網格列表 -->
    <div v-if="displayedProducts.length > 0" class="row g-3 g-md-4">
      <div v-for="prod in displayedProducts" :key="prod.id" class="col-6 col-md-4 col-lg-3">
        <ProductCard :product="prod" />
      </div>
    </div>

    <div v-else class="card-korean text-center py-5 my-4 bg-white rounded-4 border text-muted small">
      目前「{{ activeSubcategory !== 'ALL' ? activeSubcategory : activeMainCategory }}」分類下尚無上架商品，歡迎瀏覽其他系列！
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import { useProductStore } from '../stores/productStore'
import { useMarketingStore } from '../stores/marketingStore'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const marketingStore = useMarketingStore()

const sortBy = ref('NEWEST')
const activeMainCategory = ref('')
const activeSubcategory = ref('ALL')

// 同步解析網址參數（相容 /category?cat=...&sub=... 與 /category/分類名稱）
const syncCategoryFromRoute = () => {
  const rawParam = route.params.category ? decodeURIComponent(String(route.params.category)) : ''
  const rawCat = route.query.cat ? decodeURIComponent(String(route.query.cat)) : ''
  const rawSub = route.query.sub ? decodeURIComponent(String(route.query.sub)) : ''

  const target = rawCat || rawParam

  if (!target) {
    activeMainCategory.value = ''
    activeSubcategory.value = rawSub || 'ALL'
    return
  }

  // 1. 比對主分類（支援完整名稱如「Top 上衣」或部分關鍵字如「Top」、「上衣」）
  const mainCatObj = (marketingStore.categoryTree || []).find(
    c => c.name === target || c.name.includes(target) || target.includes(c.name)
  )

  if (mainCatObj) {
    activeMainCategory.value = mainCatObj.name
    activeSubcategory.value = rawSub || 'ALL'
  } else {
    // 2. 若傳入的是細項分類名稱（如「針織毛衣」），自動反查所屬主分類
    let foundParent = ''
    for (const cat of (marketingStore.categoryTree || [])) {
      const subs = marketingStore.getSubItemsByCategory(cat.name)
      if (subs.includes(target)) {
        foundParent = cat.name
        break
      }
    }
    activeMainCategory.value = foundParent
    activeSubcategory.value = target
  }
}

watch(
  () => [route.params.category, route.query.cat, route.query.sub],
  () => {
    syncCategoryFromRoute()
  },
  { immediate: true }
)

const currentSubcategoryPills = computed(() => {
  if (activeMainCategory.value) {
    return marketingStore.getSubItemsByCategory(activeMainCategory.value)
  }
  const allSubs = new Set()
  ;(marketingStore.categoryTree || []).forEach(cat => {
    marketingStore.getSubItemsByCategory(cat.name).forEach(s => allSubs.add(s))
  })
  return Array.from(allSubs)
})

const selectSubcategory = (sub) => {
  activeSubcategory.value = sub
  const query = {}
  if (activeMainCategory.value) query.cat = activeMainCategory.value
  if (sub !== 'ALL') query.sub = sub

  router.push({
    path: '/category',
    query
  })
}

const displayedProducts = computed(() => {
  let list = [...(productStore.products || [])]

  if (activeMainCategory.value) {
    list = list.filter(
      p => p.category === activeMainCategory.value || (p.category && p.category.includes(activeMainCategory.value))
    )
  }

  if (activeSubcategory.value && activeSubcategory.value !== 'ALL') {
    list = list.filter(
      p =>
        p.subcategory === activeSubcategory.value ||
        (p.name && p.name.includes(activeSubcategory.value))
    )
  }

  if (sortBy.value === 'PRICE_ASC') {
    list.sort((a, b) => (a.price || 0) - (b.price || 0))
  } else if (sortBy.value === 'PRICE_DESC') {
    list.sort((a, b) => (b.price || 0) - (a.price || 0))
  } else {
    list.sort((a, b) => (b.id || 0) - (a.id || 0))
  }

  return list
})
</script>