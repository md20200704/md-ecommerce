<template>
  <div class="d-flex flex-column gap-3 gap-md-4">
    <!-- 1. 訂單狀態流程篩選條 -->
    <div class="profile-card">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-dark font-monospace" style="font-size: 10px;">ORDER FLOW</span>
          <strong class="fs-6 font-serif text-dark">訂單狀態與售後進度</strong>
        </div>
        <span class="text-muted font-monospace" style="font-size: 11px;">
          點選節點篩選對應階段訂單
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
            :class="{ 'is-selected': selectedOrderStatusFilter === node.key }"
            @click="selectedOrderStatusFilter = node.key"
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
              :class="selectedOrderStatusFilter === node.key ? 'text-dark' : 'text-muted'"
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

    <!-- 2. 訂單列表區 -->
    <div class="d-flex flex-column gap-3">
      <div class="d-flex justify-content-between align-items-center px-1">
        <div class="d-flex align-items-center gap-2">
          <h2 class="fs-6 fw-bold text-dark font-serif mb-0">{{ currentFilterNodeLabel }}</h2>
          <span class="text-muted small font-monospace">({{ filteredUserOrders.length }})</span>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button
            v-if="filteredUserOrders.length > 0"
            type="button"
            class="btn btn-link btn-sm text-secondary text-decoration-none p-0 px-2 font-monospace"
            style="font-size: 12px;"
            @click="toggleAllUserOrders"
          >
            {{ areAllFilteredExpanded ? '全部收合' : '全部展開' }}
          </button>
          <button
            v-if="selectedOrderStatusFilter !== 'ALL'"
            type="button"
            class="btn btn-outline-dark btn-sm rounded-pill px-3 py-0.5 font-monospace"
            style="font-size: 11px;"
            @click="selectedOrderStatusFilter = 'ALL'"
          >
            查看全部
          </button>
        </div>
      </div>

      <!-- 單筆訂單卡片 -->
      <div v-if="filteredUserOrders.length > 0" class="d-flex flex-column gap-3.5">
        <div
          v-for="ord in filteredUserOrders"
          :key="ord.orderId || ord.id"
          class="minimal-order-card bg-white rounded-4 border overflow-hidden"
          :class="{ 'is-open': isOrderExpanded(ord.orderId || ord.id) }"
        >
          <!-- 收合標頭列 -->
          <div
            class="minimal-order-header"
            @click="toggleOrderExpand(ord.orderId || ord.id)"
          >
            <!-- 左區：訂單編號與下單日期 -->
            <div class="order-head-main">
              <span class="font-monospace fw-bold text-dark" style="font-size: 15.5px; letter-spacing: 0.02em;">
                #{{ ord.orderId || ord.id }}
              </span>
              <span class="text-muted font-monospace" style="font-size: 12px;">
                下單時間：{{ ord.createdAt || ord.date }}
              </span>
            </div>

            <!-- 中區：訂單狀態膠囊 + 總件數 (RWD 靠右對齊) -->
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

            <!-- 右區：金額與按鈕 -->
            <div class="order-head-price">
              
              <!-- 第一行：金額靠左、操作按鈕靠右同一行 -->
              <div class="desktop-price-row w-100">
                <!-- 實付總額（含空格） -->
                <div class="d-flex align-items-baseline" style="gap: 6px;">
                  <span class="text-muted font-monospace" style="font-size: 11.5px;">實付總額</span>
                  <span class="font-monospace fw-bold text-dark" style="font-size: 17.5px;">
                    NT$ {{ getOrderPaidAmount(ord).toLocaleString() }}
                  </span>
                </div>

                <!-- 操作按鈕靠右（僅在未展開時計，點擊 @click.stop 不觸發展開） -->
                <div v-if="!isOrderExpanded(ord.orderId || ord.id)" class="header-quick-actions" @click.stop>
                  <button
                    v-if="['待出貨', '處理中', '已付款'].includes(ord.status)"
                    type="button"
                    class="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 font-monospace fw-semibold"
                    style="font-size: 11.5px;"
                    @click.stop="handleCancelOrderRequest(ord)"
                  >
                    取消訂單
                  </button>

                  <span
                    v-else-if="ord.status === '申請取消中'"
                    class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2.5 py-1 font-monospace"
                    style="font-size: 11px;"
                  >
                    ⏳ 待商家確認
                  </span>

                  <button
                    v-if="ord.status === '配送中' || ord.status === '待出貨'"
                    type="button"
                    class="btn btn-dark btn-sm rounded-pill px-3 py-1 font-monospace fw-bold"
                    style="font-size: 11.5px;"
                    @click.stop="confirmOrderCompleted(ord)"
                  >
                    ✓ 完成訂單
                  </button>
                </div>
              </div>

              <!-- 第二行（下一行）：展開／收合明細按鈕 -->
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
                <span v-if="ord.trackingNumber || ord.trackingCode" class="font-monospace text-secondary">
                  物流單號：<strong class="text-dark">{{ ord.trackingNumber || ord.trackingCode }}</strong>
                </span>
              </div>

              <div class="font-monospace" style="font-size: 12px;">
                <span v-if="ord.rewardsSettled" class="text-success fw-semibold">
                  ✓ 已計入累積消費 NT$ {{ getOrderPaidAmount(ord).toLocaleString() }}
                  <template v-if="ord.earnedPoints"> (+{{ ord.earnedPoints }} 點紅利)</template>
                </span>
                <span v-else-if="ord.status === '已取消' || ord.status === '申請取消中'" class="text-danger fw-semibold">
                  {{ ord.status === '申請取消中' ? '⏳ 已通知商家審核取消申請中' : '✕ 訂單已取消' }}
                </span>
                <span v-else class="text-muted">
                  點擊下方「完成訂單」後即計入累積消費與紅利點數
                </span>
              </div>
            </div>

            <!-- 區塊 B：購買商品清單（圖片與名稱保留 24px 空隙） -->
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
                    <router-link
                      :to="`/product/${getItemProductId(item)}`"
                      class="order-item-thumb"
                    >
                      <img
                        :src="getItemImage(item)"
                        :alt="item.name"
                        class="w-100 h-100 object-fit-cover"
                      />
                    </router-link>

                    <div class="order-item-info">
                      <router-link
                        :to="`/product/${getItemProductId(item)}`"
                        class="order-item-title text-dark fw-bold text-decoration-none"
                      >
                        {{ item.name }}
                      </router-link>

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

                    <template v-if="ord.status === '已完成'">
                      <span
                        v-if="item.reviewed"
                        class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3.5 py-1.5 font-monospace"
                        style="font-size: 11px;"
                      >
                        ✓ 已評價
                      </span>
                      <button
                        v-else
                        type="button"
                        class="btn btn-dark btn-sm rounded-pill px-4 py-1.5 font-monospace"
                        style="font-size: 12px;"
                        @click="openReviewModal(item, ord)"
                      >
                        ★ 填寫評價
                      </button>
                    </template>
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
                    <span>🪙 紅利點數折抵（使用 {{ Number(ord.pointsUsed || 0).toLocaleString() }} 點，1 點折 $1）</span>
                  </div>
                  <span class="calc-val">
                    - NT$ {{ Number(ord.pointsUsed || 0).toLocaleString() }}
                  </span>
                </div>

                <div class="calc-line">
                  <div class="calc-label">
                    <span class="calc-step-tag">運費 (+)</span>
                    <span>🚚 物流配送運費（{{ (ord.shippingMethod || ord.shippingType) === 'CVS' ? '超商取貨 NT$ 60' : '黑貓宅配 NT$ 100' }}）</span>
                  </div>
                  <span class="calc-val text-dark">
                    + NT$ {{ getOrderShippingFee(ord).toLocaleString() }}
                  </span>
                </div>

                <div class="calc-formula-bar">
                  <span class="text-secondary">計算公式：</span>
                  <span>
                    商品小計 ${{ getOrderItemsSubtotal(ord).toLocaleString() }}
                    <template v-if="Number(ord.couponDiscount) > 0">
                      - 優惠券 ${{ Number(ord.couponDiscount).toLocaleString() }}
                    </template>
                    <template v-if="Number(ord.pointsUsed) > 0">
                      - 紅利 ${{ Number(ord.pointsUsed).toLocaleString() }}
                    </template>
                    + 運費 ${{ getOrderShippingFee(ord).toLocaleString() }}
                    = <strong class="text-dark">實付 NT$ {{ getOrderPaidAmount(ord).toLocaleString() }}</strong>
                  </span>
                </div>

                <div class="calc-total-line">
                  <div class="d-flex align-items-center flex-wrap gap-2">
                    <span class="fw-bold text-dark" style="font-size: 14.5px;">折抵後實際支付總金額</span>
                    <span
                      v-if="Number(ord.couponDiscount) > 0 || Number(ord.pointsUsed) > 0"
                      class="badge bg-success-subtle text-success border border-success-subtle"
                      style="font-size: 11px; padding: 4px 10px;"
                    >
                      本單共省下 NT$ {{ (Number(ord.couponDiscount || 0) + Number(ord.pointsUsed || 0)).toLocaleString() }}
                    </span>
                  </div>
                  <span class="fw-bold text-primary" style="font-size: 19px;">
                    NT$ {{ getOrderPaidAmount(ord).toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 區塊 D：展開後的明細底部操作按鈕區 -->
            <div class="order-foot-bar">
              <div class="text-muted font-monospace" style="font-size: 12px;">
                <div>收件資訊：{{ ord.recipientName || ord.customerName || currentUser.name }} · {{ ord.shippingAddress || ord.shippingMethod || '預設收件地址' }}</div>
                <div v-if="ord.cancelReason" class="text-danger mt-1">
                  取消申請原因：{{ ord.cancelReason }}
                </div>
                <div v-if="ord.returnRequest" class="text-danger mt-1">
                  售後退貨申請狀態：{{ ord.returnRequest.status }}（原因：{{ ord.returnRequest.reason }}）
                </div>
              </div>

              <div class="order-foot-actions">
                <button
                  v-if="['待出貨', '處理中', '已付款'].includes(ord.status)"
                  type="button"
                  class="btn btn-outline-danger btn-sm rounded-pill px-4 py-2 font-monospace fw-semibold flex-grow-1 flex-sm-grow-0"
                  style="font-size: 12px;"
                  @click="handleCancelOrderRequest(ord)"
                >
                  取消訂單 (通知商家)
                </button>

                <span
                  v-else-if="ord.status === '申請取消中'"
                  class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-4 py-2 font-monospace"
                  style="font-size: 11.5px;"
                >
                  ⏳ 已通知商家，等待後台確認取消
                </span>

                <button
                  v-if="ord.status === '配送中' || ord.status === '待出貨'"
                  type="button"
                  class="btn btn-dark btn-sm rounded-pill px-4 py-2 font-monospace fw-bold flex-grow-1 flex-sm-grow-0"
                  style="font-size: 12px;"
                  @click="confirmOrderCompleted(ord)"
                >
                  ✓ 完成訂單 (計入消費與點數)
                </button>

                <button
                  v-if="ord.status === '已完成' && !ord.returnRequest"
                  type="button"
                  class="btn btn-outline-secondary btn-sm rounded-pill px-4 py-2 font-monospace flex-grow-1 flex-sm-grow-0"
                  style="font-size: 11.5px;"
                  @click="openReturnModal(ord)"
                >
                  申請退貨 / 售後服務
                </button>

                <span
                  v-else-if="ord.returnRequest"
                  class="badge bg-secondary-subtle text-secondary border rounded-pill px-3.5 py-2 font-monospace"
                  style="font-size: 11.5px;"
                >
                  📦 已提出退貨申請 (客服審核中)
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div v-else class="profile-card text-center py-5 text-muted small">
        目前「{{ currentFilterNodeLabel }}」分類下尚無訂單紀錄。
      </div>
    </div>

    <!-- 商品評價 Modal -->
    <ReviewModal
      :is-open="reviewModalState.isOpen"
      :order-id="reviewModalState.orderId"
      :product-id="reviewModalState.productId"
      :product="reviewModalState.product"
      :item="reviewModalState.item"
      @close="reviewModalState.isOpen = false"
      @submitted="onReviewSubmitted"
    />

    <!-- 申請退貨彈跳視窗 (含圖片上傳) -->
    <ReturnModal
      :is-open="returnModalState.isOpen"
      :order="returnModalState.order"
      @close="returnModalState.isOpen = false"
      @submitted="onReturnSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Layers, Package, Truck, CheckCircle2, RotateCcw, ChevronDown } from 'lucide-vue-next'
import ReviewModal from '../ReviewModal.vue'
import ReturnModal from './ReturnModal.vue'
import { useAuthStore } from '../../stores/authStore'
import { useAdminStore } from '../../stores/adminStore'
import { useProductStore } from '../../stores/productStore'
import { showToast } from '../../composables/useToast'
import { showConfirm } from '../../composables/useConfirm'

const authStore = useAuthStore()
const adminStore = useAdminStore()
const productStore = useProductStore()

const currentUser = computed(() => authStore.user || {})

const userOrders = computed(() => {
  const allOrders = adminStore.orders || []
  allOrders.forEach((o, index) => {
    if (!o.status) {
      if (o.shippingStatus === 'PENDING') o.status = '待出貨'
      else if (o.shippingStatus === 'SHIPPED') o.status = '配送中'
      else if (o.shippingStatus === 'DELIVERED') o.status = '已完成'
      else if (o.shippingStatus === 'CANCELLED') o.status = '已取消'
      else o.status = '待出貨'
    }
    if (o.couponDiscount === undefined && o.pointsUsed === undefined) {
      if (index === 0) {
        o.couponDiscount = 100
        o.pointsUsed = 80
        o.shippingFee = 60
      } else if (index === 1) {
        o.couponDiscount = 200
        o.pointsUsed = 50
        o.shippingFee = 100
      } else {
        o.couponDiscount = 0
        o.pointsUsed = 50
        o.shippingFee = 100
      }
    }
  })

  const { email, phone, name } = currentUser.value
  const matched = allOrders.filter(
    o => o.email === email || o.phone === phone || o.recipientName === name || o.customerName === name
  )
  return matched.length > 0 ? matched : allOrders
})

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
      (item?.name && item.name.includes(p.name)) ||
      (p.name && item?.name && p.name.includes(item.name.split(' ')[0]))
  )
  if (matchedProd) return matchedProd.image || (matchedProd.images && matchedProd.images[0])
  return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80'
}

