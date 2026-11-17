<template>
  <div class="admin-layout-wrapper d-flex flex-column flex-lg-row min-vh-100 bg-light">
    
    <!-- 左側後台功能選單側邊欄 (功能列表文字一律靠左對齊) -->
    <aside class="admin-sidebar bg-white border-end p-3 p-lg-4 flex-shrink-0">
      <div class="d-flex justify-content-between align-items-center mb-3 mb-lg-4 pb-2.5 border-bottom">
        <div class="text-start">
          <div class="fw-bold font-serif text-dark fs-6" style="letter-spacing: 0.08em;">MD.SELECT</div>
          <span class="badge bg-dark font-monospace" style="font-size: 9px;">ADMIN CONSOLE</span>
        </div>
        <router-link
          to="/"
          class="btn btn-outline-secondary btn-sm rounded-pill px-2.5 py-0.5 font-monospace text-nowrap"
          style="font-size: 11px;"
        >
          返回前台 →
        </router-link>
      </div>

      <!-- 側邊欄分組標題 (靠左) -->
      <div class="d-none d-lg-block text-start text-muted font-monospace mb-2 px-2" style="font-size: 10px; letter-spacing: 0.08em;">
        MANAGEMENT MODULES
      </div>

      <!-- 側邊欄按鈕選單群 (text-start justify-content-start 文字靠左) -->
      <nav class="d-flex flex-row flex-lg-column gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          v-for="tab in navTabs"
          :key="tab.id"
          type="button"
          class="btn btn-sm rounded-3 px-3 py-2.5 d-flex align-items-center justify-content-start text-start gap-2.5 admin-nav-btn text-nowrap"
          :class="activeMenu === tab.id ? 'btn-dark fw-bold shadow-2xs' : 'btn-light text-secondary bg-transparent border-0'"
          @click="selectMenu(tab)"
        >
          <component :is="tab.icon" style="width: 16px; height: 16px; flex-shrink: 0;" />
          <span class="text-start flex-grow-1">{{ tab.label }}</span>

          <!-- 狀態警示徽章 (低庫存 / 風控警示) -->
          <span
            v-if="tab.badgeCount > 0"
            class="badge rounded-pill font-monospace ms-auto"
            :class="activeMenu === tab.id ? 'bg-white text-dark' : tab.badgeClass"
            style="font-size: 9.5px;"
          >
            {{ tab.badgeCount }}
          </span>
        </button>
      </nav>

      <!-- 桌面版側邊欄底部：當前操作管理員資訊 -->
      <div class="d-none d-lg-block mt-auto pt-4 border-top text-start">
        <div class="small text-muted font-monospace mb-1" style="font-size: 10.5px;">目前登入管理員</div>
        <div class="fw-bold text-dark small">{{ authStore.user?.name || '系統管理員' }}</div>
        <div class="text-muted font-monospace" style="font-size: 10.5px;">{{ authStore.user?.email || 'admin@md-korea.com' }}</div>
      </div>
    </aside>

    <!-- 右側動態主內容工作區 -->
    <main class="flex-grow-1 p-3 p-md-4 p-lg-5 overflow-x-hidden" style="min-width: 0;">
      <div style="max-width: 1200px; margin: 0 auto;">
        
        <!-- 模組 1：商品與即時庫存控管 -->
        <ProductManageView v-if="activeMenu === 'products'" />

        <!-- 模組 2：會員 VIP、優惠券與黑名單控管 -->
        <MarketingCrmView
          v-else-if="activeMenu === 'crm'"
          :initial-tab="crmInitialTab"
        />

        <!-- 模組 3：全站營運概況與稽核日誌 -->
        <div v-else-if="activeMenu === 'dashboard'" class="d-flex flex-column gap-4">
          <div class="text-start">
            <h1 class="h4 fw-bold text-dark font-serif mb-1">全站營運概況與系統稽核日誌</h1>
            <p class="small text-muted mb-0">即時檢視商品庫存總覽、會員規模、VIP 分布與後台異動操作紀錄</p>
          </div>

          <!-- 營運指標卡片 -->
          <div class="row g-3">
            <div class="col-6 col-md-3">
              <div class="card-korean bg-white p-3.5 border shadow-xs text-start">
                <div class="text-muted small font-monospace">架上商品總數</div>
                <div class="h4 fw-bold font-monospace text-dark mb-0 mt-1">
                  {{ productStore.products?.length || 0 }} 款
                </div>
                <div v-if="lowStockProductCount > 0" class="text-danger font-monospace mt-1" style="font-size: 10.5px;">
                  ⚠ {{ lowStockProductCount }} 款低庫存預警
                </div>
              </div>
            </div>

            <div class="col-6 col-md-3">
              <div class="card-korean bg-white p-3.5 border shadow-xs text-start">
                <div class="text-muted small font-monospace">全館會員總人數</div>
                <div class="h4 fw-bold font-monospace text-dark mb-0 mt-1">
                  {{ authStore.memberList?.length || 0 }} 位
                </div>
                <div class="text-muted font-monospace mt-1" style="font-size: 10.5px;">
                  含生日建檔 {{ birthdayRegisteredCount }} 位
                </div>
              </div>
            </div>

            <div class="col-6 col-md-3">
              <div class="card-korean bg-white p-3.5 border shadow-xs text-start">
                <div class="text-muted small font-monospace">VIP 尊榮會員數</div>
                <div class="h4 fw-bold font-monospace text-primary mb-0 mt-1">
                  {{ vipMemberCount }} 位
                </div>
                <div class="text-muted font-monospace mt-1" style="font-size: 10.5px;">
                  銀卡 / 金卡 / 黑鑽 VIP
                </div>
              </div>
            </div>

            <div class="col-6 col-md-3">
              <div class="card-korean bg-white p-3.5 border shadow-xs text-start">
                <div class="text-muted small font-monospace">風險管制中帳號</div>
                <div class="h4 fw-bold font-monospace text-danger mb-0 mt-1">
                  {{ restrictedMemberCount }} 位
                </div>
                <div class="text-muted font-monospace mt-1" style="font-size: 10.5px;">
                  限制取付 / 凍結 / 黑名單
                </div>
              </div>
            </div>
          </div>

          <!-- 系統稽核操作日誌列表 -->
          <div class="card-korean bg-white p-3.5 p-md-4 border shadow-xs text-start">
            <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h2 class="fs-6 fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                <FileText style="width: 16px; height: 16px;" class="text-primary" />
                <span>即時系統操作與交易稽核日誌 (Audit Logs)</span>
              </h2>
              <span class="badge bg-light text-secondary border font-monospace" style="font-size: 10.5px;">
                共 {{ auditLogList.length }} 筆紀錄
              </span>
            </div>

            <div v-if="auditLogList.length > 0" class="table-responsive">
              <table class="table table-hover align-middle small mb-0 font-sans">
                <thead class="table-light">
                  <tr class="text-secondary text-nowrap" style="font-size: 11px;">
                    <th style="min-width: 150px;">時間戳記</th>
                    <th style="min-width: 150px;">操作項目</th>
                    <th style="min-width: 300px;">詳細異動內容</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(log, idx) in auditLogList" :key="log.id || idx">
                    <td class="font-monospace text-muted text-nowrap" style="font-size: 11px;">
                      {{ log.timestamp || log.time || '剛剛' }}
                    </td>
                    <td>
                      <span class="badge bg-dark-subtle text-dark font-monospace" style="font-size: 10.5px;">
                        {{ log.action || log.title || '系統紀錄' }}
                      </span>
                    </td>
                    <td class="text-dark">
                      {{ log.detail || log.description || log.message }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="text-center py-5 text-muted small">
              目前尚無操作異動紀錄，當您調整商品、VIP 等級、黑名單或完成訂單時將自動記錄於此。
            </div>
          </div>
        </div>

      </div>
    </main>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Package, Crown, LayoutDashboard, FileText } from 'lucide-vue-next'
