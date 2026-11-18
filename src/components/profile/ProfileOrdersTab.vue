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
                class="flow-node-count font-monospace"
              >
                {{ getOrderCountByNode(node.key) }}
              </span>
            </div>

            <div class="flow-node-label">{{ node.label }}</div>
            <div class="flow-node-sub font-monospace d-none d-md-block">{{ node.sublabel }}</div>
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
      <div v-if="filteredUserOrders.length > 0" class="d-flex flex-column gap-3">
        <div
          v-for="ord in filteredUserOrders"
          :key="ord.orderId || ord.id"
          class="minimal-order-card bg-white rounded-4 border overflow-hidden"
          :class="{ 'is-open': isOrderExpanded(ord.orderId || ord.id) }"
        >
          <!-- ★ 優化重點 1：收合標頭列（拉開訂單狀態膠囊內外距 + 直接呈現優惠券與紅利折抵標籤） -->
          <div
            class="minimal-order-header"
            @click="toggleOrderExpand(ord.orderId || ord.id)"
          >
            <!-- 左區：訂單編號與下單日期 -->
            <div class="order-head-main">
              <span class="font-monospace fw-bold text-dark" style="font-size: 15px;">
                #{{ ord.orderId || ord.id }}
              </span>
              <span class="text-muted font-monospace" style="font-size: 12px;">
                {{ ord.createdAt || ord.date }}
              </span>
            </div>

            <!-- 中區：寬敞版訂單狀態膠囊 + 總件數（強制留白 16px，絕不擁擠） -->
            <div class="order-head-status" style="display: flex; align-items: center; gap: 16px;">
              <span
                class="status-pill"
                :class="getCleanStatusClass(ord.status)"
                style="padding: 7px 16px; display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; font-size: 13px; font-weight: 600;"
              >
                <span class="status-dot" style="width: 8px; height: 8px; border-radius: 50%;"></span>
                <span>{{ ord.status }}</span>
              </span>
              <span
                class="order-qty-badge font-monospace"
                style="padding: 6px 14px; background-color: #f6f3ee; border-radius: 999px; font-size: 12.5px; color: #5c554e;"
              >
                共 {{ getOrderTotalQty(ord) }} 件
              </span>
            </div>

            <!-- 右區：優惠券/紅利折抵摘要標籤 + 折抵後實付金額 -->
            <div class="order-head-price">
              <div class="d-flex flex-column align-items-start align-items-md-end" style="gap: 6px;">
                <div
                  v-if="Number(ord.couponDiscount) > 0 || Number(ord.pointsUsed) > 0"
                  style="display: flex; flex-wrap: wrap; gap: 8px;"
                >
                  <span
                    v-if="Number(ord.couponDiscount) > 0"
                    class="discount-mini-tag font-monospace"
                    style="padding: 3px 10px; font-size: 11.5px;"
                  >
                    🎟️ 優惠券折抵 -NT$ {{ Number(ord.couponDiscount).toLocaleString() }}
                  </span>
                  <span
                    v-if="Number(ord.pointsUsed) > 0"
                    class="discount-mini-tag font-monospace"
                    style="padding: 3px 10px; font-size: 11.5px;"
                  >
                    🪙 紅利折抵 -NT$ {{ Number(ord.pointsUsed).toLocaleString() }}
                  </span>
                </div>

                <div style="display: flex; align-items: baseline; gap: 8px;">
                  <span class="text-muted font-monospace" style="font-size: 11.5px;">折抵後實付</span>
                  <span class="font-monospace fw-bold text-dark" style="font-size: 17px;">
                    NT$ {{ getOrderPaidAmount(ord).toLocaleString() }}
                  </span>
                </div>
              </div>

              <ChevronDown
                style="width: 18px; height: 18px; margin-left: 12px;"
                class="text-muted transition-icon flex-shrink-0"
                :class="{ 'rotate-180 text-dark': isOrderExpanded(ord.orderId || ord.id) }"
              />
            </div>
          </div>

          <!-- 展開明細區 -->
          <div v-show="isOrderExpanded(ord.orderId || ord.id)" class="minimal-order-body border-top">
            <!-- 1. 配送與點數結算狀態列 -->
            <div class="order-meta-bar">
              <div class="d-flex flex-wrap gap-3 font-monospace" style="font-size: 12px;">
                <span>付款：<strong class="text-dark">{{ ord.paymentMethod || 'LINE Pay' }}</strong></span>
                <span>配送：<strong class="text-dark">{{ (ord.shippingMethod || ord.shippingType) === 'CVS' ? '超商純取貨' : '黑貓宅配' }}</strong></span>
                <span v-if="ord.trackingNumber || ord.trackingCode">
                  單號：<strong class="text-dark">{{ ord.trackingNumber || ord.trackingCode }}</strong>
                </span>
              </div>

              <div class="font-monospace" style="font-size: 11.5px;">
                <span v-if="ord.rewardsSettled" class="text-success fw-semibold">
                  ✓ 已計入消費 NT$ {{ getOrderPaidAmount(ord).toLocaleString() }}
                  <template v-if="ord.earnedPoints"> (+{{ ord.earnedPoints }} 點紅利)</template>
                </span>
                <span v-else-if="ord.status === '已取消' || ord.status === '申請取消中'" class="text-danger">
                  {{ ord.status === '申請取消中' ? '⏳ 已通知商家審核取消申請中' : '✕ 訂單已取消' }}
                </span>
                <span v-else class="text-muted">
                  點擊「完成訂單」後即計入累積消費與紅利點數
                </span>
              </div>
            </div>

            <!-- ★ 優化重點 2：購買商品明細（強制設定圖片右側 margin-right: 22px，解決圖片與商品名稱貼太近） -->
            <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px;">
              <div
                v-for="(item, idx) in (ord.items || [])"
                :key="idx"
                class="order-item-row"
              >
                <!-- 左側：商品圖片 + 強制 22px 間距 + 商品名稱與規格 -->
                <div style="display: flex; align-items: center; min-width: 0; flex: 1 1 auto;">
                  <router-link
                    :to="`/product/${getItemProductId(item)}`"
                    style="width: 68px; height: 84px; margin-right: 22px; border-radius: 10px; overflow: hidden; border: 1px solid #e2dbd0; background-color: #f7f4ef; flex-shrink: 0; display: block;"
                  >
                    <img
                      :src="getItemImage(item)"
                      :alt="item.name"
                      class="w-100 h-100 object-fit-cover"
                    />
                  </router-link>

                  <div style="min-width: 0; flex: 1 1 auto; display: flex; flex-direction: column; gap: 6px;">
                    <router-link
                      :to="`/product/${getItemProductId(item)}`"
                      class="order-item-title text-dark fw-bold text-decoration-none"
                      style="font-size: 15px; line-height: 1.4;"
                    >
                      {{ item.name }}
                    </router-link>
                    <div class="font-monospace" style="font-size: 12.5px; color: #787167;">
                      <span>規格：{{ item.color || '標準' }} / {{ item.size || 'F' }}</span>
                      <span style="margin: 0 8px;">·</span>
                      <span>單價 NT$ {{ Number(item.price || 0).toLocaleString() }} × {{ item.quantity || 1 }}</span>
                    </div>
                  </div>
                </div>

                <!-- 右側：單項小計與評價按鈕 -->
                <div class="order-item-right">
                  <span class="font-monospace text-dark fw-bold" style="font-size: 15px;">
                    NT$ {{ ((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString() }}
                  </span>

                  <template v-if="ord.status === '已完成'">
                    <span
                      v-if="item.reviewed"
                      class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 font-monospace"
                      style="font-size: 11px;"
                    >
                      ✓ 已評價
                    </span>
                    <button
                      v-else
                      type="button"
                      class="btn btn-dark btn-sm rounded-pill px-3 py-1.5 font-monospace"
                      style="font-size: 11.5px;"
                      @click="openReviewModal(item, ord)"
                    >
                      ★ 填寫評價
                    </button>
                  </template>
                </div>
              </div>
            </div>

            <!-- ★ 優化重點 3：完整呈現「優惠券折抵」與「紅利點數折抵」核算明細盒 -->
            <div class="order-amount-breakdown rounded-3 mb-3 font-monospace">
              <div class="breakdown-row text-secondary">
                <span>商品原價小計 ({{ getOrderTotalQty(ord) }} 件)</span>
                <span>NT$ {{ getOrderItemsSubtotal(ord).toLocaleString() }}</span>
              </div>

              <!-- 優惠券折抵列 -->
              <div
                class="breakdown-row"
                :class="Number(ord.couponDiscount) > 0 ? 'discount-highlight-row' : 'text-muted'"
              >
                <span>🎟️ 優惠券折抵 {{ ord.couponCode ? `(${ord.couponCode})` : '' }}</span>
                <span>- NT$ {{ Number(ord.couponDiscount || 0).toLocaleString() }}</span>
              </div>

              <!-- 紅利點數折抵列 -->
              <div
                class="breakdown-row"
                :class="Number(ord.pointsUsed) > 0 ? 'discount-highlight-row' : 'text-muted'"
              >
                <span>🪙 紅利點數折抵 ({{ Number(ord.pointsUsed || 0).toLocaleString() }} 點)</span>
                <span>- NT$ {{ Number(ord.pointsUsed || 0).toLocaleString() }}</span>
              </div>

              <!-- 運費列 -->
              <div class="breakdown-row text-secondary">
                <span>物流運費 ({{ (ord.shippingMethod || ord.shippingType) === 'CVS' ? '超商取貨' : '黑貓宅配' }})</span>
                <span>+ NT$ {{ getOrderShippingFee(ord).toLocaleString() }}</span>
              </div>

              <!-- 最終折抵後實付金額 -->
              <div class="breakdown-total-row">
                <div class="d-flex align-items-center flex-wrap gap-2">
                  <span class="fw-bold text-dark">折抵後實際支付金額</span>
                  <span
                    v-if="Number(ord.couponDiscount) > 0 || Number(ord.pointsUsed) > 0"
                    class="badge bg-success-subtle text-success border border-success-subtle font-monospace"
                    style="font-size: 11px; padding: 4px 10px;"
                  >
                    共折抵省下 NT$ {{ (Number(ord.couponDiscount || 0) + Number(ord.pointsUsed || 0)).toLocaleString() }}
                  </span>
                </div>
                <span class="fs-5 fw-bold text-primary">
                  NT$ {{ getOrderPaidAmount(ord).toLocaleString() }}
                </span>
              </div>
            </div>

            <!-- 4. 收件資訊與操作按鈕 -->
            <div class="order-foot-bar">
              <div class="text-muted font-monospace" style="font-size: 11.5px;">
                <div>收件：{{ ord.recipientName || ord.customerName || currentUser.name }} · {{ ord.shippingAddress || ord.shippingMethod || '預設收件地址' }}</div>
                <div v-if="ord.cancelReason" class="text-danger mt-1">
                  取消原因：{{ ord.cancelReason }}
                </div>
              </div>

              <div class="order-foot-actions">
                <button
                  v-if="['待出貨', '處理中', '已付款'].includes(ord.status)"
                  type="button"
                  class="btn btn-outline-danger btn-sm rounded-pill px-3.5 py-1.5 font-monospace flex-grow-1 flex-sm-grow-0"
                  style="font-size: 12px;"
                  @click="handleCancelOrderRequest(ord)"
                >
                  取消訂單 (通知商家)
                </button>

                <span
                  v-else-if="ord.status === '申請取消中'"
                  class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-3 py-2 font-monospace"
                  style="font-size: 11.5px;"
                >
                  ⏳ 已通知商家，等待後台確認取消
                </span>

                <button
                  v-if="ord.status === '配送中' || ord.status === '待出貨'"
                  type="button"
                  class="btn btn-dark btn-sm rounded-pill px-4 py-1.5 font-monospace fw-bold flex-grow-1 flex-sm-grow-0"
                  style="font-size: 12px;"
                  @click="confirmOrderCompleted(ord)"
                >
                  ✓ 完成訂單 (計入消費與點數)
                </button>

                <button
                  v-if="ord.status === '已完成'"
                  type="button"
                  class="btn btn-outline-secondary btn-sm rounded-pill px-3.5 py-1.5 font-monospace flex-grow-1 flex-sm-grow-0"
                  style="font-size: 11.5px;"
                  @click="requestOrderReturn(ord)"
                >
                  申請退貨
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="profile-card text-center py-5 text-muted small">
        目前「{{ currentFilterNodeLabel }}」分類下尚無訂單紀錄。
      </div>
    </div>

    <!-- 商品評價與曬圖 Modal -->
    <ReviewModal
      :is-open="reviewModalState.isOpen"
      :order-id="reviewModalState.orderId"
      :product-id="reviewModalState.productId"
      :product="reviewModalState.product"
      :item="reviewModalState.item"
      @close="reviewModalState.isOpen = false"
      @submitted="onReviewSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Layers, Package, Truck, CheckCircle2, RotateCcw, ChevronDown } from 'lucide-vue-next'
import ReviewModal from '../ReviewModal.vue'
import { useAuthStore } from '../../stores/authStore'
import { useAdminStore } from '../../stores/adminStore'
import { useProductStore } from '../../stores/productStore'

const authStore = useAuthStore()
const adminStore = useAdminStore()
const productStore = useProductStore()

const currentUser = computed(() => authStore.user || {})

// 自動正規化訂單（若舊版 adminStore.js 尚未更新，自動為預設訂單補上優惠券折抵與紅利折抵欄位）
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
  if (typeof ord.subtotal === 'number' && ord.subtotal > 0) return ord.subtotal
  return (ord.items || []).reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  )
}

