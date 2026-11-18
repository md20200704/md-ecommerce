<template>
  <div class="d-flex flex-column gap-4 w-100" style="min-width: 0; overflow-x: hidden;">
    <!-- 頂部頁頭 -->
    <div class="d-flex justify-content-between align-items-end flex-wrap gap-2 px-1">
      <div>
        <h1 class="h4 fw-bold text-dark font-serif mb-1">訂單與物流出貨管理</h1>
        <p class="small text-muted mb-0">即時接收顧客取消訂單申請、更新出貨單號，完成訂單時自動依「折抵後實付金額」結算消費與紅利</p>
      </div>
      <span class="badge bg-white text-dark border px-3.5 py-2 rounded-pill font-monospace small shadow-2xs">
        全站總訂單：{{ allOrders.length }} 筆
      </span>
    </div>

    <!-- 🔔 顧客申請取消訂單即時通知橫幅 -->
    <div
      v-if="pendingCancelOrders.length > 0"
      class="alert alert-warning rounded-4 border-warning p-3.5 mb-0 shadow-2xs d-flex flex-column gap-2"
    >
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="fw-bold text-dark d-flex align-items-center gap-2 small">
          <span>🔔 商家通知：目前有 {{ pendingCancelOrders.length }} 筆未出貨訂單由顧客提出「取消申請」，請確認處理：</span>
        </div>
        <button
          type="button"
          class="btn btn-dark btn-sm rounded-pill px-3 py-1 font-monospace"
          style="font-size: 11px;"
          @click="selectedStatusNode = 'RETURN'; triggerSearch()"
        >
          篩選查看取消申請
        </button>
      </div>

      <div class="d-flex flex-column gap-2 mt-1">
        <div
          v-for="cOrd in pendingCancelOrders"
          :key="cOrd.orderId || cOrd.id"
          class="bg-white rounded-3 p-2.5 px-3 border d-flex align-items-center justify-content-between flex-wrap gap-2 small"
        >
          <div class="font-monospace">
            <strong class="text-dark">#{{ cOrd.orderId || cOrd.id }}</strong>
            <span class="text-secondary ms-2">{{ cOrd.recipientName || cOrd.customerName }} ({{ cOrd.phone }})</span>
            <span class="text-danger ms-2">原因：{{ cOrd.cancelReason || '顧客申請取消未出貨訂單' }}</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button
              type="button"
              class="btn btn-danger btn-sm rounded-pill px-3 py-1 font-monospace fw-bold"
              style="font-size: 11px;"
              @click="handleApproveCancel(cOrd)"
            >
              ✓ 確認取消訂單 (回補庫存)
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 font-monospace"
              style="font-size: 11px;"
              @click="handleRejectCancel(cOrd)"
            >
              駁回申請
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 1. 訂單狀態流程篩選條 -->
    <div class="card-korean p-3 p-md-4 bg-white">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-dark font-monospace" style="font-size: 10px;">ORDER FLOW</span>
          <strong class="fs-6 font-serif text-dark">訂單狀態與出貨漏斗篩選</strong>
        </div>
        <span class="text-muted font-monospace" style="font-size: 11px;">
          點選節點快速過濾商家待辦訂單
        </span>
      </div>

      <div class="order-flow-scroll no-scrollbar">
        <div class="order-flow-track">
          <div class="order-flow-line"></div>

          <button
            v-for="node in orderFlowNodes"
            :key="node.key"
            type="button"
            class="flow-node-btn"
            :class="{ 'is-selected': selectedStatusNode === node.key }"
            @click="selectedStatusNode = node.key; triggerSearch()"
          >
            <div class="position-relative">
              <div class="flow-node-circle">
                <component :is="node.icon" style="width: 16px; height: 16px;" />
              </div>

              <span
                v-if="getOrderCountByNode(node.key) > 0"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill font-monospace bg-secondary text-white"
                style="font-size: 9.5px;"
              >
                {{ getOrderCountByNode(node.key) }}
              </span>
            </div>

            <div
              class="mt-2 font-sans fw-bold"
              :class="selectedStatusNode === node.key ? 'text-dark' : 'text-muted'"
              style="font-size: 12px;"
            >
              {{ node.label }}
            </div>

            <div class="text-muted font-monospace d-none d-sm-block mt-0.5" style="font-size: 10px;">
              {{ node.sublabel }}
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. 進階搜尋與篩選工具列（已優化美化與 RWD 自適應） -->
    <div class="card-korean p-3.5 px-4 bg-white rounded-4 border shadow-xs">
      <div class="row g-3 align-items-center">
        <!-- 關鍵字搜尋框 -->
        <div class="col-12 col-md-5">
          <label class="form-label text-secondary mb-1" style="font-size: 11px;">關鍵字搜尋</label>
          <input
            v-model="tempKeyword"
            type="text"
            class="form-control form-control-sm rounded-pill px-3.5 py-2"
            placeholder="搜尋訂單編號、收件人、手機、物流單號..."
          />
        </div>

        <!-- 配送方式下拉選單 -->
        <div class="col-12 col-sm-6 col-md-3">
          <label class="form-label text-secondary mb-1" style="font-size: 11px;">配送方式篩選</label>
          <select v-model="tempShippingFilter" class="form-select form-select-sm rounded-pill font-monospace py-2">
            <option value="ALL">全部配送方式</option>
            <option value="HOME">黑貓宅配到府</option>
            <option value="CVS">7-11 / 全家超取</option>
          </select>
        </div>

        <!-- 查詢與重置按鈕區 -->
        <div class="col-12 col-sm-6 col-md-4 d-flex align-items-end gap-2 pt-1 pt-sm-0">
          <button
            type="button"
            class="btn btn-dark btn-sm rounded-pill px-4 py-2 font-monospace fw-bold shadow-2xs flex-grow-1"
            style="margin-top: auto;"
            @click="triggerSearch"
          >
            🔍 查詢訂單
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm rounded-pill px-3.5 py-2 font-monospace flex-grow-1"
            style="margin-top: auto;"
            @click="resetFilters"
          >
            重置條件
          </button>
        </div>
      </div>
    </div>

    <!-- 3. 訂單列表區 -->
    <div class="d-flex flex-column gap-3">
      <div class="d-flex justify-content-between align-items-center px-1">
        <div class="d-flex align-items-center gap-2">
          <h2 class="fs-6 fw-bold text-dark font-serif mb-0">{{ currentFilterNodeLabel }}</h2>
          <span class="text-muted small font-monospace">({{ filteredOrders.length }})</span>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button
            v-if="filteredOrders.length > 0"
            type="button"
            class="btn btn-link btn-sm text-secondary text-decoration-none p-0 px-2 font-monospace"
            style="font-size: 12px;"
            @click="toggleAllOrders"
          >
            {{ areAllFilteredExpanded ? '全部收合' : '全部展開' }}
          </button>
          <button
            v-if="selectedStatusNode !== 'ALL' || appliedKeyword || appliedShippingFilter !== 'ALL'"
            type="button"
            class="btn btn-outline-dark btn-sm rounded-pill px-3 py-0.5 font-monospace"
            style="font-size: 11px;"
            @click="resetFilters"
          >
            查看全部
          </button>
        </div>
      </div>

      <!-- 單筆訂單卡片 -->
      <div v-if="filteredOrders.length > 0" class="d-flex flex-column gap-3.5">
        <div
          v-for="ord in filteredOrders"
          :key="ord.orderId || ord.id"
          class="minimal-order-card bg-white rounded-4 border overflow-hidden"
          :class="{ 'is-open': isOrderExpanded(ord.orderId || ord.id) }"
        >
          <!-- 收合標頭列 -->
          <div
            class="minimal-order-header"
            @click="toggleOrderExpand(ord.orderId || ord.id)"
          >
            <!-- 左區：訂單編號與買家資訊 -->
            <div class="order-head-main">
              <span class="font-monospace fw-bold text-dark" style="font-size: 15.5px; letter-spacing: 0.02em;">
                #{{ ord.orderId || ord.id }}
              </span>
              <span class="text-muted font-monospace" style="font-size: 12px;">
                買家：{{ ord.recipientName || ord.customerName || '會員' }} ({{ ord.phone || '無電話' }}) · {{ ord.createdAt || ord.date }}
              </span>
            </div>

            <!-- 中區：訂單狀態膠囊 + 總件數 -->
            <div class="order-head-status">
              <span
                class="status-pill"
                :class="getCleanStatusClass(ord.status)"
              >
                <span class="status-dot"></span>
                <span>{{ ord.status }}</span>
              </span>

              <span class="order-qty-pill font-monospace">
                共 {{ getOrderTotalQty(ord) }} 件商品
              </span>
            </div>

            <!-- 右區：實付總額與出貨按鈕在同一行（總額靠左、出貨按鈕靠右） -->
            <div class="order-head-price">
              
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 w-100">
                <!-- 左側：實付總額（帶有空格） -->
                <div class="d-flex align-items-baseline" style="gap: 6px;">
                  <span class="text-muted font-monospace" style="font-size: 11.5px;">實付總額</span>
                  <span class="font-monospace fw-bold text-dark" style="font-size: 17.5px;">
                    NT$ {{ getOrderPaidAmount(ord).toLocaleString() }}
                  </span>
                </div>

                <!-- 右側：商家快捷操作按鈕（僅在未展開時計，點擊 @click.stop 不觸發展開） -->
                <div v-if="!isOrderExpanded(ord.orderId || ord.id)" class="d-flex align-items-center gap-2" @click.stop>
                  <button
                    v-if="['待出貨', '處理中', '已付款'].includes(ord.status)"
                    type="button"
                    class="btn btn-dark btn-sm rounded-pill px-3.5 py-1 font-monospace fw-bold shadow-2xs"
                    style="font-size: 11.5px;"
                    @click.stop="openShipModal(ord)"
                  >
                    📦 立即出貨
                  </button>

                  <button
                    v-if="ord.status === '申請取消中'"
                    type="button"
                    class="btn btn-danger btn-sm rounded-pill px-3.5 py-1 font-monospace fw-bold shadow-2xs"
                    style="font-size: 11.5px;"
                    @click.stop="handleApproveCancel(ord)"
                  >
                    確認取消
                  </button>
                </div>
              </div>

              <!-- 第二行（下一行）：展開／收合明細按鈕（靠右放置） -->
              <div class="d-flex align-items-center justify-content-end w-100 mt-1" style="gap: 4px;">
                <span class="text-primary font-monospace fw-semibold" style="font-size: 11.5px;">
                  {{ isOrderExpanded(ord.orderId || ord.id) ? '收合明細' : '展開明細' }}
                </span>
                <ChevronDown
                  style="width: 13px; height: 13px;"
                  class="text-primary transition-icon flex-shrink-0"
                  :class="{ 'rotate-180': isOrderExpanded(ord.orderId || ord.id) }"
                />
              </div>

            </div>
          </div>

          <!-- ==================== 展開後的整筆訂單完整明細區 ==================== -->
          <div v-show="isOrderExpanded(ord.orderId || ord.id)" class="minimal-order-body border-top">
            
            <!-- 區塊 A：物流與結算狀態列 -->
            <div class="order-meta-bar">
              <div class="d-flex flex-wrap align-items-center" style="gap: 12px 20px; font-size: 12.5px;">
                <span class="font-monospace text-secondary">付款方式：<strong class="text-dark">{{ ord.paymentMethod || 'LINE Pay' }}</strong></span>
                <span class="font-monospace text-secondary">配送方式：<strong class="text-dark">{{ (ord.shippingMethod || ord.shippingType) === 'CVS' ? '超商純取貨' : '黑貓宅配' }}</strong></span>
                <span class="font-monospace text-secondary">
                  物流單號：<strong class="text-dark">{{ ord.trackingNumber || ord.trackingCode || '尚未填寫' }}</strong>
                </span>
              </div>

              <div class="font-monospace" style="font-size: 12px;">
                <span v-if="ord.rewardsSettled" class="text-success fw-semibold">
                  ✓ 已完成結算消費與紅利點數
                </span>
                <span v-else-if="ord.status === '申請取消中'" class="text-danger fw-semibold">
                  ⏳ 顧客已提出取消申請，請盡速確認
                </span>
                <span v-else class="text-muted">
                  目前訂單狀態：{{ ord.status }}
                </span>
              </div>
            </div>

            <!-- 區塊 B：購買商品清單 -->
            <div class="mb-4">
              <div class="section-sub-label font-monospace mb-2.5">
                1. 購買商品項目明細 (ITEMS)
              </div>

              <div style="display: flex; flex-direction: column; gap: 14px;">
                <div
                  v-for="(item, idx) in (ord.items || [])"
                  :key="idx"
                  class="order-item-row"
                >
                  <div class="order-item-left">
                    <div class="order-item-thumb">
                      <img
                        :src="getItemImage(item)"
                        :alt="item.name"
                        class="w-100 h-100 object-fit-cover"
                      />
                    </div>

                    <div class="order-item-info">
                      <div class="order-item-title text-dark fw-bold">
                        {{ item.name }}
                      </div>

                      <div class="font-monospace text-secondary" style="font-size: 12.5px;">
                        規格：{{ item.color || '標準色' }} / {{ item.size || 'F' }}
                      </div>

                      <div class="font-monospace text-muted" style="font-size: 12px;">
                        單價 NT$ {{ Number(item.price || 0).toLocaleString() }} × 數量 {{ item.quantity || 1 }} 件
                      </div>
                    </div>
                  </div>

                  <div class="order-item-right">
                    <div class="text-end">
                      <span class="text-muted font-monospace d-block" style="font-size: 10.5px;">單項小計</span>
                      <span class="font-monospace text-dark fw-bold" style="font-size: 15px;">
                        NT$ {{ ((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString() }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 區塊 C：整筆訂單金額計算明細表 -->
            <div class="mb-4">
              <div class="section-sub-label font-monospace mb-2.5">
                2. 整筆訂單金額計算明細 (PRICE CALCULATION)
              </div>

              <div class="order-calc-box font-monospace">
                <div class="calc-line">
                  <div class="calc-label">
                    <span class="calc-step-tag">項目 (+)</span>
                    <span>商品金額小計（共 {{ getOrderTotalQty(ord) }} 件商品加總）</span>
                  </div>
                  <span class="calc-val text-dark fw-semibold">
                    NT$ {{ getOrderItemsSubtotal(ord).toLocaleString() }}
                  </span>
                </div>

                <div
                  class="calc-line"
                  :class="Number(ord.couponDiscount) > 0 ? 'is-discount' : 'text-muted'"
                >
                  <div class="calc-label">
                    <span class="calc-step-tag">折抵 (-)</span>
                    <span>🎟️ 優惠券折抵 {{ ord.couponCode ? `(${ord.couponCode})` : '' }}</span>
                  </div>
                  <span class="calc-val">
                    - NT$ {{ Number(ord.couponDiscount || 0).toLocaleString() }}
                  </span>
                </div>

                <div
                  class="calc-line"
                  :class="Number(ord.pointsUsed) > 0 ? 'is-discount' : 'text-muted'"
                >
                  <div class="calc-label">
                    <span class="calc-step-tag">折抵 (-)</span>
                    <span>🪙 紅利點數折抵（使用 {{ Number(ord.pointsUsed || 0).toLocaleString() }} 點）</span>
                  </div>
                  <span class="calc-val">
                    - NT$ {{ Number(ord.pointsUsed || 0).toLocaleString() }}
                  </span>
                </div>

                <div class="calc-line">
                  <div class="calc-label">
                    <span class="calc-step-tag">運費 (+)</span>
                    <span>🚚 物流配送運費</span>
                  </div>
                  <span class="calc-val text-dark">
                    + NT$ {{ getOrderShippingFee(ord).toLocaleString() }}
                  </span>
                </div>

                <div class="calc-total-line">
                  <span class="fw-bold text-dark" style="font-size: 14.5px;">折抵後實際支付總金額</span>
                  <span class="fw-bold text-primary" style="font-size: 19px;">
                    NT$ {{ getOrderPaidAmount(ord).toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 區塊 D：展開後的明細底部操作按鈕區 -->
            <div class="order-foot-bar">
              <div class="text-muted font-monospace" style="font-size: 12px;">
                <div>收件資訊：{{ ord.recipientName }} · {{ ord.shippingAddress || '超商門市取貨' }}</div>
                <div v-if="ord.cancelReason" class="text-danger mt-1">
                  取消原因：{{ ord.cancelReason }}
                </div>
              </div>

              <div class="order-foot-actions">
                <button
                  v-if="['待出貨', '處理中', '已付款'].includes(ord.status)"
                  type="button"
                  class="btn btn-dark btn-sm rounded-pill px-4 py-2 font-monospace fw-bold"
                  style="font-size: 12px;"
                  @click="openShipModal(ord)"
                >
                  📦 填寫物流單號並出貨
                </button>

                <button
                  v-if="ord.status === '申請取消中'"
                  type="button"
                  class="btn btn-danger btn-sm rounded-pill px-4 py-2 font-monospace fw-bold"
                  style="font-size: 12px;"
                  @click="handleApproveCancel(ord)"
                >
                  ✓ 確認取消訂單 (回補庫存)
                </button>

                <button
                  v-if="ord.status === '配送中'"
                  type="button"
                  class="btn btn-outline-dark btn-sm rounded-pill px-4 py-2 font-monospace"
                  style="font-size: 12px;"
                  @click="markAsCompleted(ord)"
                >
                  ✓ 手動標記為已完成
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div v-else class="card-korean text-center py-5 text-muted small">
        目前「{{ currentFilterNodeLabel }}」分類下尚無符合條件的訂單紀錄。
      </div>
    </div>

    <!-- 填寫物流單號與出貨 Modal -->
    <div v-if="shipModalState.isOpen" class="position-fixed top-0 start-0 w-100 h-100 modal-backdrop-custom d-flex align-items-center justify-content-center p-3" style="z-index: 1060;">
      <div class="bg-white rounded-4 p-4 shadow-lg w-100" style="max-width: 440px;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="fs-6 fw-bold text-dark mb-0 font-serif">📦 填寫物流單號並出貨</h3>
          <button type="button" class="btn-close shadow-none" @click="shipModalState.isOpen = false"></button>
        </div>

        <div class="small text-muted mb-3 font-monospace">
          訂單編號：#{{ shipModalState.order?.orderId || shipModalState.order?.id }}
        </div>

        <div class="mb-3">
          <label class="form-label text-secondary small mb-1">物流單號 / 寄件編號 *</label>
          <input
            v-model="shipModalState.trackingNumber"
            type="text"
            class="form-control form-control-sm font-monospace py-2"
            placeholder="例如：71188293910 或 TPE20261118"
          />
        </div>

        <div class="d-flex justify-content-end gap-2 pt-2">
          <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-4 font-monospace" @click="shipModalState.isOpen = false">
            取消
          </button>
          <button type="button" class="btn btn-dark btn-sm rounded-pill px-4 font-monospace fw-bold" @click="submitShipOrder">
            確認出貨並發送通知
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Layers, Package, Truck, CheckCircle2, RotateCcw, ChevronDown } from 'lucide-vue-next'
import { useAdminStore } from '../../stores/adminStore'
import { useProductStore } from '../../stores/productStore'

const adminStore = useAdminStore()
const productStore = useProductStore()

const allOrders = computed(() => adminStore.orders || [])

const pendingCancelOrders = computed(() => {
  return allOrders.value.filter(o => o.status === '申請取消中')
})

const selectedStatusNode = ref('ALL')

// 暫存篩選條件（輸入時不即時篩選）
const tempKeyword = ref('')
const tempShippingFilter = ref('ALL')

// 套用後的篩選條件（點擊「查詢」後才生效）
const appliedKeyword = ref('')
const appliedShippingFilter = ref('ALL')

const triggerSearch = () => {
  appliedKeyword.value = tempKeyword.value.trim()
  appliedShippingFilter.value = tempShippingFilter.value
}

const resetFilters = () => {
  tempKeyword.value = ''
  tempShippingFilter.value = 'ALL'
  appliedKeyword.value = ''
  appliedShippingFilter.value = 'ALL'
  selectedStatusNode.value = 'ALL'
}

const expandedOrderIds = ref({})
const hasInitializedExpand = ref(false)

const isOrderExpanded = (id) => {
  if (!hasInitializedExpand.value && allOrders.value.length > 0) {
    const firstId = allOrders.value[0].orderId || allOrders.value[0].id
    expandedOrderIds.value[firstId] = true
    hasInitializedExpand.value = true
  }
  return Boolean(expandedOrderIds.value[id])
}

const toggleOrderExpand = (id) => {
  expandedOrderIds.value[id] = !isOrderExpanded(id)
}

const areAllFilteredExpanded = computed(() => {
  if (filteredOrders.value.length === 0) return false
  return filteredOrders.value.every(o => isOrderExpanded(o.orderId || o.id))
})

const toggleAllOrders = () => {
  const targetState = !areAllFilteredExpanded.value
  filteredOrders.value.forEach(o => {
    expandedOrderIds.value[o.orderId || o.id] = targetState
  })
}

const getOrderTotalQty = (ord) => {
  return (ord.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
}

const orderFlowNodes = [
  { key: 'ALL', label: '全部訂單', sublabel: '所有交易紀錄', icon: Layers },
  { key: 'PACKING', label: '待出貨', sublabel: '未出貨可處理', icon: Package },
  { key: 'SHIPPING', label: '配送中', sublabel: '轉運與物流中', icon: Truck },
  { key: 'COMPLETED', label: '已完成', sublabel: '已簽收結算', icon: CheckCircle2 },
  { key: 'RETURN', label: '取消/退貨', sublabel: '取消申請與售後', icon: RotateCcw }
]

const matchOrderNode = (ord, nodeKey) => {
  if (nodeKey === 'ALL') return true
  const st = ord.status || ''
  if (nodeKey === 'PACKING') return ['待出貨', '處理中', '已付款'].includes(st)
  if (nodeKey === 'SHIPPING') return st === '配送中'
  if (nodeKey === 'COMPLETED') return st === '已完成'
  if (nodeKey === 'RETURN') return ['申請取消中', '已取消', '退貨審核中', '已退貨'].includes(st)
  return false
}

const getOrderCountByNode = (nodeKey) => {
  return allOrders.value.filter(o => matchOrderNode(o, nodeKey)).length
}

// 根據點擊「查詢」後的條件進行過濾
const filteredOrders = computed(() => {
  return allOrders.value.filter(ord => {
    // 1. 節點狀態篩選
    if (!matchOrderNode(ord, selectedStatusNode.value)) return false

    // 2. 配送方式篩選
    if (appliedShippingFilter.value !== 'ALL') {
      const shipType = ord.shippingMethod || ord.shippingType || 'HOME'
      if (shipType !== appliedShippingFilter.value) return false
    }

    // 3. 關鍵字搜尋
    if (appliedKeyword.value) {
      const q = appliedKeyword.value.toLowerCase()
      const idStr = String(ord.orderId || ord.id || '').toLowerCase()
      const nameStr = String(ord.recipientName || ord.customerName || '').toLowerCase()
      const phoneStr = String(ord.phone || '').toLowerCase()
      const trackingStr = String(ord.trackingNumber || ord.trackingCode || '').toLowerCase()

      if (!idStr.includes(q) && !nameStr.includes(q) && !phoneStr.includes(q) && !trackingStr.includes(q)) {
        return false
      }
    }

    return true
  })
})

const currentFilterNodeLabel = computed(() => {
  const found = orderFlowNodes.find(n => n.key === selectedStatusNode.value)
  return found ? found.label : '全部訂單'
})

const getCleanStatusClass = (status) => {
  if (['待出貨', '處理中'].includes(status)) return 'pill-pending'
  if (status === '配送中') return 'pill-shipping'
  if (status === '已完成') return 'pill-completed'
  if (status === '申請取消中') return 'pill-cancel-req'
  return 'pill-return'
}

const getOrderItemsSubtotal = (ord) => {
  const itemsSum = (ord.items || []).reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  )
  if (itemsSum > 0) return itemsSum
  return Number(ord.subtotal || 0)
}

const getOrderShippingFee = (ord) => {
  if (typeof ord.shippingFee === 'number') return ord.shippingFee
  return (ord.shippingMethod || ord.shippingType) === 'CVS' ? 60 : 100
}

const getOrderPaidAmount = (ord) => {
  const sub = getOrderItemsSubtotal(ord)
  const disc = Number(ord.couponDiscount || 0) + Number(ord.pointsUsed || 0)
  const ship = getOrderShippingFee(ord)
  if (sub > 0) {
    return Math.max(0, sub - disc) + ship
  }
  return Number(ord.totalAmount || ord.amount || ord.total || 0)
}

const getItemImage = (item) => {
  if (item?.image) return item.image
  const matchedProd = (productStore.products || []).find(
    p =>
      Number(p.id) === Number(item?.id) ||
      (item?.name && item.name.includes(p.name))
  )
  if (matchedProd) return matchedProd.image || (matchedProd.images && matchedProd.images[0])
  return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80'
}

const handleApproveCancel = (ord) => {
  const orderId = ord.orderId || ord.id
  if (adminStore.approveCancelOrder) {
    const res = adminStore.approveCancelOrder(orderId)
    alert(res.message)
  } else {
    ord.status = '已取消'
    alert(`訂單 #${orderId} 已確認取消，庫存已回補！`)
  }
}

const handleRejectCancel = (ord) => {
  const orderId = ord.orderId || ord.id
  ord.status = '待出貨'
  delete ord.cancelReason
  alert(`已駁回訂單 #${orderId} 的取消申請，訂單恢復為待出貨狀態。`)
}

const shipModalState = reactive({
  isOpen: false,
  order: null,
  trackingNumber: ''
})

const openShipModal = (ord) => {
  shipModalState.order = ord
  shipModalState.trackingNumber = ord.trackingNumber || ord.trackingCode || '711' + Math.floor(100000000 + Math.random() * 900000000)
  shipModalState.isOpen = true
}

const submitShipOrder = () => {
  const ord = shipModalState.order
  if (!ord) return
  const orderId = ord.orderId || ord.id
  const tracking = shipModalState.trackingNumber.trim() || 'EX' + Date.now()

  if (adminStore.updateOrderStatus) {
    adminStore.updateOrderStatus(orderId, '配送中', tracking)
  } else {
    ord.status = '配送中'
    ord.trackingNumber = tracking
  }

  if (adminStore.addAuditLog) {
    adminStore.addAuditLog('商家更新訂單出貨', `訂單 #${orderId} 已出貨，物流單號：${tracking}`)
  }

  alert(`訂單 #${orderId} 已成功標記為「配送中」！物流單號：${tracking}`)
  shipModalState.isOpen = false
}

const markAsCompleted = (ord) => {
  const orderId = ord.orderId || ord.id
  ord.status = '已完成'
  alert(`訂單 #${orderId} 已手動標記為已完成！`)
}
</script>

<style scoped>
.order-flow-scroll {
  background-color: #faf8f5;
  border: 1px solid #ebe5dd;
  border-radius: 12px;
  padding: 16px 10px;
  overflow-x: auto;
}

.order-flow-track {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  min-width: 390px;
}

.order-flow-line {
  position: absolute;
  top: 19px;
  left: 36px;
  right: 36px;
  height: 2px;
  background-color: #dfd8ce;
  z-index: 1;
}

.flow-node-btn {
  position: relative;
  z-index: 2;
  flex: 1 0 78px;
  background: transparent;
  border: none;
  padding: 0 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
}

.flow-node-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: #ffffff;
  border: 1px solid #d8d0c5;
  color: #6e655f;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.flow-node-btn.is-selected .flow-node-circle {
  background-color: #2d2621;
  border-color: #2d2621;
  color: #ffffff;
  transform: scale(1.08);
}

.flow-node-label {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #787167;
  white-space: nowrap;
}

.flow-node-btn.is-selected .flow-node-label {
  color: #2d2621;
}

.flow-node-sub {
  font-size: 10px;
  color: #9c9289;
  margin-top: 2px;
}

/* 訂單卡片排版 */
.minimal-order-card {
  border-color: #e8e2da !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.minimal-order-card.is-open {
  border-color: #2d2621 !important;
  box-shadow: 0 8px 24px rgba(45, 38, 33, 0.06);
}

.minimal-order-header {
  padding: 20px 18px !important;
  cursor: pointer;
  background-color: #ffffff;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px 20px !important;
  align-items: center;
}

@media (min-width: 768px) {
  .minimal-order-header {
    padding: 22px 28px !important;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 20px 24px !important;
  }
}

.order-head-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 170px;
}

.order-head-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px !important;
  justify-self: end;
  justify-content: flex-end;
}

@media (min-width: 768px) {
  .order-head-status {
    justify-self: auto;
    gap: 16px !important;
  }
}

.status-pill {
  display: inline-flex !important;
  align-items: center !important;
  gap: 10px !important;
  padding: 8px 18px !important;
  border-radius: 999px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.03em !important;
  line-height: 1.2 !important;
  white-space: nowrap !important;
}

.status-dot {
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  display: inline-block !important;
  flex-shrink: 0 !important;
}

.order-qty-pill {
  padding: 7px 14px !important;
  background-color: #f6f3ee !important;
  border: 1px solid #e8e1d7 !important;
  border-radius: 999px !important;
  font-size: 12.5px !important;
  color: #5c554e !important;
  white-space: nowrap !important;
}

.order-head-price {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-top: 14px;
  border-top: 1px dashed #eee8df;
  gap: 6px;
}

@media (min-width: 768px) {
  .order-head-price {
    grid-column: auto;
    padding-top: 0;
    border-top: none;
    margin-left: auto;
    align-items: flex-end;
  }
}

.minimal-order-body {
  padding: 22px 18px !important;
  background-color: #faf8f5;
  border-color: #eee9e2 !important;
}

@media (min-width: 768px) {
  .minimal-order-body {
    padding: 26px 30px !important;
  }
}

.section-sub-label {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #787167;
}

.order-meta-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e6dfd5;
}