import ProductManageView from './ProductManageView.vue'
import MarketingCrmView from './MarketingCrmView.vue'
import { useProductStore } from '../../stores/productStore'
import { useAuthStore } from '../../stores/authStore'
import { useAdminStore } from '../../stores/adminStore'

const productStore = useProductStore()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const activeMenu = ref('products')
const crmInitialTab = ref('vip_tiers')

// 計算低庫存（任一 SKU ≤ 5 件）商品數量
const lowStockProductCount = computed(() => {
  return (productStore.products || []).filter(p =>
    (p.skus || []).some(sku => sku.stock <= 5)
  ).length
})

// 計算 VIP 會員人數
const vipMemberCount = computed(() => {
  return (authStore.memberList || []).filter(m =>
    ['SILVER', 'GOLD', 'DIAMOND'].includes(m.vipTierId)
  ).length
})

// 計算已填寫生日之會員人數
const birthdayRegisteredCount = computed(() => {
  return (authStore.memberList || []).filter(m => Boolean(m.birthday)).length
})

// 計算受風控管制（非 NORMAL）之會員人數
const restrictedMemberCount = computed(() => {
  return (authStore.memberList || []).filter(m =>
    m.riskStatus && m.riskStatus !== 'NORMAL'
  ).length
})

// 後台側邊欄導航選單（文字全部靠左對齊，並動態顯示狀態提示徽章）
const navTabs = computed(() => [
  {
    id: 'products',
    label: '商品與即時庫存控管',
    icon: Package,
    badgeCount: lowStockProductCount.value,
    badgeClass: 'bg-warning-subtle text-warning-emphasis'
  },
  {
    id: 'crm',
    label: '會員 VIP、優惠券與黑名單控管',
    icon: Crown,
    badgeCount: restrictedMemberCount.value,
    badgeClass: 'bg-danger-subtle text-danger'
  },
  {
    id: 'dashboard',
    label: '全站營運概況與稽核日誌',
    icon: LayoutDashboard,
    badgeCount: 0,
    badgeClass: ''
  }
])

const selectMenu = (tab) => {
  activeMenu.value = tab.id
}

// 取得稽核日誌清單
const auditLogList = computed(() => {
  return adminStore.auditLogs || []
})
</script>

<style scoped>
.admin-sidebar {
  display: flex;
  flex-direction: column;
}

@media (min-width: 992px) {
  .admin-sidebar {
    width: 280px;
    min-height: 100vh;
    position: sticky;
    top: 0;
    height: 100vh;
  }
}

.admin-nav-btn {
  font-size: 13px;
  text-align: left !important;
  justify-content: flex-start !important;
  transition: all 0.2s ease;
}

.admin-nav-btn:hover:not(.btn-dark) {
  background-color: var(--md-surface-subtle, #f5f2ed) !important;
  color: var(--md-text-primary, #2d2621) !important;
}
</style>