const getOrderShippingFee = (ord) => {
  if (typeof ord.shippingFee === 'number') return ord.shippingFee
  return (ord.shippingMethod || ord.shippingType) === 'CVS' ? 60 : 100
}

const getOrderPaidAmount = (ord) => {
  if (typeof adminStore.getOrderPaidAmount === 'function') {
    return adminStore.getOrderPaidAmount(ord)
  }
  const sub = getOrderItemsSubtotal(ord)
  const disc = Number(ord.couponDiscount || 0) + Number(ord.pointsUsed || 0)
  const ship = getOrderShippingFee(ord)
  if (typeof ord.totalAmount === 'number' && ord.totalAmount > 0) return ord.totalAmount
  return Math.max(0, sub - disc) + ship
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

const handleCancelOrderRequest = (ord) => {
  const orderId = ord.orderId || ord.id
  const reason = prompt(`您正在申請取消尚未出貨的訂單 #${orderId}\n請輸入取消原因（送出後將立即通知商家於後台確認）：`, '想修改商品規格或重新下單')
  if (reason === null) return

  const cleanReason = reason.trim() || '顧客主動申請取消未出貨訂單'
  if (typeof adminStore.requestCancelOrder === 'function') {
    const res = adminStore.requestCancelOrder(orderId, cleanReason)
    alert(res.message)
  } else {
    ord.status = '申請取消中'
    ord.cancelReason = cleanReason
    if (adminStore.addAuditLog) {
      adminStore.addAuditLog('顧客申請取消訂單', `訂單 #${orderId} 申請取消，原因：${cleanReason}`)
    }
    alert(`已送出訂單 #${orderId} 的取消申請！商家將於後台系統確認取消。`)
  }
}

const confirmOrderCompleted = (ord) => {
  const orderId = ord.orderId || ord.id
  const paidAmt = getOrderPaidAmount(ord)
  if (!confirm(`確認已收到訂單 #${orderId} 的商品並完成訂單嗎？\n\n確認後系統將：\n1. 計入折抵後實際支付金額 NT$ ${paidAmt.toLocaleString()} 至累積消費\n2. 依您的 VIP 等級派發紅利點數\n3. 立即開放本筆訂單商品填寫評價`)) {
    return
  }

  ord.status = '已完成'
  ord.totalAmount = paidAmt

  const earnRate = Number(authStore.currentVipTier?.pointsEarnRate || 1)
  const calculatedPts = Math.max(1, Math.floor((paidAmt * earnRate) / 100))
  ord.earnedPoints = calculatedPts

  let notifyMsg = `🎉 訂單 #${orderId} 已完成！`
  if (authStore.settleCompletedOrderRewards) {
    const res = authStore.settleCompletedOrderRewards(ord)
    if (res.settled) {
      notifyMsg += `\n✓ 已計入折抵後實付消費金額：NT$ ${paidAmt.toLocaleString()}`
      notifyMsg += `\n✓ 已入帳紅利點數：+${res.earnedPoints || calculatedPts} 點`
      if (res.upgraded) {
        const giftNames = (res.issuedCoupons || []).map(c => `【${c.title}】`).join('、')
        notifyMsg += `\n👑 恭喜晉升為「${res.newTier.name}」！${giftNames ? `已自動派發升級禮券 ${giftNames} 至您的錢包！` : ''}`
      }
    }
  } else {
    currentUser.value.totalSpent = (Number(currentUser.value.totalSpent) || 0) + paidAmt
    currentUser.value.points = (Number(currentUser.value.points) || 0) + calculatedPts
    ord.rewardsSettled = true
    notifyMsg += `\n✓ 已計入折抵後實付消費金額：NT$ ${paidAmt.toLocaleString()}\n✓ 已入帳紅利點數：+${calculatedPts} 點`
  }

  notifyMsg += `\n\n現在您可以點擊商品右側的「★ 填寫評價」按鈕分享穿搭心得！`

  if (adminStore.addAuditLog) {
    adminStore.addAuditLog('會員完成訂單', `訂單 #${orderId} 已完成簽收，計入實付消費 NT$ ${paidAmt.toLocaleString()}`)
  }
  alert(notifyMsg)
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
    alert('已送出售後退貨申請，已為您切換至「取消/退貨」分類檢視！')
  }
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

.minimal-order-card {
  border-color: #e8e2da !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.minimal-order-card.is-open {
  border-color: #2d2621 !important;
  box-shadow: 0 6px 20px rgba(45, 38, 33, 0.05);
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
    justify-content: space-between;
    gap: 28px !important;
  }
}

