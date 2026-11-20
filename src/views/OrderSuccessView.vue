<template>
  <main class="container py-5 px-3" style="max-width: 640px; margin: 0 auto;">
    <div class="bg-white rounded-4 border p-4 p-md-5 text-center shadow-xs" style="border-color: #e8e2da !important;">
      
      <!-- 1. 正在向 LINE Pay 確認扣款中 -->
      <div v-if="status === 'CONFIRMING'" class="py-4">
        <div class="spinner-border text-dark mb-3" role="status"></div>
        <h1 class="h5 fw-bold text-dark font-serif mb-2">正在確認 LINE Pay 付款狀態...</h1>
        <p class="small text-muted font-monospace mb-0">
          正在與 LINE Pay 伺服器進行安全交易核對，請勿關閉視窗
        </p>
      </div>

      <!-- 2. 付款與訂單成立成功 -->
      <div v-else-if="status === 'SUCCESS'" class="py-2">
        <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success mb-3" style="width: 64px; height: 64px; font-size: 28px;">
          ✓
        </div>
        <div class="text-muted font-monospace mb-1" style="font-size: 11px; letter-spacing: 0.1em;">
          LINE PAY PAYMENT CONFIRMED
        </div>
        <h1 class="h4 fw-bold text-dark font-serif mb-2">感謝您的訂購，付款已完成！</h1>
        <p class="small text-muted mb-4">
          我們已收到您的 LINE Pay 款項，倉庫人員將盡快為您安排出貨。
        </p>

        <div class="bg-light rounded-4 border p-3.5 text-start font-monospace small mb-4 d-flex flex-column gap-2" style="border-color: #ede8e1 !important; padding: 16px 20px;">
          <div class="d-flex justify-content-between">
            <span class="text-muted">訂單編號：</span>
            <strong class="text-dark">#{{ orderInfo.orderId }}</strong>
          </div>
          <div v-if="transactionId" class="d-flex justify-content-between">
            <span class="text-muted">LINE Pay 交易序號：</span>
            <span class="text-dark">{{ transactionId }}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span class="text-muted">付款方式：</span>
            <span class="badge bg-success-subtle text-success border border-success-subtle">LINE Pay 已付款</span>
          </div>
          <div class="d-flex justify-content-between pt-2 border-top">
            <span class="text-muted">實付總金額：</span>
            <strong class="text-dark fs-6">NT$ {{ Number(orderInfo.amount || 0).toLocaleString() }}</strong>
          </div>
        </div>

        <div class="d-flex flex-column flex-sm-row justify-content-center gap-2.5">
          <router-link to="/profile" class="btn btn-dark rounded-pill px-4 py-2.5 fw-bold font-monospace" style="font-size: 12.5px;">
            前往會員中心查看訂單
          </router-link>
          <router-link to="/" class="btn btn-outline-dark rounded-pill px-4 py-2.5 font-monospace" style="font-size: 12.5px;">
            繼續逛逛選品
          </router-link>
        </div>
      </div>

      <!-- 3. 付款確認失敗 -->
      <div v-else class="py-3">
        <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-subtle text-danger mb-3" style="width: 64px; height: 64px; font-size: 28px;">
          ✕
        </div>
        <h1 class="h5 fw-bold text-dark font-serif mb-2">LINE Pay 付款確認失敗</h1>
        <p class="small text-danger font-monospace mb-4">{{ errorMessage }}</p>
        <router-link to="/checkout" class="btn btn-dark rounded-pill px-4 py-2.5 fw-bold font-monospace" style="font-size: 12.5px;">
          返回結帳頁面重試
        </router-link>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { useAdminStore } from '../stores/adminStore'
import { useAuthStore } from '../stores/authStore'
import { useProductStore } from '../stores/productStore'

const route = useRoute()
const cartStore = useCartStore()
const adminStore = useAdminStore()
const authStore = useAuthStore()
const productStore = useProductStore()

const status = ref('CONFIRMING')
const errorMessage = ref('')
const transactionId = ref(String(route.query.transactionId || ''))
const orderInfo = reactive({
  orderId: String(route.query.orderId || ''),
  amount: Number(route.query.amount || 0)
})

const finalizeOrderInStore = () => {
  const rawDraft = sessionStorage.getItem('md_pending_linepay_order')
  if (!rawDraft) return

  const draft = JSON.parse(rawDraft)
  draft.transactionId = transactionId.value
  draft.paymentStatus = 'PAID'

  // 1. 扣減商品 SKU 庫存，總庫存歸 0 自動下架
  for (const item of (draft.items || [])) {
    const targetProd = (productStore.products || []).find(p => p.id === item.id)
    if (targetProd && Array.isArray(targetProd.skus)) {
      const targetSku = targetProd.skus.find(s => s.color === item.color && s.size === item.size) || targetProd.skus[0]
      if (targetSku) {
        targetSku.stock = Math.max(0, (Number(targetSku.stock) || 0) - item.quantity)
      }
      targetProd.salesCount = (Number(targetProd.salesCount) || 0) + item.quantity
      const remainingTotal = targetProd.skus.reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
      if (remainingTotal === 0) {
        targetProd.isPublished = false
      }
    }
  }

  // 2. 寫入後台訂單列表
  if (adminStore.orders && !adminStore.orders.some(o => o.orderId === draft.orderId)) {
    adminStore.orders.unshift(draft)
  }

  if (adminStore.addAuditLog) {
    adminStore.addAuditLog(
      'LINE Pay 付款完成',
      `訂單 #${draft.orderId} 已完成 LINE Pay 扣款（交易序號：${transactionId.value}），實付 NT$ ${draft.totalAmount}`
    )
  }

  // 3. 核銷優惠券與扣除紅利點數
  if (draft.appliedCouponInstanceId && authStore.markCouponAsUsed) {
    authStore.markCouponAsUsed(draft.appliedCouponInstanceId)
  }
  if (draft.pointsUsed > 0 && authStore.user) {
    authStore.user.points = Math.max(0, (authStore.user.points || 0) - draft.pointsUsed)
  }

  // 4. 清空已結帳購物車項目並清除暫存
  cartStore.items = cartStore.items.filter(i => !i.selected)
  sessionStorage.removeItem('md_pending_linepay_order')
}

onMounted(async () => {
  const txId = String(route.query.transactionId || '')
  const amt = Number(route.query.amount || 0)

  if (!txId || !amt) {
    // 若無 transactionId（例如直接瀏覽此頁），顯示一般成立狀態
    status.value = 'SUCCESS'
    return
  }

  try {
    const res = await fetch('/api/linepay-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: txId, amount: amt })
    })
    const data = await res.json()

    if (data.success) {
      finalizeOrderInStore()
      status.value = 'SUCCESS'
    } else {
      status.value = 'ERROR'
      errorMessage.value = `${data.returnCode || ''} ${data.message || '確認扣款失敗'}`
    }
  } catch (err) {
    status.value = 'ERROR'
    errorMessage.value = err.message
  }
})
</script>