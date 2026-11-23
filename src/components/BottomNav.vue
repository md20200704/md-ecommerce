<template>
  <nav class="bottom-nav-fixed d-lg-none bg-white border-top shadow-lg">
    <div class="d-flex align-items-center justify-content-around py-2 px-1">
      <router-link
        to="/"
        class="bottom-nav-item text-decoration-none d-flex flex-column align-items-center gap-1"
        :class="route.path === '/' ? 'text-dark fw-bold' : 'text-muted'"
      >
        <Home style="width: 19px; height: 19px;" />
        <span style="font-size: 10.5px;">首頁</span>
      </router-link>

      <button
        type="button"
        class="btn btn-link bottom-nav-item text-decoration-none d-flex flex-column align-items-center gap-1 p-0"
        :class="route.path.startsWith('/category') ? 'text-dark fw-bold' : 'text-muted'"
        @click="openCategoryPicker"
      >
        <Grid style="width: 19px; height: 19px;" />
        <span style="font-size: 10.5px;">分類選購</span>
      </button>

      <button
        type="button"
        class="btn btn-link bottom-nav-item text-decoration-none d-flex flex-column align-items-center gap-1 p-0 position-relative text-muted"
        @click="openCartDrawer"
      >
        <ShoppingBag style="width: 19px; height: 19px;" class="text-dark" />
        <span class="text-dark" style="font-size: 10.5px;">購物袋</span>
        <span
          v-if="cartStore.totalBagCount > 0"
          class="position-absolute top-0 start-50 translate-middle-y badge rounded-pill bg-dark text-white font-monospace"
          style="font-size: 9.5px; padding: 2px 5px; margin-left: 6px; margin-top: -2px;"
        >
          {{ cartStore.totalBagCount }}
        </span>
      </button>

      <router-link
        to="/profile"
        class="bottom-nav-item text-decoration-none d-flex flex-column align-items-center gap-1"
        :class="route.path.startsWith('/profile') ? 'text-dark fw-bold' : 'text-muted'"
      >
        <User style="width: 19px; height: 19px;" />
        <span style="font-size: 10.5px;">會員中心</span>
      </router-link>

      <router-link
        v-if="authStore.isAdmin"
        to="/admin"
        class="bottom-nav-item text-decoration-none d-flex flex-column align-items-center gap-1"
        :class="route.path.startsWith('/admin') ? 'text-dark fw-bold' : 'text-muted'"
      >
        <Settings style="width: 19px; height: 19px;" />
        <span style="font-size: 10.5px;">後台管理</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { Home, Grid, ShoppingBag, User, Settings } from 'lucide-vue-next'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

const openCategoryPicker = () => {
  router.push({
    path: '/category',
    query: {
      ...route.query,
      openPicker: '1'
    }
  })
}

const openCartDrawer = () => {
  if (typeof cartStore.openDrawer === 'function') {
    cartStore.openDrawer()
  } else {
    cartStore.isOpen = true
  }
}
</script>

<style scoped>
.bottom-nav-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1030;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.bottom-nav-item {
  min-width: 56px;
  transition: color 0.15s ease;
}
</style>