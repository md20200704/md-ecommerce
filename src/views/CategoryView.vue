<template>
  <main class="container py-3 py-md-5 px-3 px-md-4" style="max-width: 1240px; margin: 0 auto;">
    
    <!-- 1. 頂部導覽與篩選狀態列（維持原版簡潔設計） -->
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-3 mb-4 border-bottom">
      
      <!-- 左側：開啟分類選單按鈕 + 當前選擇路徑 -->
      <div class="d-flex align-items-center flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-dark btn-sm rounded-pill px-3.5 py-2 fw-semibold d-inline-flex align-items-center gap-1.5"
          @click="openCategorySelector"
        >
          <span>選擇分類</span>
          <ChevronDown style="width: 14px; height: 14px;" />
        </button>

        <div class="d-flex align-items-center gap-1.5 small ms-1">
          <span class="fw-bold text-dark">{{ activeMainCategory || '全部商品' }}</span>
          <template v-if="activeSubcategory && activeSubcategory !== 'ALL'">
            <span class="text-muted">/</span>
            <span class="text-secondary fw-semibold">{{ activeSubcategory }}</span>
          </template>
          <button
            v-if="activeMainCategory || (activeSubcategory && activeSubcategory !== 'ALL')"
            type="button"
            class="btn btn-link btn-sm text-muted text-decoration-none p-0 ms-1"
            style="font-size: 12px;"
            @click="resetAllCategory"
          >
            ✕ 清除
          </button>
        </div>
      </div>

      <!-- 右側：商品數與排序下拉 -->
      <div class="d-flex align-items-center gap-2 ms-auto">
        <span class="text-muted font-monospace" style="font-size: 11.5px;">
          {{ displayedProducts.length }} ITEMS
        </span>
        <select
          v-model="sortBy"
          class="form-select form-select-sm rounded-pill font-monospace border-secondary-subtle"
          style="width: 145px; font-size: 11.5px;"
        >
          <option value="NEWEST">最新上架</option>
          <option value="PRICE_ASC">價格：低至高</option>
          <option value="PRICE_DESC">價格：高至低</option>
        </select>
      </div>
    </div>

    <!-- 2. 商品陳列網格 -->
    <div v-if="displayedProducts.length > 0" class="row g-3 g-md-4">
      <div
        v-for="prod in displayedProducts"
        :key="prod.id"
        class="col-6 col-md-4 col-lg-3"
      >
        <ProductCard :product="prod" />
      </div>
    </div>

    <!-- 無商品時之空狀態 -->
    <div v-else class="bg-white rounded-4 border p-5 text-center my-3">
      <div class="text-muted small mb-3">此分類目前尚無上架商品。</div>
      <button type="button" class="btn btn-outline-dark btn-sm rounded-pill px-4 py-2" @click="resetAllCategory">
        返回全部商品
      </button>
    </div>

    <!-- ==================== 3. 固定於下方的極簡收合式（Bottom Sheet Accordion）分類選單 ==================== -->
    <Teleport to="body">
      <div
        v-if="isSelectorOpen"
        class="sheet-backdrop"
        @click.self="isSelectorOpen = false"
      >
        <div class="sheet-panel">
          
          <!-- 頂部固定把手與標題列 -->
          <div class="sheet-header">
            <span class="sheet-title font-serif">選擇商品分類</span>
            <button
              type="button"
              class="btn-close"
              style="font-size: 12px;"
              aria-label="關閉"
              @click="isSelectorOpen = false"
            ></button>
          </div>

          <!-- 選單內容捲動區（獨立 Block 流向，左右留白 24px 不貼邊，展開穩定不跑版） -->
          <div class="sheet-body">
            
            <!-- 全部商品總覽 -->
            <div class="sheet-group">
              <button
                type="button"
                class="sheet-main-btn"
                :class="{ 'is-active': !activeMainCategory }"
                @click="resetAllCategory"
              >
                <span>全部商品總覽</span>
                <span class="sheet-count font-monospace">{{ allPublishedProducts.length }}</span>
              </button>
            </div>

            <!-- 各大分類（點擊展開/收合小分類） -->
            <div
              v-for="cat in categoryTree"
              :key="cat.name"
              class="sheet-group"
            >
              <!-- 大分類列（高度 54px） -->
              <button
                type="button"
                class="sheet-main-btn"
                :class="{ 'is-active': expandedCategory === cat.name || activeMainCategory === cat.name }"
                @click="toggleMainCategory(cat.name)"
              >
                <div class="sheet-main-left">
                  <span>{{ cat.name }}</span>
                  <span class="sheet-count font-monospace">({{ getMainCategoryCount(cat.name) }})</span>
                </div>
                <ChevronDown
                  style="width: 16px; height: 16px;"
                  class="sheet-chevron"
                  :class="{ 'is-open': expandedCategory === cat.name }"
                />
              </button>

              <!-- 收合的小分類清單（一行一列，高度 48px 防誤觸，內縮留白不貼邊） -->
              <div
                v-if="expandedCategory === cat.name"
                class="sheet-sub-list"
              >
                <button
                  type="button"
                  class="sheet-sub-btn"
                  :class="{ 'is-selected': activeMainCategory === cat.name && (!activeSubcategory || activeSubcategory === 'ALL') }"
                  @click="selectSubcategory(cat.name, '')"
                >
                  <span>全部 {{ cat.name }}</span>
                  <span class="sheet-count font-monospace">{{ getMainCategoryCount(cat.name) }}</span>
                </button>

                <button
                  v-for="subItem in getFlatSubItems(cat)"
                  :key="subItem"
                  type="button"
                  class="sheet-sub-btn"
                  :class="{ 'is-selected': activeMainCategory === cat.name && activeSubcategory === subItem }"
                  @click="selectSubcategory(cat.name, subItem)"
                >
                  <span>{{ subItem }}</span>
                  <span class="sheet-count font-monospace">{{ getSubCategoryCount(cat.name, subItem) }}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Teleport>

  </main>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'
