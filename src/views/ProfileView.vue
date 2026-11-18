<template>
  <main class="profile-page-container">
    <!-- 1. 未登入狀態 -->
    <div v-if="!isUserLoggedIn" class="profile-card text-center py-5 my-3">
      <User class="mb-2 opacity-40 text-muted" style="width: 44px; height: 44px;" />
      <h2 class="h5 fw-bold text-dark font-serif">請先登入會員帳號</h2>
      <p class="small text-muted mb-3">登入後即可檢視各狀態訂單、VIP 專屬折扣與生日禮券</p>
      <router-link to="/" class="btn btn-dark btn-sm rounded-pill px-4 py-2 fw-bold">
        返回首頁登入
      </router-link>
    </div>

    <!-- 2. 已登入會員中心（正式載入拆分後的 6 個子元件） -->
    <div v-else class="d-flex flex-column gap-3 gap-md-4">
      <!-- 頂部 VIP 尊榮摘要卡片 -->
      <VipSummaryCard />

      <!-- 五大功能頁籤導覽列 -->
      <nav class="profile-tabs-bar no-scrollbar" aria-label="會員中心功能切換">
        <button
          v-for="tab in profileTabs"
          :key="tab.id"
          type="button"
          class="profile-tab-btn"
          :class="{ 'is-active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" style="width: 14px; height: 14px; flex-shrink: 0;" />
          <span>{{ tab.label }}</span>
          <span v-if="tab.badge > 0" class="tab-badge font-monospace">
            {{ tab.badge }}
          </span>
        </button>
      </nav>

      <!-- 動態切換五大功能子元件 -->
      <ProfileOrdersTab v-if="activeTab === 'orders'" />
      <ProfileCouponsTab v-else-if="activeTab === 'coupons'" />
      <ProfileInfoTab v-else-if="activeTab === 'profile'" />
      <ProfileWishlistTab v-else-if="activeTab === 'wishlist'" />
      <ProfileAddressesTab v-else-if="activeTab === 'addresses'" />
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { User, ShoppingBag, Ticket, Heart, MapPin } from 'lucide-vue-next'
import VipSummaryCard from '../components/profile/VipSummaryCard.vue'
import ProfileOrdersTab from '../components/profile/ProfileOrdersTab.vue'
import ProfileCouponsTab from '../components/profile/ProfileCouponsTab.vue'
import ProfileInfoTab from '../components/profile/ProfileInfoTab.vue'
import ProfileWishlistTab from '../components/profile/ProfileWishlistTab.vue'
import ProfileAddressesTab from '../components/profile/ProfileAddressesTab.vue'

import { useAuthStore } from '../stores/authStore'
import { useAdminStore } from '../stores/adminStore'
import { useProductStore } from '../stores/productStore'

const authStore = useAuthStore()
const adminStore = useAdminStore()
const productStore = useProductStore()

const activeTab = ref('orders')

const currentUser = computed(() => authStore.user || {})
const isUserLoggedIn = computed(() => Boolean(authStore.user?.isLoggedIn || authStore.isLoggedIn))

const userOrdersCount = computed(() => {
  const allOrders = adminStore.orders || []
  const { email, phone, name } = currentUser.value
  const matched = allOrders.filter(
    o => o.email === email || o.phone === phone || o.recipientName === name || o.customerName === name
  )
  return (matched.length > 0 ? matched : allOrders).length
})

const availableCouponsCount = computed(() => (authStore.availableUserCoupons || []).length)

const wishlistCount = computed(() => {
  const ids = currentUser.value.wishlist || []
  return (productStore.products || []).filter(p => ids.includes(p.id)).length
})

const profileTabs = computed(() => [
  { id: 'orders', label: '我的訂單與進度', icon: ShoppingBag, badge: userOrdersCount.value },
  { id: 'coupons', label: '我的優惠券錢包', icon: Ticket, badge: availableCouponsCount.value },
  { id: 'profile', label: '會員資料與生日', icon: User, badge: 0 },
  { id: 'wishlist', label: '愛心收藏清單', icon: Heart, badge: wishlistCount.value },
  { id: 'addresses', label: '常用收件地址', icon: MapPin, badge: 0 }
])
</script>

<style scoped>
.profile-page-container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 16px 14px 48px;
}

@media (min-width: 768px) {
  .profile-page-container {
    padding: 32px 24px 64px;
  }
}

.profile-card {
  background-color: #ffffff;
  border: 1px solid #e8e2da;
  border-radius: 16px;
  padding: 18px 16px;
  box-shadow: 0 2px 10px rgba(45, 38, 33, 0.03);
}

.profile-tabs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 10px;
  border-bottom: 1px solid #e8e2da;
  -webkit-overflow-scrolling: touch;
}

.profile-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid #e4ddd3;
  background-color: #ffffff;
  color: #595959;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.profile-tab-btn.is-active {
  background-color: #2d2621;
  border-color: #2d2621;
  color: #ffffff;
}

.tab-badge {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 999px;
  background-color: #f0ece6;
  color: #2d2621;
}

.profile-tab-btn.is-active .tab-badge {
  background-color: #ffffff;
  color: #2d2621;
}
</style>