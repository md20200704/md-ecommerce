<template>
  <Teleport to="body">
    <div v-if="cartStore.isOpen" class="position-fixed top-0 start-0 w-100 h-100" style="z-index: 1090;">
      <div class="position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-50" @click="cartStore.closeDrawer()"></div>

      <div class="position-absolute top-0 end-0 h-100 bg-white shadow-xl d-flex flex-column" style="width: 100%; max-width: 440px; z-index: 1091;">

        <div class="p-4 border-bottom d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <h2 class="h5 fw-bold text-dark font-serif mb-0">購物袋</h2>
            <span class="badge bg-light text-dark border rounded-pill font-monospace" style="font-size: 11px;">
              共 {{ cartStore.totalBagCount }} 件 · 已選 {{ cartStore.totalCount }} 件
            </span>
          </div>

          <button type="button" class="btn-close" @click="cartStore.closeDrawer()"></button>
        </div>

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

        <div class="flex-grow-1 overflow-y-auto p-4 d-flex flex-column gap-3">
          <div v-if="cartStore.items.length > 0" class="d-flex flex-column gap-3">
            <div
              v-for="item in cartStore.items"
              :key="item.cartItemId"
              class="p-3 rounded-4 border bg-white d-flex align-items-center gap-3 transition cart-item-card"
              :class="{ 'is-selected': item.selected }"
            >
              <div class="form-check m-0">
                <input
                  type="checkbox"
                  class="form-check-input"
                  v-model="item.selected"
                  style="cursor: pointer; width: 18px; height: 18px;"
                  @change="onToggleItem(item)"
                />
              </div>

              <div class="rounded-3 overflow-hidden border flex-shrink-0" style="width: 56px; height: 70px; background-color: #f5f2ed;">
                <img :src="item.image" class="w-100 h-100 object-fit-cover" />
              </div>

              <div class="flex-grow-1 min-w-0">
                <div class="fw-bold text-dark text-truncate small mb-1">{{ item.name }}</div>
                <div class="text-muted font-monospace mb-2" style="font-size: 11px;">
                  規格：{{ item.color }} / {{ item.size }}
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="font-monospace fw-bold text-dark" style="font-size: 14px;">
                    NT$ {{ (cartStore.getLiveUnitPrice(item) * item.quantity).toLocaleString() }}
                  </span>

                  <div class="d-flex align-items-center gap-2 border rounded-pill px-2.5 py-1 bg-light">
                    <button type="button" class="btn btn-link p-0 text-dark text-decoration-none fw-bold" style="font-size: 13px;" @click="decreaseQty(item)">-</button>
                    <span class="font-monospace small px-1 fw-bold">{{ item.quantity }}</span>
                    <button type="button" class="btn btn-link p-0 text-dark text-decoration-none fw-bold" style="font-size: 13px;" @click="increaseQty(item)">+</button>
                  </div>
                </div>
              </div>

              <button type="button" class="btn btn-link text-muted p-1 text-decoration-none" style="font-size: 18px;" @click="cartStore.removeItem(item.cartItemId)">
                ×
              </button>
            </div>
          </div>

          <div v-else class="text-center py-5 text-muted small my-auto">
            購物袋內尚無任何商品。
          </div>
        </div>

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
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { apiRequest, getAuthToken } from '../services/apiClient'
import { showToast } from '../composables/useToast'

const CHECKOUT_DRAFT_KEY = 'md_checkout_form_draft_v1'

const router = useRouter()
const cartStore = useCartStore()

const allSelectedProxy = computed({
  get: () => cartStore.isAllSelected,
  set: (val) => cartStore.toggleSelectAll(val)
})

const syncItemQuantity = (item) => {
  if (getAuthToken()) {
    apiRequest('/api/cart', {
      method: 'PUT',
      body: JSON.stringify({ cartItemId: item.cartItemId, quantity: item.quantity })
    }).catch(err => console.error('更新購物袋數量同步失敗:', err))
  }
}

const decreaseQty = (item) => {
  if (item.quantity > 1) {
    item.quantity--
    syncItemQuantity(item)
  }
}

const increaseQty = (item) => {
  item.quantity++
  syncItemQuantity(item)
}

const onToggleItem = (item) => {
  if (getAuthToken()) {
    apiRequest('/api/cart', {
      method: 'PUT',
      body: JSON.stringify({ cartItemId: item.cartItemId, selected: item.selected })
    }).catch(err => console.error('更新勾選狀態同步失敗:', err))
  }
}

const goToCheckout = () => {
  if (cartStore.selectedItems.length === 0) {
    showToast('請先勾選要結帳的商品！', 'warning', '尚未勾選商品')
    return
  }
  try {
    sessionStorage.removeItem(CHECKOUT_DRAFT_KEY)
  } catch {
    // ignore storage error
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