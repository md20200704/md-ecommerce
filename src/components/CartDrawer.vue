<template>
  <div v-if="cartStore.isOpen" class="position-fixed top-0 start-0 w-100 h-100" style="z-index: 1080;">
    <!-- 背景遮罩 -->
    <div class="position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-50" @click="cartStore.closeDrawer()"></div>

    <!-- 右側抽屜主體 -->
    <div class="position-absolute top-0 end-0 h-100 bg-white shadow-xl d-flex flex-column" style="width: 100%; max-width: 440px; z-index: 1081;">
      
      <!-- 頂部標題與關閉按鈕 -->
      <div class="p-4 border-bottom d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
          <h2 class="h5 fw-bold text-dark font-serif mb-0">購物袋</h2>
          <span class="badge bg-light text-dark border rounded-pill font-monospace" style="font-size: 11px;">
            已選 {{ cartStore.totalCount }} 件
          </span>
        </div>

        <button type="button" class="btn-close" @click="cartStore.closeDrawer()"></button>
      </div>

      <!-- 全選操作列 -->
      <div v-if="cartStore.items.length > 0" class="px-4 py-3 bg-light border-bottom d-flex justify-content-between align-items-center small">
        <div class="form-check m-0 d-flex align-items-center gap-2">
          <input
            type="checkbox"
            class="form-check-input"
            id="selectAllCart"
            v-model="allSelectedProxy"
            style="cursor: pointer; width: 18px; height: 18px;"
          />
          <label class="form-check-label fw-bold text-dark" for="selectAllCart" style="cursor: pointer;">
            全選所有商品
          </label>
        </div>
        <span class="text-muted font-monospace" style="font-size: 11px;">
          勾選後將列入結帳計算
        </span>
      </div>

      <!-- 購物車商品列表 -->
      <div class="flex-grow-1 overflow-y-auto p-4 d-flex flex-column gap-3">
        <div v-if="cartStore.items.length > 0" class="d-flex flex-column gap-3">
          <div
            v-for="item in cartStore.items"
            :key="item.cartItemId"
            class="p-3 rounded-4 border bg-white d-flex align-items-center gap-3 transition cart-item-card"
            :class="{ 'is-selected': item.selected }"
          >
            <!-- 勾選框 -->
            <div class="form-check m-0">
              <input
                type="checkbox"
                class="form-check-input"
                v-model="item.selected"
                style="cursor: pointer; width: 18px; height: 18px;"
              />
            </div>

            <!-- 商品圖 -->
            <div class="rounded-3 overflow-hidden border flex-shrink-0" style="width: 56px; height: 70px; background-color: #f5f2ed;">
              <img :src="item.image" class="w-100 h-100 object-fit-cover" />
            </div>

            <!-- 商品資訊（即時對應後台商品售價） -->
            <div class="flex-grow-1 min-w-0">
              <div class="fw-bold text-dark text-truncate small mb-1">{{ item.name }}</div>
              <div class="text-muted font-monospace mb-2" style="font-size: 11px;">
                規格：{{ item.color }} / {{ item.size }}
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="font-monospace fw-bold text-dark" style="font-size: 14px;">
                  NT$ {{ (cartStore.getLiveUnitPrice(item) * item.quantity).toLocaleString() }}
                </span>

                <!-- 數量增減 -->
                <div class="d-flex align-items-center gap-2 border rounded-pill px-2.5 py-1 bg-light">
                  <button type="button" class="btn btn-link p-0 text-dark text-decoration-none fw-bold" style="font-size: 13px;" @click="decreaseQty(item)">-</button>
                  <span class="font-monospace small px-1 fw-bold">{{ item.quantity }}</span>
                  <button type="button" class="btn btn-link p-0 text-dark text-decoration-none fw-bold" style="font-size: 13px;" @click="increaseQty(item)">+</button>
                </div>
              </div>
            </div>

            <!-- 刪除按鈕 -->
            <button type="button" class="btn btn-link text-muted p-1 text-decoration-none" style="font-size: 18px;" @click="cartStore.removeItem(item.cartItemId)">
              ×
            </button>
          </div>
        </div>

        <div v-else class="text-center py-5 text-muted small my-auto">
          購物袋內尚無任何商品。
        </div>
      </div>

      <!-- 底部結算區 -->
      <div v-if="cartStore.items.length > 0" class="p-4 border-top bg-light">
        <div class="d-flex justify-content-between align-items-center mb-3 font-monospace">
          <span class="text-secondary small">已選商品總計 ({{ cartStore.totalCount }} 件)</span>
          <strong class="fs-5 fw-bold text-dark">NT$ {{ cartStore.totalPrice.toLocaleString() }}</strong>
        </div>

        <button
          type="button"
          class="btn btn-dark w-100 rounded-pill py-3 fw-bold shadow-2xs"
          :disabled="cartStore.selectedItems.length === 0"
          @click="goToCheckout"
        >
          {{ cartStore.selectedItems.length === 0 ? '請至少勾選一項商品' : '前往結帳 (已選 ' + cartStore.totalCount + ' 件)' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'

const router = useRouter()
const cartStore = useCartStore()

const allSelectedProxy = computed({
  get: () => cartStore.isAllSelected,
  set: (val) => cartStore.toggleSelectAll(val)
})

const decreaseQty = (item) => {
  if (item.quantity > 1) {
    item.quantity--
  }
}

const increaseQty = (item) => {
  item.quantity++
}

const goToCheckout = () => {
  if (cartStore.selectedItems.length === 0) {
    alert('請勾選要結帳的商品！')
    return
  }
  cartStore.closeDrawer()
  router.push('/checkout')
}
</script>

<style scoped>
.cart-item-card {
  border-color: #e8e2da !important;
  transition: all 0.2s ease;
}

.cart-item-card:hover {
  border-color: #c8bfb5 !important;
}

.cart-item-card.is-selected {
  border-color: #2d2621 !important;
  background-color: #fcfaf7 !important;
}
</style>