<template>
  <div>
    <div v-if="wishlistProducts.length > 0" class="row g-3 g-md-4">
      <div v-for="prod in wishlistProducts" :key="prod.id" class="col-6 col-md-4 col-lg-3">
        <ProductCard :product="prod" />
      </div>
    </div>
    <div v-else class="profile-card text-center py-5 text-muted small">
      尚未收藏任何商品，點擊商品卡片右上角的愛心即可加入收藏！
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ProductCard from '../ProductCard.vue'
import { useAuthStore } from '../../stores/authStore'
import { useProductStore } from '../../stores/productStore'

const authStore = useAuthStore()
const productStore = useProductStore()

const wishlistProducts = computed(() => {
  const ids = authStore.user?.wishlist || []
  return (productStore.products || []).filter(p => ids.includes(p.id))
})
</script>

<style scoped>
.profile-card {
  background-color: #ffffff;
  border: 1px solid #e8e2da;
  border-radius: 16px;
  padding: 18px 16px;
  box-shadow: 0 2px 10px rgba(45, 38, 33, 0.03);
}
</style>