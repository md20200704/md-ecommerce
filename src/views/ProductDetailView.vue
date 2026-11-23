<template>
  <div v-if="product" class="container py-4 py-md-5" style="max-width: 1140px;">
    <nav class="small text-muted mb-4" aria-label="breadcrumb">
      <ol class="breadcrumb mb-0">
        <li class="breadcrumb-item"><router-link to="/" class="text-decoration-none text-muted">首頁</router-link></li>
        <li class="breadcrumb-item">
          <router-link :to="{ path: '/category', query: { cat: product.category } }" class="text-decoration-none text-muted">
            {{ product.category }}
          </router-link>
        </li>
        <li v-if="product.subcategory" class="breadcrumb-item">
          <router-link :to="{ path: '/category', query: { cat: product.category, sub: product.subcategory } }" class="text-decoration-none text-muted">
            {{ product.subcategory }}
          </router-link>
        </li>
        <li class="breadcrumb-item active text-dark fw-semibold" aria-current="page">{{ product.name }}</li>
      </ol>
    </nav>

    <div class="row g-4 g-lg-5 mb-5">
      <div class="col-12 col-md-6">
        <div class="d-flex flex-column gap-3">
          <div
            class="position-relative overflow-hidden rounded-4 bg-light cursor-zoom-in shadow-xs"
            style="aspect-ratio: 3/4;"
            @click="openLightbox"
          >
            <img :src="currentImage" :alt="product.name" class="w-100 h-100 object-fit-cover transition" />
            <div
              class="position-absolute bottom-0 end-0 m-3 p-2 bg-dark text-white rounded-circle opacity-75 d-flex align-items-center justify-content-center"
              style="width: 36px; height: 36px;"
              title="點擊放大檢視"
            >
              <Maximize2 style="width: 16px; height: 16px;" />
            </div>
            <span v-if="product.tag" class="position-absolute top-0 start-0 m-3 badge bg-dark opacity-75 font-monospace text-uppercase" style="font-size: 10px;">
              {{ product.tag }}
            </span>
          </div>

          <div class="d-flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              v-for="(img, idx) in allImages"
              :key="idx"
              type="button"
              class="p-0 border rounded-3 overflow-hidden bg-light flex-shrink-0 transition"
              :class="{ 'border-primary ring-2': currentImage === img }"
              style="width: 72px; aspect-ratio: 3/4; cursor: pointer;"
              @click="currentImage = img"
            >
              <img :src="img" class="w-100 h-100 object-fit-cover" />
            </button>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6 d-flex flex-column">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="text-uppercase small fw-bold" style="color: var(--md-primary); font-size: 11px; letter-spacing: 0.1em;">
            {{ product.category }}<span v-if="product.subcategory"> · {{ product.subcategory }}</span>
          </span>
          <span class="small text-muted font-monospace">已售出 {{ product.salesCount || 0 }} 件</span>
        </div>

        <h1 class="h4 fw-bold text-dark mb-2" style="font-family: serif; letter-spacing: 0.03em;">
          {{ product.name }}
        </h1>

        <div class="d-flex align-items-baseline gap-2 mb-4">
          <span class="fs-4 fw-bold font-monospace" style="color: var(--md-primary);">
            NT$ {{ activePrice.toLocaleString() }}
          </span>
        </div>

        <div v-if="product.descriptionHtml" class="small text-secondary mb-3" v-html="product.descriptionHtml"></div>
        <p v-else class="text-secondary small leading-relaxed mb-4">{{ product.description }}</p>
        <hr class="border-stone-200 my-2" />

        <div class="mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="small fw-semibold text-dark">選擇顏色：<strong class="text-primary">{{ selectedColor }}</strong></span>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <button
              v-for="color in availableColors"
              :key="color"
              type="button"
              class="btn btn-sm rounded-pill px-3 py-1.5 small text-nowrap"
              :class="selectedColor === color ? 'btn-dark shadow-xs' : 'btn-outline-secondary'"
              @click="selectedColor = color"
            >
              {{ color }}
            </button>
          </div>
        </div>

        <div class="mb-4">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="small fw-semibold text-dark">選擇尺寸：<strong class="text-primary">{{ selectedSize }}</strong></span>
            <span class="small font-monospace" :class="isOutOfStock ? 'text-danger fw-bold' : 'text-muted'">
              {{ isOutOfStock ? '● 該規格已斷貨售完' : `剩餘庫存：${currentSku?.stock || 0} 件` }}
            </span>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <button
              v-for="size in availableSizes"
              :key="size"
              type="button"
              class="btn btn-sm rounded-3 px-3 py-1.5 small"
              :class="selectedSize === size ? 'btn-dark' : 'btn-outline-secondary'"
              @click="selectedSize = size"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <div class="mb-4" v-if="!isOutOfStock">
          <label class="small fw-semibold text-dark mb-2 d-block">選購數量：</label>
          <div class="d-inline-flex align-items-center border rounded-pill bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              class="btn btn-light border-0 rounded-0 px-3 py-1.5 fw-bold text-dark"
              :disabled="quantity <= 1"
              @click="quantity = Math.max(1, quantity - 1)"
            >
              −
            </button>
            <span
              class="font-monospace fw-bold text-dark text-center select-none px-3 py-1.5"
              style="min-width: 52px; font-size: 14px;"
            >
              {{ quantity }}
            </span>
            <button
              type="button"
              class="btn btn-light border-0 rounded-0 px-3 py-1.5 fw-bold text-dark"
              :disabled="currentSku && quantity >= currentSku.stock"
              @click="quantity = currentSku ? Math.min(currentSku.stock, quantity + 1) : quantity + 1"
            >
              +
            </button>
          </div>
        </div>

        <div class="d-flex gap-3 mb-4">
          <button
            v-if="!isOutOfStock"
            type="button"
            class="btn btn-dark flex-grow-1 rounded-pill py-3 fw-bold tracking-wider text-uppercase d-flex align-items-center justify-content-center gap-2 shadow-sm"
            @click="handleAddToCart"
          >
            <ShoppingBag style="width: 18px; height: 18px;" />
            <span>加入購物袋 (NT$ {{ (activePrice * quantity).toLocaleString() }})</span>
          </button>

          <button
            v-else
            type="button"
            class="btn btn-outline-danger flex-grow-1 rounded-pill py-3 fw-bold tracking-wider d-flex align-items-center justify-content-center gap-2 shadow-sm"
            @click="openRestockModal"
          >
            <Bell style="width: 18px; height: 18px;" />
            <span>缺貨中 · 貨到通知我</span>
          </button>

          <button
            @click="handleWishlistToggle"
            class="btn btn-outline-secondary rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0"
            style="width: 50px; height: 50px;"
            :title="authStore.isInWishlist(product.id) ? '從願望清單移除' : '加入願望清單'"
          >
            <Heart
              style="width: 20px; height: 20px;"
              :class="{ 'text-danger': authStore.isInWishlist(product.id) }"
              :fill="authStore.isInWishlist(product.id) ? 'currentColor' : 'none'"
            />
          </button>
        </div>

        <div class="card-korean p-3 small text-muted mb-4 bg-light">
          <div class="d-flex align-items-center gap-2 mb-1">
            <Truck style="width: 16px; height: 16px; color: var(--md-primary);" />
            <span>全館滿 <strong>NT$ 1,500</strong> 享免運</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <CheckCircle2 style="width: 16px; height: 16px;" class="text-success" />
            <span>首爾正韓原裝直送 · 7 天安心鑑賞期</span>
          </div>
        </div>
      </div>
    </div>

    <section class="mt-5 pt-4 border-top">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 class="h5 fw-bold text-dark font-serif mb-1">CUSTOMER REVIEWS</h2>
          <p class="small text-muted mb-0">來自已購買顧客的真實評價與實穿實拍</p>
        </div>

        <div>
          <button
            v-if="canReviewCurrentProduct"
            type="button"
            class="btn btn-dark btn-sm rounded-pill px-3 py-1.5 fw-bold font-monospace"
            @click="showReviewModal = true"
          >
            ★ 撰寫我的評價與曬圖
          </button>
          <span v-else class="text-muted small" style="font-size: 11px;">
            ※ 僅限完成訂單送達之顧客留評
          </span>
        </div>
      </div>

      <div class="card-korean p-4 bg-white shadow-xs mb-4">
        <div class="row g-4 align-items-center">
          <div class="col-12 col-md-4 text-center border-end-md">
            <div class="display-5 fw-bold font-monospace text-dark">{{ ratingSummary.average }}</div>
            <div class="d-flex justify-content-center text-warning mb-1">
              <Star
                v-for="s in 5"
                :key="s"
                style="width: 18px; height: 18px;"
                :fill="ratingSummary.average >= s ? '#ffc107' : 'none'"
              />
            </div>
            <div class="small text-muted font-monospace">共 {{ ratingSummary.count }} 則評價</div>
          </div>

          <div class="col-12 col-md-8">
            <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="d-flex align-items-center gap-2 mb-1 small">
              <span class="text-muted font-monospace" style="width: 32px;">{{ star }} 星</span>
              <div class="progress flex-grow-1" style="height: 6px;">
                <div
                  class="progress-bar bg-warning"
                  role="progressbar"
                  :style="{ width: `${ratingSummary.count > 0 ? (ratingSummary.breakdown[star] / ratingSummary.count) * 100 : 0}%` }"
                ></div>
              </div>
              <span class="text-muted font-monospace" style="width: 25px; font-size: 11px;">
                {{ ratingSummary.breakdown[star] }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="productReviews.length === 0" class="card-korean text-center py-5 text-muted bg-white">
        <MessageSquare style="width: 38px; height: 38px;" class="mb-2 opacity-30" />
        <div class="small">此商品目前尚無評價，歡迎完成購買之會員留下第一則心得！</div>
      </div>

      <div v-else class="d-flex flex-column gap-3">
        <div
          v-for="rev in productReviews"
          :key="rev.id"
          class="card-korean p-4 bg-white shadow-xs"
        >
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="fw-bold text-dark">{{ rev.userName }}</span>
                <span class="badge rounded-pill bg-success-subtle text-success font-monospace" style="font-size: 10px;">
                  ✓ 已認證購買者
                </span>
              </div>
              <div class="d-flex text-warning">
                <Star
                  v-for="s in 5"
                  :key="s"
                  style="width: 14px; height: 14px;"
                  :fill="rev.rating >= s ? '#ffc107' : 'none'"
                />
              </div>
            </div>
            <span class="text-muted font-monospace small" style="font-size: 11px;">{{ rev.createdAt }}</span>
          </div>

          <p class="text-secondary small mb-3 leading-relaxed">{{ rev.content }}</p>

          <div v-if="rev.images && rev.images.length > 0" class="d-flex gap-2 flex-wrap">
            <img
              v-for="(img, iIdx) in rev.images"
              :key="iIdx"
              :src="img"
              class="rounded-3 object-fit-cover border cursor-pointer hover-zoom"
              style="width: 76px; height: 76px;"
              @click="previewImage(img)"
            />
          </div>
        </div>
      </div>
    </section>

    <ReviewModal
      :is-open="showReviewModal"
      :product-id="product.id"
      :product="product"
      :order-id="eligibleOrderId"
      @close="showReviewModal = false"
      @submitted="onReviewSubmitted"
    />

    <!-- 美化版：補貨登記彈窗與燈箱 -->
    <Teleport to="body">
      <Transition name="md-restock-fade">
        <div
          v-if="showRestockModal"
          class="md-restock-backdrop"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          @click.self="showRestockModal = false"
        >
          <div class="md-restock-dialog">
            <div class="md-restock-header">
              <div>
                <span class="md-restock-eyebrow font-monospace">RESTOCK ALERT</span>
                <h3 class="md-restock-title font-serif d-flex align-items-center gap-2">
                  <Bell style="width: 16px; height: 16px; color: #9b7e68;" />
                  <span>登記補貨提醒通知</span>
                </h3>
              </div>
              <button type="button" class="md-restock-close" aria-label="關閉" @click="showRestockModal = false">
                ×
              </button>
            </div>

            <div class="small">
              <div class="md-restock-summary font-monospace mb-3">
                <div class="fw-bold text-dark mb-1">{{ product.name }}</div>
                <div class="text-muted" style="font-size: 11px;">
                  預約規格：<span style="color: #9b7e68;" class="fw-bold">{{ currentSku?.color }} / {{ currentSku?.size }}</span>
                </div>
              </div>

              <form @submit.prevent="submitRestockAlert" class="d-flex flex-column gap-3">
                <div>
                  <label class="form-label text-dark fw-semibold mb-1">通知信箱 Email *</label>
                  <input
                    v-model="restockForm.email"
                    required
                    type="email"
                    class="form-control form-control-sm font-monospace md-restock-input"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label class="form-label text-dark fw-semibold mb-1">通知手機 SMS (選填)</label>
                  <input
                    v-model="restockForm.phone"
                    type="tel"
                    pattern="^09\d{8}$"
                    class="form-control form-control-sm font-monospace md-restock-input"
                    placeholder="0912345678"
                  />
                </div>
                <div class="d-flex gap-2 pt-1">
                  <button
                    type="button"
                    class="btn md-restock-btn-cancel rounded-pill py-2.5 px-4 font-monospace fw-semibold"
                    @click="showRestockModal = false"
                  >
                    取消
                  </button>
                  <button type="submit" class="btn btn-dark flex-grow-1 rounded-pill py-2.5 fw-bold font-monospace shadow-xs">
                    確認登記補貨提醒
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>

      <div
        v-if="lightboxImg || showLightbox"
        class="md-lightbox-backdrop"
        @click="lightboxImg = null; showLightbox = false;"
      >
        <img :src="lightboxImg || currentImage" class="rounded-4 shadow-lg object-fit-contain" style="max-width: 90vw; max-height: 85vh;" @click.stop />
        <button
          type="button"
          class="btn btn-light rounded-pill px-3.5 py-1.5 font-monospace fw-bold position-fixed top-0 end-0 m-4 shadow-sm"
          style="font-size: 12px;"
          @click="lightboxImg = null; showLightbox = false;"
        >
          ✕ 關閉預覽
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ShoppingBag, Heart, Maximize2, Truck, CheckCircle2, Bell, Star, MessageSquare } from 'lucide-vue-next'
import ReviewModal from '../components/ReviewModal.vue'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { useAdminStore } from '../stores/adminStore'
import { showToast } from '../composables/useToast'