const getItemProductId = (item) => {
  if (item?.id) return item.id
  const matchedProd = (productStore.products || []).find(
    p =>
      (item?.name && item.name.includes(p.name)) ||
      (p.name && item?.name && p.name.includes(item.name.split(' ')[0]))
  )
  return matchedProd ? matchedProd.id : 1
}

const selectedOrderStatusFilter = ref('ALL')
const expandedOrderIds = ref({})
const hasInitializedExpand = ref(false)

const isOrderExpanded = (id) => {
  if (!hasInitializedExpand.value && userOrders.value.length > 0) {
    const firstId = userOrders.value[0].orderId || userOrders.value[0].id
    expandedOrderIds.value[firstId] = true
    hasInitializedExpand.value = true
  }
  return Boolean(expandedOrderIds.value[id])
}

const toggleOrderExpand = (id) => {
  expandedOrderIds.value[id] = !isOrderExpanded(id)
}

const areAllFilteredExpanded = computed(() => {
  if (filteredUserOrders.value.length === 0) return false
  return filteredUserOrders.value.every(o => isOrderExpanded(o.orderId || o.id))
})

const toggleAllUserOrders = () => {
  const targetState = !areAllFilteredExpanded.value
  filteredUserOrders.value.forEach(o => {
    expandedOrderIds.value[o.orderId || o.id] = targetState
  })
}

