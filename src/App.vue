<template>
  <div class="app-root d-flex flex-column min-vh-100 bg-cream">
    <AppToast />
    <AppConfirmModal />

    <Navbar v-if="!isAdminRoute" @open-auth="showAuthModal = true" />

    <div class="flex-grow-1" :class="{ 'pb-mobile-nav': !isAdminRoute }">
      <router-view @open-auth="showAuthModal = true" />
    </div>

    <footer
      v-if="!isAdminRoute"
      class="bg-white border-top py-4 px-3 text-center text-muted small font-monospace"
      :class="{ 'mb-5 pb-4 d-lg-block': !isAdminRoute }"
    >
      <div class="container">
        <div class="d-flex justify-content-center flex-wrap gap-3 mb-2">
          <router-link to="/policy/returns" class="text-decoration-none text-secondary">退換貨說明</router-link>
          <span class="text-muted">·</span>
          <router-link to="/policy/privacy" class="text-decoration-none text-secondary">隱私權政策</router-link>
          <span class="text-muted">·</span>
          <router-link to="/policy/shopping" class="text-decoration-none text-secondary">購物須知</router-link>
        </div>
        <div class="fw-bold text-dark font-serif mb-1" style="letter-spacing: 0.08em;">M & D SELECT</div>
        <div style="font-size: 11px;">KOREAN MINIMALIST ARCHIVE · ALL RIGHTS RESERVED.</div>
      </div>
    </footer>

    <CartDrawer />
    <AuthModal :is-open="showAuthModal" @close="showAuthModal = false" />
    <CustomerServiceWidget v-if="!isAdminRoute" />
    <BottomNav v-if="!isAdminRoute" class="d-lg-none" />
    <Analytics />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'
import Navbar from './components/Navbar.vue'
import CartDrawer from './components/CartDrawer.vue'
import AuthModal from './components/AuthModal.vue'
import BottomNav from './components/BottomNav.vue'
import CustomerServiceWidget from './components/CustomerServiceWidget.vue'
import AppToast from './components/AppToast.vue'
import AppConfirmModal from './components/AppConfirmModal.vue'
import { showToast } from './composables/useToast'
import { useMarketingStore } from './stores/marketingStore'
import { useProductStore } from './stores/productStore'
import { useAuthStore } from './stores/authStore'
import { useCartStore } from './stores/cartStore'
import { useAdminStore } from './stores/adminStore'
import { useChatStore } from './stores/chatStore'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const showAuthModal = ref(false)

const marketingStore = useMarketingStore()
const productStore = useProductStore()
const authStore = useAuthStore()
const cartStore = useCartStore()
const adminStore = useAdminStore()
const chatStore = useChatStore()

let hasSyncedAuthData = false

const syncAuthenticatedData = async () => {
  if (hasSyncedAuthData) return
  hasSyncedAuthData = true

  await cartStore.fetchCart()

  const backgroundTasks = [
    adminStore.fetchOrders(),
    chatStore.fetchThreads()
  ]

  if (authStore.isAdmin) {
    backgroundTasks.push(authStore.fetchMemberList(), adminStore.fetchLogs())
  }

  Promise.allSettled(backgroundTasks)
  chatStore.startPolling()
}

onMounted(async () => {
  window.alert = (msg) => {
    const text = String(msg ?? '')
    const isError = /失敗|錯誤|不足|封鎖|受限|權限不足|請先|請輸入|請選擇|請填寫|請勾選|請上傳|超過|未達|無效|已過期/.test(text)
    const isSuccess = /成功|歡迎|已儲存|已建立|已更新|已上架|已發送|已送出|已完成|已加入|已核准|已標記/.test(text)
    showToast(text, isError ? 'error' : isSuccess ? 'success' : 'info')
  }

  // 若本地已有快取登入態，立即開始背景同步購物車與訂單，不等待商品 API
  if (authStore.isLoggedIn) {
    syncAuthenticatedData()
  }

  const [, , restored] = await Promise.all([
    marketingStore.fetchMarketingConfig(),
    productStore.fetchProducts(),
    authStore.initSession()
  ])

  if (restored) {
    await syncAuthenticatedData()
  }
})

watch(() => authStore.isLoggedIn, async (loggedIn) => {
  if (loggedIn) {
    await syncAuthenticatedData()
  } else {
    hasSyncedAuthData = false
    cartStore.items = []
    chatStore.resetChatState()
    adminStore.orders = []
  }
})

onUnmounted(() => {
  chatStore.stopPolling()
})
</script>

<style>
.bg-cream {
  background-color: #faf8f5;
}

@media (max-width: 991.98px) {
  .pb-mobile-nav {
    padding-bottom: 72px;
  }
}
</style>