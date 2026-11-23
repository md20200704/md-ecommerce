<template>
  <Teleport to="body">
    <Transition name="md-return-fade">
      <div
        v-if="isOpen"
        class="md-return-backdrop"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        @click.self="closeModal"
      >
        <div class="md-return-dialog">
          <!-- 標頭 -->
          <div class="md-return-header">
            <div>
              <span class="md-return-eyebrow font-monospace">AFTER-SALES RETURN REQUEST</span>
              <h3 class="md-return-title font-serif">申請商品退貨與售後服務</h3>
            </div>
            <button type="button" class="md-return-close" aria-label="關閉" @click="closeModal">
              ×
            </button>
          </div>

          <!-- 內容 -->
          <div class="md-return-body small">
            <!-- 訂單摘要卡片 -->
            <div class="md-return-summary font-monospace">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-bold text-dark">申請退貨訂單：#{{ order?.orderId || order?.id }}</span>
                <span class="md-return-amount">NT$ {{ orderPaidAmount.toLocaleString() }}</span>
              </div>
              <div class="text-muted" style="font-size: 11px;">
                收件人：{{ order?.recipientName || order?.customerName }} · 共 {{ (order?.items || []).length }} 項商品
              </div>
            </div>

            <!-- 退貨表單 -->
            <form @submit.prevent="submitReturn" class="d-flex flex-column gap-3">
              <!-- 退貨原因分類 -->
              <div>
                <label class="form-label text-dark fw-semibold mb-1">退貨原因分類 *</label>
                <select v-model="returnReasonType" class="form-select form-select-sm md-return-input" required>
                  <option value="尺寸不合 / 版型不符">尺寸不合 / 版型不符</option>
                  <option value="商品與實品有落差 / 色差">商品與實品有落差 / 色差</option>
                  <option value="收到商品有瑕疵 / 破損">收到商品有瑕疵 / 破損 (需拍照上傳)</option>
                  <option value="收到錯誤商品 / 漏寄">收到錯誤商品 / 漏寄</option>
                  <option value="其他個人因素">其他個人因素</option>
                </select>
              </div>

              <!-- 詳細說明 -->
              <div>
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="form-label text-dark fw-semibold mb-0">退貨詳細說明與狀況描述 *</label>
                  <span class="text-muted font-monospace" style="font-size: 11px;">{{ detailReason.length }}/300 字</span>
                </div>
                <textarea
                  v-model="detailReason"
                  required
                  rows="3"
                  maxlength="300"
                  class="form-control form-control-sm md-return-input"
                  placeholder="請簡述需要退貨的原因（例如：平常穿 M 號這件偏緊，想申請退貨...）"
                ></textarea>
              </div>

              <!-- 上傳瑕疵或商品照片（最多 3 張） -->
              <div>
                <div class="d-flex justify-content-between align-items-center mb-1.5">
                  <label class="form-label text-dark fw-semibold mb-0">上傳商品狀況照片（最多 3 張）</label>
                  <span class="text-muted font-monospace" style="font-size: 11px;">{{ uploadedImages.length }}/3</span>
                </div>

                <div class="d-flex flex-wrap gap-2">
                  <div
                    v-for="(img, idx) in uploadedImages"
                    :key="idx"
                    class="position-relative rounded-3 overflow-hidden border bg-white"
                    style="width: 72px; height: 72px; border-color: #e3dbd0 !important;"
                  >
                    <img :src="img" class="w-100 h-100 object-fit-cover" />
                    <button
                      type="button"
                      class="position-absolute top-0 end-0 btn btn-dark p-0 rounded-circle d-flex align-items-center justify-content-center m-1"
                      style="width: 18px; height: 18px; opacity: 0.85; font-size: 10px;"
                      @click="removeImage(idx)"
                    >
                      ✕
                    </button>
                  </div>

                  <label
                    v-if="uploadedImages.length < 3"
                    class="md-return-upload-box cursor-pointer"
                  >
                    <span style="font-size: 18px; line-height: 1;">+</span>
                    <span style="font-size: 10px;" class="mt-1 font-monospace">上傳照片</span>
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

              <!-- 提示文字 -->
              <div class="md-return-notice font-monospace">
                💡 提醒：送出申請後，客服與後台將於 1-2 個工作天內審核，並派發黑貓宅配前往原收件地址取回退貨商品。
              </div>

              <!-- 按鈕 -->
              <div class="d-flex gap-2 pt-1">
                <button
                  type="button"
                  class="btn md-return-btn-cancel rounded-pill py-2.5 px-4 font-monospace fw-semibold"
                  @click="closeModal"
                >
                  取消
                </button>
                <button
                  type="submit"
                  class="btn btn-dark flex-grow-1 rounded-pill py-2.5 fw-bold font-monospace shadow-xs"
                  :disabled="!detailReason.trim() || isSubmitting"
                >
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
                  確認送出退貨申請
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
import { ref, computed } from 'vue'
import { showToast } from '../../composables/useToast'