const route = useRoute()
const productStore = useProductStore()
const cartStore = useCartStore()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const product = computed(() => productStore.getProductById(route.params.id))
const productReviews = computed(() => productStore.getProductReviews(route.params.id))
const ratingSummary = computed(() => productStore.getProductRatingSummary(route.params.id))

const allImages = computed(() => {
  if (!product.value) return []
  return product.value.images && product.value.images.length > 0 ? product.value.images : [product.value.image]
})

const currentImage = ref('')
const showLightbox = ref(false)
const showReviewModal = ref(false)
const showRestockModal = ref(false)
const lightboxImg = ref(null)

const selectedColor = ref('')
const selectedSize = ref('')
const quantity = ref(1)

const restockForm = reactive({
  email: '',
  phone: ''
})

const availableColors = computed(() => [...new Set((product.value?.skus || []).map((s) => s.color))])
const availableSizes = computed(() => [...new Set((product.value?.skus || []).map((s) => s.size))])

const currentSku = computed(() => {
  return product.value?.skus.find((s) => s.color === selectedColor.value && s.size === selectedSize.value)
})

watch(currentSku, (sku) => {
  if (!sku || sku.stock <= 0) {
    quantity.value = 1
  } else if (quantity.value > sku.stock) {
    quantity.value = sku.stock
  }
})

