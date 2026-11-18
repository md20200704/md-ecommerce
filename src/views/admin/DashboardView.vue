<template>
  <div class="dashboard-container d-flex flex-column gap-4 w-100" style="min-width: 0; overflow-x: hidden;">
    <!-- ==================== 1. 頁面標題與匯出工具列 ==================== -->
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div>
        <h1 class="h4 fw-bold text-dark font-serif mb-1">AD-10 營運數據儀表板</h1>
        <p class="small text-muted mb-0">即時監控全店 GMV、轉化率指標、熱銷穿搭排行與財務金物流收支對帳</p>
      </div>
      <div class="d-flex gap-2">
        <button
          class="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-2xs font-monospace d-flex align-items-center gap-1.5"
          @click="exportFilteredReport"
        >
          <Download style="width: 14px; height: 14px;" />
          <span>匯出當前對帳報表 (CSV)</span>
        </button>
      </div>
    </div>

    <!-- ==================== 2. 多維度篩選工具列 ==================== -->
    <div class="card-korean p-3.5 bg-white shadow-xs">
      <div class="d-flex flex-column gap-3">
        <!-- 上排：時間預設標籤與自訂日期 -->
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <div class="d-flex align-items-center gap-1.5 text-muted">
              <Calendar style="width: 15px; height: 15px; color: var(--md-primary, #9b7e68);" />
              <span class="small fw-semibold text-dark" style="font-size: 12px;">時間維度：</span>
            </div>
            <div class="btn-group btn-group-sm rounded-pill border p-0.5 bg-light flex-wrap" role="group">
              <button
                v-for="preset in datePresets"
                :key="preset.key"
                type="button"
                class="btn btn-sm rounded-pill py-1 px-3 font-monospace border-0"
                :class="filter.period === preset.key ? 'btn-white bg-white text-dark shadow-2xs fw-bold' : 'text-muted'"
                @click="selectDatePreset(preset.key)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <!-- 自訂日期區間 -->
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <input
              v-model="filter.startDate"
              type="date"
              class="form-control form-control-sm font-monospace rounded-pill px-3"
              style="width: 135px; font-size: 11.5px;"
            />
            <span class="text-muted small">至</span>
            <input
              v-model="filter.endDate"
              type="date"
              class="form-control form-control-sm font-monospace rounded-pill px-3"
              style="width: 135px; font-size: 11.5px;"
            />
          </div>
        </div>

        <!-- 下排：進階狀態與渠道篩選 -->
        <div class="d-flex align-items-center flex-wrap gap-3 pt-2 border-top small">
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted font-monospace">訂單狀態：</span>
            <select v-model="filter.shippingStatus" class="form-select form-select-sm rounded-pill font-monospace" style="width: 130px; font-size: 11px;">
              <option value="ALL">全部狀態</option>
              <option value="PENDING">待出貨</option>
              <option value="SHIPPED">配送中</option>
              <option value="DELIVERED">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>

          <div class="d-flex align-items-center gap-2">
            <span class="text-muted font-monospace">支付方式：</span>
            <select v-model="filter.paymentMethod" class="form-select form-select-sm rounded-pill font-monospace" style="width: 130px; font-size: 11px;">
              <option value="ALL">全部金流</option>
              <option value="LINE Pay">LINE Pay</option>
              <option value="信用卡一次付清">信用卡一次付清</option>
              <option value="超商代碼繳費">超商代碼繳費</option>
              <option value="貨到付款">貨到付款</option>
            </select>
          </div>

          <div class="d-flex align-items-center gap-2">
            <span class="text-muted font-monospace">物流方式：</span>
            <select v-model="filter.shippingType" class="form-select form-select-sm rounded-pill font-monospace" style="width: 130px; font-size: 11px;">
              <option value="ALL">全部物流</option>
              <option value="CVS">超商純取貨</option>
              <option value="HOME">黑貓宅配</option>
            </select>
          </div>

          <button
            type="button"
            class="btn btn-outline-dark btn-sm rounded-pill px-3 ms-auto font-monospace"
            style="font-size: 11px;"
            @click="resetFilter"
          >
            重置篩選
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 3. 核心 4 大營運指標卡 ==================== -->
    <div class="row g-3">
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card-korean bg-white shadow-xs h-100 d-flex flex-column justify-content-between p-4">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted font-monospace small mb-1">總營業額 (GMV)</div>
              <div class="h3 fw-bold font-monospace text-dark mb-0">NT$ {{ computedMetrics.gmv.toLocaleString() }}</div>
            </div>
            <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2.5 py-1" style="font-size: 10px;">
              +18.4% YoY
            </span>
          </div>
          <div class="mt-3 pt-2 border-top text-muted font-monospace small" style="font-size: 11.5px;">
            有效訂單共 {{ computedMetrics.orderCount }} 筆
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card-korean bg-white shadow-xs h-100 d-flex flex-column justify-content-between p-4">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted font-monospace small mb-1">訪客下單轉化率 (CR)</div>
              <div class="h3 fw-bold font-monospace text-dark mb-0">{{ computedMetrics.conversionRate }}%</div>
            </div>
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2.5 py-1" style="font-size: 10px;">
              目標 &gt; 3.0%
            </span>
          </div>
          <div class="mt-3 pt-2 border-top text-muted font-monospace small" style="font-size: 11.5px;">
            客單價 AOV：NT$ {{ computedMetrics.aov.toLocaleString() }}
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card-korean bg-white shadow-xs h-100 d-flex flex-column justify-content-between p-4">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted font-monospace small mb-1">退貨與售後率</div>
              <div class="h3 fw-bold font-monospace text-danger mb-0">{{ computedMetrics.returnRate }}%</div>
            </div>
            <span class="badge bg-danger-subtle text-danger border border-danger-subtle font-monospace px-2.5 py-1" style="font-size: 10px;">
              警戒值 &lt; 5.0%
            </span>
          </div>
          <div class="mt-3 pt-2 border-top text-muted font-monospace small" style="font-size: 11.5px;">
            已處理退貨 {{ computedMetrics.returnCount }} 筆
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card-korean bg-white shadow-xs h-100 d-flex flex-column justify-content-between p-4">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="text-muted font-monospace small mb-1">毛利率估算 (Gross Margin)</div>
              <div class="h3 fw-bold font-monospace text-success mb-0">{{ computedMetrics.grossMargin }}%</div>
            </div>
            <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2.5 py-1" style="font-size: 10px;">
              含成本分析
            </span>
          </div>
          <div class="mt-3 pt-2 border-top text-muted font-monospace small" style="font-size: 11.5px;">
            預估毛利：NT$ {{ computedMetrics.estimatedProfit.toLocaleString() }}
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 4. 熱銷穿搭排行與財務收支對帳表格 ==================== -->
    <div class="row g-4">
      <!-- 左側：熱銷商品排行 TOP 5 -->
      <div class="col-12 col-xl-6">
        <div class="card-korean bg-white shadow-xs h-100 p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="fs-6 fw-bold text-dark mb-0">🔥 熱銷穿搭排行 (TOP 5)</h2>
            <span class="text-muted font-monospace small" style="font-size: 11px;">依銷售數量加總</span>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle small mb-0">
              <thead class="table-light">
                <tr class="text-secondary font-monospace" style="font-size: 11px;">
                  <th style="width: 50px;">排名</th>
                  <th>商品名稱</th>
                  <th class="text-end">售價</th>
                  <th class="text-end">售出件數</th>
                  <th class="text-end">銷售額</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in topSellingProducts" :key="item.id">
                  <td>
                    <span
                      class="badge rounded-circle font-monospace d-inline-flex align-items-center justify-content-center"
                      :class="idx === 0 ? 'bg-dark text-white' : idx === 1 ? 'bg-secondary text-white' : idx === 2 ? 'bg-light text-dark border' : 'bg-light text-muted'"
                      style="width: 24px; height: 24px; font-size: 11px;"
                    >
                      {{ idx + 1 }}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <img :src="item.image" class="rounded-3 object-fit-cover border" style="width: 36px; height: 44px;" />
                      <div class="fw-bold text-dark text-truncate" style="max-width: 180px;">{{ item.name }}</div>
                    </div>
                  </td>
                  <td class="text-end font-monospace">NT$ {{ Number(item.price).toLocaleString() }}</td>
                  <td class="text-end font-monospace fw-bold text-primary">{{ item.soldQty }} 件</td>
                  <td class="text-end font-monospace fw-bold">NT$ {{ item.salesAmount.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 右側：財務金物流收支對帳表 -->
      <div class="col-12 col-xl-6">
        <div class="card-korean bg-white shadow-xs h-100 p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="fs-6 fw-bold text-dark mb-0">💰 財務金物流收支對帳表</h2>
            <span class="text-muted font-monospace small" style="font-size: 11px;">手續費與託運成本彙總</span>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle small mb-0">
              <thead class="table-light">
                <tr class="text-secondary font-monospace" style="font-size: 11px;">
                  <th>金流渠道</th>
                  <th class="text-center">筆數</th>
                  <th class="text-end">總交易額</th>
                  <th class="text-end">金流手續費</th>
                  <th class="text-end">物流成本</th>
                  <th class="text-end">實收淨額</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in financialReportRows" :key="row.channel">
                  <td class="fw-bold text-dark">{{ row.channel }}</td>
                  <td class="text-center font-monospace">{{ row.count }} 筆</td>
                  <td class="text-end font-monospace">NT$ {{ row.gross.toLocaleString() }}</td>
                  <td class="text-end font-monospace text-danger">- NT$ {{ row.fee.toLocaleString() }}</td>
                  <td class="text-end font-monospace text-danger">- NT$ {{ row.shippingCost.toLocaleString() }}</td>
                  <td class="text-end font-monospace fw-bold text-success">NT$ {{ row.net.toLocaleString() }}</td>
                </tr>
              </tbody>
              <tfoot class="table-group-divider">
                <tr class="fw-bold">
                  <td>合計彙總</td>
                  <td class="text-center font-monospace">{{ computedMetrics.orderCount }} 筆</td>
                  <td class="text-end font-monospace">NT$ {{ computedMetrics.gmv.toLocaleString() }}</td>
                  <td class="text-end font-monospace text-danger">- NT$ {{ totalPaymentFee.toLocaleString() }}</td>
                  <td class="text-end font-monospace text-danger">- NT$ {{ totalShippingCost.toLocaleString() }}</td>
                  <td class="text-end font-monospace text-success">NT$ {{ totalNetRevenue.toLocaleString() }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { Calendar, Download } from 'lucide-vue-next'
import { useAdminStore } from '../../stores/adminStore'
import { useProductStore } from '../../stores/productStore'

const adminStore = useAdminStore()
const productStore = useProductStore()

const datePresets = [
  { key: 'today', label: '今日' },
  { key: '7days', label: '近 7 天' },
  { key: '30days', label: '近 30 天' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' }
]

const filter = reactive({
  period: 'all',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  shippingStatus: 'ALL',
  paymentMethod: 'ALL',
  shippingType: 'ALL'
})

const selectDatePreset = (key) => {
  filter.period = key
  const now = new Date('2026-11-18') // 2026 固定基準日
  let start = new Date(now)

  if (key === 'today') {
    start = now
  } else if (key === '7days') {
    start.setDate(now.getDate() - 7)
  } else if (key === '30days') {
    start.setDate(now.getDate() - 30)
  } else if (key === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    filter.startDate = '2026-01-01'
    filter.endDate = '2026-12-31'
    return
  }

  filter.startDate = start.toISOString().slice(0, 10)
  filter.endDate = now.toISOString().slice(0, 10)
}

const resetFilter = () => {
  filter.period = 'all'
  filter.startDate = '2026-01-01'
  filter.endDate = '2026-12-31'
  filter.shippingStatus = 'ALL'
  filter.paymentMethod = 'ALL'
  filter.shippingType = 'ALL'
}

// 篩選訂單
const filteredOrders = computed(() => {
  const all = adminStore.orders || []
  return all.filter(o => {
    const d = o.createdAt || o.date || '2026-01-01'
    if (d < filter.startDate || d > filter.endDate) return false
    if (filter.shippingStatus !== 'ALL' && o.status !== filter.shippingStatus) {
      if (filter.shippingStatus === 'DELIVERED' && o.status !== '已完成') return false
      if (filter.shippingStatus === 'PENDING' && !['待出貨', '處理中'].includes(o.status)) return false
    }
    if (filter.paymentMethod !== 'ALL' && o.paymentMethod !== filter.paymentMethod) return false
    if (filter.shippingType !== 'ALL' && (o.shippingMethod || o.shippingType) !== filter.shippingType) return false
    return true
  })
})

// 計算核心指標
const computedMetrics = computed(() => {
  const orders = filteredOrders.value
  const orderCount = orders.length
  let gmv = 0
  let returnCount = 0

  orders.forEach(o => {
    const amt = Number(o.totalAmount || o.amount || 0)
    if (['已取消', '申請取消中'].includes(o.status)) return
    gmv += amt
    if (['退貨審核中', '已退貨'].includes(o.status) || o.returnRequest) {
      returnCount++
    }
  })

  const aov = orderCount > 0 ? Math.round(gmv / orderCount) : 0
  const conversionRate = 3.8 // 預設店鋪平均轉化率
  const returnRate = orderCount > 0 ? Number(((returnCount / orderCount) * 100).toFixed(1)) : 0
  const grossMargin = 45.0 // 平均毛利率 45%
  const estimatedProfit = Math.round(gmv * (grossMargin / 100))

  return {
    orderCount,
    gmv,
    aov,
    conversionRate,
    returnRate,
    returnCount,
    grossMargin,
    estimatedProfit
  }
})

// 熱銷商品排行
const topSellingProducts = computed(() => {
  const prods = productStore.products || []
  const map = {}
  filteredOrders.value.forEach(o => {
    if (['已取消', '申請取消中'].includes(o.status)) return
    ;(o.items || []).forEach(item => {
      const pid = item.id || 1
      if (!map[pid]) {
        const pObj = productStore.getProductById(pid) || item
        map[pid] = {
          id: pid,
          name: item.name || pObj.name,
          price: Number(item.price || pObj.price || 0),
          image: item.image || pObj.image || (pObj.images && pObj.images[0]),
          soldQty: 0,
          salesAmount: 0
        }
      }
      const qty = Number(item.quantity || 1)
      map[pid].soldQty += qty
      map[pid].salesAmount += map[pid].price * qty
    })
  })

  const arr = Object.values(map)
  arr.sort((a, b) => b.soldQty - a.soldQty)
  return arr.slice(0, 5)
})

// 財務金物流收支對帳行
const financialReportRows = computed(() => {
  const channels = ['LINE Pay', '信用卡一次付清', '超商代碼繳費', '貨到付款']
  const map = {}
  channels.forEach(ch => {
    map[ch] = { channel: ch, count: 0, gross: 0, fee: 0, shippingCost: 0, net: 0 }
  })

  filteredOrders.value.forEach(o => {
    if (['已取消', '申請取消中'].includes(o.status)) return
    const ch = o.paymentMethod || 'LINE Pay'
    if (!map[ch]) {
      map[ch] = { channel: ch, count: 0, gross: 0, fee: 0, shippingCost: 0, net: 0 }
    }
    const amt = Number(o.totalAmount || o.amount || 0)
    map[ch].count++
    map[ch].gross += amt

    // 假設手續費率：LINE Pay 2%, 信用卡 2.2%, 超商 30元/筆, 貨到付款 1%
    let fee = 0
    if (ch === 'LINE Pay') fee = Math.round(amt * 0.02)
    else if (ch === '信用卡一次付清') fee = Math.round(amt * 0.022)
    else if (ch === '超商代碼繳費') fee = 30
    else fee = Math.round(amt * 0.01)

    // 物流成本：超商 60，宅配 100
    const shipType = o.shippingMethod || o.shippingType
    const shipCost = shipType === 'CVS' ? 60 : 100

    map[ch].fee += fee
    map[ch].shippingCost += shipCost
    map[ch].net += (amt - fee - shipCost)
  })

  return Object.values(map).filter(r => r.count > 0 || r.gross > 0)
})

const totalPaymentFee = computed(() => financialReportRows.value.reduce((s, r) => s + r.fee, 0))
const totalShippingCost = computed(() => financialReportRows.value.reduce((s, r) => s + r.shippingCost, 0))
const totalNetRevenue = computed(() => financialReportRows.value.reduce((s, r) => s + r.net, 0))

// 匯出報表
const exportFilteredReport = () => {
  let csv = 'data:text/csv;charset=utf-8,金流渠道,訂單筆數,總交易額(GMV),金流手續費,物流託運成本,實收淨額\n'
  financialReportRows.value.forEach((r) => {
    csv += `${r.channel},${r.count},${r.gross},${r.fee},${r.shippingCost},${r.net}\n`
  })
  csv += `合計彙總,${computedMetrics.value.orderCount},${computedMetrics.value.gmv},${totalPaymentFee.value},${totalShippingCost.value},${totalNetRevenue.value}\n`

  const link = document.createElement('a')
  link.setAttribute('href', encodeURI(csv))
  link.setAttribute('download', `MD_Finance_Report_${filter.startDate}_${filter.endDate}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.dashboard-container {
  min-width: 0;
  max-width: 100%;
}

.shadow-2xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.btn-white {
  background-color: #ffffff !important;
}
</style>