import ProductCard from '../components/ProductCard.vue'
import { useProductStore } from '../stores/productStore'
import { useMarketingStore } from '../stores/marketingStore'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const marketingStore = useMarketingStore()

const categoryTree = computed(() => marketingStore.categoryTree || [])

const activeMainCategory = ref('')
const activeSubcategory = ref('ALL')
const sortBy = ref('NEWEST')

const isSelectorOpen = ref(false)
const expandedCategory = ref('')

const allPublishedProducts = computed(() => {
  return (productStore.products || []).filter(p => {
    const totalStock = (p.skus || []).reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
    return p.isPublished !== false && totalStock > 0
  })
})

const getProductPrice = (prod) => {
  return Number(prod?.price ?? prod?.basePrice ?? 0)
}

const getMainCategoryCount = (mainCatName) => {
  return allPublishedProducts.value.filter(
    p => p.category === mainCatName || (p.category && p.category.includes(mainCatName))
  ).length
}

const getSubCategoryCount = (mainCatName, subName) => {
  return allPublishedProducts.value.filter(
    p =>
      (p.category === mainCatName || (p.category && p.category.includes(mainCatName))) &&
      (p.subcategory === subName || (p.name && p.name.includes(subName)))
  ).length
}

const getFlatSubItems = (catObj) => {
  if (!catObj || !Array.isArray(catObj.subcategories)) return []
  const items = []
  catObj.subcategories.forEach(group => {
    if (Array.isArray(group.items)) {
      items.push(...group.items)
    }
  })
  return items
}

const toggleMainCategory = (catName) => {
  expandedCategory.value = expandedCategory.value === catName ? '' : catName
}

const openCategorySelector = () => {
  expandedCategory.value = activeMainCategory.value || ''
  isSelectorOpen.value = true
}

const selectSubcategory = (mainCat, subCat) => {
  activeMainCategory.value = mainCat || ''
  activeSubcategory.value = subCat || 'ALL'
  isSelectorOpen.value = false

  const query = {}
  if (mainCat) query.cat = mainCat
  if (subCat) query.sub = subCat
  router.replace({ path: '/category', query })
}

