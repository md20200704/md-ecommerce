<template>
  <main class="container py-4 py-md-5 px-3 px-md-4" style="max-width: 1120px; margin: 0 auto;">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
      <h1 class="h4 fw-bold text-dark font-serif mb-0">填寫訂單與結帳</h1>
      <button type="button" class="btn btn-link text-secondary small text-decoration-none p-0" @click="cartStore.openDrawer()">
        ← 返回購物袋修改勾選
      </button>
    </div>

    <!-- 若消費者從 LINE Pay 頁面取消付款導回時的提示 -->
    <div
      v-if="route.query.canceled === '1'"
      class="alert alert-warning rounded-4 border-warning-subtle p-3 mb-4 small font-monospace"
    >
      ⚠️ 您已取消本次 LINE Pay 付款流程，購物袋商品已為您保留，可重新確認後再次結帳。
    </div>

    <div
      v-if="route.query.cvsError === '1'"
      class="alert alert-warning rounded-4 border-warning-subtle p-3 mb-4 small font-monospace"
    >
      ⚠️ 尚未取得 7-11 門市資料，請重新開啟電子地圖選擇取貨門市。
    </div>

    <!-- 風控黑名單攔截警示 -->
    <div
      v-if="currentUser?.riskStatus === 'BLOCK_ORDER'"
      class="alert alert-danger rounded-4 border-danger-subtle p-3 mb-4 small"
    >
      <strong>⚠️ 帳號下單權限受限：</strong>您的帳號目前因多次未取貨或異常紀錄已被系統暫停下單權限，如有疑問請聯繫品牌客服。
    </div>

    <div class="row g-4">
      <!-- 左側：收件人與配送資訊 -->
      <div class="col-12 col-lg-7">
        <div class="card-korean p-3.5 p-md-4 bg-white rounded-4 border shadow-xs">
          <h2 class="fs-6 fw-bold text-dark mb-3 pb-2 border-bottom">收件人與配送資訊</h2>

          <form @submit.prevent="submitOrder" class="row g-3 small">
            <div class="col-12 col-sm-6">
              <label class="form-label text-secondary mb-1">收件人姓名 *</label>
              <input v-model="form.recipientName" required type="text" class="form-control form-control-sm" placeholder="請輸入真實姓名（超取需核對證件）" />
            </div>

            <div class="col-12 col-sm-6">
              <label class="form-label text-secondary mb-1">聯絡手機 *</label>
              <input v-model="form.phone" required type="tel" class="form-control form-control-sm font-monospace" placeholder="0912345678（接收簡訊通知）" />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary mb-1">電子信箱 (接收訂單通知) *</label>
              <input v-model="form.email" required type="email" class="form-control form-control-sm font-monospace" placeholder="name@example.com" />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary mb-1">配送方式 *</label>
              <select v-model="form.shippingMethod" class="form-select form-select-sm">
                <option value="CVS">7-ELEVEN 超商純取貨 (運費 NT$ 60)</option>
                <option value="HOME">黑貓宅急便宅配到府 (運費 NT$ 100)</option>
              </select>
            </div>

            <!-- 7-ELEVEN 官方電子地圖自動帶入 -->
            <div v-if="form.shippingMethod === 'CVS'" class="col-12">
              <div class="p-3 rounded-4 border bg-light d-flex flex-column gap-3">
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div>
                    <div class="fw-bold text-dark font-monospace" style="font-size: 12px;">
                      🏪 7-ELEVEN 官方電子地圖選店 *
                    </div>
                    <div class="text-muted" style="font-size: 11px;">
                      點擊開啟 7-11 地圖，選取門市後將自動跳回並帶入店號、店名與地址
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-primary btn-sm rounded-pill px-3.5 py-2 font-monospace fw-bold"
                    @click="open711OfficialMap"
                  >
                    🗺️ {{ form.storeId ? '重新選擇 7-11 門市' : '開啟 7-11 電子地圖選店' }}
                  </button>
                </div>

                <!-- 已帶入的 7-11 門市結果卡片與欄位 -->
                <div class="p-3 rounded-3 border bg-white d-flex flex-column gap-2">
                  <div class="d-flex align-items-center justify-content-between">
                    <span class="font-monospace fw-bold" :class="form.storeId ? 'text-success' : 'text-secondary'" style="font-size: 11.5px;">
                      {{ form.storeId ? `✓ 已帶入 7-11 門市：${form.storeName} (${form.storeId})` : '尚未選取門市（點擊上方按鈕選店後自動填入）' }}
                    </span>
                    <button
                      v-if="form.storeId || form.storeName"
                      type="button"
                      class="btn btn-link btn-sm text-muted p-0 text-decoration-none font-monospace"
                      style="font-size: 11px;"
                      @click="clearSelectedStore"
                    >
                      清除重選
                    </button>
                  </div>

                  <div class="row g-2">
                    <div class="col-12 col-sm-4">
                      <label class="form-label text-secondary mb-0.5" style="font-size: 11px;">門市代號 *</label>
                      <input
                        v-model="form.storeId"
                        type="text"
                        class="form-control form-control-sm font-monospace"
                        placeholder="選店自動帶入"
                      />
                    </div>
                    <div class="col-12 col-sm-8">
                      <label class="form-label text-secondary mb-0.5" style="font-size: 11px;">門市名稱 *</label>
                      <input
                        v-model="form.storeName"
                        type="text"
                        class="form-control form-control-sm"
                        placeholder="選店自動帶入"
                      />
                    </div>
                    <div class="col-12">
                      <label class="form-label text-secondary mb-0.5" style="font-size: 11px;">門市地址</label>
                      <input
                        v-model="form.storeAddress"
                        type="text"
                        class="form-control form-control-sm"
                        placeholder="選店自動帶入地址"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 宅配到府地址輸入 -->
            <div v-else class="col-12">
              <label class="form-label text-secondary mb-1">宅配收件地址 *</label>
              <input v-model="form.shippingAddress" required type="text" class="form-control form-control-sm" placeholder="請輸入完整縣市、區、街道地址" />
            </div>

            <div class="col-12 pt-2 border-top">
              <label class="form-label text-secondary mb-1">付款方式 *</label>
              <div class="p-2.5 px-3 rounded-3 border bg-light d-flex align-items-center justify-content-between">
                <span class="font-monospace fw-bold text-dark">LINE Pay 線上支付 (API v3)</span>
                <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace" style="font-size: 10px;">
                  支援沙盒與正式交易跳轉
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- 右側：已選結帳商品、優惠券與紅利折抵 -->
      <div class="col-12 col-lg-5">
        <div class="card-korean p-3.5 p-md-4 bg-white rounded-4 border shadow-xs sticky-lg-top" style="top: 90px;">
          <h2 class="fs-6 fw-bold text-dark mb-3 pb-2 border-bottom">已選結帳商品 ({{ checkoutItems.length }} 項)</h2>

          <div v-if="checkoutItems.length > 0" class="d-flex flex-column gap-3 mb-4">
            <div
              v-for="item in checkoutItems"
              :key="item.cartItemId"
              class="d-flex align-items-center justify-content-between gap-2 pb-3 border-bottom small"
            >
              <div class="d-flex align-items-center gap-2.5 min-w-0">
                <div class="rounded-2 overflow-hidden border flex-shrink-0" style="width: 44px; height: 56px; background-color: #f5f2ed;">
                  <img :src="item.image" class="w-100 h-100 object-fit-cover" />
                </div>
                <div class="min-w-0">
                  <strong class="text-dark d-block text-truncate" style="max-width: 165px;">{{ item.name }}</strong>
                  <span class="text-muted font-monospace" style="font-size: 11px;">{{ item.color }} / {{ item.size }} × {{ item.quantity }}</span>
                </div>
              </div>

              <div class="d-flex align-items-center gap-2.5 flex-shrink-0">
                <span class="font-monospace fw-bold text-dark">
                  NT$ {{ (item.price * item.quantity).toLocaleString() }}
                </span>
                <button
                  type="button"
                  class="btn btn-outline-secondary btn-sm rounded-circle p-0 d-inline-flex align-items-center justify-content-center"
                  style="width: 22px; height: 22px; font-size: 13px; line-height: 1;"
                  title="從本次結帳移除"
                  @click="removeCheckoutItem(item.cartItemId)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-4 text-muted small mb-4">
            尚未勾選任何結帳商品，請返回購物袋重新勾選！
            <div class="mt-2">
              <router-link to="/category" class="btn btn-outline-dark btn-sm rounded-pill px-3">前往選購商品</router-link>
            </div>
          </div>

          <!-- 優惠券與紅利點數折抵區塊 -->
          <div v-if="checkoutItems.length > 0" class="p-3 bg-light rounded-3 border mb-4 d-flex flex-column gap-3 small font-monospace">
            <div>
              <label class="form-label text-dark fw-bold mb-1" style="font-size: 11.5px;">選擇或輸入優惠券</label>
              <div class="d-flex gap-1.5 mb-2">
                <select v-model="selectedCouponId" class="form-select form-select-sm font-monospace" @change="applyCoupon">
                  <option value="">-- 請選擇可用優惠券 --</option>
                  <option
                    v-for="cpn in availableCoupons"
                    :key="cpn.instanceId"
                    :value="cpn.instanceId"
                    :disabled="cartStore.totalPrice < cpn.minSpend"
                  >
                    [{{ cpn.code }}] {{ cpn.title }} ({{ cpn.type === 'FIXED' ? `-$${cpn.value}` : `${Math.round(cpn.value * 100)}折` }})
                  </option>
                </select>
              </div>

              <div class="input-group input-group-sm">
                <input
                  v-model="inputCouponCode"
                  type="text"
                  class="form-control text-uppercase"
                  placeholder="輸入優惠碼 (如 WINTER88)..."
                  @keyup.enter="handleClaimAndApplyCode"
                />
                <button
                  type="button"
                  class="btn btn-dark px-3 text-nowrap font-monospace"
                  @click="handleClaimAndApplyCode"
                >
                  新增並套用
                </button>
              </div>

              <div v-if="appliedCoupon" class="text-success mt-1.5" style="font-size: 10.5px;">
                ✓ 已套用【{{ appliedCoupon.title }}】，折抵 NT$ {{ couponDiscountAmount.toLocaleString() }}
              </div>
            </div>

            <div class="pt-2 border-top">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <label class="form-label text-dark fw-bold mb-0" style="font-size: 11.5px;">紅利點數 (可用 {{ currentUserPoints }} 點)</label>
                <button
                  type="button"
                  class="btn btn-link btn-sm p-0 text-decoration-none font-monospace"
                  style="font-size: 10.5px;"
                  @click="useMaxPoints"
                >
                  全部折抵
                </button>
              </div>
              <div class="input-group input-group-sm">
                <input
                  v-model.number="pointsToUse"
                  type="number"
                  min="0"
                  :max="maxUsablePoints"
                  class="form-control font-monospace"
                  placeholder="輸入折抵點數..."
                />
                <span class="input-group-text font-monospace bg-white">點 ($1)</span>
              </div>
            </div>
          </div>

          <!-- 費用計算明細 -->
          <div class="d-flex flex-column gap-2 small font-monospace pt-2 border-top">
            <div class="d-flex justify-content-between">
              <span class="text-muted">已選商品小計</span>
              <span class="text-dark">NT$ {{ cartStore.totalPrice.toLocaleString() }}</span>
            </div>
            <div v-if="couponDiscountAmount > 0" class="d-flex justify-content-between text-success">
              <span>優惠券折抵</span>
              <span>- NT$ {{ couponDiscountAmount.toLocaleString() }}</span>
            </div>
            <div v-if="pointsToUse > 0" class="d-flex justify-content-between text-success">
              <span>紅利點數折抵</span>
              <span>- NT$ {{ pointsToUse.toLocaleString() }}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-muted">物流運費 ({{ form.shippingMethod === 'CVS' ? '7-11 純取貨' : '黑貓宅配' }})</span>
              <span class="text-dark">NT$ {{ shippingFee }}</span>
            </div>
            <div class="d-flex justify-content-between fs-6 fw-bold text-dark pt-2 border-top">
              <span>實付總金額</span>
              <span class="text-primary fs-5">NT$ {{ finalTotalAmount.toLocaleString() }}</span>
            </div>
          </div>

          <div class="mt-4">
            <button
              type="button"
              class="btn btn-dark w-100 rounded-pill py-3 fw-bold shadow-2xs"
              :disabled="isSubmitting || checkoutItems.length === 0 || currentUser?.riskStatus === 'BLOCK_ORDER'"
              @click="submitOrder"
            >
              <span v-if="isSubmitting">正在連線至 LINE Pay 付款頁面...</span>
              <span v-else>前往 LINE Pay 線上付款 (NT$ {{ finalTotalAmount.toLocaleString() }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { getAuthToken } from '../services/apiClient'
import { showToast } from '../composables/useToast'

const CHECKOUT_DRAFT_KEY = 'md_checkout_form_draft_v1'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

const isSubmitting = ref(false)
const checkoutItems = computed(() => cartStore.selectedItems)
const pendingSelectedIds = ref(null)
const hasAppliedSnapshot = ref(false)

const removeCheckoutItem = (cartItemId) => {
  cartStore.removeItem(cartItemId)
  if (Array.isArray(pendingSelectedIds.value)) {
    pendingSelectedIds.value = pendingSelectedIds.value.filter(id => id !== cartItemId)
    saveCheckoutDraft()
  }
}

const form = reactive({
  recipientName: authStore.user?.name || '',
  phone: authStore.user?.phone || '',
  email: authStore.user?.email || '',
  shippingMethod: 'CVS',
  logisticsSubType: '7-11',
  storeId: '',
  storeName: '',
  storeAddress: '',
  shippingAddress: '台北市中正區忠孝西路一段 100 號 8 樓',
  paymentMethod: 'LINE Pay'
})

const selectedCouponId = ref('')
const appliedCoupon = ref(null)
const inputCouponCode = ref('')
const currentUser = computed(() => authStore.user || {})
const availableCoupons = computed(() => {
  return (authStore.availableUserCoupons || currentUser.value.myCoupons || []).filter(c => !c.isUsed)
})
const currentUserPoints = computed(() => Number(currentUser.value.points || 0))
const pointsToUse = ref(0)

const saveCheckoutDraft = () => {
  try {
    const idsToSave = Array.isArray(pendingSelectedIds.value)
      ? pendingSelectedIds.value
      : checkoutItems.value.map(i => i.cartItemId)

    sessionStorage.setItem(
      CHECKOUT_DRAFT_KEY,
      JSON.stringify({
        recipientName: form.recipientName,
        phone: form.phone,
        email: form.email,
        shippingMethod: form.shippingMethod,
        storeId: form.storeId,
        storeName: form.storeName,
        storeAddress: form.storeAddress,
        shippingAddress: form.shippingAddress,
        selectedCouponId: selectedCouponId.value,
        pointsToUse: pointsToUse.value,
        selectedItemIds: idsToSave
      })
    )
  } catch {
    // ignore storage error
  }
}

const open711OfficialMap = () => {
  pendingSelectedIds.value = checkoutItems.value.map(i => i.cartItemId)
  saveCheckoutDraft()
  const callbackUrl = `${window.location.origin}/api/cvs-map-callback`
  const mapUrl = `https://emap.presco.com.tw/c2cemap.ashx?eshopid=870&&servicetype=1&url=${encodeURIComponent(callbackUrl)}`
  window.location.href = mapUrl
}

const tryRestoreSelectedSnapshot = () => {
  if (hasAppliedSnapshot.value) return
  if (!Array.isArray(pendingSelectedIds.value)) return
  if (!Array.isArray(cartStore.items) || cartStore.items.length === 0) return

  cartStore.applySelectedSnapshot(pendingSelectedIds.value)
  hasAppliedSnapshot.value = true
}

watch(
  () => cartStore.items,
  () => {
    tryRestoreSelectedSnapshot()
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  try {
    const rawDraft = sessionStorage.getItem(CHECKOUT_DRAFT_KEY)
    if (rawDraft) {
      const draft = JSON.parse(rawDraft)
      if (draft.recipientName) form.recipientName = draft.recipientName
      if (draft.phone) form.phone = draft.phone
      if (draft.email) form.email = draft.email
      if (draft.shippingMethod) form.shippingMethod = draft.shippingMethod
      if (draft.storeId) form.storeId = draft.storeId
      if (draft.storeName) form.storeName = draft.storeName
      if (draft.storeAddress) form.storeAddress = draft.storeAddress
      if (draft.shippingAddress) form.shippingAddress = draft.shippingAddress
      if (draft.selectedCouponId) selectedCouponId.value = draft.selectedCouponId
      if (Number.isFinite(Number(draft.pointsToUse))) pointsToUse.value = Number(draft.pointsToUse)
      if (Array.isArray(draft.selectedItemIds)) {
        pendingSelectedIds.value = draft.selectedItemIds
        tryRestoreSelectedSnapshot()
      }
    }
  } catch {
    // ignore
  }

  if (route.query.cvsSelected === '1' && route.query.storeId) {
    form.shippingMethod = 'CVS'
    form.logisticsSubType = '7-11'
    form.storeId = String(route.query.storeId || '')
    form.storeName = String(route.query.storeName || '')
    form.storeAddress = String(route.query.storeAddress || '')
    saveCheckoutDraft()
    showToast(`已自動帶入 7-11 門市：${form.storeName} (${form.storeId})`, 'success', '7-11 門市已選取')
    router.replace({ path: '/checkout' })
  }
})

const clearSelectedStore = () => {
  form.storeId = ''
  form.storeName = ''
  form.storeAddress = ''
}

watch(
  () => authStore.user,
  (u) => {
    if (!u) return
    if (!form.recipientName && u.name) form.recipientName = u.name
    if (!form.phone && u.phone) form.phone = u.phone
    if (!form.email && u.email) form.email = u.email
    if (Array.isArray(u.savedAddresses) && u.savedAddresses.length > 0) {
      const defAddr = u.savedAddresses.find(a => a.isDefault) || u.savedAddresses[0]
      if (defAddr && form.shippingAddress === '台北市中正區忠孝西路一段 100 號 8 樓') {
        form.shippingAddress = `${defAddr.city}${defAddr.district}${defAddr.detail}`
      }
    }
  },
  { immediate: true, deep: true }
)

const handleClaimAndApplyCode = async () => {
  const code = inputCouponCode.value.trim().toUpperCase()
  if (!code) {
    showToast('請先輸入優惠碼再進行領取！', 'warning', '提示')
    return
  }

  if (!authStore.isLoggedIn) {
    showToast('請先登入會員帳號再領取優惠券！', 'error', '領取失敗')
    return
  }

  if (authStore.claimCouponByCode) {
    const res = await authStore.claimCouponByCode(code, '結帳頁面手動輸入領取')
    if (res?.success) {
      showToast(res.message || `已領取並套用優惠碼 ${code}！`, 'success', '領取成功')
      inputCouponCode.value = ''
      const newlyAdded = availableCoupons.value.find(c => c.code === code) || availableCoupons.value[0]
      if (newlyAdded) {
        selectedCouponId.value = newlyAdded.instanceId
        applyCoupon()
      }
    } else {
      showToast(res?.message || `${code} 優惠碼無效、已過期或不符合領取條件。`, 'error', '領取失敗')
    }
  } else {
    showToast('請先登入會員以使用優惠碼功能！', 'error', '領取失敗')
  }
}

const applyCoupon = () => {
  if (!selectedCouponId.value) {
    appliedCoupon.value = null
    return
  }
  const found = availableCoupons.value.find(c => c.instanceId === selectedCouponId.value)
  if (found && cartStore.totalPrice >= found.minSpend) {
    appliedCoupon.value = found
  } else {
    showToast('未達此優惠券之低消門檻！', 'warning', '無法套用優惠券')
    selectedCouponId.value = ''
    appliedCoupon.value = null
  }
}

const couponDiscountAmount = computed(() => {
  if (!appliedCoupon.value) return 0
  const cpn = appliedCoupon.value
  if (cpn.type === 'FIXED') {
    return Math.min(cartStore.totalPrice, cpn.value)
  } else if (cpn.type === 'PERCENT') {
    const rawDiscount = Math.round(cartStore.totalPrice * (1 - cpn.value))
    if (cpn.maxDiscount && cpn.maxDiscount > 0) {
      return Math.min(rawDiscount, cpn.maxDiscount)
    }
    return rawDiscount
  }
  return 0
})

const maxUsablePoints = computed(() => {
  const subtotalAfterCoupon = Math.max(0, cartStore.totalPrice - couponDiscountAmount.value)
  const halfAmount = Math.floor(subtotalAfterCoupon * 0.5)
  return Math.min(currentUserPoints.value, halfAmount)
})

const useMaxPoints = () => {
  pointsToUse.value = maxUsablePoints.value
}

const shippingFee = computed(() => (form.shippingMethod === 'HOME' ? 100 : 60))

const finalTotalAmount = computed(() => {
  const subtotal = cartStore.totalPrice
  const discount = couponDiscountAmount.value
  const pointsDeduced = Math.min(maxUsablePoints.value, Math.max(0, Number(pointsToUse.value) || 0))
  return Math.max(0, subtotal - discount - pointsDeduced) + shippingFee.value
})

const submitOrder = async () => {
  if (currentUser.value?.riskStatus === 'BLOCK_ORDER') {
    showToast('您的帳號目前受風控管制，無法建立新訂單。', 'error', '下單權限受限')
    return
  }
  if (checkoutItems.value.length === 0) {
    showToast('購物車中沒有勾選任何結帳商品！', 'warning', '尚未勾選商品')
    return
  }
  if (!form.recipientName || !form.phone) {
    showToast('請完整填寫收件人姓名與聯絡手機！', 'warning', '資料未完整')
    return
  }
  if (form.shippingMethod === 'CVS' && (!form.storeId.trim() || !form.storeName.trim())) {
    showToast('請先開啟 7-11 電子地圖選擇取貨門市！', 'warning', '尚未選擇 7-11 門市')
    return
  }
  if (form.shippingMethod === 'HOME' && !form.shippingAddress.trim()) {
    showToast('請完整填寫宅配收件地址！', 'warning', '資料未完整')
    return
  }

  isSubmitting.value = true

  const cleanPointsUsed = Math.min(maxUsablePoints.value, Math.max(0, Number(pointsToUse.value) || 0))
  const totalDiscount = couponDiscountAmount.value + cleanPointsUsed
  const orderId = 'MD-' + Date.now()

  const lineProducts = checkoutItems.value.map(item => ({
    id: String(item.id),
    name: `${item.name} (${item.color}/${item.size})`,
    quantity: Number(item.quantity),
    price: Math.round(Number(item.price))
  }))

  if (shippingFee.value > 0) {
    lineProducts.push({
      id: 'SHIPPING',
      name: form.shippingMethod === 'HOME' ? '黑貓宅急便運費' : '7-11 純取貨運費',
      quantity: 1,
      price: Math.round(shippingFee.value)
    })
  }

  if (totalDiscount > 0) {
    lineProducts.push({
      id: 'DISCOUNT',
      name: '優惠券與紅利點數折抵',
      quantity: 1,
      price: -Math.round(totalDiscount)
    })
  }

  const packages = [
    {
      id: 'PKG-' + orderId,
      amount: Math.round(finalTotalAmount.value),
      name: 'M&D SELECT 韓系選品訂單',
      products: lineProducts
    }
  ]

  const resolvedAddress =
    form.shippingMethod === 'CVS'
      ? `[7-11] ${form.storeName.trim()} (${form.storeId.trim()})${form.storeAddress.trim() ? ` - ${form.storeAddress.trim()}` : ''}`
      : form.shippingAddress.trim()

  const pendingOrderDraft = {
    orderId,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: '待付款',
    items: JSON.parse(JSON.stringify(checkoutItems.value)),
    totalAmount: Math.round(finalTotalAmount.value),
    subtotal: cartStore.totalPrice,
    couponDiscount: couponDiscountAmount.value,
    pointsUsed: cleanPointsUsed,
    appliedCouponInstanceId: appliedCoupon.value?.instanceId || null,
    shippingFee: shippingFee.value,
    shippingMethod: form.shippingMethod,
    logisticsSubType: form.shippingMethod === 'CVS' ? '7-11' : null,
    storeId: form.shippingMethod === 'CVS' ? form.storeId.trim() : null,
    storeName: form.shippingMethod === 'CVS' ? form.storeName.trim() : null,
    storeAddress: form.shippingMethod === 'CVS' ? form.storeAddress.trim() : null,
    shippingAddress: resolvedAddress,
    paymentMethod: 'LINE Pay',
    recipientName: form.recipientName,
    phone: form.phone,
    email: form.email,
    rewardsSettled: false
  }
  sessionStorage.setItem('md_pending_linepay_order', JSON.stringify(pendingOrderDraft))

  try {
    const token = getAuthToken()
    const res = await fetch('/api/linepay-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        orderId,
        amount: Math.round(finalTotalAmount.value),
        packages,
        originUrl: window.location.origin,
        orderDraft: pendingOrderDraft
      })
    })

    const data = await res.json()

    if (data.success && data.paymentUrl) {
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY)
      window.location.href = data.paymentUrl
    } else {
      isSubmitting.value = false
      showToast(`LINE Pay 請求失敗 (${data.returnCode || 'ERROR'})：${data.message || '請檢查環境變數或庫存狀態'}`, 'error', '金流請求失敗')
    }
  } catch (err) {
    isSubmitting.value = false
    showToast('連線至後端 API 失敗：' + err.message, 'error', '連線異常')
  }
}
</script>