@media (min-width: 768px) {
  .order-meta-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.order-item-row {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 18px !important;
  background-color: #ffffff;
  border: 1px solid #e6dfd5;
  border-radius: 14px;
}

@media (min-width: 576px) {
  .order-item-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 18px 22px !important;
  }
}

.order-item-left {
  display: flex !important;
  align-items: center !important;
  gap: 24px !important;
  min-width: 0;
  flex: 1 1 auto;
}

.order-item-thumb {
  width: 68px !important;
  height: 86px !important;
  margin-right: 4px !important;
  border-radius: 10px !important;
  overflow: hidden !important;
  border: 1px solid #e2dbd0 !important;
  background-color: #f7f4ef !important;
  flex-shrink: 0 !important;
  display: block !important;
}

.order-item-info {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 6px !important;
}

.order-item-right {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px dashed #eee8df;
  flex-shrink: 0;
}

@media (min-width: 576px) {
  .order-item-right {
    padding-top: 0;
    border-top: none;
    justify-content: flex-end;
  }
}

.order-calc-box {
  background-color: #ffffff;
  border: 1px solid #e2dbd0;
  border-radius: 14px;
  padding: 18px 22px !important;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.calc-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.calc-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.calc-step-tag {
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 6px;
  background-color: #f4f1ec;
  color: #6e655f;
}

.calc-line.is-discount {
  color: #237804;
  font-weight: 600;
  background-color: #f6ffed;
  padding: 6px 12px;
  margin: 0 -8px;
  border-radius: 8px;
}

.calc-total-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 12px;
  margin-top: 2px;
  border-top: 1px solid #e6dfd5;
}

.order-foot-bar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 16px;
  border-top: 1px solid #e6dfd5;
}

@media (min-width: 576px) {
  .order-foot-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.order-foot-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

@media (min-width: 576px) {
  .order-foot-actions {
    width: auto;
  }
}

.pill-pending {
  background-color: #fff2f0;
  color: #cf1322;
  border: 1px solid #ffccc7;
}
.pill-pending .status-dot {
  background-color: #cf1322;
}

.pill-shipping {
  background-color: #fffbe6;
  color: #d48806;
  border: 1px solid #ffe58f;
}
.pill-shipping .status-dot {
  background-color: #d48806;
}

.pill-completed {
  background-color: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}
.pill-completed .status-dot {
  background-color: #389e0d;
}

.pill-cancel-req {
  background-color: #fff7e6;
  color: #d46b08;
  border: 1px solid #ffd591;
}
.pill-cancel-req .status-dot {
  background-color: #d46b08;
}

.pill-return {
  background-color: #f5f5f5;
  color: #595959;
  border: 1px solid #d9d9d9;
}
.pill-return .status-dot {
  background-color: #8c8c8c;
}

.transition-icon {
  transition: transform 0.25s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>