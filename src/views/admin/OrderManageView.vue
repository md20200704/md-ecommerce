<template>
  <div class="d-flex flex-column gap-4 w-100" style="min-width: 0;">
    <!-- 頂部頁頭 -->
    <div class="d-flex justify-content-between align-items-end flex-wrap gap-2">
      <div>
        <h1 class="h4 fw-bold text-dark font-serif mb-1">訂單與物流出貨管理</h1>
        <p class="small text-muted mb-0">透過上方進度流程條快速篩選各階段訂單，處理出貨單號與售後狀態</p>
      </div>
      <span class="badge bg-white text-dark border px-3 py-2 rounded-pill font-monospace small shadow-2xs">
        全站總訂單：{{ allOrders.length }} 筆
      </span>
    </div>

    <!-- ★ 1. 訂單物流進度總流程篩選條（點擊各階段節點即可篩選對應訂單） ★ -->
    <div class="card-korean p-4 bg-white border shadow-xs">
      <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
        <span class="small fw-bold text-dark d-flex align-items-center gap-1.5">
          <Truck style="width: 15px; height: 15px;" class="text-primary" />
          <span>訂單處理與物流進度篩選條</span>
        </span>
        <span class="text-muted font-monospace" style="font-size: 11px;">點擊節點切換檢視</span>
      </div>

      <div class="py-3 px-2 px-md-4 rounded-3 bg-light border">
        <div class="d-flex justify-content-between align-items-start position-relative">
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

            <div
              v-if="selectedStatusNode === node.key"
              class="mt-1.5 rounded-pill bg-dark"
              style="width: 24px; height: 3px;"
            ></div>
          </button>
        </div>
      </div>
    </div>

    <!-- ★ 2. 多條件進階篩選與搜尋列 ★ -->
    <div class="card-korean p-3 bg-white border shadow-xs d-flex flex-wrap justify-content-between align-items-center gap-2.5">
      <div class="d-flex flex-wrap gap-2 flex-grow-1">
        <input
          v-model="searchKeyword"
          type="text"
          class="form-control form-control-sm rounded-pill"
          style="max-width: 250px;"
          placeholder="搜尋訂單編號、收件人、手機、物流單號..."
        />

        <select v-model="shippingFilter" class="form-select form-select-sm rounded-pill font-monospace" style="width: 160px;">
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

      <span class="text-muted small font-monospace">顯示 {{ filteredOrders.length }} 筆訂單</span>
    </div>

    <!-- ★ 3. 訂單資料清單表格 ★ -->
    <div class="card-korean bg-white p-3.5 p-md-4 border shadow-xs">
      <div v-if="filteredOrders.length > 0" class="table-responsive">
        <table class="table table-hover align-middle small mb-0 font-sans">
          <thead class="table-light">
            <tr class="text-secondary text-nowrap" style="font-size: 11px;">
              <th style="min-width: 140px;">訂單編號 / 時間</th>
              <th style="min-width: 150px;">收件人 / 配送方式</th>
              <th style="min-width: 210px;">購買商品明細</th>
              <th style="min-width: 115px;">實付金額</th>
              <th style="min-width: 110px;">目前狀態</th>
              <th style="min-width: 145px;">物流追蹤單號</th>
              <th class="text-end text-nowrap" style="min-width: 115px;">出貨與處理</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ord in filteredOrders" :key="ord.orderId || ord.id">
              <td>
                <strong class="font-monospace text-dark d-block">#{{ ord.orderId || ord.id }}</strong>
                <span class="text-muted font-monospace" style="font-size: 10.5px;">{{ ord.createdAt || ord.date }}</span>
              </td>

              <td>
                <strong class="text-dark d-block">{{ ord.recipientName || ord.customerName }}</strong>
                <span class="text-muted font-monospace d-block" style="font-size: 11px;">{{ ord.phone }}</span>
                <span class="badge bg-light text-secondary border font-monospace mt-0.5" style="font-size: 9.5px;">
                  {{ ord.shippingMethod === 'CVS' ? '超商純取貨' : '黑貓宅配' }}
                </span>
              </td>

              <td>
                <div
                  v-for="(item, idx) in (ord.items || [])"
                  :key="idx"
                  class="text-truncate text-dark"
                  style="max-width: 230px; font-size: 11.5px;"
                >
                  • {{ item.name }} <span class="text-muted font-monospace">({{ item.color }}/{{ item.size }}) ×{{ item.quantity }}</span>
                </div>
              </td>

              <td>
                <strong class="font-monospace text-dark d-block">NT$ {{ (ord.totalAmount || ord.total || 0).toLocaleString() }}</strong>
                <span class="badge bg-success-subtle text-success font-monospace" style="font-size: 9.5px;">
                  {{ ord.paymentMethod || 'LINE Pay' }}
                </span>
              </td>

              <td>
                <span class="badge rounded-pill font-monospace py-1 px-2.5" :class="getStatusBadgeClass(ord.status)">
                  {{ ord.status }}
                </span>
              </td>

              <td class="font-monospace small">
                <span v-if="ord.trackingNumber" class="text-dark fw-semibold">{{ ord.trackingNumber }}</span>
                <span v-else class="text-muted fst-italic">尚未填入單號</span>
              </td>

              <td class="text-end text-nowrap">
                <button
                  type="button"
                  class="btn btn-outline-dark btn-sm rounded-pill px-3 py-1 font-monospace"
                  style="font-size: 11px;"
                  @click="openOrderModal(ord)"
                >
                  處理 / 出貨
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-5 text-muted small">
        目前篩選條件下沒有符合的訂單資料。
      </div>
    </div>

    <!-- 訂單處理與出貨單號設定 Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 520px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-0">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">訂單狀態與物流出貨處理</h3>
              <button type="button" class="btn-close" @click="showModal = false"></button>
            </div>
            <div class="modal-body small px-1 py-3" v-if="editingOrder">
              <div class="p-3 rounded-3 bg-light border mb-3">
                <div class="d-flex justify-content-between font-monospace fw-bold text-dark mb-1">
                  <span>訂單編號：#{{ editingOrder.orderId || editingOrder.id }}</span>
                  <span>NT$ {{ (editingOrder.totalAmount || editingOrder.total || 0).toLocaleString() }}</span>
                </div>
                <div class="text-secondary">收件人：{{ editingOrder.recipientName || editingOrder.customerName }} ({{ editingOrder.phone }})</div>
                <div class="text-secondary">配送地址：{{ editingOrder.shippingAddress || '標準配送地址' }}</div>
              </div>

              <form @submit.prevent="saveOrderUpdate" class="d-flex flex-column gap-3">
                <div>
                  <label class="form-label text-secondary fw-semibold mb-1">更新訂單階段狀態 *</label>
                  <select v-model="editForm.status" class="form-select form-select-sm font-monospace" required>
                    <option value="待出貨">待出貨 (備貨包裝中)</option>
                    <option value="配送中">配送中 (已交寄物流)</option>
                    <option value="已完成">已完成 (顧客已簽收)</option>
                    <option value="退貨審核中">退貨審核中</option>
                    <option value="已取消">已取消</option>
                  </select>
                </div>

                <div>
                  <label class="form-label text-secondary fw-semibold mb-1">物流追蹤單號 (宅配單號 / 超商交貨便代碼)</label>
                  <input
                    v-model="editForm.trackingNumber"
                    type="text"
                    class="form-control form-control-sm font-monospace"
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
import { Layers, Package, Truck, CheckCircle2, RotateCcw } from 'lucide-vue-next'
import { useAdminStore } from '../../stores/adminStore'