.order-head-main {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 160px;
}

.order-head-price {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px dashed #eee8df;
}

@media (min-width: 768px) {
  .order-head-price {
    grid-column: auto;
    padding-top: 0;
    border-top: none;
    gap: 16px;
    margin-left: auto;
  }
}

.discount-mini-tag {
  color: #237804;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 999px;
  white-space: nowrap;
}

.minimal-order-body {
  padding: 20px 18px !important;
  background-color: #faf8f5;
  border-color: #eee9e2 !important;
}

@media (min-width: 768px) {
  .minimal-order-body {
    padding: 26px 30px !important;
  }
}

.order-meta-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 14px;
  margin-bottom: 18px;
  border-bottom: 1px solid #ebe5dd;
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
    padding: 16px 22px !important;
  }
}

.order-item-title:hover {
  text-decoration: underline !important;
}

.order-item-right {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 10px;
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

.order-amount-breakdown {
  background-color: #ffffff;
  border: 1px solid #e6dfd5;
  padding: 16px 20px !important;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.discount-highlight-row {
  color: #237804;
  font-weight: 600;
  background-color: #f6ffed;
  padding: 6px 12px;
  margin: 0 -6px;
  border-radius: 8px;
}

.breakdown-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px solid #ebe5dd;
  font-size: 14px;
}

.order-foot-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid #ebe5dd;
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
  gap: 8px;
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