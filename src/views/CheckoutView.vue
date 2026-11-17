<template>
  <main class="container py-4 py-md-5" style="max-width: 1120px; margin: 0 auto;">
    <h1 class="h4 fw-bold text-dark font-serif mb-4">填寫訂單與結帳</h1>

    <div class="row g-4">
      <!-- 左側：收件人與配送資訊 -->
      <div class="col-12 col-lg-7">
        <div class="card-korean p-4 bg-white rounded-4 border shadow-xs">
          <h2 class="fs-6 fw-bold text-dark mb-3 pb-2 border-bottom">收件人與配送資訊</h2>

          <form @submit.prevent="submitOrder" class="row g-3 small">
            <div class="col-12 col-sm-6">
              <label class="form-label text-secondary mb-1">收件人姓名 *</label>
              <input v-model="form.recipientName" required type="text" class="form-control form-control-sm" placeholder="請輸入真實姓名" />
            </div>

            <div class="col-12 col-sm-6">
              <label class="form-label text-secondary mb-1">聯絡手機 *</label>
              <input v-model="form.phone" required type="tel" class="form-control form-control-sm font-monospace" placeholder="0912345678" />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary mb-1">電子信箱 (接收訂單通知) *</label>
              <input v-model="form.email" required type="email" class="form-control form-control-sm font-monospace" placeholder="name@example.com" />
            </div>

            <div class="col-12">
              <label class="form-label text-secondary mb-1">配送方式 *</label>
              <select v-model="form.shippingMethod" class="form-select form-select-sm">
                <option value="HOME">黑貓宅急便宅配到府 (運費 NT$ 100)</option>
                <option value="CVS">7-11 / 全家超商純取貨 (運費 NT$ 60)</option>
              </select>
            </div>

            <div class="col-12">
              <label class="form-label text-secondary mb-1">收件地址 / 指定超商門市 *</label>
              <input v-model="form.shippingAddress" required type="text" class="form-control form-control-sm" placeholder="請輸入完整街道地址或超商門市名稱" />
            </div>

            <div class="col-12 pt-2 border-top">
              <label class="form-label text-secondary mb-1">付款方式 *</label>
              <input type="text" class="form-control form-control-sm font-monospace bg-light" value="LINE Pay 線上支付" disabled />
            </div>
          </form>
        </div>
      </div>

      <!-- 右側：已勾選結帳商品摘要、優惠券與紅利折抵 -->
      <div class="col-12 col-lg-5">
        <div class="card-korean p-4 bg-white rounded-4 border shadow-xs sticky-top" style="top: 90px;">
          <h2 class="fs-6 fw-bold text-dark mb-3 pb-2 border-bottom">已選結帳商品 ({{ checkoutItems.length }} 項)</h2>

          <!-- 商品清單（支援在此直接刪除品項） -->
          <div v-if="checkoutItems.length > 0" class="d-flex flex-column gap-3 mb-4">
            <div
              v-for="item in checkoutItems"
              :key="item.cartItemId"
              class="d-flex align-items-center justify-content-between gap-2 pb-3 border-bottom small"
            >
              <div class="d-flex align-items-center gap-2.5 min-w-0">
                <div class="rounded-2 overflow-hidden border flex-shrink-0" style="width: 40px; height: 50px; background-color: #f5f2ed;">
                  <img :src="item.image" class="w-100 h-100 object-fit-cover" />
                </div>
                <div class="min-w-0">
                  <strong class="text-dark d-block text-truncate" style="max-width: 160px;">{{ item.name }}</strong>
                  <span class="text-muted font-monospace" style="font-size: 11px;">{{ item.color }} / {{ item.size }} × {{ item.quantity }}</span>
                </div>
              </div>

              <div class="d-flex align-items-center gap-2 flex-shrink-0">
                <span class="font-monospace fw-bold text-dark">
                  NT$ {{ (item.price * item.quantity).toLocaleString() }}
                </span>
                <!-- 刪除本項結帳商品按鈕 -->
                <button
                  type="button"
                  class="btn btn-link text-muted p-0 text-decoration-none"
                  style="font-size: 16px; line-height: 1;"
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
              <router-link to="/" class="btn btn-outline-dark btn-sm rounded-pill px-3">返回首頁選購</router-link>
            </div>
          </div>

          <!-- 優惠券與紅利點數折抵區塊 -->
          <div v-if="checkoutItems.length > 0" class="p-3 bg-light rounded-3 border mb-4 d-flex flex-column gap-3 small font-monospace">
            <!-- 優惠券下拉與手動輸入優惠碼新增 -->
            <div>
              <label class="form-label text-dark fw-bold mb-1" style="font-size: 11.5px;">選擇或輸入優惠券</label>
              <div class="d-flex gap-1.5 mb-2">
                <select v-model="selectedCouponId" class="form-select form-select-sm font-monospace" @change="applyCoupon">
                  <option value="">-- 請選擇優惠券 --</option>
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

              <!-- 輸入優惠碼新增按鈕 -->
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
                  class="btn btn-dark px-3 text-nowkrp font-monospace"
                  @click="handleClaimAndApplyCode"
                >
                  新增並套用
                </button>
              </div>

              <div v-if="appliedCoupon" class="text-success mt-1.5" style="font-size: 10.5px;">
                ✓ 已套用【{{ appliedCoupon.title }}】，折抵 NT$ {{ couponDiscountAmount.toLocaleString() }}
              </div>
            </div>

            <!-- 紅利點數折抵 -->
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
              <span class="text-muted">物流運費</span>
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
              :disabled="checkoutItems.length === 0"
              @click="submitOrder"
            >
              確認送出訂單 (NT$ {{ finalTotalAmount.toLocaleString() }})
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const cartStore = useCartStore()
const adminStore = useAdminStore()
const authStore = useAuthStore()

