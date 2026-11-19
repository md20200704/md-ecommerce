<template>
  <div class="app-root d-flex flex-column min-vh-100 bg-cream">
    <!-- 前台頂部導覽列（進入後台路由時自動隱藏，由 AdminLayout 接管） -->
    <Navbar v-if="!isAdminRoute" @open-auth="showAuthModal = true" />

    <!-- 主路由視圖區（手機版預留底部導覽列高度） -->
    <div class="flex-grow-1" :class="{ 'pb-mobile-nav': !isAdminRoute }">
      <router-view @open-auth="showAuthModal = true" />
    </div>

    <!-- 前台極簡頁尾 -->
    <footer v-if="!isAdminRoute" class="bg-white border-top py-4 px-3 text-center text-muted small font-monospace" :class="{ 'mb-5 pb-4 d-lg-block': !isAdminRoute }">
      <div class="container">
        <div class="fw-bold text-dark font-serif mb-1" style="letter-spacing: 0.08em;">MD.SELECT</div>
        <div style="font-size: 11px;">KOREAN MINIMALIST ARCHIVE · ALL RIGHTS RESERVED.</div>
      </div>
    </footer>

    <!-- 全域側邊購物袋抽屜 -->
    <CartDrawer />

    <!-- 全域會員登入/註冊彈窗 -->
    <AuthModal :is-open="showAuthModal" @close="showAuthModal = false" />

    <!-- 全域懸浮線上客服 Widget (僅前台顯示) -->
    <CustomerServiceWidget v-if="!isAdminRoute" />

    <!-- 手機版專屬底部固定導覽列（桌機版自動隱藏） -->
    <BottomNav v-if="!isAdminRoute" class="d-lg-none" />

    <!-- Vercel Web Analytics 網站流量分析 -->
    <Analytics />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'
import Navbar from './components/Navbar.vue'
import CartDrawer from './components/CartDrawer.vue'
import AuthModal from './components/AuthModal.vue'
import BottomNav from './components/BottomNav.vue'
import CustomerServiceWidget from './components/CustomerServiceWidget.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const showAuthModal = ref(false)
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