const adminStore = useAdminStore()

const allOrders = computed(() => adminStore.orders || [])

const selectedStatusNode = ref('ALL')
const shippingFilter = ref('ALL')
const searchKeyword = ref('')

const orderFlowNodes = [
  { key: 'ALL', label: '全部訂單', sublabel: '所有交易總覽', icon: Layers },
  { key: 'PACKING', label: '待出貨 / 備貨', sublabel: '待檢貨包裝', icon: Package },
  { key: 'SHIPPING', label: '物流配送中', sublabel: '宅配/超商轉運', icon: Truck },
  { key: 'COMPLETED', label: '已完成簽收', sublabel: '交易結案', icon: CheckCircle2 },
  { key: 'RETURN', label: '售後 / 退貨取消', sublabel: '異常與退貨處理', icon: RotateCcw }
]

const matchNode = (ord, key) => {
  if (key === 'ALL') return true
  const st = ord.status || ''
  if (key === 'PACKING') return ['待出貨', '處理中', '已付款'].includes(st)
  if (key === 'SHIPPING') return st === '配送中'
  if (key === 'COMPLETED') return st === '已完成'
  if (key === 'RETURN') return ['退貨審核中', '已退貨', '已取消'].includes(st)
  return false
}

const getNodeCount = (key) => allOrders.value.filter(o => matchNode(o, key)).length

const filteredOrders = computed(() => {
  return allOrders.value.filter(ord => {
    if (!matchNode(ord, selectedStatusNode.value)) return false
    if (shippingFilter.value !== 'ALL' && (ord.shippingMethod || 'HOME') !== shippingFilter.value) {
      return false
    }
    if (searchKeyword.value.trim()) {
      const q = searchKeyword.value.trim().toLowerCase()
      const idMatch = (ord.orderId || ord.id || '').toLowerCase().includes(q)
      const nameMatch = (ord.recipientName || ord.customerName || '').toLowerCase().includes(q)
      const phoneMatch = (ord.phone || '').includes(q)
      const trackMatch = (ord.trackingNumber || '').toLowerCase().includes(q)
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

const getStatusBadgeClass = (status) => {
  const map = {
    '待出貨': 'bg-danger-subtle text-danger border border-danger-subtle',
    '處理中': 'bg-danger-subtle text-danger border border-danger-subtle',
    '配送中': 'bg-warning-subtle text-warning-emphasis border border-warning-subtle',
    '已完成': 'bg-success-subtle text-success border border-success-subtle',
    '退貨審核中': 'bg-danger text-white',
    '已取消': 'bg-secondary-subtle text-secondary'
  }
  return map[status] || 'bg-light text-dark'
}

const showModal = ref(false)
const editingOrder = ref(null)
const editForm = reactive({ status: '待出貨', trackingNumber: '' })

const openOrderModal = (ord) => {
  editingOrder.value = ord
  editForm.status = ord.status
  editForm.trackingNumber = ord.trackingNumber || ''
  showModal.value = true
}

const saveOrderUpdate = () => {
  if (!editingOrder.value) return
  editingOrder.value.status = editForm.status
  editingOrder.value.trackingNumber = editForm.trackingNumber.trim()
  if (adminStore.addAuditLog) {
    adminStore.addAuditLog(
      '更新訂單物流進度',
      `訂單 #${editingOrder.value.orderId || editingOrder.value.id} 更新為【${editForm.status}】${editForm.trackingNumber ? `，單號：${editForm.trackingNumber}` : ''}`
    )
  }
  alert('訂單狀態與物流單號已更新！')
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
</style>