<template>
  <Teleport to="body">
    <Transition name="md-review-fade">
      <div
        v-if="isOpen"
        class="md-review-backdrop"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        @click.self="closeModal"
      >
        <div class="md-review-dialog">
          <!-- 標頭 -->
          <div class="md-review-header">
            <div>
              <span class="md-review-eyebrow font-monospace">VERIFIED PURCHASE REVIEW</span>
              <h3 class="md-review-title font-serif">商品評價與穿搭曬圖</h3>
            </div>
            <button type="button" class="md-review-close" aria-label="關閉" @click="closeModal">
              ×
            </button>
          </div>

          <div class="small">
            <!-- 商品資訊卡 -->
            <div class="md-review-product-box d-flex align-items-center gap-3 mb-3">
              <img
                :src="item?.image || product?.image"
                class="rounded-3 object-fit-cover border"
                style="width: 50px; height: 66px; border-color: #e3dbd0 !important;"
              />
              <div class="min-w-0">
                <div class="fw-bold text-dark text-truncate">{{ product?.name || item?.name }}</div>
                <div class="text-muted font-monospace mt-0.5" style="font-size: 11px;">
                  訂單編號：#{{ orderId }}
                </div>
              </div>
            </div>

            <form @submit.prevent="submitReview" class="d-flex flex-column gap-3">
              <!-- 星等評分 -->
              <div>
                <label class="form-label text-dark fw-semibold mb-1">
                  總體評分 *：<span style="color: #9b7e68;" class="fw-bold">{{ ratingTexts[hoverRating || currentRating] }}</span>
                </label>
                <div class="d-flex align-items-center gap-1.5 py-1">
                  <button
                    v-for="star in 5"
                    :key="star"
                    type="button"
                    class="btn btn-link p-0 text-decoration-none border-0"
                    @mouseenter="hoverRating = star"
                    @mouseleave="hoverRating = 0"
                    @click="currentRating = star"
                  >
                    <Star
                      style="width: 26px; height: 26px; cursor: pointer; transition: transform 0.15s ease;"
                      :class="(hoverRating || currentRating) >= star ? 'text-warning' : 'text-secondary opacity-25'"
                      :fill="(hoverRating || currentRating) >= star ? '#e0a82e' : 'none'"
                    />
                  </button>
                  <span class="ms-2 font-monospace fw-bold fs-6 text-dark">{{ hoverRating || currentRating }}.0</span>
                </div>
              </div>

              <!-- 心得描述 -->
              <div>
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="form-label text-dark fw-semibold mb-0">心得描述 *</label>
                  <span class="text-muted font-monospace" style="font-size: 11px;">{{ content.length }}/300 字</span>
                </div>
                <textarea
                  v-model="content"
                  required
                  rows="3"
                  maxlength="300"
                  class="form-control form-control-sm md-review-input"
                  placeholder="穿起來的版型、材質觸感如何？分享給其他喜愛韓系穿搭的朋友吧！"
                ></textarea>
              </div>

              <!-- 實穿曬圖 -->
              <div>
                <div class="d-flex justify-content-between align-items-center mb-1.5">
                  <label class="form-label text-dark fw-semibold mb-0">實穿曬圖（最多 5 張）</label>
                  <span class="text-muted font-monospace" style="font-size: 11px;">{{ uploadedImages.length }}/5</span>
                </div>

                <div class="d-flex flex-wrap gap-2">
                  <div
                    v-for="(img, idx) in uploadedImages"
                    :key="idx"
                    class="position-relative rounded-3 overflow-hidden border bg-white"
                    style="width: 68px; height: 68px; border-color: #e3dbd0 !important;"
                  >
                    <img :src="img" class="w-100 h-100 object-fit-cover" />
                    <button
                      type="button"
                      class="position-absolute top-0 end-0 btn btn-dark p-0 rounded-circle d-flex align-items-center justify-content-center m-1"
                      style="width: 18px; height: 18px; opacity: 0.85;"
                      @click="removeImage(idx)"
                    >
                      <X style="width: 12px; height: 12px;" />
                    </button>
                  </div>

                  <label
                    v-if="uploadedImages.length < 5"
                    class="md-review-upload-box cursor-pointer"
                  >
                    <Camera style="width: 20px; height: 20px;" class="mb-1" />
                    <span style="font-size: 9.5px;" class="font-monospace">+上傳</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      class="d-none"
                      @change="handleFileUpload"
                    />
                  </label>
                </div>
              </div>

              <!-- 按鈕 -->
              <div class="d-flex gap-2 pt-2">
                <button
                  type="button"
                  class="btn md-review-btn-cancel rounded-pill py-2.5 px-4 font-monospace fw-semibold"
                  @click="closeModal"
                >
                  取消
                </button>
                <button
                  type="submit"
                  class="btn btn-dark flex-grow-1 rounded-pill py-2.5 fw-bold font-monospace shadow-xs"
                  :disabled="!content.trim() || isSubmitting"
                >
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
                  送出真實商品評價
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { Star, Camera, X } from 'lucide-vue-next'
import { useProductStore } from '../stores/productStore'
import { useAuthStore } from '../stores/authStore'
import { showToast } from '../composables/useToast'