const activePrice = computed(() => Number(product.value?.price ?? product.value?.basePrice ?? 0))
const isOutOfStock = computed(() => !currentSku.value || currentSku.value.stock <= 0)

const eligibleOrder = computed(() => {
  if (!authStore.user?.isLoggedIn) return null
  return (adminStore.orders || []).find((o) => {
    const isCompleted = (o.shippingStatus || o.status) === 'DELIVERED' || o.status === '已完成'
    const containsProduct = (o.items || []).some((item) => item.name.includes(product.value?.name))
    return isCompleted && containsProduct
  })
})

const canReviewCurrentProduct = computed(() => !!eligibleOrder.value)
const eligibleOrderId = computed(() => eligibleOrder.value?.id || eligibleOrder.value?.orderId || 'ORD-VERIFIED')

const previewImage = (img) => { lightboxImg.value = img }
const openLightbox = () => { showLightbox.value = true }
const onReviewSubmitted = () => { showReviewModal.value = false }

const initDefaults = () => {
  if (product.value) {
    quantity.value = 1
    currentImage.value = allImages.value[0] || product.value.image
    const defaultSku = (product.value.skus || []).find((s) => s.stock > 0) || (product.value.skus || [])[0]
    if (defaultSku) {
      selectedColor.value = defaultSku.color
      selectedSize.value = defaultSku.size
    }
  }
}