const resetAllCategory = () => {
  activeMainCategory.value = ''
  activeSubcategory.value = 'ALL'
  expandedCategory.value = ''
  isSelectorOpen.value = false
  router.replace({ path: '/category', query: {} })
}

watch(
  () => [route.query.cat, route.query.sub, route.query.openPicker],
  ([newCat, newSub, openPicker]) => {
    activeMainCategory.value = newCat ? decodeURIComponent(String(newCat)) : ''
    activeSubcategory.value = newSub ? decodeURIComponent(String(newSub)) : 'ALL'

    if (openPicker === '1') {
      openCategorySelector()
      const cleanQuery = { ...route.query }
      delete cleanQuery.openPicker
      router.replace({ path: '/category', query: cleanQuery })
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (!route.query.cat && !route.query.sub && window.innerWidth < 992) {
    openCategorySelector()
  }
})

const displayedProducts = computed(() => {
  let list = [...allPublishedProducts.value]

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
    list.sort((a, b) => getProductPrice(a) - getProductPrice(b))
  } else if (sortBy.value === 'PRICE_DESC') {
    list.sort((a, b) => getProductPrice(b) - getProductPrice(a))
  } else {
    list.sort((a, b) => (b.id || 0) - (a.id || 0))
  }

  return list
})
</script>

<style scoped>
/* ==================== 固定於底部的極簡分類選單（Bottom Sheet） ==================== */
.sheet-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1090;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet-panel {
  width: 100%;
  max-width: 540px;
  max-height: 75vh;
  background-color: #ffffff;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 12px);
}

/* 頂部標題列：左右留白 24px，不貼邊框 */
.sheet-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #eee8df;
  background-color: #ffffff;
}

.sheet-title {
  font-size: 16px;
  font-weight: 700;
  color: #2d2621;
  letter-spacing: 0.02em;
}

/* 獨立捲動內容區：標準 Block 流向，左右留白 24px，展開子項時絕不擠壓跑版 */
.sheet-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 6px 24px 24px;
  box-sizing: border-box;
}

.sheet-group {
  border-bottom: 1px solid #f0ece6;
}

.sheet-group:last-child {
  border-bottom: none;
}

/* 大分類按鈕：高度 54px，舒適好點 */
.sheet-main-btn {
  width: 100%;
  min-height: 54px;
  padding: 14px 4px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  font-size: 15px;
  color: #595959;
  cursor: pointer;
  box-sizing: border-box;
  transition: color 0.15s ease;
}

.sheet-main-btn:hover,
.sheet-main-btn.is-active {
  color: #2d2621;
  font-weight: 700;
}

.sheet-main-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sheet-count {
  font-size: 12px;
  color: #9c9289;
  font-weight: 400;
}

.sheet-chevron {
  color: #9c9289;
  flex-shrink: 0;
  transition: transform 0.2s ease, color 0.2s ease;
}

.sheet-chevron.is-open {
  transform: rotate(180deg);
  color: #2d2621;
}

/* 展開後的一行一列小分類清單：柔和米白底色 + 圓角內縮，每列高度 48px 防誤點 */
.sheet-sub-list {
  background-color: #faf8f5;
  border-radius: 12px;
  padding: 6px 16px;
  margin-bottom: 14px;
}

.sheet-sub-btn {
  width: 100%;
  min-height: 48px;
  padding: 12px 4px;
  background: transparent;
  border: none;
  border-bottom: 1px solid #eee8df;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  font-size: 14px;
  color: #595959;
  cursor: pointer;
  box-sizing: border-box;
  transition: color 0.15s ease, padding-left 0.15s ease;
}

.sheet-sub-btn:last-child {
  border-bottom: none;
}

.sheet-sub-btn:hover {
  color: #2d2621;
  padding-left: 8px;
}

.sheet-sub-btn.is-selected {
  color: #2d2621;
  font-weight: 700;
}

.sheet-sub-btn.is-selected .sheet-count {
  color: #2d2621;
  font-weight: 600;
}
</style>