const props = defineProps({
  isOpen: Boolean,
  order: Object
})

const emit = defineEmits(['close', 'submitted'])

const returnReasonType = ref('尺寸不合 / 版型不符')
const detailReason = ref('')
const uploadedImages = ref([])
const isSubmitting = ref(false)

const orderPaidAmount = computed(() => {
  if (!props.order) return 0
  const sub = Number(props.order.subtotal || 0)
  const disc = Number(props.order.couponDiscount || 0) + Number(props.order.pointsUsed || 0)
  const ship = Number(props.order.shippingFee || (props.order.shippingMethod === 'CVS' ? 60 : 100))
  return Number(props.order.totalAmount || props.order.amount || Math.max(0, sub - disc) + ship)
})

const handleFileUpload = (e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  const remaining = 3 - uploadedImages.value.length
  files.slice(0, remaining).forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      showToast(`檔案「${file.name}」超過 5MB 上限！`, 'warning', '檔案過大')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      if (uploadedImages.value.length < 3) {
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
  detailReason.value = ''
  uploadedImages.value = []
  returnReasonType.value = '尺寸不合 / 版型不符'
  emit('close')
}

const submitReturn = () => {
  if (!detailReason.value.trim()) return
  isSubmitting.value = true

  setTimeout(() => {
    isSubmitting.value = false
    const fullReason = `[${returnReasonType.value}] ${detailReason.value.trim()}`
    emit('submitted', {
      reason: fullReason,
      images: [...uploadedImages.value]
    })
    closeModal()
  }, 300)
}
</script>

<style scoped>
.md-return-backdrop {
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

.md-return-dialog {
  width: 100%;
  max-width: 500px;
  background: #faf8f5;
  border: 1px solid #e3dbd0;
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 20px 48px rgba(45, 38, 33, 0.18);
  color: #2d2621;
}

.md-return-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid #ebe4da;
}

.md-return-eyebrow {
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

.md-return-title {
  font-size: 16px;
  font-weight: 700;
  color: #2d2621;
  margin: 0;
}

.md-return-close {
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

.md-return-close:hover {
  background: #e2d9cc;
  color: #2d2621;
}

.md-return-summary {
  background: #ffffff;
  border: 1px solid #e6dfd5;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 14px;
  font-size: 12px;
}

.md-return-amount {
  color: #9b7e68;
  font-weight: 700;
}

.md-return-input {
  background-color: #ffffff !important;
  border-color: #dfd7cc !important;
  border-radius: 12px !important;
}

.md-return-upload-box {
  width: 72px;
  height: 72px;
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

.md-return-upload-box:hover {
  background: #f3eee7;
  border-color: #9b7e68;
  color: #2d2621;
}

.md-return-notice {
  background: #f6efe3;
  border: 1px solid #ead9bc;
  color: #7a5419;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 11px;
  line-height: 1.55;
}

.md-return-btn-cancel {
  background: #efeae2;
  color: #4a4139;
  border: 0;
  font-size: 12px;
}

.md-return-btn-cancel:hover {
  background: #e3dbd0;
  color: #2d2621;
}

.cursor-pointer {
  cursor: pointer;
}

.md-return-fade-enter-active,
.md-return-fade-leave-active {
  transition: opacity 0.2s ease;
}

.md-return-fade-enter-from,
.md-return-fade-leave-to {
  opacity: 0;
}
</style>