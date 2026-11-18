<template>
  <div class="d-flex flex-column gap-3">
    <div class="profile-card">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2.5">
        <label class="form-label fw-bold text-dark small mb-0 d-flex align-items-center gap-1.5">
          <Ticket style="width: 15px; height: 15px;" class="text-primary" />
          <span>輸入專屬優惠碼領取優惠券</span>
        </label>
        <span class="text-muted font-monospace" style="font-size: 11px;">
          可用代碼：<code>WINTER88</code>、<code>VIP200</code>、<code>HBD300</code>
        </span>
      </div>

      <div class="coupon-claim-row">
        <input
          v-model="claimCodeInput"
          type="text"
          class="form-control form-control-sm font-monospace text-uppercase"
          placeholder="輸入優惠碼領取..."
          @keyup.enter="handleClaimCoupon"
        />
        <button
          type="button"
          class="btn btn-dark btn-sm rounded-pill px-4 text-nowrap font-monospace"
          @click="handleClaimCoupon"
        >
          立即領取
        </button>
      </div>
    </div>

    <div v-if="(currentUser.myCoupons || []).length > 0" class="row g-3">
      <div
        v-for="cpn in currentUser.myCoupons"
        :key="cpn.instanceId"
        class="col-12 col-md-6"
      >
        <div
          class="coupon-ticket-card bg-white rounded-4 border h-100"
          :class="{ 'opacity-50 bg-light': cpn.isUsed }"
        >
          <div class="coupon-ticket-left">
            <div class="d-flex align-items-center flex-wrap gap-1.5 mb-1">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
                {{ cpn.code }}
              </span>
              <strong class="text-dark small">{{ cpn.title }}</strong>
            </div>
            <div class="text-muted font-monospace" style="font-size: 11px;">
              低消滿 NT$ {{ (cpn.minSpend || 0).toLocaleString() }} · 到期 {{ cpn.expiryDate }}
            </div>
            <div class="text-secondary mt-1" style="font-size: 10.5px;">
              來源：{{ cpn.source }}
            </div>
          </div>

          <div class="coupon-ticket-right">
            <div class="fs-5 fw-bold font-monospace text-dark">
              {{ cpn.type === 'FIXED' ? `-$${cpn.value}` : `${Math.round(cpn.value * 100)}折` }}
            </div>
            <span v-if="cpn.isUsed" class="badge bg-secondary font-monospace mt-1" style="font-size: 10px;">
              已使用
            </span>
            <router-link
              v-else
              to="/checkout"
              class="btn btn-outline-dark btn-sm rounded-pill py-1 px-2.5 font-monospace mt-1 text-nowrap"
              style="font-size: 10.5px;"
            >
              去結帳 →
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="profile-card text-center py-5 text-muted small">
      目前優惠券錢包尚無可用禮券，請於上方輸入優惠碼進行領取！
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Ticket } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user || {})
const claimCodeInput = ref('')

const handleClaimCoupon = () => {
  if (!claimCodeInput.value.trim()) {
    alert('請輸入優惠碼！')
    return
  }
  if (authStore.claimCouponByCode) {
    const res = authStore.claimCouponByCode(claimCodeInput.value, '會員中心輸入優惠碼領取')
    alert(res.message)
    if (res.success) claimCodeInput.value = ''
  }
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

.coupon-claim-row {
  display: flex;
  gap: 8px;
  max-width: 480px;
}

.coupon-ticket-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-color: #e8e2da !important;
}

.coupon-ticket-left {
  min-width: 0;
  flex: 1 1 auto;
}

.coupon-ticket-right {
  flex-shrink: 0;
  text-align: right;
  padding-left: 14px;
  border-left: 1px dashed #dfd8ce;
}
</style>