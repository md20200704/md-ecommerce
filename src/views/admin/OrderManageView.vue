<template>
  <div class="d-flex flex-column gap-4 w-100" style="min-width: 0;">
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

    <!-- 🔔 顧客申請取消訂單即時通知橫幅（當有訂單處於「申請取消中」時醒目提示商家確認） -->
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
          @click="selectedStatusNode = 'RETURN'"
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

    <!-- 1. 訂單物流進度總流程篩選條 -->
    <div class="card-korean p-4 bg-white rounded-4 border shadow-xs">
      <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
        <span class="small fw-bold text-dark d-flex align-items-center gap-1.5">
          <Truck style="width: 15px; height: 15px;" class="text-primary" />
          <span>訂單處理與物流進度篩選條</span>
        </span>
        <span class="text-muted font-monospace" style="font-size: 11px;">點擊節點切換檢視</span>
      </div>

      <div class="py-3 px-2 px-md-4 rounded-3 bg-light border overflow-x-auto">
        <div class="d-flex justify-content-between align-items-start position-relative" style="min-width: 420px;">
          <div
            class="position-absolute start-0 w-100 bg-secondary-subtle"
            style="top: 19px; height: 2px; z-index: 1;"
          ></div>

          <button
            v-for="node in orderFlowNodes"
            :key="node.key"
            type="button"
            class="btn p-0 border-0 bg-transparent d-flex flex-column align-items-center text-center position-relative flow-node-btn"
            style="z-index: 2; width: 20%;"
            @click="selectedStatusNode = node.key"
          >
            <div class="position-relative">
              <div
                class="rounded-circle d-flex align-items-center justify-content-center font-monospace fw-bold border shadow-2xs transition"
                :class="selectedStatusNode === node.key ? 'bg-dark text-white border-dark scale-active' : 'bg-white text-secondary border-secondary-subtle'"
                style="width: 38px; height: 38px;"
              >
                <component :is="node.icon" style="width: 16px; height: 16px;" />
              </div>

              <span
                v-if="getNodeCount(node.key) > 0"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill font-monospace"
                :class="selectedStatusNode === node.key ? 'bg-primary text-white' : 'bg-secondary text-white'"
                style="font-size: 9.5px;"
              >
                {{ getNodeCount(node.key) }}
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

    <!-- 2. 多條件進階篩選與搜尋列 -->
    <div class="card-korean p-3.5 px-4 bg-white rounded-4 border shadow-xs d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div class="d-flex flex-wrap gap-2.5 flex-grow-1">
        <input
          v-model="searchKeyword"
          type="text"
          class="form-control form-control-sm rounded-pill px-3"
          style="max-width: 260px;"
          placeholder="搜尋訂單編號、收件人、手機、物流單號..."
        />

        <select v-model="shippingFilter" class="form-select form-select-sm rounded-pill font-monospace" style="width: 165px;">
          <option value="ALL">全部配送方式</option>
          <option value="HOME">黑貓宅配到府</option>
          <option value="CVS">7-11 / 全家超取</option>
        </select>

        <button
          v-if="selectedStatusNode !== 'ALL' || shippingFilter !== 'ALL' || searchKeyword"
          type="button"
          class="btn btn-outline-secondary btn-sm rounded-pill px-3 font-monospace"
          style="font-size: 11px;"
          @click="resetFilters"
        >
          清除篩選條件
        </button>
      </div>

      <div class="d-flex align-items-center gap-3">
        <button
          v-if="filteredOrders.length > 0"
          type="button"
          class="btn btn-link btn-sm text-secondary text-decoration-none p-0 font-monospace"
          style="font-size: 12px;"
          @click="toggleAllAdminOrders"
        >
          {{ areAllAdminOrdersExpanded ? '全部收合' : '全部展開' }}
        </button>
        <span class="text-muted small font-monospace">共 {{ filteredOrders.length }} 筆訂單</span>
      </div>
    </div>

    <!-- 3. 訂單可收合卡片列表 -->
    <div v-if="filteredOrders.length > 0" class="d-flex flex-column gap-3">
      <div
        v-for="ord in filteredOrders"
        :key="ord.orderId || ord.id"
        class="minimal-admin-order bg-white rounded-4 border overflow-hidden"
        :class="{ 'is-open': isAdminOrderExpanded(ord.orderId || ord.id) }"
      >
        <div
          class="minimal-admin-header d-flex align-items-center justify-content-between flex-wrap gap-3"
          @click="toggleAdminOrderExpand(ord.orderId || ord.id)"
        >
          <div class="d-flex flex-column gap-1" style="min-width: 165px;">
            <span class="font-monospace fw-bold text-dark" style="font-size: 15px;">
              #{{ ord.orderId || ord.id }}
            </span>
            <span class="text-muted font-monospace" style="font-size: 11.5px;">
              {{ ord.createdAt || ord.date }}
            </span>
          </div>

          <div class="d-flex flex-column gap-1" style="min-width: 145px;">
            <span class="fw-semibold text-dark" style="font-size: 14px;">
              {{ ord.recipientName || ord.customerName }}
            </span>
            <span class="text-muted font-monospace" style="font-size: 11.5px;">
              {{ ord.phone }}
            </span>
          </div>

          <div class="d-flex align-items-center gap-3">
            <span class="status-pill d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill font-sans fw-medium" :class="getCleanStatusClass(ord.status)">
              <span class="status-dot"></span>
              <span>{{ ord.status }}</span>
            </span>
            <span class="text-muted small font-monospace">
              {{ (ord.shippingMethod || ord.shippingType) === 'CVS' ? '超取' : '宅配' }} · {{ getAdminOrderTotalQty(ord) }} 件
            </span>
          </div>

          <div class="d-flex align-items-center gap-2.5 ms-auto">
            <span class="font-monospace fw-bold text-dark me-1" style="font-size: 16px;">
              NT$ {{ getOrderPaidAmount(ord).toLocaleString() }}
            </span>

            <!-- 若顧客申請取消中，直接提供確認取消按鈕 -->
            <button
              v-if="ord.status === '申請取消中'"
              type="button"
              class="btn btn-danger btn-sm rounded-pill px-3 py-1.5 font-monospace fw-bold"
              style="font-size: 11.5px;"
              @click.stop="handleApproveCancel(ord)"
            >
              ✓ 確認取消
            </button>

            <button
              type="button"
              class="btn btn-dark btn-sm rounded-pill px-3.5 py-1.5 font-monospace"
              style="font-size: 11.5px;"
              @click.stop="openOrderModal(ord)"
            >
              處理 / 出貨
            </button>

            <ChevronDown
              style="width: 18px; height: 18px;"
              class="text-muted transition-icon"
              :class="{ 'rotate-180 text-dark': isAdminOrderExpanded(ord.orderId || ord.id) }"
            />
          </div>
        </div>

        <!-- 展開後的訂單完整明細 -->
        <div v-show="isAdminOrderExpanded(ord.orderId || ord.id)" class="minimal-admin-body border-top">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 pb-3 mb-3 border-bottom small text-secondary">
            <div class="d-flex flex-wrap gap-3 font-monospace" style="font-size: 12px;">
              <span>付款：<strong class="text-dark">{{ ord.paymentMethod || 'LINE Pay' }}</strong></span>
              <span>
                物流單號：
                <strong v-if="ord.trackingNumber || ord.trackingCode" class="text-dark">{{ ord.trackingNumber || ord.trackingCode }}</strong>
                <span v-else class="text-muted fst-italic">尚未填入</span>
              </span>
              <span>地址：<strong class="text-dark">{{ ord.shippingAddress || ord.shippingMethod || '預設收件地址' }}</strong></span>
            </div>

            <div class="font-monospace" style="font-size: 11.5px;">
              <span v-if="ord.rewardsSettled" class="text-success fw-semibold">
                ✓ 實付 NT$ {{ getOrderPaidAmount(ord).toLocaleString() }} 已計入消費與點數
              </span>
              <span v-else class="text-muted">訂單完成後結算累積消費</span>
            </div>
          </div>

          <!-- 商品明細（含商品縮圖） -->
          <div class="d-flex flex-column gap-2.5">
            <div
              v-for="(item, idx) in (ord.items || [])"
              :key="idx"
              class="d-flex justify-content-between align-items-center gap-3 py-1.5 px-2.5 bg-white rounded-3 border"
            >
              <div class="d-flex align-items-center gap-3 min-w-0">
                <div
                  class="rounded-3 overflow-hidden border flex-shrink-0"
                  style="width: 48px; height: 60px; background-color: #f7f4ef;"
                >
                  <img :src="getItemImage(item)" class="w-100 h-100 object-fit-cover" />
                </div>
                <div class="min-w-0">
                  <div class="fw-semibold text-dark text-truncate" style="max-width: 380px; font-size: 14px;">
                    {{ item.name }}
                  </div>
                  <div class="text-muted font-monospace mt-1" style="font-size: 12px;">
                    {{ item.color || '標準' }} / {{ item.size || 'F' }} · 單價 NT$ {{ (item.price || 0).toLocaleString() }} × {{ item.quantity || 1 }}
                  </div>
                </div>
              </div>

              <span class="font-monospace text-dark fw-bold flex-shrink-0" style="font-size: 14px;">
                NT$ {{ ((item.price || 0) * (item.quantity || 1)).toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="card-korean bg-white rounded-4 border text-center py-5 text-muted small">
      目前篩選條件下沒有符合的訂單資料。
    </div>

    <!-- 訂單處理與出貨單號設定 Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 520px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-2">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">訂單狀態與物流出貨處理</h3>
              <button type="button" class="btn-close" @click="showModal = false"></button>
            </div>
            <div class="modal-body small px-2 py-3" v-if="editingOrder">
              <div class="p-3.5 rounded-3 bg-light border mb-3.5">
                <div class="d-flex justify-content-between font-monospace fw-bold text-dark mb-1.5">
                  <span>訂單編號：#{{ editingOrder.orderId || editingOrder.id }}</span>
                  <span>實付 NT$ {{ getOrderPaidAmount(editingOrder).toLocaleString() }}</span>
                </div>
                <div class="text-secondary mb-1">收件人：{{ editingOrder.recipientName || editingOrder.customerName }} ({{ editingOrder.phone }})</div>
                <div class="text-secondary">配送地址：{{ editingOrder.shippingAddress || editingOrder.shippingMethod || '標準配送地址' }}</div>
              </div>

              <form @submit.prevent="saveOrderUpdate" class="d-flex flex-column gap-3.5">
                <div>
                  <label class="form-label text-secondary fw-semibold mb-1.5">更新訂單階段狀態 *</label>
                  <select v-model="editForm.status" class="form-select form-select-sm font-monospace py-2 px-3" required>
                    <option value="待出貨">待出貨 (備貨包裝中)</option>
                    <option value="配送中">配送中 (已交寄物流)</option>
                    <option value="已完成">已完成 (顧客已簽收 - 自動結算實付消費與VIP點數)</option>
                    <option value="申請取消中">申請取消中 (待確認)</option>
                    <option value="退貨審核中">退貨審核中</option>
                    <option value="已取消">已取消 (確認取消並回補庫存)</option>
                  </select>
                </div>

                <div>
                  <label class="form-label text-secondary fw-semibold mb-1.5">物流追蹤單號 (宅配單號 / 超商交貨便代碼)</label>
                  <input
                    v-model="editForm.trackingNumber"
                    type="text"
                    class="form-control form-control-sm font-monospace py-2 px-3"
                    placeholder="例如：TCAT-992817263 或 711-88374610"
                  />
                </div>

                <button type="submit" class="btn btn-dark w-100 rounded-pill py-2.5 fw-bold mt-1">
                  確認更新訂單狀態
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Layers, Package, Truck, CheckCircle2, RotateCcw, ChevronDown } from 'lucide-vue-next'
import { useAdminStore } from '../../stores/adminStore'
import { useAuthStore } from '../../stores/authStore'
import { useProductStore } from '../../stores/productStore'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const productStore = useProductStore()

const allOrders = computed(() => adminStore.orders || [])

// 篩選出所有處於「申請取消中」的訂單供頂部通知橫幅顯示
const pendingCancelOrders = computed(() => {
  return allOrders.value.filter(o => o.status === '申請取消中')
})

const getOrderPaidAmount = (ord) => {
  if (typeof adminStore.getOrderPaidAmount === 'function') {
    return adminStore.getOrderPaidAmount(ord)
  }
  return Number(ord.totalAmount || ord.amount || ord.total || 0)
}

const getItemImage = (item) => {
  if (item?.image) return item.image
  const matchedProd = (productStore.products || []).find(
    p => Number(p.id) === Number(item?.id) || (item?.name && item.name.includes(p.name))
  )
  return matchedProd?.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80'
}

const handleApproveCancel = (ord) => {
  const orderId = ord.orderId || ord.id
  if (!confirm(`確定要核准取消訂單 #${orderId} 嗎？\n確認後系統將自動回補該筆訂單的商品庫存，並退還顧客已折抵的紅利點數。`)) {
    return
  }
  const res = adminStore.approveCancelOrder(orderId)
  alert(res.message)
}

const handleRejectCancel = (ord) => {
  const orderId = ord.orderId || ord.id
  const res = adminStore.rejectCancelOrder(orderId)
  alert(res.message)
}

const selectedStatusNode = ref('ALL')
const shippingFilter = ref('ALL')
const searchKeyword = ref('')

const expandedAdminOrderIds = ref({})
const isAdminOrderExpanded = (id) => Boolean(expandedAdminOrderIds.value[id])
const toggleAdminOrderExpand = (id) => {
  expandedAdminOrderIds.value[id] = !expandedAdminOrderIds.value[id]
}

const areAllAdminOrdersExpanded = computed(() => {
  if (filteredOrders.value.length === 0) return false
  return filteredOrders.value.every(o => isAdminOrderExpanded(o.orderId || o.id))
})

const toggleAllAdminOrders = () => {
  const target = !areAllAdminOrdersExpanded.value
  filteredOrders.value.forEach(o => {
    expandedAdminOrderIds.value[o.orderId || o.id] = target
  })
}

const getAdminOrderTotalQty = (ord) => {
  return (ord.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
}

const orderFlowNodes = [
  { key: 'ALL', label: '全部訂單', sublabel: '所有交易總覽', icon: Layers },
  { key: 'PACKING', label: '待出貨 / 備貨', sublabel: '待檢貨包裝', icon: Package },
  { key: 'SHIPPING', label: '物流配送中', sublabel: '宅配/超商轉運', icon: Truck },
  { key: 'COMPLETED', label: '已完成簽收', sublabel: '已結算累積消費', icon: CheckCircle2 },
  { key: 'RETURN', label: '取消 / 退貨申請', sublabel: '含待確認取消單', icon: RotateCcw }
]

const matchNode = (ord, key) => {
  if (key === 'ALL') return true
  const st = ord.status || ''
  if (key === 'PACKING') return ['待出貨', '處理中', '已付款'].includes(st)
  if (key === 'SHIPPING') return st === '配送中'
  if (key === 'COMPLETED') return st === '已完成'
  if (key === 'RETURN') return ['申請取消中', '退貨審核中', '已退貨', '已取消'].includes(st)
  return false
}

const getNodeCount = (key) => allOrders.value.filter(o => matchNode(o, key)).length

const filteredOrders = computed(() => {
  return allOrders.value.filter(ord => {
    if (!matchNode(ord, selectedStatusNode.value)) return false
    if (shippingFilter.value !== 'ALL' && (ord.shippingMethod || ord.shippingType || 'HOME') !== shippingFilter.value) {
      return false
    }
    if (searchKeyword.value.trim()) {
      const q = searchKeyword.value.trim().toLowerCase()
      const idMatch = (ord.orderId || ord.id || '').toLowerCase().includes(q)
      const nameMatch = (ord.recipientName || ord.customerName || '').toLowerCase().includes(q)
      const phoneMatch = (ord.phone || '').includes(q)
      const trackMatch = (ord.trackingNumber || ord.trackingCode || '').toLowerCase().includes(q)
      if (!idMatch && !nameMatch && !phoneMatch && !trackMatch) return false
    }
    return true
  })
})

const resetFilters = () => {
  selectedStatusNode.value = 'ALL'
  shippingFilter.value = 'ALL'
  searchKeyword.value = ''
}

const getCleanStatusClass = (status) => {
  if (['待出貨', '處理中'].includes(status)) return 'pill-pending'
  if (status === '配送中') return 'pill-shipping'
  if (status === '已完成') return 'pill-completed'
  if (status === '申請取消中') return 'pill-cancel-req'
  return 'pill-return'
}

const showModal = ref(false)
const editingOrder = ref(null)
const editForm = reactive({ status: '待出貨', trackingNumber: '' })

const openOrderModal = (ord) => {
  editingOrder.value = ord
  editForm.status = ord.status || '待出貨'
  editForm.trackingNumber = ord.trackingNumber || ord.trackingCode || ''
  showModal.value = true
}

const saveOrderUpdate = () => {
  if (!editingOrder.value) return
  const orderId = editingOrder.value.orderId || editingOrder.value.id

  if (editForm.status === '已取消' && editingOrder.value.status !== '已取消') {
    const res = adminStore.approveCancelOrder(orderId)
    alert(res.message)
    showModal.value = false
    return
  }

  editingOrder.value.status = editForm.status
  editingOrder.value.trackingNumber = editForm.trackingNumber.trim()

  let settleMessage = ''

  if (editForm.status === '已完成' && authStore.settleCompletedOrderRewards) {
    const res = authStore.settleCompletedOrderRewards(editingOrder.value)
    if (res.settled) {
      settleMessage = `\n✓ 已將折抵後實付金額 NT$ ${res.paidAmount.toLocaleString()} 計入會員累積消費，並發放 ${res.earnedPoints} 點紅利。`
      if (res.upgraded) {
        const giftNames = (res.issuedCoupons || []).map(c => `【${c.title}】`).join('、')
        settleMessage += `\n👑 該會員已達成升級門檻晉升為【${res.newTier.name}】${giftNames ? `，並自動發送升級禮券 ${giftNames}` : ''}！`
      }
    }
  }

  if (adminStore.addAuditLog) {
    adminStore.addAuditLog(
      '更新訂單物流進度',
      `訂單 #${orderId} 更新為【${editForm.status}】${editForm.trackingNumber ? `，單號：${editForm.trackingNumber}` : ''}`
    )
  }

  alert(`訂單狀態與物流單號已更新！${settleMessage}`)
  showModal.value = false
}
</script>

<style scoped>
.flow-node-btn {
  cursor: pointer;
}
.flow-node-btn:hover .rounded-circle {
  transform: translateY(-2px);
  border-color: #2d2621 !important;
}
.scale-active {
  transform: scale(1.08);
}

.minimal-admin-order {
  border-color: #e8e2da !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.minimal-admin-order:hover {
  border-color: #c8bfb5 !important;
}

.minimal-admin-order.is-open {
  border-color: #2d2621 !important;
  box-shadow: 0 6px 20px rgba(45, 38, 33, 0.05);
}

.minimal-admin-header {
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  user-select: none;
  background-color: #ffffff;
  transition: background-color 0.15s ease;
}

.minimal-admin-header:hover {
  background-color: #fcfaf7;
}

.minimal-admin-body {
  padding: 1.5rem;
  background-color: #faf8f5;
  border-color: #eee9e2 !important;
}

.status-pill {
  font-size: 12px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.pill-pending {
  background-color: #fff2f0;
  color: #cf1322;
}
.pill-pending .status-dot {
  background-color: #cf1322;
}

.pill-shipping {
  background-color: #fffbe6;
  color: #d48806;
}
.pill-shipping .status-dot {
  background-color: #d48806;
}

.pill-completed {
  background-color: #f6ffed;
  color: #389e0d;
}
.pill-completed .status-dot {
  background-color: #389e0d;
}

.pill-cancel-req {
  background-color: #fff7e6;
  color: #d46b08;
}
.pill-cancel-req .status-dot {
  background-color: #d46b08;
}

.pill-return {
  background-color: #f5f5f5;
  color: #595959;
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