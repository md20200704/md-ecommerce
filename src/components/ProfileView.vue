<template>
  <div class="max-w-5xl mx-auto px-4 py-10">
    <!-- 會員卡片與登出按鈕 -->
    <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-sm">
          {{ authStore.user.name[0] || '用' }}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-slate-900">{{ authStore.user.name }}</h1>
            <span class="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">
              {{ authStore.user.tier }}
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-1 font-mono">
            手機：{{ authStore.user.phone || '0912-345-678' }} | 信箱：{{ authStore.user.email || '未設定' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        <div class="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 text-center">
          <div class="text-[11px] text-slate-400 font-medium">可用紅利</div>
          <div class="text-lg font-bold text-indigo-600 font-mono">{{ authStore.user.points }} 點</div>
        </div>

        <button
          @click="handleLogout"
          class="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition active:scale-95"
        >
          <LogOut class="w-4 h-4" />
          登出帳號
        </button>
      </div>
    </div>

    <!-- 主頁籤導航 -->
    <div class="flex border-b border-slate-200 gap-6 sm:gap-8 mb-6 text-sm font-semibold overflow-x-auto scrollbar-none">
      <button
        @click="activeMainTab = 'orders'"
        class="pb-3 transition relative whitespace-nowrap flex items-center gap-1.5"
        :class="activeMainTab === 'orders' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'"
      >
        <Package class="w-4 h-4" />
        訂單歷程與進度 ({{ userOrders.length }})
      </button>
      <button
        @click="activeMainTab = 'addresses'"
        class="pb-3 transition relative whitespace-nowrap flex items-center gap-1.5"
        :class="activeMainTab === 'addresses' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'"
      >
        <MapPin class="w-4 h-4" />
        常用收件地址 ({{ authStore.user.addresses.length }}/5)
      </button>
      <button
        @click="activeMainTab = 'profile'"
        class="pb-3 transition relative whitespace-nowrap flex items-center gap-1.5"
        :class="activeMainTab === 'profile' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'"
      >
        <User class="w-4 h-4" />
        個人資料修改
      </button>
    </div>

    <!-- 模組 1：訂單歷程 (含 6 大狀態子分頁篩選與步驟條) -->
    <div v-if="activeMainTab === 'orders'" class="space-y-6">
      <!-- 6 大狀態篩選子頁籤 -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-bold">
        <button
          v-for="step in orderFilters"
          :key="step.key"
          @click="currentStepFilter = step.key"
          class="px-4 py-2 rounded-xl transition whitespace-nowrap border"
          :class="currentStepFilter === step.key ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
        >
          {{ step.label }} ({{ countOrdersByStep(step.key) }})
        </button>
      </div>

      <!-- 查無訂單提示 -->
      <div v-if="filteredOrders.length === 0" class="text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-400">
        <Package class="w-12 h-12 mx-auto stroke-1 mb-2 opacity-40" />
        <p class="text-sm">此狀態分類下目前沒有任何訂單紀錄</p>
      </div>

      <!-- 訂單卡片清單 -->
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs text-xs space-y-6"
      >
        <!-- 頂部資訊與狀態標籤 -->
        <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-4">
          <div class="flex items-center gap-3">
            <span class="font-mono font-bold text-slate-900 text-sm">{{ order.id }}</span>
            <span class="text-slate-400">成立時間：{{ order.createdAt }}</span>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="px-3 py-1 rounded-full font-bold text-[11px]"
              :class="getBadgeClass(order.status)"
            >
              {{ getStatusText(order.status) }}
            </span>
          </div>
        </div>

        <!-- 依狀態在對應流程中的進度步驟條 (引用 OrderStepper) -->
        <OrderStepper :order="order" />

        <!-- 商品明細清單 -->
        <div class="bg-slate-50/80 rounded-2xl p-4 divide-y divide-slate-100">
          <div
            v-for="(item, idx) in order.items"
            :key="idx"
            class="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center text-slate-700"
          >
            <div>
              <p class="font-bold text-slate-900 text-xs">{{ item.name }}</p>
              <p class="text-slate-400 text-[11px] mt-0.5">數量：{{ item.quantity }}</p>
            </div>
            <span class="font-bold text-slate-900 font-mono">
              NT$ {{ (item.price * item.quantity).toLocaleString() }}
            </span>
          </div>
        </div>

        <!-- 物流追蹤碼與查件/退換/取消按鈕 -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 border-t border-slate-100 gap-3">
          <div class="text-slate-600 flex flex-wrap items-center gap-2">
            <span>物流配送：{{ order.shippingMethod }}</span>

            <!-- 點擊直接開啟查件服務 (AC: ST-02) -->
            <span v-if="order.trackingCode" class="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl">
              <span class="text-slate-500">追蹤單號：</span>
              <span class="font-mono font-bold text-slate-800">{{ order.trackingCode }}</span>
              <a
                :href="getTrackingUrl(order.shippingMethod, order.trackingCode)"
                target="_blank"
                class="text-indigo-600 hover:text-indigo-800 font-bold ml-1 inline-flex items-center gap-0.5 underline"
              >
                開啟物流查件
                <ExternalLink class="w-3 h-3" />
              </a>
            </span>
            <span v-else class="text-slate-400 italic">（待出貨後生成追蹤單號）</span>
          </div>

          <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
            <div class="text-right">
              <span class="text-slate-400 text-[11px] block">實付總額</span>
              <span class="font-bold text-slate-900 text-base font-mono">NT$ {{ order.amount.toLocaleString() }}</span>
            </div>

            <!-- 取消訂單：僅「待付款」或「備貨中」狀態允許顧客主動取消 (AC: ST-02)[cite: 1] -->
            <button
              v-if="order.status === 'PENDING_PAYMENT' || order.status === 'PROCESSING'"
              @click="cancelOrder(order)"
              class="px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition active:scale-95"
            >
              申請取消訂單
            </button>

            <!-- 申請退貨：訂單「已完成」後開放退換貨申請 -->
            <button
              v-if="order.status === 'COMPLETED'"
              @click="requestRefund(order)"
              class="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold transition active:scale-95"
            >
              申請退貨/退款
            </button>

            <span v-if="order.status === 'CANCELLED'" class="text-slate-400 font-medium">
              訂單已結案
            </span>
            <span v-if="order.status === 'REFUNDING'" class="text-rose-500 font-medium">
              待商品驗收退款
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 模組 2：常用收件地址簿 (AC: ST-02 規範 1，最多 5 組)[cite: 1] -->
    <div v-if="activeMainTab === 'addresses'" class="space-y-5">
      <div class="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span class="text-xs font-bold text-slate-700">常用配送地址簿</span>
          <p class="text-xs text-slate-400">最多可儲存 5 組常用地址，結帳時將預設自動代入。</p>
        </div>
        <button
          @click="openAddAddressModal"
          :disabled="authStore.user.addresses.length >= 5"
          class="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Plus class="w-4 h-4" />
          新增地址 ({{ authStore.user.addresses.length }}/5)
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="addr in authStore.user.addresses"
          :key="addr.id"
          class="bg-white rounded-3xl border p-5 shadow-xs relative flex flex-col justify-between transition-all"
          :class="addr.isDefault ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'"
        >
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold text-base text-slate-900">{{ addr.recipient }}</span>
              <span v-if="addr.isDefault" class="text-[11px] bg-indigo-600 text-white px-2.5 py-0.5 rounded-full font-semibold shadow-xs">
                預設地址
              </span>
            </div>
            <div class="font-mono text-xs text-slate-500 mb-2">{{ addr.phone }}</div>
            <p class="text-xs text-slate-600 leading-relaxed">{{ addr.address }}</p>
          </div>

          <div class="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs font-semibold">
            <div class="flex items-center gap-3">
              <button
                v-if="!addr.isDefault"
                @click="authStore.setDefaultAddress(addr.id)"
                class="text-indigo-600 hover:text-indigo-800"
              >
                設為預設
              </button>
              <button @click="openEditAddressModal(addr)" class="text-slate-600 hover:text-slate-900">
                編輯
              </button>
            </div>
            <button @click="handleRemoveAddress(addr.id)" class="text-rose-500 hover:text-rose-700">
              刪除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 模組 3：個人基本資料維護 -->
    <div v-if="activeMainTab === 'profile'" class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-xl">
      <h3 class="text-base font-bold text-slate-900 mb-4">基本帳號資訊</h3>
      <form @submit.prevent="handleUpdateProfile" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">姓名 / 暱稱 *</label>
          <input
            v-model="profileForm.name"
            required
            type="text"
            class="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">聯絡 Email *</label>
          <input
            v-model="profileForm.email"
            required
            type="email"
            class="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">綁定手機號碼 (唯讀)</label>
          <input
            :value="authStore.user.phone || '0912345678'"
            disabled
            type="text"
            class="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm font-mono text-slate-500 cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-sm"
        >
          儲存個人資料
        </button>
      </form>
    </div>

    <!-- 地址新增與編輯彈窗 -->
    <Teleport to="body">
      <div
        v-if="showAddressModal"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="showAddressModal = false"
      >
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
          <button @click="showAddressModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
            <X class="w-5 h-5" />
          </button>

          <h3 class="text-lg font-bold text-slate-900 mb-4">
            {{ isEditing ? '編輯常用收件地址' : '新增常用收件地址' }}
          </h3>

          <form @submit.prevent="saveAddress" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">收件人姓名 *</label>
              <input
                v-model="addressForm.recipient"
                required
                type="text"
                placeholder="例如：陳大文"
                class="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">聯絡手機 (09xxxxxxxx) *</label>
              <input
                v-model="addressForm.phone"
                required
                pattern="^09\d{8}$"
                type="tel"
                placeholder="0912345678"
                class="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">完整配送地址 *</label>
              <input
                v-model="addressForm.address"
                required
                type="text"
                placeholder="請填寫完整地址 (含縣市區街巷門牌)"
                class="w-full border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input
                id="default-check"
                v-model="addressForm.isDefault"
                type="checkbox"
                class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <label for="default-check" class="text-slate-700 font-medium">設為預設配送收件地址</label>
            </div>

            <button
              type="submit"
              class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-sm transition mt-2 shadow-sm"
            >
              儲存此地址
            </button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, Package, MapPin, User, ExternalLink, Plus, X } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'
import OrderStepper from '../components/OrderStepper.vue'

const authStore = useAuthStore()
const router = useRouter()

const activeMainTab = ref('orders')
const currentStepFilter = ref('ALL')
const showAddressModal = ref(false)
const isEditing = ref(false)
const currentEditId = ref(null)

// 支援 6 大狀態子分頁篩選
const orderFilters = [
  { key: 'ALL', label: '全部訂單' },
  { key: 'PENDING_PAYMENT', label: '待付款' },
  { key: 'PROCESSING', label: '備貨中' },
  { key: 'SHIPPED', label: '已出貨' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
  { key: 'REFUNDING', label: '退貨/退款中' }
]

// 涵蓋 6 大狀態之訂單歷程資料
const userOrders = ref([
  {
    id: 'ORD-1001',
    status: 'PENDING_PAYMENT',
    amount: 1880,
    shippingMethod: '黑貓宅配',
    trackingCode: '',
    createdAt: '2026-11-06 14:00',
    paidAt: null,
    shippedAt: null,
    completedAt: null,
    items: [{ name: '手沖細口不鏽鋼溫控快煮壺', quantity: 1, price: 1880 }]
  },
  {
    id: 'ORD-1002',
    status: 'PROCESSING',
    amount: 2480,
    shippingMethod: '黑貓宅配',
    trackingCode: '',
    createdAt: '2026-11-06 09:30',
    paidAt: '2026-11-06 09:32',
    shippedAt: null,
    completedAt: null,
    items: [{ name: '極簡都會防潑水機能後背包 (曜石黑 / 標準款)', quantity: 1, price: 2480 }]
  },
  {
    id: 'ORD-1003',
    status: 'SHIPPED',
    amount: 4990,
    shippingMethod: '7-11 超商取貨 (鑫鑫門市)',
    trackingCode: 'CVS-7119028',
    createdAt: '2026-11-05 14:15',
    paidAt: '2026-11-05 14:16',
    shippedAt: '2026-11-05 18:00',
    completedAt: null,
    items: [{ name: '智能主動降噪藍牙無線耳機 Pro (極光白)', quantity: 1, price: 4990 }]
  },
  {
    id: 'ORD-1004',
    status: 'COMPLETED',
    amount: 1280,
    shippingMethod: '黑貓宅配',
    trackingCode: 'EXP-90218842',
    createdAt: '2026-11-03 10:10',
    paidAt: '2026-11-03 10:12',
    shippedAt: '2026-11-03 15:30',
    completedAt: '2026-11-05 11:00',
    items: [{ name: '天然冷杉雪松精油香氛擴香組', quantity: 1, price: 1280 }]
  },
  {
    id: 'ORD-1005',
    status: 'REFUNDING',
    amount: 2680,
    shippingMethod: '黑貓宅配',
    trackingCode: 'EXP-90218855',
    createdAt: '2026-11-01 11:20',
    paidAt: '2026-11-01 11:22',
    shippedAt: '2026-11-01 16:00',
    completedAt: '2026-11-03 12:00',
    items: [{ name: '極簡都會防潑水機能後背包 (加大款)', quantity: 1, price: 2680 }]
  },
  {
    id: 'ORD-1006',
    status: 'CANCELLED',
    amount: 1880,
    shippingMethod: '黑貓宅配',
    trackingCode: '',
    createdAt: '2026-10-28 16:40',
    paidAt: null,
    shippedAt: null,
    completedAt: null,
    items: [{ name: '手沖細口不鏽鋼溫控快煮壺', quantity: 1, price: 1880 }]
  }
])

// 統計各狀態訂單數量
const countOrdersByStep = (statusKey) => {
  if (statusKey === 'ALL') return userOrders.value.length
  return userOrders.value.filter((o) => o.status === statusKey).length
}

// 依當前選中標籤篩選清單
const filteredOrders = computed(() => {
  if (currentStepFilter.value === 'ALL') return userOrders.value
  return userOrders.value.filter((o) => o.status === currentStepFilter.value)
})

// 狀態文字對應
const getStatusText = (status) => {
  const map = {
    PENDING_PAYMENT: '待付款',
    PROCESSING: '備貨處理中',
    SHIPPED: '已出貨',
    COMPLETED: '已送達完成',
    CANCELLED: '已取消',
    REFUNDING: '退貨/退款中'
  }
  return map[status] || status
}

// 狀態標籤顏色
const getBadgeClass = (status) => {
  const map = {
    PENDING_PAYMENT: 'bg-amber-50 text-amber-700 border border-amber-200',
    PROCESSING: 'bg-blue-50 text-blue-700 border border-blue-200',
    SHIPPED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-500',
    REFUNDING: 'bg-rose-50 text-rose-700 border border-rose-200'
  }
  return map[status] || 'bg-slate-100 text-slate-700'
}

// 物流查件連結跳轉 (AC: ST-02)[cite: 1]
const getTrackingUrl = (method, code) => {
  if (method.includes('7-11')) {
    return `https://eservice.7-11.com.tw/e-tracking/search.aspx?order_code=${code}`
  } else if (method.includes('全家')) {
    return `https://www.famiport.com.tw/Web_Famiport/page/process.aspx?bill_no=${code}`
  }
  return `https://www.t-cat.com.tw/Inquire/TraceDetail.aspx?BillID=${code}`
}

// 取消訂單 (僅待付款或備貨中可取消) (AC: ST-02)[cite: 1]
const cancelOrder = (order) => {
  if (confirm(`確定要取消訂單【${order.id}】嗎？系統將自動釋放預留庫存。`)) {
    order.status = 'CANCELLED'
    alert(`訂單 ${order.id} 已順利取消！`)
  }
}

// 申請退貨退款
const requestRefund = (order) => {
  if (confirm(`確定要為訂單【${order.id}】申請售後退貨退款嗎？`)) {
    order.status = 'REFUNDING'
    alert(`訂單 ${order.id} 已建立退貨單，請保持商品與包裝完整，物流將派員前往收取。`)
  }
}

// 個人資料表單
const profileForm = reactive({
  name: authStore.user.name,
  email: authStore.user.email
})

// 地址簿表單
const addressForm = reactive({
  recipient: '',
  phone: '',
  address: '',
  isDefault: false
})

const openAddAddressModal = () => {
  isEditing.value = false
  currentEditId.value = null
  addressForm.recipient = authStore.user.name
  addressForm.phone = authStore.user.phone
  addressForm.address = ''
  addressForm.isDefault = authStore.user.addresses.length === 0
  showAddressModal.value = true
}

const openEditAddressModal = (addr) => {
  isEditing.value = true
  currentEditId.value = addr.id
  addressForm.recipient = addr.recipient
  addressForm.phone = addr.phone
  addressForm.address = addr.address
  addressForm.isDefault = addr.isDefault
  showAddressModal.value = true
}

const saveAddress = () => {
  if (isEditing.value && currentEditId.value) {
    authStore.updateAddress(currentEditId.value, addressForm)
  } else {
    authStore.addAddress(addressForm)
  }
  showAddressModal.value = false
}

const handleRemoveAddress = (id) => {
  if (confirm('確定要刪除這組常用地址嗎？')) {
    authStore.removeAddress(id)
  }
}

const handleUpdateProfile = () => {
  const res = authStore.updateProfile(profileForm.name, profileForm.email)
  alert(res.message)
}

const handleLogout = () => {
  if (confirm('確定要登出目前會員帳號嗎？')) {
    authStore.logout()
    router.push('/')
  }
}
</script>