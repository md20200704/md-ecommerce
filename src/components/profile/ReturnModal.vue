<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="modal fade show d-block modal-backdrop-custom"
      tabindex="-1"
      style="z-index: 1070;"
    >
      <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
        <div class="modal-content rounded-4 border-0 p-4 shadow-xl bg-white">
          
          <!-- 標頭 -->
          <div class="modal-header border-0 pb-1">
            <div>
              <span class="badge bg-secondary-subtle text-secondary font-monospace mb-1" style="font-size: 10px;">
                AFTER-SALES RETURN REQUEST
              </span>
              <h3 class="modal-title fs-6 fw-bold text-dark font-serif">申請商品退貨與售後服務</h3>
            </div>
            <button type="button" class="btn-close" @click="closeModal" aria-label="關閉"></button>
          </div>

          <!-- 內容 -->
          <div class="modal-body small px-1 py-2">
            <!-- 訂單簡易摘要 -->
            <div class="bg-light p-3 rounded-3 mb-3 font-monospace">
              <div class="d-flex justify-content-between text-dark fw-bold mb-1">
                <span>申請退貨訂單：#{{ order?.orderId || order?.id }}</span>
                <span class="text-primary">NT$ {{ orderPaidAmount.toLocaleString() }}</span>
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
                <select v-model="returnReasonType" class="form-select form-select-sm rounded-3" required>
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
                  class="form-control form-control-sm rounded-3"
                  placeholder="請簡述需要退貨的原因（例如：平常穿M號這件偏緊，想申請退貨...）"
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
                    class="position-relative rounded-3 overflow-hidden border"
                    style="width: 72px; height: 72px;"
                  >
                    <img :src="img" class="w-100 h-100 object-fit-cover" />
                    <button
                      type="button"
                      class="position-absolute top-0 end-0 btn btn-dark p-0 rounded-circle d-flex align-items-center justify-content-center m-1"
                      style="width: 18px; height: 18px; opacity: 0.8; font-size: 10px;"
                      @click="removeImage(idx)"
                    >
                      ✕
                    </button>
                  </div>

                  <label
                    v-if="uploadedImages.length < 3"
                    class="d-flex flex-column align-items-center justify-content-center border border-dashed rounded-3 bg-light text-muted cursor-pointer hover-bg"
                    style="width: 72px; height: 72px;"
                  >
                    <span style="font-size: 18px; line-height: 1;">+</span>
                    <span style="font-size: 10px;" class="mt-1">上傳照片</span>
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
              <div class="p-2.5 rounded-3 bg-warning-subtle text-warning-emphasis small font-monospace" style="font-size: 11px;">
                💡 提醒：送出申請後，客服與後台將於 1-2 個工作天內審核，並派發黑貓宅配前往原收件地址取回退貨商品。
              </div>

              <!-- 按鈕 -->
              <div class="pt-1">
                <button
                  type="submit"
                  class="btn btn-dark w-100 rounded-pill py-2.5 fw-bold font-monospace shadow-xs"
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
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'

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
      alert(`檔案「${file.name}」超過 5MB 上限！`)
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
.hover-bg:hover {
  background-color: #ede8e1 !important;
}
.cursor-pointer {
  cursor: pointer;
}
</style>