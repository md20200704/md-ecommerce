<template>
  <div class="admin-layout-root d-flex flex-column flex-lg-row min-vh-100" style="background-color: var(--md-bg, #faf9f6);">
    
    <!-- 手機/平板版頂部導覽列 -->
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
        <span class="fw-bold font-serif tracking-wide" style="letter-spacing: 0.05em; font-size: 14.5px;">M&amp;D SELECT 後台管理</span>
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

    <!-- 左側管理導覽列 -->
    <aside
      class="admin-sidebar bg-white border-end d-flex flex-column justify-content-between p-3 p-lg-3.5 flex-shrink-0"
      :class="{ 'show-mobile-sidebar': mobileMenuOpen }"
    >
      <div class="d-flex flex-column flex-grow-1 min-h-0">
        <!-- 品牌標頭 -->
        <div class="d-flex align-items-center justify-content-between pb-2.5 mb-2.5 border-bottom flex-shrink-0">
          <div>
            <router-link to="/" class="text-decoration-none text-dark fw-bold fs-5 font-serif d-block" style="letter-spacing: 0.08em;">
              M&amp;D SELECT
            </router-link>
            <span class="text-muted font-monospace" style="font-size: 10px; letter-spacing: 0.06em;">BACKOFFICE ARCHIVE</span>
          </div>
          <button
            type="button"
            class="btn-close d-lg-none shadow-none"
            @click="mobileMenuOpen = false"
          ></button>
        </div>

        <!-- 功能選單列表（空間不足時僅在列表內部捲動，不擠壓底部按鈕） -->
        <ul class="nav nav-pills flex-column gap-1.5 small font-sans overflow-y-auto no-scrollbar pe-0.5 flex-grow-1">
          <li v-for="item in navItems" :key="item.path" class="nav-item">
            <router-link
              :to="item.path"
              class="admin-sidebar-btn nav-link rounded-pill py-2 px-3 d-flex align-items-center justify-content-between"
              :class="{ 'active-menu': isActiveRoute(item.path) }"
              @click="mobileMenuOpen = false"
            >
              <span class="fw-semibold" style="font-size: 12.5px;">{{ item.label }}</span>
              <span class="font-monospace opacity-50" style="font-size: 11px;">›</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- 底部返回前台與登出按鈕（固定於左側面板底部） -->
      <div class="pt-2.5 border-top mt-2 d-flex flex-column gap-2 flex-shrink-0 bg-white">
        <router-link
          to="/"
          class="btn btn-outline-dark btn-sm w-100 rounded-pill py-2 font-monospace fw-semibold shadow-2xs"
          style="font-size: 11.5px;"
        >
          ← 返回品牌前台商店
        </router-link>
        <button
          type="button"
          class="btn btn-outline-danger btn-sm w-100 rounded-pill py-2 font-monospace fw-semibold"
          style="font-size: 11.5px;"
          @click="handleAdminLogout"
        >
          登出管理員帳號
        </button>
      </div>
    </aside>

    <!-- 右側主內容工作區 -->
    <main class="flex-grow-1 p-3 p-md-4 p-xl-5" style="min-width: 0; overflow-x: hidden;">
      <router-view />
    </main>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { showConfirm } from '../../composables/useConfirm'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const navItems = [
  { path: '/admin', label: '📊 營運總覽與毛利分析' },
  { path: '/admin/products', label: '👗 商品與即時庫存控管' },
  { path: '/admin/orders', label: '📦 訂單與物流狀態管理' },
  { path: '/admin/marketing', label: '🎟️ 優惠券、VIP 與風控 CRM' },
  { path: '/admin/cms', label: '🎨 首頁視覺與分類樹 CMS' },
  { path: '/admin/cs', label: '💬 客服訊息與即時對話' },
  { path: '/admin/logs', label: '🛡️ 系統安全稽核日誌' }
]

const isActiveRoute = (path) => {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}

const handleAdminLogout = async () => {
  const ok = await showConfirm('確定要登出後台管理員帳號並返回首頁嗎？', {
    title: '登出管理後台',
    confirmText: '確定登出',
    cancelText: '取消',
    danger: true
  })
  if (ok) {
    authStore.logout()
    mobileMenuOpen.value = false
    router.push('/')
  }
}
</script>

<style scoped>
.admin-sidebar {
  width: 260px;
  border-right-color: var(--md-border, #ede8e1) !important;
  background-color: var(--md-surface, #ffffff) !important;
}

@media (min-width: 992px) {
  .admin-sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
  }
}

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