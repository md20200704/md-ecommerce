<template>
  <header class="sticky-top bg-white border-bottom shadow-2xs" style="z-index: 1030;">
    <nav class="navbar-grid-container px-3 px-md-4 px-xl-5 py-3">
      
      <!-- 1. 最左側：品牌 Logo（點擊返回首頁） -->
      <div class="d-flex align-items-center justify-content-start">
        <router-link
          to="/"
          class="text-decoration-none text-dark fw-bold fs-4 font-serif tracking-wide flex-shrink-0"
          style="letter-spacing: 0.08em;"
        >
          MD.SELECT
        </router-link>
      </div>

      <!-- 2. 正中央：完全依照後台 categoryTree 動態渲染主分類與細項 -->
      <ul class="nav d-none d-lg-flex align-items-center justify-content-center gap-3 mb-0">
        <li
          v-for="cat in marketingStore.categoryTree"
          :key="cat.name"
          class="nav-item dropdown nav-category-dropdown position-relative"
        >
          <button
            type="button"
            class="btn btn-link nav-link nav-cat-btn text-dark small fw-semibold px-3 py-1.5 text-decoration-none d-inline-flex align-items-center gap-1.5 text-nowrap"
            :class="{ 'is-active-cat': isCurrentMainCategory(cat.name) }"
            @click="goToCategory(cat.name, '')"
          >
            <span>{{ cat.name }}</span>
            <ChevronDown
              v-if="hasSubcategories(cat)"
              style="width: 13px; height: 13px;"
              class="opacity-50 transition-chevron"
            />
          </button>

          <!-- 滑鼠懸停展開細項子分類選單 -->
          <div
            v-if="hasSubcategories(cat)"
            class="dropdown-menu rounded-4 border shadow-sm p-3.5 mt-0 nav-mega-menu"
            style="min-width: 240px;"
          >
            <div class="d-flex flex-column gap-3">
              <div v-for="group in (cat.subcategories || [])" :key="group.name">
                <div
                  v-if="group.name"
                  class="text-muted font-monospace px-2.5 mb-1.5"
                  style="font-size: 10.5px; letter-spacing: 0.04em;"
                >
                  {{ group.name }}
                </div>
                <div class="d-flex flex-column gap-1">
                  <button
                    v-for="item in (group.items || [])"
                    :key="item"
                    type="button"
                    class="dropdown-item rounded-3 small py-1.5 px-2.5 text-dark d-flex align-items-center justify-content-between"
                    :class="{ 'fw-bold bg-light': isCurrentSubCategory(cat.name, item) }"
                    @click="goToCategory(cat.name, item)"
                  >
                    <span>{{ item }}</span>
                    <span class="text-muted opacity-50 font-monospace" style="font-size: 11px;">›</span>
                  </button>
                </div>
              </div>

              <div class="border-top pt-2.5 mt-0.5">
                <button
                  type="button"
                  class="dropdown-item rounded-3 small py-1.5 px-2.5 fw-bold text-primary"
                  @click="goToCategory(cat.name, '')"
                >
                  瀏覽全部 {{ cat.name }} →
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <!-- 3. 最右側：功能按鈕群（會員中心 / 後台 / 購物袋） -->
      <div class="d-flex align-items-center justify-content-end gap-2 flex-shrink-0">
        <router-link to="/profile" class="btn btn-outline-dark btn-sm rounded-pill px-3.5 py-1.5 font-sans text-nowrap">
          會員中心
        </router-link>
        <router-link
          v-if="authStore.isAdmin"
          to="/admin"
          class="btn btn-dark btn-sm rounded-pill px-3.5 py-1.5 font-monospace text-nowrap"
          style="font-size: 11.5px;"
        >
          後台管理
        </router-link>
        <button
          type="button"
          class="btn btn-light border btn-sm rounded-pill px-3.5 py-1.5 font-monospace position-relative text-nowrap"
          @click="openCartDrawer"
        >
          購物袋 ({{ cartStore.totalCount || 0 }})
        </button>
      </div>
    </nav>

    <!-- 手機版：橫向滑動分類快捷列（僅顯示後台設定之主分類） -->
    <div
      v-if="(marketingStore.categoryTree || []).length > 0"
      class="d-flex d-lg-none gap-2 px-3 py-2 border-top bg-light overflow-x-auto no-scrollbar"
    >
      <button
        v-for="cat in marketingStore.categoryTree"
        :key="cat.name"
        type="button"
        class="btn btn-sm rounded-pill px-3.5 py-1 text-nowrap small transition-pill"
        :class="isCurrentMainCategory(cat.name) ? 'btn-dark fw-bold' : 'btn-white bg-white border text-dark'"
        @click="goToCategory(cat.name, '')"
      >
        {{ cat.name }}
      </button>
    </div>
  </header>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'
import { useMarketingStore } from '../stores/marketingStore'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'

const route = useRoute()
const router = useRouter()
const marketingStore = useMarketingStore()
const authStore = useAuthStore()
const cartStore = useCartStore()

const hasSubcategories = (cat) => {
  return Array.isArray(cat?.subcategories) && cat.subcategories.some(g => Array.isArray(g.items) && g.items.length > 0)
}

const isCurrentMainCategory = (catName) => {
  if (route.path !== '/category' && !route.path.startsWith('/category/')) return false
  const currentCat = decodeURIComponent(String(route.query.cat || route.params.category || ''))
  return currentCat === catName
}

const isCurrentSubCategory = (catName, subName) => {
  if (!isCurrentMainCategory(catName)) return false
  const currentSub = decodeURIComponent(String(route.query.sub || ''))
  return currentSub === subName
}

const openCartDrawer = () => {
  if (typeof cartStore.openDrawer === 'function') {
    cartStore.openDrawer()
  } else if ('isOpen' in cartStore) {
    cartStore.isOpen = true
  } else if ('isDrawerOpen' in cartStore) {
    cartStore.isDrawerOpen = true
  }
}

const goToCategory = (mainCategory, subCategory) => {
  const query = {}
  if (mainCategory) query.cat = mainCategory
  if (subCategory) query.sub = subCategory

  router.push({
    path: '/category',
    query
  })
}
</script>

<style scoped>
/* 桌面版三欄式全寬佈局：Logo 貼最左、分類正置中、功能鈕貼最右 */
.navbar-grid-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media (min-width: 992px) {
  .navbar-grid-container {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1rem;
  }
}

.nav-cat-btn {
  position: relative;
  letter-spacing: 0.02em;
  transition: color 0.2s ease;
}

.nav-cat-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background-color: #2d2621;
  transition: width 0.22s ease, left 0.22s ease;
}

.nav-category-dropdown:hover .nav-cat-btn::after,
.nav-cat-btn.is-active-cat::after {
  width: 65%;
  left: 17.5%;
}

.nav-category-dropdown:hover .transition-chevron {
  transform: rotate(180deg);
}

.transition-chevron {
  transition: transform 0.2s ease;
}

.nav-category-dropdown:hover .nav-mega-menu {
  display: block;
}

.nav-mega-menu {
  border-color: #ebe5dd !important;
  box-shadow: 0 10px 28px rgba(45, 38, 33, 0.08) !important;
}

.dropdown-item {
  transition: background-color 0.15s ease, padding-left 0.15s ease;
}

.dropdown-item:hover {
  background-color: #faf8f5;
  padding-left: 0.85rem !important;
}

.transition-pill {
  transition: all 0.2s ease;
}
</style>