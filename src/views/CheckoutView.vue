<template>
  <main class="container py-3 py-md-5 checkout-page-container">
    
    <div class="mb-4">
      <nav class="small text-muted mb-2" aria-label="breadcrumb">
        <ol class="breadcrumb mb-0">
          <li class="breadcrumb-item">
            <router-link to="/" class="text-decoration-none text-muted">首頁</router-link>
          </li>
          <li class="breadcrumb-item active text-dark fw-semibold" aria-current="page">購物結帳</li>
        </ol>
      </nav>
      <h1 class="h3 fw-bold text-dark font-serif mb-1">訂單結帳確認</h1>
      <p class="small text-muted mb-0">請填寫收件資訊、選擇專屬優惠券與紅利點數折抵</p>
    </div>

    <!-- 風控管制警戒橫幅 -->
    <div
      v-if="currentRiskStatus === 'BLOCK_ORDER' || currentRiskStatus === 'BANNED'"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4 rounded-3 border-0 shadow-2xs"
    >
      <ShieldAlert style="width: 20px; height: 20px;" class="flex-shrink-0" />
      <div class="small">
        <strong>【帳號權限受限】</strong>
        {{ authStore.user?.blockReason || '您的帳號目前暫停下單交易權限，如有疑問請聯繫客服專員。' }}
      </div>
    </div>

    <!-- 購物車為空時提示 -->
    <div v-if="cartStore.items.length === 0" class="card-korean text-center py-5 my-4 bg-white shadow-xs">
      <ShoppingBag class="mb-2 opacity-40 text-muted" style="width: 44px; height: 44px;" />
      <h2 class="h5 fw-bold text-dark">購物袋內目前沒有商品</h2>
      <router-link to="/" class="btn btn-primary btn-sm rounded-pill px-4 mt-2">前往選購商品</router-link>
    </div>

    <!-- 結帳主內容雙欄佈局 -->
    <div v-else class="row g-4">
      
      <!-- ==================== 左欄：收件、配送與 LINE Pay 付款 ==================== -->
      <div class="col-12 col-lg-7 d-flex flex-column gap-3.5">
        
        <!-- 1. 收件人資訊 -->
        <div class="card-korean bg-white p-3.5 p-md-4 border shadow-xs">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="fs-6 fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
              <User style="width: 16px; height: 16px;" class="text-primary" />
              <span>收件人資訊</span>
            </h2>
            <button
              v-if="authStore.user?.isLoggedIn"
              type="button"
              class="btn btn-outline-secondary btn-sm rounded-pill font-monospace"
              style="font-size: 11px;"
              @click="autofillMemberInfo"
            >
              帶入會員資料
            </button>
          </div>

          <div class="row g-3">
            <div class="col-12 col-sm-6">
              <label class="form-label text-secondary small mb-1">收件人真實姓名 *</label>
              <input v-model="form.recipientName" required type="text" class="form-control form-control-sm" placeholder="請輸入證件姓名" />
            </div>
            <div class="col-12 col-sm-6">
              <label class="form-label text-secondary small mb-1">收件人手機號碼 *</label>
              <input v-model="form.phone" required type="tel" class="form-control form-control-sm font-monospace" placeholder="0912345678" />
            </div>
            <div class="col-12">
              <label class="form-label text-secondary small mb-1">電子郵件信箱 *</label>
              <input v-model="form.email" required type="email" class="form-control form-control-sm font-monospace" placeholder="example@gmail.com" />
            </div>
          </div>
        </div>

        <!-- 2. 配送方式 -->
        <div class="card-korean bg-white p-3.5 p-md-4 border shadow-xs">
          <h2 class="fs-6 fw-bold text-dark mb-3 d-flex align-items-center gap-1.5">
            <Truck style="width: 16px; height: 16px;" class="text-primary" />
            <span>配送方式</span>
          </h2>

          <div class="d-flex flex-column gap-2 mb-3">
            <label class="d-flex align-items-center justify-content-between p-3 rounded-3 border delivery-radio-option" :class="{ 'border-primary bg-light': form.shippingMethod === 'HOME' }">
              <div class="d-flex align-items-center gap-2.5">
                <input v-model="form.shippingMethod" type="radio" value="HOME" class="form-check-input m-0" />
                <div>
                  <strong class="text-dark d-block small">黑貓宅急便 / 宅配到府</strong>
                  <span class="text-muted font-monospace" style="font-size: 11px;">出貨後約 2~3 個工作日抵達</span>
                </div>
              </div>
              <span class="font-monospace fw-bold small text-dark">{{ shippingFee === 0 ? '免運費' : 'NT$ ' + shippingFee }}</span>
            </label>

            <label class="d-flex align-items-center justify-content-between p-3 rounded-3 border delivery-radio-option" :class="{ 'border-primary bg-light': form.shippingMethod === 'CVS' }">
              <div class="d-flex align-items-center gap-2.5">
                <input v-model="form.shippingMethod" type="radio" value="CVS" class="form-check-input m-0" />
                <div>
                  <strong class="text-dark d-block small">7-ELEVEN / 全家超商純取貨</strong>
                  <span class="text-muted font-monospace" style="font-size: 11px;">簡訊通知門市取件，須出示有效證件</span>
                </div>
              </div>
              <span class="font-monospace fw-bold small text-dark">{{ shippingFee === 0 ? '免運費' : 'NT$ ' + shippingFee }}</span>
            </label>
          </div>

          <div v-if="form.shippingMethod === 'HOME'" class="row g-2">
            <div class="col-6"><input v-model="form.city" type="text" class="form-control form-control-sm" placeholder="縣市" /></div>
            <div class="col-6"><input v-model="form.district" type="text" class="form-control form-control-sm" placeholder="鄉鎮市區" /></div>
            <div class="col-12"><input v-model="form.addressDetail" type="text" class="form-control form-control-sm" placeholder="詳細收件地址" /></div>
          </div>
          <div v-else class="row g-2">
            <div class="col-12 col-sm-6"><input v-model="form.cvsStoreName" type="text" class="form-control form-control-sm" placeholder="門市名稱" /></div>
            <div class="col-12 col-sm-6"><input v-model="form.cvsStoreId" type="text" class="form-control form-control-sm font-monospace" placeholder="門市店號 (6碼)" /></div>
          </div>
        </div>

        <!-- 3. 付款方式：專屬商家 LINE Pay -->
        <div class="card-korean bg-white p-3.5 p-md-4 border shadow-xs">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="fs-6 fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
              <Wallet style="width: 16px; height: 16px;" class="text-success" />
              <span>付款方式</span>
            </h2>
            <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace" style="font-size: 10px;">
              官方安全即時支付
            </span>
          </div>

          <div class="linepay-card p-3.5 rounded-3 border border-success bg-success-subtle bg-opacity-25">
            <div class="d-flex align-items-center gap-3">
              <input v-model="form.paymentMethod" type="radio" value="LINE_PAY" checked class="form-check-input m-0 border-success" />
              <div class="linepay-logo-badge font-monospace fw-bold px-2.5 py-1 rounded-2 text-white">LINE Pay</div>
              <div>
                <strong class="text-dark d-block small">商家 LINE Pay 行動支付</strong>
                <span class="text-muted font-monospace" style="font-size: 11px;">支援 LINE POINTS 折抵及綁定信用卡付款</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 右欄：VIP折扣、選用優惠券、自訂點數與金額總結 ==================== -->
      <div class="col-12 col-lg-5">
        <div class="card-korean bg-white p-3.5 p-md-4 border shadow-xs sticky-order-summary">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h2 class="fs-6 fw-bold text-dark mb-0 font-serif">選購明細 (共 {{ cartStore.totalCount }} 件)</h2>
            <span v-if="authStore.user?.isLoggedIn" class="badge rounded-pill font-monospace" :class="authStore.currentVipTier.badgeColor" style="font-size: 10px;">
              {{ authStore.currentVipTier.name }}
            </span>
          </div>

          <div class="d-flex flex-column gap-2.5 mb-3.5 max-h-cart-list overflow-y-auto no-scrollbar">
            <div v-for="item in cartStore.items" :key="item.skuId" class="d-flex align-items-center justify-content-between gap-2 py-1">
              <div class="d-flex align-items-center gap-2 min-w-0">
                <div class="rounded-2 overflow-hidden border flex-shrink-0" style="width: 42px; height: 52px; background-color: #f5f2ed;">
                  <img :src="item.image" class="w-100 h-100 object-fit-cover" />
                </div>
                <div class="min-w-0">
                  <div class="small fw-semibold text-dark text-truncate" style="max-width: 170px;">{{ item.name }}</div>
                  <div class="text-muted font-monospace" style="font-size: 10.5px;">{{ item.color }} / {{ item.size }} × {{ item.quantity }}</div>
                </div>
              </div>
              <div class="font-monospace small fw-bold text-dark text-nowrap">NT$ {{ (item.price * item.quantity).toLocaleString() }}</div>
            </div>
          </div>

          <!-- 1. 選取會員優惠券 + 支援現場輸入優惠碼領取 -->
          <div class="border-top pt-3 mb-3">
            <label class="form-label text-dark fw-bold small mb-1.5 d-flex align-items-center gap-1.5">
              <Ticket style="width: 14px; height: 14px;" class="text-primary" />
              <span>選擇使用優惠券</span>
            </label>

            <div v-if="currentRiskStatus === 'RESTRICT_PROMO'" class="text-danger small font-monospace" style="font-size: 11px;">
              ✕ 此帳號目前優惠受限，無法使用優惠券
            </div>

            <div v-else class="d-flex flex-column gap-2">
              <select v-model="selectedCouponInstanceId" class="form-select form-select-sm font-sans">
                <option value="">不使用優惠券</option>
                <option
                  v-for="cpn in authStore.availableUserCoupons"
                  :key="cpn.instanceId"
                  :value="cpn.instanceId"
                  :disabled="subtotalAfterVip < cpn.minSpend"
                >
                  {{ cpn.title }} ({{ cpn.type === 'FIXED' ? `折$${cpn.value}` : `${Math.round(cpn.value * 100)}折` }})
                  {{ subtotalAfterVip < cpn.minSpend ? `[未滿低消 $${cpn.minSpend}]` : '' }}
                </option>
              </select>

              <div class="input-group input-group-sm">
                <input
                  v-model="inlinePromoCode"
                  type="text"
                  class="form-control font-monospace text-uppercase"
                  placeholder="輸入新優惠碼領取並套用..."
                  @keyup.enter="claimAndSelectCoupon"
                />
                <button type="button" class="btn btn-outline-dark font-monospace" @click="claimAndSelectCoupon">
                  領取並套用
                </button>
              </div>
            </div>
          </div>

          <!-- 2. 紅利點數自訂輸入折抵 -->
          <div v-if="authStore.user?.isLoggedIn" class="border-top pt-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1.5">
              <label class="form-label text-dark fw-bold small mb-0 d-flex align-items-center gap-1.5">
                <Coins style="width: 14px; height: 14px; color: #d4a373;" />
                <span>紅利點數折抵</span>
              </label>
              <span class="badge bg-light text-dark border font-monospace" style="font-size: 10.5px;">
                持有 {{ availableUserPoints.toLocaleString() }} 點
              </span>
            </div>

            <div v-if="currentRiskStatus === 'RESTRICT_PROMO'" class="text-danger small font-monospace" style="font-size: 11px;">
              ✕ 此帳號目前優惠受限，無法折抵點數
            </div>

            <div v-else>
              <div class="input-group input-group-sm">
                <input
                  v-model.number="customPointsInput"
                  type="number"
                  min="0"
                  :max="maxUsablePoints"
                  class="form-control font-monospace"
                  placeholder="輸入折抵點數 (1點 = $1)"
                  @input="validatePointsInput"
                />
                <button
                  type="button"
                  class="btn btn-outline-secondary font-monospace"
                  style="font-size: 11px;"
                  :disabled="maxUsablePoints === 0"
                  @click="customPointsInput = maxUsablePoints"
                >
                  最高折抵 ({{ maxUsablePoints }})
                </button>
              </div>
            </div>
          </div>

          <!-- 金額計算明細表 -->
          <div class="border-top pt-3 d-flex flex-column gap-2 font-sans small">
            <div class="d-flex justify-content-between text-secondary">
              <span>商品原價小計</span>
              <span class="font-monospace">NT$ {{ rawSubtotal.toLocaleString() }}</span>
            </div>

            <div v-if="vipDiscountAmount > 0" class="d-flex justify-content-between text-warning-emphasis fw-medium">
              <span>👑 {{ authStore.currentVipTier.name }} ({{ Math.round(authStore.currentVipTier.discountRate * 100) }}折)</span>
              <span class="font-monospace">- NT$ {{ vipDiscountAmount.toLocaleString() }}</span>
            </div>

            <div v-if="couponDiscountAmount > 0" class="d-flex justify-content-between text-success fw-medium">
              <span>🎫 優惠券折抵 ({{ selectedCoupon?.title }})</span>
              <span class="font-monospace">- NT$ {{ couponDiscountAmount.toLocaleString() }}</span>
            </div>

            <div v-if="appliedPointsDiscount > 0" class="d-flex justify-content-between text-primary fw-medium">
              <span>🪙 紅利點數折抵</span>
              <span class="font-monospace">- NT$ {{ appliedPointsDiscount.toLocaleString() }}</span>
            </div>

            <div class="d-flex justify-content-between text-secondary">
              <span>物流運費</span>
              <span class="font-monospace">{{ shippingFee === 0 ? '免運費' : 'NT$ ' + shippingFee }}</span>
            </div>

            <div class="border-top pt-2.5 mt-1 d-flex justify-content-between align-items-baseline">
              <strong class="fs-6 text-dark font-serif">LINE Pay 應付總額</strong>
              <div class="font-monospace fs-4 fw-bold text-dark">
                NT$ {{ finalTotalAmount.toLocaleString() }}
              </div>
            </div>

            <div v-if="authStore.user?.isLoggedIn" class="bg-light rounded-2 p-2 text-end font-monospace text-muted" style="font-size: 11px;">
              ✨ 本筆完成後預計可獲得 <strong class="text-dark">{{ estimatedEarnedPoints }} 點</strong> 紅利回饋 ({{ authStore.currentVipTier.pointsEarnRate }}%)
            </div>
          </div>

          <div class="pt-3.5 d-none d-lg-block">
            <button
              type="button"
              class="btn btn-linepay w-100 rounded-pill py-2.5 fw-bold shadow-xs d-flex align-items-center justify-content-center gap-2"
              :disabled="isSubmitting || isBlockedFromCheckout"
              @click="submitOrder"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
              <Lock style="width: 14px; height: 14px;" />
              <span>{{ isBlockedFromCheckout ? '帳號暫停結帳' : '前往商家 LINE Pay 付款' }}</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- 手機端底部浮動結帳列 -->
    <div class="mobile-sticky-checkout-bar d-lg-none">
      <div class="d-flex align-items-center justify-content-between gap-2.5">
        <div>
          <span class="text-muted font-monospace" style="font-size: 10.5px;">LINE Pay 實付金額</span>
          <div class="font-monospace fs-5 fw-bold text-dark lh-1">NT$ {{ finalTotalAmount.toLocaleString() }}</div>
        </div>
        <button
          type="button"
          class="btn btn-linepay rounded-pill px-4 py-2.5 fw-bold font-sans shadow-xs flex-grow-1"
          style="max-width: 220px;"
          :disabled="isSubmitting || isBlockedFromCheckout || cartStore.items.length === 0"
          @click="submitOrder"
        >
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
          <span>{{ isBlockedFromCheckout ? '帳號受限' : 'LINE Pay 結帳' }}</span>
        </button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ShoppingBag, User, Truck, Wallet, Lock, ShieldAlert, Ticket, Coins } from 'lucide-vue-next'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { useAdminStore } from '../stores/adminStore'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const isSubmitting = ref(false)