watch(() => route.params.id, () => initDefaults())
onMounted(() => initDefaults())

const handleWishlistToggle = () => {
  if (product.value && typeof authStore.toggleWishlist === 'function') {
    const res = authStore.toggleWishlist(product.value.id)
    if (!res?.message) return

    if (res.requiresLogin || res.success === false) {
      showToast(res.message, 'warning', '請先登入')
      return
    }

    showToast(
      res.message,
      res.added ? 'success' : 'info',
      res.added ? '已加入收藏' : '已移除收藏'
    )
  }
}

const openRestockModal = () => {
  if (!authStore.user?.isLoggedIn) {
    showToast('請先登入會員以登記補貨提醒！', 'warning', '請先登入')
    return
  }
  restockForm.email = authStore.user.email || ''
  restockForm.phone = authStore.user.phone || ''
  showRestockModal.value = true
}

const submitRestockAlert = async () => {
  const res = await authStore.registerRestockAlert(product.value, currentSku.value, restockForm)
  showToast(res.message, res.success ? 'success' : 'error', res.success ? '登記成功' : '登記失敗')
  if (res.success) showRestockModal.value = false
}

const handleAddToCart = () => {
  if (!currentSku.value || isOutOfStock.value) return
  cartStore.addItem(product.value, selectedColor.value, selectedSize.value, quantity.value)
}
</script>

