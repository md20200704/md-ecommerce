<template>
  <div class="app-root d-flex flex-column min-vh-100 bg-cream">
    <Navbar v-if="!isAdminRoute" @open-auth="showAuthModal = true" />

    <div class="flex-grow-1" :class="{ 'pb-mobile-nav': !isAdminRoute }">
      <router-view @open-auth="showAuthModal = true" />
    </div>

    <footer v-if="!isAdminRoute" class="bg-white border-top py-4 px-3 text-center text-muted small font-monospace" :class="{ 'mb-5 pb-4 d-lg-block': !isAdminRoute }">
      <div class="container">
        <div class="fw-bold text-dark font-serif mb-1" style="letter-spacing: 0.08em;">MD.SELECT</div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'
import Navbar from './components/Navbar.vue'
import CartDrawer from './components/CartDrawer.vue'
import AuthModal from './components/AuthModal.vue'
import BottomNav from './components/BottomNav.vue'
import CustomerServiceWidget from './components/CustomerServiceWidget.vue'
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

const syncAuthenticatedData = async () => {
  await Promise.all([
    cartStore.fetchCart(),
    adminStore.fetchOrders(),
    chatStore.fetchThreads()
  ])
  if (authStore.isAdmin) {
    await Promise.all([authStore.fetchMemberList(), adminStore.fetchLogs()])
  }
}

onMounted(async () => {
  await Promise.all([
    marketingStore.fetchMarketingConfig(),
    productStore.fetchProducts()
  ])
  const restored = await authStore.initSession()
  if (restored) {
    await syncAuthenticatedData()
  }
})

watch(() => authStore.isLoggedIn, async (loggedIn) => {
  if (loggedIn) await syncAuthenticatedData()
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