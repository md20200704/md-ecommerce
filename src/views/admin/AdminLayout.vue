<template>
  <div class="admin-layout d-flex flex-column flex-lg-row min-vh-100 bg-light">
    
    <!-- 手機/平板版頂部導覽列（< 992px 顯示） -->
    <header class="d-lg-none bg-dark text-white px-3 py-2.5 d-flex align-items-center justify-content-between sticky-top shadow-sm" style="z-index: 1040;">
      <div class="d-flex align-items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-outline-light rounded-3 px-2 py-1"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          ☰ 選單
        </button>
        <span class="fw-bold font-serif tracking-wide">MD.SELECT 後台管理</span>
      </div>
      <router-link to="/" class="btn btn-light btn-sm rounded-pill px-3 py-1 font-monospace" style="font-size: 11px;">
        返回前台 →
      </router-link>
    </header>

    <!-- 手機版側邊選單遮罩 -->
    <div
      v-if="mobileMenuOpen"
      class="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
      style="z-index: 1045;"
      @click="mobileMenuOpen = false"
    ></div>

    <!-- 左側管理導覽列（桌機固定顯示，手機版滑出抽屜） -->
    <aside
      class="admin-sidebar bg-white border-end d-flex flex-column justify-content-between p-3.5 flex-shrink-0"
      :class="{ 'show-mobile-sidebar': mobileMenuOpen }"
    >
      <div>
        <div class="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
          <div>
            <router-link to="/" class="text-decoration-none text-dark fw-bold fs-5 font-serif d-block">
              MD.SELECT
            </router-link>
            <span class="text-muted font-monospace" style="font-size: 10.5px;">BACKOFFICE SYSTEM</span>
          </div>
          <button
            type="button"
            class="btn-close d-lg-none"
            @click="mobileMenuOpen = false"
          ></button>
        </div>

        <ul class="nav nav-pills flex-column gap-1.5 small font-sans">
          <li v-for="item in navItems" :key="item.path" class="nav-item">
            <router-link
              :to="item.path"
              class="nav-link rounded-3 py-2.5 px-3 d-flex align-items-center justify-content-between"
              :class="isActiveRoute(item.path) ? 'bg-dark text-white fw-bold' : 'text-secondary hover-bg-light'"
              @click="mobileMenuOpen = false"
            >
              <span>{{ item.label }}</span>
              <span class="font-monospace opacity-50" style="font-size: 11px;">›</span>
            </router-link>
          </li>
        </ul>
      </div>

      <div class="pt-3 border-top mt-4">
        <router-link
          to="/"
          class="btn btn-outline-dark btn-sm w-100 rounded-pill py-2 font-monospace"
          style="font-size: 11.5px;"
        >
          ← 返回品牌前台商店
        </router-link>
      </div>
    </aside>

    <!-- 右側主內容工作區（自適應流體寬度，防止表格撐破版面） -->
    <main class="flex-grow-1 p-3 p-md-4 p-xl-5" style="min-width: 0; overflow-x: hidden;">
      <router-view />
    </main>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const mobileMenuOpen = ref(false)

const navItems = [
  { path: '/admin', label: '📊 營運總覽與毛利分析' },
  { path: '/admin/products', label: '👗 商品與即時庫存控管' },
  { path: '/admin/orders', label: '📦 訂單與物流狀態管理' },
  { path: '/admin/marketing', label: '🎟️ 優惠券、VIP 與風控 CRM' },
  { path: '/admin/cms', label: '🎨 首頁視覺與分類樹 CMS' },
  { path: '/admin/logs', label: '🛡️ 系統安全稽核日誌' }
]

const isActiveRoute = (path) => {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}
</script>

<style scoped>
.admin-sidebar {
  width: 250px;
}

.hover-bg-light:hover {
  background-color: #faf8f5;
  color: #2d2621 !important;
}

@media (max-width: 991.98px) {
  .admin-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 1050;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  }

  .admin-sidebar.show-mobile-sidebar {
    transform: translateX(0);
  }
}
</style>