const form = reactive({
  recipientName: '',
  phone: '',
  email: '',
  shippingMethod: 'HOME',
  city: '台北市',
  district: '大安區',
  addressDetail: '',
  cvsStoreName: '',
  cvsStoreId: '',
  paymentMethod: 'LINE_PAY',
  orderNotes: ''
})

const rawSubtotal = computed(() => {
  return cartStore.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const vipDiscountAmount = computed(() => {
  if (!authStore.user?.isLoggedIn) return 0
  const rate = authStore.currentVipTier?.discountRate ?? 1.0
  if (rate >= 1.0) return 0
  return Math.round(rawSubtotal.value * (1 - rate))
})

const subtotalAfterVip = computed(() => Math.max(0, rawSubtotal.value - vipDiscountAmount.value))

const selectedCouponInstanceId = ref('')
const inlinePromoCode = ref('')

const selectedCoupon = computed(() => {
  if (!selectedCouponInstanceId.value) return null
  return authStore.availableUserCoupons.find(c => c.instanceId === selectedCouponInstanceId.value) || null
})

const claimAndSelectCoupon = () => {
  if (!inlinePromoCode.value.trim()) {
    alert('請輸入優惠碼！')
    return
  }
  const res = authStore.claimCouponByCode(inlinePromoCode.value, '結帳頁輸入代碼領取')
  alert(res.message)
  if (res.success && res.coupon) {
    selectedCouponInstanceId.value = res.coupon.instanceId
    inlinePromoCode.value = ''
  }
}

const couponDiscountAmount = computed(() => {
  if (!selectedCoupon.value || currentRiskStatus.value === 'RESTRICT_PROMO') return 0
  if (subtotalAfterVip.value < selectedCoupon.value.minSpend) return 0

  if (selectedCoupon.value.type === 'FIXED') {
    return Math.min(subtotalAfterVip.value, selectedCoupon.value.value)
  }
  if (selectedCoupon.value.type === 'PERCENT') {
    return Math.round(subtotalAfterVip.value * (1 - selectedCoupon.value.value))
  }
  return 0
})

const customPointsInput = ref(0)
const availableUserPoints = computed(() => authStore.user?.points || 0)

const maxUsablePoints = computed(() => {
  if (!authStore.user?.isLoggedIn || currentRiskStatus.value === 'RESTRICT_PROMO') return 0
  const remaining = Math.max(0, subtotalAfterVip.value - couponDiscountAmount.value)
  return Math.min(availableUserPoints.value, remaining)
})

const validatePointsInput = () => {
  if (customPointsInput.value < 0 || isNaN(customPointsInput.value)) customPointsInput.value = 0
  if (customPointsInput.value > maxUsablePoints.value) customPointsInput.value = maxUsablePoints.value
  customPointsInput.value = Math.floor(customPointsInput.value)
}

const appliedPointsDiscount = computed(() => {
  if (!authStore.user?.isLoggedIn || currentRiskStatus.value === 'RESTRICT_PROMO') return 0
  const pts = Number(customPointsInput.value) || 0
  return Math.max(0, Math.min(pts, maxUsablePoints.value))
})

const shippingFee = computed(() => (subtotalAfterVip.value >= 1500 ? 0 : 80))

const finalTotalAmount = computed(() => {
  const afterDiscounts = subtotalAfterVip.value - couponDiscountAmount.value - appliedPointsDiscount.value
  return Math.max(0, afterDiscounts) + shippingFee.value
})

const estimatedEarnedPoints = computed(() => {
  const earnRate = authStore.currentVipTier?.pointsEarnRate ?? 1
  return Math.floor(finalTotalAmount.value * (earnRate / 100))
})

const currentRiskStatus = computed(() => authStore.user?.riskStatus || 'NORMAL')
const isBlockedFromCheckout = computed(() => ['BLOCK_ORDER', 'BANNED'].includes(currentRiskStatus.value))

const autofillMemberInfo = () => {
  if (!authStore.user) return
  form.recipientName = authStore.user.name || ''
  form.phone = authStore.user.phone || ''
  form.email = authStore.user.email || ''
  const defaultAddr = authStore.user.savedAddresses?.[0]
  if (defaultAddr) {
    form.city = defaultAddr.city || '台北市'
    form.district = defaultAddr.district || '大安區'
    form.addressDetail = defaultAddr.detail || ''
  }
}

const submitOrder = async () => {
  const eligibility = authStore.checkCheckoutEligibility('LINE_PAY')
  if (!eligibility.allowed) {
    alert(`【交易無法繼續】\n${eligibility.reason}`)
    return
  }
  if (!form.recipientName.trim() || !form.phone.trim()) {
    alert('請完整填寫收件人姓名與聯絡手機！')
    return
  }

  isSubmitting.value = true

  try {
    if (authStore.user?.isLoggedIn) {
      authStore.user.points = Math.max(0, authStore.user.points - appliedPointsDiscount.value) + estimatedEarnedPoints.value
      authStore.user.totalSpent += finalTotalAmount.value
    }

    if (selectedCouponInstanceId.value) {
      authStore.markCouponAsUsed(selectedCouponInstanceId.value)
    }

    const orderId = 'ORD-' + Date.now().toString().slice(-8)
    const shippingAddress = form.shippingMethod === 'HOME'
      ? `${form.city}${form.district}${form.addressDetail}`
      : `${form.cvsStoreName} (店號:${form.cvsStoreId})`

    // 同步寫入 adminStore.orders 讓後台訂單管理與前台會員中心即時看到新訂單
    if (adminStore.orders) {
      adminStore.orders.unshift({
        id: orderId,
        orderId,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        recipientName: form.recipientName,
        customerName: form.recipientName,
        phone: form.phone,
        email: form.email,
        shippingMethod: form.shippingMethod,
        shippingAddress,
        paymentMethod: 'LINE Pay',
        status: '待出貨',
        trackingNumber: '',
        totalAmount: finalTotalAmount.value,
        total: finalTotalAmount.value,
        items: [...cartStore.items]
      })
    }

    if (adminStore.addAuditLog) {
      adminStore.addAuditLog(
        '完成 LINE Pay 訂單結帳',
        `訂單 #${orderId}，實付 NT$${finalTotalAmount.value}，新增回饋 ${estimatedEarnedPoints.value}點`
      )
    }

    cartStore.clearCart()

    setTimeout(() => {
      isSubmitting.value = false
      router.push({
        path: '/order-success',
        query: { orderId, total: finalTotalAmount.value, payment: 'LINE Pay' }
      })
    }, 600)
  } catch (err) {
    console.error(err)
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.checkout-page-container {
  max-width: 1140px;
  margin: 0 auto;
}
.delivery-radio-option {
  cursor: pointer;
  transition: all 0.2s ease;
}
.delivery-radio-option:hover {
  background-color: var(--md-surface-subtle, #f5f2ed);
}
.linepay-logo-badge {
  background-color: #06C755;
  font-size: 13px;
  letter-spacing: 0.03em;
}
.btn-linepay {
  background-color: #06C755;
  border-color: #06C755;
  color: #ffffff;
}
.btn-linepay:hover:not(:disabled) {
  background-color: #05b34c;
  color: #ffffff;
}
.sticky-order-summary {
  position: sticky;
  top: 90px;
}
.max-h-cart-list {
  max-height: 240px;
}
.mobile-sticky-checkout-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--md-border, #ede8e1);
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
  z-index: 1020;
}
</style>