const getOrderTotalQty = (ord) => {
  return (ord.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
}

const orderFlowNodes = [
  { key: 'ALL', label: '全部訂單', sublabel: '所有交易紀錄', icon: Layers },
  { key: 'PACKING', label: '待出貨', sublabel: '未出貨可取消', icon: Package },
  { key: 'SHIPPING', label: '配送中', sublabel: '宅配/超商轉運', icon: Truck },
  { key: 'COMPLETED', label: '已完成', sublabel: '計入消費與評價', icon: CheckCircle2 },
  { key: 'RETURN', label: '取消/退貨', sublabel: '取消與售後紀錄', icon: RotateCcw }
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
  return userOrders.value.filter(o => matchOrderNode(o, nodeKey)).length
}

const filteredUserOrders = computed(() => {
  return userOrders.value.filter(o => matchOrderNode(o, selectedOrderStatusFilter.value))
})

const currentFilterNodeLabel = computed(() => {
  const found = orderFlowNodes.find(n => n.key === selectedOrderStatusFilter.value)
  return found ? found.label : '全部訂單'
})

const getCleanStatusClass = (status) => {
  if (['待出貨', '處理中'].includes(status)) return 'pill-pending'
  if (status === '配送中') return 'pill-shipping'
  if (status === '已完成') return 'pill-completed'
  if (status === '申請取消中') return 'pill-cancel-req'
  return 'pill-return'
}

const handleCancelOrderRequest = async (ord) => {
  const orderId = ord.orderId || ord.id
  const reason = prompt(
    `您正在申請取消尚未出貨的訂單 #${orderId}\n請輸入取消原因（送出後將立即通知商家於後台確認）：`,
    '想修改商品規格或重新下單'
  )
  if (reason === null) return

  const cleanReason = reason.trim() || '顧客主動申請取消未出貨訂單'
  if (typeof adminStore.requestCancelOrder === 'function') {
    const res = await adminStore.requestCancelOrder(orderId, cleanReason)
    showToast(
      res?.message || `已送出訂單 #${orderId} 的取消申請！`,
      res?.success !== false ? 'success' : 'error',
      res?.success !== false ? '已送出取消申請' : '申請失敗'
    )
  } else {
    ord.status = '申請取消中'
    ord.cancelReason = cleanReason
    if (adminStore.addAuditLog) {
      adminStore.addAuditLog('顧客申請取消訂單', `訂單 #${orderId} 申請取消，原因：${cleanReason}`)
    }
    showToast(
      `已送出訂單 #${orderId} 的取消申請！商家將於後台系統確認取消。`,
      'success',
      '已送出取消申請'
    )
  }
}

const confirmOrderCompleted = async (ord) => {
  const orderId = ord.orderId || ord.id
  const paidAmt = getOrderPaidAmount(ord)
  const confirmed = await showConfirm(
    `確認已收到訂單 #${orderId} 的商品並完成訂單嗎？\n\n確認後系統將：\n1. 計入折抵後實際支付金額 NT$ ${paidAmt.toLocaleString()} 至累積消費\n2. 依您的 VIP 等級派發紅利點數\n3. 立即開放本筆訂單商品填寫評價`,
    {
      title: '確認收貨並完成訂單',
      confirmText: '確認完成',
      cancelText: '再確認'
    }
  )
  if (!confirmed) return

  ord.status = '已完成'
  ord.totalAmount = paidAmt
  expandedOrderIds.value[orderId] = true

  const earnRate = Number(authStore.currentVipTier?.pointsEarnRate || 1)
  const calculatedPts = Math.max(1, Math.floor((paidAmt * earnRate) / 100))
  ord.earnedPoints = calculatedPts

  let notifyMsg = `🎉 訂單 #${orderId} 已完成！`
  if (authStore.settleCompletedOrderRewards) {
    const res = authStore.settleCompletedOrderRewards(ord)
    if (res?.earnedPoints) {
      notifyMsg += `\n本次入帳紅利點數：+${res.earnedPoints} 點`
    }
    if (res?.upgradedTier) {
      notifyMsg += `\n✨ 恭喜晉升至【${res.upgradedTier.name}】！`
    }
  }
  notifyMsg += `\n\n已為您展開此筆訂單，現在可直接點擊商品右側的「★ 填寫評價」按鈕分享穿搭心得！`

  if (adminStore.addAuditLog) {
    adminStore.addAuditLog('會員完成訂單', `訂單 #${orderId} 已完成簽收，計入實付消費 NT$ ${paidAmt.toLocaleString()}`)
  }
  showToast(notifyMsg, 'success', '訂單已完成')
}

const requestOrderReturn = (ord) => {
  const orderId = ord.orderId || ord.id
  const reason = prompt(`申請訂單 #${orderId} 退貨/售後服務，請填寫原因：`, '尺寸不合需申請退貨')
  if (reason && reason.trim()) {
    ord.status = '退貨審核中'
    if (adminStore.addAuditLog) {
      adminStore.addAuditLog('會員申請售後退貨', `訂單 #${orderId} 提出售後申請，原因：${reason}`)
    }
    selectedOrderStatusFilter.value = 'RETURN'
    showToast(
      '已送出售後退貨申請，已為您切換至「取消/退貨」分類檢視！',
      'success',
      '退貨申請已送出'
    )
  }
}

const returnModalState = reactive({
  isOpen: false,
  order: null
})

const openReturnModal = (ord) => {
  returnModalState.order = ord
  returnModalState.isOpen = true
}

const onReturnSubmitted = (payload) => {
  const ord = returnModalState.order
  if (!ord) return
  const orderId = ord.orderId || ord.id

  ord.status = '退貨審核中'
  ord.returnRequest = {
    id: 'RET-' + Date.now().toString().slice(-6),
    status: 'PENDING',
    reason: payload.reason,
    images: payload.images || [],
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
  }

  if (adminStore.addAuditLog) {
    adminStore.addAuditLog(
      '會員申請售後退貨',
      `訂單 #${orderId} 提出退貨申請（原因：${payload.reason}，上傳圖片數：${payload.images.length} 張）`
    )
  }

  selectedOrderStatusFilter.value = 'RETURN'
  showToast(
    `訂單 #${orderId} 的退貨申請已送出！客服將盡速為您審核並聯繫黑貓宅配取件。`,
    'success',
    '退貨申請已送出'
  )
  returnModalState.isOpen = false
}

const reviewModalState = reactive({
  isOpen: false,
  orderId: '',
  productId: 1,
  product: null,
  item: null
})

const openReviewModal = (item, ord) => {
  const prodId = getItemProductId(item)
  const prodObj = productStore.getProductById(prodId) || {
    id: prodId,
    name: item.name,
    image: getItemImage(item)
  }

  reviewModalState.orderId = String(ord.orderId || ord.id)
  reviewModalState.productId = Number(prodId)
  reviewModalState.product = prodObj
  reviewModalState.item = {
    ...item,
    image: getItemImage(item)
  }
  reviewModalState.isOpen = true
}

const onReviewSubmitted = () => {
  if (reviewModalState.item) {
    reviewModalState.item.reviewed = true
  }
  reviewModalState.isOpen = false
}
</script>

<style scoped>
.profile-card {
  background-color: #ffffff;
  border: 1px solid #e8e2da;
  border-radius: 16px;
  padding: 18px 16px;
  box-shadow: 0 2px 10px rgba(45, 38, 33, 0.03);
}

@media (min-width: 768px) {
  .profile-card {
    padding: 24px 28px;
  }
}

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

.flow-node-count {
  position: absolute;
  top: -4px;
  right: -8px;
  background-color: #9b7e68;
  color: #ffffff;
  font-size: 9.5px;
  padding: 1px 6px;
  border-radius: 999px;
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

/* ==================== 1. 訂單卡片標頭排版 ==================== */
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

/* 手機版維持原本靠右對齊 */
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

/* 網頁版金額與按鈕並排在同一行（金額靠左、按鈕靠右） */
.desktop-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

@media (max-width: 767px) {
  .desktop-price-row {
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }
}

.header-quick-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.toggle-detail-btn-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background-color: #f6f3ee;
  border: 1px solid #e8e1d7;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toggle-detail-btn-group:hover {
  background-color: #ebe5dd;
}

/* ==================== 2. 展開後的商品明細列 ==================== */
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

.order-item-title {
  font-size: 15px !important;
  line-height: 1.4 !important;
}

.order-item-title:hover {
  text-decoration: underline !important;
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

/* ==================== 3. 整筆訂單金額計算明細盒 ==================== */
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

.calc-line.is-discount .calc-step-tag {
  background-color: #d9f7be;
  color: #135200;
}

.calc-formula-bar {
  margin-top: 4px;
  padding: 10px 14px;
  background-color: #faf8f5;
  border: 1px dashed #d8d0c5;
  border-radius: 10px;
  font-size: 12.5px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
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