const checkoutItems = computed(() => cartStore.selectedItems)

// 在結帳頁面直接從本次結帳清單中移除（取消勾選該商品）
const removeCheckoutItem = (cartItemId) => {
  const target = cartStore.items.find(i => i.cartItemId === cartItemId)
  if (target) {
    target.selected = false
  }
}

const form = reactive({
  recipientName: authStore.user?.name || '',
  phone: authStore.user?.phone || '',
  email: authStore.user?.email || '',
  shippingMethod: 'HOME',
  shippingAddress: '',
  paymentMethod: 'LINE Pay'
})

// ==================== 優惠券與紅利點數邏輯 ====================
const currentUser = computed(() => authStore.user || {})
const availableCoupons = computed(() => {
  return (authStore.availableUserCoupons || currentUser.value.myCoupons || []).filter(c => !c.isUsed)
})

const selectedCouponId = ref('')
const appliedCoupon = ref(null)
const inputCouponCode = ref('')

// 輸入優惠碼新增並自動套用
const handleClaimAndApplyCode = () => {
  const code = inputCouponCode.value.trim().toUpperCase()
  if (!code) {
    alert('請輸入優惠碼！')
    return
  }

  if (authStore.claimCouponByCode) {
    const res = authStore.claimCouponByCode(code, '結帳頁面手動輸入領取')
    alert(res.message)
    if (res.success) {
      inputCouponCode.value = ''
      // 自動選取剛領取的優惠券
      const newlyAdded = availableCoupons.value[availableCoupons.value.length - 1]
      if (newlyAdded) {
        selectedCouponId.value = newlyAdded.instanceId
        applyCoupon()
      }
    }
  } else {
    alert('優惠碼功能尚未初始化。')
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
    alert('未達此優惠券之低消門檻！')
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

const currentUserPoints = computed(() => Number(currentUser.value.points || 0))
const pointsToUse = ref(0)

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
  const pointsDeduced = Number(pointsToUse.value) || 0
  return Math.max(0, subtotal - discount - pointsDeduced) + shippingFee.value
})

const submitOrder = () => {
  if (checkoutItems.value.length === 0) {
    alert('購物車中沒有勾選任何結帳商品！')
    return
  }
  if (!form.recipientName || !form.phone || !form.shippingAddress) {
    alert('請完整填寫收件人姓名、手機與配送地址！')
    return
  }

  const newOrder = {
    orderId: 'MD-' + Math.floor(100000 + Math.random() * 900000),
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: '待出貨',
    items: [...checkoutItems.value],
    totalAmount: finalTotalAmount.value,
    subtotal: cartStore.totalPrice,
    couponDiscount: couponDiscountAmount.value,
    pointsUsed: Number(pointsToUse.value) || 0,
    shippingFee: shippingFee.value,
    shippingMethod: form.shippingMethod,
    shippingAddress: form.shippingAddress,
    paymentMethod: 'LINE Pay',
    recipientName: form.recipientName,
    phone: form.phone,
    email: form.email,
    rewardsSettled: false
  }

  // 1. 寫入後台訂單
  if (adminStore.orders) {
    adminStore.orders.unshift(newOrder)
  }

  if (adminStore.addAuditLog) {
    adminStore.addAuditLog('新訂單成立', `成立訂單 #${newOrder.orderId}，實付 NT$ ${finalTotalAmount.value}`)
  }

  // 2. 標記優惠券已使用
  if (appliedCoupon.value && authStore.markCouponAsUsed) {
    authStore.markCouponAsUsed(appliedCoupon.value.instanceId)
  }

  // 3. 扣除紅利點數
  if (pointsToUse.value > 0 && currentUser.value) {
    currentUser.value.points = Math.max(0, (currentUser.value.points || 0) - Number(pointsToUse.value))
  }

  // 4. 將已結帳商品從購物車移除（保留未勾選商品）
  const unselectedItems = cartStore.items.filter(i => !i.selected)
  cartStore.items = unselectedItems

  alert(`訂單 #${newOrder.orderId} 結帳成功！`)
  router.push('/order-success')
}
</script>