<template>
  <div class="admin-layout-wrapper d-flex flex-column flex-lg-row min-vh-100 bg-light">
    
    <!-- 左側後台功能選單側邊欄 (加寬至 300px + 增加間距呼吸感 + 文字靠左) -->
    <aside class="admin-sidebar bg-white border-end p-3.5 p-lg-4 flex-shrink-0">
      <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div class="text-start">
          <div class="fw-bold font-serif text-dark fs-5" style="letter-spacing: 0.08em;">MD.SELECT</div>
          <span class="badge bg-dark font-monospace mt-1" style="font-size: 9.5px;">ADMIN CONSOLE</span>
        </div>
        <router-link
          to="/"
          class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 font-monospace text-nowrap"
          style="font-size: 11px;"
        >
          返回前台 →
        </router-link>
      </div>

      <div class="d-none d-lg-block text-start text-muted font-monospace mb-2.5 px-2" style="font-size: 10.5px; letter-spacing: 0.1em;">
        後台核心管理模組
      </div>

      <!-- 側邊欄按鈕選單群 (寬鬆間距 gap-2 + 充足內距 py-2.5 px-3.5 + 文字靠左) -->
      <nav class="d-flex flex-row flex-lg-column gap-2 overflow-x-auto no-scrollbar pb-2">
        <button
          v-for="tab in navTabs"
          :key="tab.id"
          type="button"
          class="btn rounded-3 px-3.5 py-2.5 d-flex align-items-center justify-content-start text-start gap-3 admin-nav-btn text-nowrap"
          :class="activeMenu === tab.id ? 'btn-dark fw-bold shadow-xs' : 'btn-light text-secondary bg-transparent border-0'"
          @click="activeMenu = tab.id"
        >
          <component :is="tab.icon" style="width: 17px; height: 17px; flex-shrink: 0;" />
          <span class="text-start flex-grow-1">{{ tab.label }}</span>

          <span
            v-if="tab.badgeCount > 0"
            class="badge rounded-pill font-monospace ms-auto"
            :class="activeMenu === tab.id ? 'bg-white text-dark' : tab.badgeClass"
            style="font-size: 10px;"
          >
            {{ tab.badgeCount }}
          </span>
        </button>
      </nav>

      <!-- 桌面版側邊欄底部：當前操作管理員資訊 -->
      <div class="d-none d-lg-block mt-auto pt-4 border-top text-start">
        <div class="p-3 rounded-3 bg-light border">
          <div class="small text-muted font-monospace mb-1" style="font-size: 10px;">目前登入管理員</div>
          <div class="fw-bold text-dark small">{{ authStore.user?.name || '系統管理員' }}</div>
          <div class="text-muted font-monospace" style="font-size: 10.5px;">{{ authStore.user?.email || 'admin@md-korea.com' }}</div>
        </div>
      </div>
    </aside>

    <!-- 右側動態主內容工作區 -->
    <main class="flex-grow-1 p-3 p-md-4 p-lg-5 overflow-x-hidden" style="min-width: 0;">
      <div style="max-width: 1240px; margin: 0 auto;">
        <DashboardView v-if="activeMenu === 'dashboard'" />
        <OrderManageView v-else-if="activeMenu === 'orders'" />
        <ProductManageView v-else-if="activeMenu === 'products'" />
        <MarketingCrmView v-else-if="activeMenu === 'crm'" />
        <CmsLayoutView v-else-if="activeMenu === 'cms'" />
        <AuditLogView v-else-if="activeMenu === 'audit'" />
      </div>
    </main>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Crown,
  LayoutTemplate,
  FileText
} from 'lucide-vue-next'
import DashboardView from './DashboardView.vue'
import OrderManageView from './OrderManageView.vue'
import ProductManageView from './ProductManageView.vue'
import MarketingCrmView from './MarketingCrmView.vue'
import CmsLayoutView from './CmsLayoutView.vue'
import AuditLogView from './AuditLogView.vue'
import { useProductStore } from '../../stores/productStore'
import { useAuthStore } from '../../stores/authStore'
import { useAdminStore } from '../../stores/adminStore'

const productStore = useProductStore()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const activeMenu = ref('dashboard')

const pendingOrderCount = computed(() => {
  return (adminStore.orders || []).filter(o => o.status === '待出貨' || o.status === '處理中').length
})

const lowStockProductCount = computed(() => {
  return (productStore.products || []).filter(p =>
    (p.skus || []).some(sku => sku.stock <= 5)
  ).length
})

const restrictedMemberCount = computed(() => {
  return (authStore.memberList || []).filter(m =>
    m.riskStatus && m.riskStatus !== 'NORMAL'
  ).length
})

const navTabs = computed(() => [
  {
    id: 'dashboard',
    label: '數據統計儀表板',
    icon: LayoutDashboard,
    badgeCount: 0,
    badgeClass: ''
  },
  {
    id: 'orders',
    label: '訂單與物流管理',
    icon: ShoppingBag,
    badgeCount: pendingOrderCount.value,
    badgeClass: 'bg-danger-subtle text-danger'
  },
  {
    id: 'products',
    label: '商品與即時庫存控管',
    icon: Package,
    badgeCount: lowStockProductCount.value,
    badgeClass: 'bg-warning-subtle text-warning-emphasis'
  },
  {
    id: 'crm',
    label: '會員 VIP、優惠券與風控',
    icon: Crown,
    badgeCount: restrictedMemberCount.value,
    badgeClass: 'bg-danger-subtle text-danger'
  },
  {
    id: 'cms',
    label: '首頁輪播與版面配置',
    icon: LayoutTemplate,
    badgeCount: 0,
    badgeClass: ''
  },
  {
    id: 'audit',
    label: '系統操作稽核日誌',
    icon: FileText,
    badgeCount: 0,
    badgeClass: ''
  }
])
</script>

<style scoped>
.admin-sidebar {
  display: flex;
  flex-direction: column;
}

@media (min-width: 992px) {
  .admin-sidebar {
    width: 300px;
    min-height: 100vh;
    position: sticky;
    top: 0;
    height: 100vh;
  }
}

.admin-nav-btn {
  font-size: 13.5px;
  line-height: 1.4;
  text-align: left !important;
  justify-content: flex-start !important;
  transition: all 0.2s ease;
}

.admin-nav-btn:hover:not(.btn-dark) {
  background-color: var(--md-surface-subtle, #f5f2ed) !important;
  color: var(--md-text-primary, #2d2621) !important;
}
</style>