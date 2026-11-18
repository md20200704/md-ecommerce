<template>
  <div class="admin-layout-root d-flex flex-column flex-lg-row min-vh-100" style="background-color: var(--md-bg, #faf9f6);">
    
    <!-- 手機/平板版頂部導覽列（< 992px 顯示，與前台一致的黑底白字高質感極簡風格） -->
    <header class="d-lg-none bg-dark text-white px-3 py-3 d-flex align-items-center justify-content-between sticky-top shadow-2xs" style="z-index: 1040;">
      <div class="d-flex align-items-center gap-2.5">
        <button
          type="button"
          class="btn btn-sm btn-outline-light rounded-pill px-3 py-1.5 font-monospace d-flex align-items-center gap-1"
          style="font-size: 11.5px; border-color: rgba(255, 255, 255, 0.3);"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span>☰ 選單</span>
        </button>
        <span class="fw-bold font-serif tracking-wide" style="letter-spacing: 0.05em; font-size: 14.5px;">M&D SELECT 後台管理</span>
      </div>
      <router-link
        to="/"
        class="btn btn-light btn-sm rounded-pill px-3 py-1.5 font-monospace fw-semibold"
        style="font-size: 11px;"
      >
        返回前台商店 →
      </router-link>
    </header>

    <!-- 手機版側邊選單毛玻璃遮罩 -->
    <div
      v-if="mobileMenuOpen"
      class="d-lg-none position-fixed top-0 start-0 w-100 h-100 modal-backdrop-custom"
      style="z-index: 1045;"
      @click="mobileMenuOpen = false"
    ></div>

    <!-- 左側管理導覽列（桌機固定顯示，手機版平滑滑出抽屜） -->
    <aside
      class="admin-sidebar bg-white border-end d-flex flex-column justify-content-between p-4 flex-shrink-0"
      :class="{ 'show-mobile-sidebar': mobileMenuOpen }"
    >
      <div>
        <!-- 品牌標頭 -->
        <div class="d-flex align-items-center justify-content-between pb-3.5 mb-3.5 border-bottom">
          <div>
            <router-link to="/" class="text-decoration-none text-dark fw-bold fs-5 font-serif d-block" style="letter-spacing: 0.08em;">
              M&D SELECT
            </router-link>
            <span class="text-muted font-monospace" style="font-size: 10px; letter-spacing: 0.06em;">BACKOFFICE ARCHIVE</span>
          </div>
          <button
            type="button"
            class="btn-close d-lg-none shadow-none"
            @click="mobileMenuOpen = false"
          ></button>
        </div>

        <!-- 功能選單列表 -->
        <ul class="nav nav-pills flex-column gap-2 small font-sans">
          <li v-for="item in navItems" :key="item.path" class="nav-item">
            <router-link
              :to="item.path"
              class="admin-sidebar-btn nav-link rounded-pill py-2.5 px-3.5 d-flex align-items-center justify-content-between"
              :class="{ 'active-menu': isActiveRoute(item.path) }"
              @click="mobileMenuOpen = false"
            >
              <span class="fw-semibold" style="font-size: 12.5px;">{{ item.label }}</span>
              <span class="font-monospace opacity-50" style="font-size: 11px;">›</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- 底部返回前台按鈕 -->
      <div class="pt-3 border-top mt-4">
        <router-link
          to="/"
          class="btn btn-outline-dark btn-sm w-100 rounded-pill py-2 font-monospace fw-semibold shadow-2xs"
          style="font-size: 11.5px;"
        >
          ← 返回品牌前台商店
        </router-link>
      </div>
    </aside>

    <!-- 右側主內容工作區（自動撐開、流體寬度、防止表格或長卡片撐破版面） -->
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
  width: 260px;
  border-right-color: var(--md-border, #ede8e1) !important;
  background-color: var(--md-surface, #ffffff) !important;
}

/* 抽屜側邊欄 RWD 手機滑出效果 */
@media (max-width: 991.98px) {
  .admin-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 1050;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1);
    box-shadow: 0 10px 30px rgba(45, 38, 33, 0.15);
  }

  .admin-sidebar.show-mobile-sidebar {
    transform: translateX(0);
  }
}
</style>