const props = defineProps({
  isOpen: Boolean,
  orderId: String,
  productId: Number,
  product: Object,
  item: Object
})

const emit = defineEmits(['close', 'submitted'])

const productStore = useProductStore()
const authStore = useAuthStore()

const currentRating = ref(5)
const hoverRating = ref(0)
const content = ref('')
const uploadedImages = ref([])
const isSubmitting = ref(false)

const ratingTexts = {
  1: '非常不滿意',
  2: '不太理想',
  3: '符合預期',
  4: '滿意推薦',
  5: '非常完美！值得回購'
}

const handleFileUpload = (e) => {
  const files = Array.from(e.target.files)
  if (!files.length) return
  const remainingSlots = 5 - uploadedImages.value.length
  const selectedFiles = files.slice(0, remainingSlots)

  selectedFiles.forEach((file) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast(`檔案「${file.name}」超過 5MB 上限！`, 'warning', '檔案過大')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      if (uploadedImages.value.length < 5) {
        uploadedImages.value.push(event.target.result)
      }
    }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

const removeImage = (idx) => {
  uploadedImages.value.splice(idx, 1)
}

const closeModal = () => {
  content.value = ''
  uploadedImages.value = []
  currentRating.value = 5
  emit('close')
}

const submitReview = () => {
  if (!content.value.trim()) return
  isSubmitting.value = true
  const res = productStore.addReview({
    productId: props.productId || props.product?.id,
    orderId: props.orderId,
    userName: authStore.user?.name || '會員',
    userPhone: authStore.user?.phone || '',
    rating: currentRating.value,
    content: content.value,
    images: uploadedImages.value
  })
  isSubmitting.value = false
  showToast(res.message, res.success !== false ? 'success' : 'error', '評價通知')
  emit('submitted')
  closeModal()
}
</script>

<style scoped>
.md-review-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1070;
  background: rgba(34, 29, 25, 0.48);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  overflow-y: auto;
}

.md-review-dialog {
  width: 100%;
  max-width: 500px;
  background: #faf8f5;
  border: 1px solid #e3dbd0;
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 20px 48px rgba(45, 38, 33, 0.18);
  color: #2d2621;
}

.md-review-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid #ebe4da;
}

.md-review-eyebrow {
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

.md-review-title {
  font-size: 16px;
  font-weight: 700;
  color: #2d2621;
  margin: 0;
}

.md-review-close {
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

.md-review-close:hover {
  background: #e2d9cc;
  color: #2d2621;
}

.md-review-product-box {
  background: #ffffff;
  border: 1px solid #e6dfd5;
  border-radius: 14px;
  padding: 10px 12px;
}

.md-review-input {
  background-color: #ffffff !important;
  border-color: #dfd7cc !important;
  border-radius: 12px !important;
}

.md-review-upload-box {
  width: 68px;
  height: 68px;
  border-radius: 12px;
  border: 1.5px dashed #cfc5b8;
  background: #ffffff;
  color: #7c7268;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.md-review-upload-box:hover {
  background: #f3eee7;
  border-color: #9b7e68;
  color: #2d2621;
}

.md-review-btn-cancel {
  background: #efeae2;
  color: #4a4139;
  border: 0;
  font-size: 12px;
}

.md-review-btn-cancel:hover {
  background: #e3dbd0;
  color: #2d2621;
}

.cursor-pointer {
  cursor: pointer;
}

.md-review-fade-enter-active,
.md-review-fade-leave-active {
  transition: opacity 0.2s ease;
}

.md-review-fade-enter-from,
.md-review-fade-leave-to {
  opacity: 0;
}
</style>