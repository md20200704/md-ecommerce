<template>
  <div>
    <!-- 固定在最上方的導覽列 -->
    <header class="navbar-fixed-top bg-white border-bottom shadow-2xs">
      <nav class="navbar-grid-container px-3 px-md-4 px-xl-5 py-2.5 py-lg-3">
        
        <!-- 1. 最左側：品牌 Logo -->
        <div class="d-flex align-items-center justify-content-start">
          <router-link
            to="/"
            class="text-decoration-none text-dark fw-bold fs-4 font-serif tracking-wide flex-shrink-0"
            style="letter-spacing: 0.08em;"
          >
            M&D SELECT
          </router-link>
        </div>

        <!-- 2. 正中央：桌機版動態商品分類選單（RWD 手機版隱藏，改由分層選購抽屜負責） -->
        <ul class="nav d-none d-lg-flex align-items-center justify-content-center gap-2 gap-xl-3 mb-0">
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
              class="dropdown-menu rounded-4 border shadow-sm p-4 nav-mega-menu"
              style="min-width: 250px;"
            >
              <div class="d-flex flex-column gap-3.5">
                <div v-for="group in (cat.subcategories || [])" :key="group.name">
                  <div
                    v-if="group.name"
                    class="text-muted font-monospace px-2.5 mb-2"
                    style="font-size: 11px; letter-spacing: 0.05em;"
                  >
                    {{ group.name }}
                  </div>
                  <div class="d-flex flex-column gap-1">
                    <button
                      v-for="item in (group.items || [])"
                      :key="item"
                      type="button"
                      class="dropdown-item rounded-3 small py-2 px-2.5 text-dark d-flex align-items-center justify-content-between"
                      :class="{ 'fw-bold bg-light': isCurrentSubCategory(cat.name, item) }"
                      @click="goToCategory(cat.name, item)"
                    >
                      <span>{{ item }}</span>
                      <span class="text-muted opacity-50 font-monospace" style="font-size: 11px;">›</span>
                    </button>
                  </div>
                </div>

                <div class="border-top pt-3 mt-1">
                  <button
                    type="button"
                    class="dropdown-item rounded-3 small py-2 px-2.5 fw-bold text-primary"
                    @click="goToCategory(cat.name, '')"
                  >
                    瀏覽全部 {{ cat.name }} →
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>

        <!-- 3. 最右側：功能按鈕群（僅在桌機版 d-lg-flex 顯示，RWD 時隱藏） -->
        <div class="d-none d-lg-flex align-items-center justify-content-end gap-2 flex-shrink-0">
          <router-link
            v-if="authStore.isAuthenticated"
            to="/profile"
            class="btn btn-outline-dark btn-sm rounded-pill px-3.5 py-1.5 font-sans text-nowrap"
          >
            {{ authStore.user?.name || '會員中心' }}
          </router-link>
          <button
            v-else
            type="button"
            class="btn btn-outline-dark btn-sm rounded-pill px-3.5 py-1.5 font-sans text-nowrap"
            @click="$emit('open-auth')"
          >
            登入 / 註冊
          </button>

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
    </header>

    <!-- 頂部佔位高度（防止 Fixed Navbar 蓋住頁面內容） -->
    <div class="navbar-spacer"></div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'
import { useMarketingStore } from '../stores/marketingStore'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'

defineEmits(['open-auth'])

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
  } else {
    cartStore.isOpen = true
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
.navbar-fixed-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1030;
}

.navbar-spacer {
  height: 58px;
}

@media (min-width: 992px) {
  .navbar-spacer {
    height: 66px;
  }
}

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

.nav-category-dropdown::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -14px;
  height: 14px;
}

.nav-category-dropdown:hover .nav-mega-menu {
  display: block;
}

.nav-mega-menu {
  margin-top: 10px !important;
  border-color: #ebe5dd !important;
  box-shadow: 0 12px 32px rgba(45, 38, 33, 0.08) !important;
}

.dropdown-item {
  transition: background-color 0.15s ease, padding-left 0.15s ease;
}

.dropdown-item:hover {
  background-color: #faf8f5;
  padding-left: 0.85rem !important;
}
</style>