<style scoped>
.cursor-zoom-in { cursor: zoom-in; }
.ring-2 { outline: 2px solid var(--md-primary); }
.hover-zoom:hover { transform: scale(1.05); }
.cursor-pointer { cursor: pointer; }
.select-none { user-select: none; }

.md-restock-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1065;
  background: rgba(34, 29, 25, 0.48);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.md-restock-dialog {
  width: 100%;
  max-width: 440px;
  background: #faf8f5;
  border: 1px solid #e3dbd0;
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 20px 48px rgba(45, 38, 33, 0.18);
  color: #2d2621;
}

.md-restock-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid #ebe4da;
}

.md-restock-eyebrow {
  display: inline-block;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: #8c735b;
  background: #f2ece3;
  border: 1px solid #e3dbd0;
  border-radius: 999px;
  padding: 2px 10px;
  margin-bottom: 6px;
}

.md-restock-title {
  font-size: 16px;
  font-weight: 700;
  color: #2d2621;
  margin: 0;
}

.md-restock-close {
  border: 0;
  background: #efeae2;
  color: #5c5249;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.md-restock-close:hover {
  background: #e2d9cc;
  color: #2d2621;
}

.md-restock-summary {
  background: #ffffff;
  border: 1px solid #e6dfd5;
  border-radius: 14px;
  padding: 12px 14px;
}

.md-restock-input {
  background-color: #ffffff !important;
  border-color: #dfd7cc !important;
  border-radius: 12px !important;
}

.md-restock-btn-cancel {
  background: #efeae2;
  color: #4a4139;
  border: 0;
  font-size: 12px;
}

.md-restock-btn-cancel:hover {
  background: #e3dbd0;
  color: #2d2621;
}

.md-lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 17, 15, 0.84);
  backdrop-filter: blur(4px);
  z-index: 1080;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.md-restock-fade-enter-active,
.md-restock-fade-leave-active {
  transition: opacity 0.2s ease;
}

.md-restock-fade-enter-from,
.md-restock-fade-leave-to {
  opacity: 0;
}
</style>