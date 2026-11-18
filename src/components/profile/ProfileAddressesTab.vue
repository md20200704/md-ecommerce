<template>
  <div class="d-flex flex-column gap-4">
    <div class="profile-card p-4 p-md-5">
      
      <!-- 標頭列：寬鬆留白與縮小的新增按鈕 -->
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-3 border-bottom">
        <div>
          <div class="d-flex align-items-center gap-2.5 flex-wrap">
            <h2 class="fs-5 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <MapPin style="width: 18px; height: 18px;" class="text-primary flex-shrink-0" />
              <span>常用收件地址管理</span>
            </h2>
            <span class="badge bg-light text-dark border rounded-pill font-monospace px-2.5 py-1" style="font-size: 11px;">
              {{ (currentUser.savedAddresses || []).length }} 個地址
            </span>
          </div>
          <p class="text-muted small mb-0 mt-1.5" style="font-size: 13px;">管理您的常用收件地址，結帳時可一鍵快速帶入</p>
        </div>

        <!-- 縮小精緻的新增按鈕 -->
        <button
          type="button"
          class="btn btn-outline-dark btn-sm rounded-pill px-3 py-1 font-monospace fw-semibold shadow-2xs"
          style="font-size: 11.5px;"
          @click="showAddressForm = !showAddressForm"
        >
          {{ showAddressForm ? '✕ 取消新增' : '+ 新增地址' }}
        </button>
      </div>

      <!-- 新增地址展開表單 (寬鬆留白) -->
      <form
        v-if="showAddressForm"
        @submit.prevent="handleAddAddress"
        class="address-form-box p-3.5 p-md-4 rounded-4 border mb-4 row g-3 small"
      >
        <div class="col-12 mb-1">
          <span class="font-monospace fw-bold text-dark" style="font-size: 13px;">填寫新收件地址資訊</span>
        </div>

        <div class="col-12 col-sm-6">
          <label class="form-label text-secondary small mb-1.5">收件人姓名 *</label>
          <input v-model="newAddressForm.recipientName" required type="text" class="form-control form-control-sm py-2" placeholder="例如：陳哲偉" />
        </div>

        <div class="col-12 col-sm-6">
          <label class="form-label text-secondary small mb-1.5">聯絡手機 *</label>
          <input v-model="newAddressForm.phone" required type="tel" class="form-control form-control-sm font-monospace py-2" placeholder="例如：0912345678" />
        </div>

        <div class="col-6 col-sm-4">
          <label class="form-label text-secondary small mb-1.5">縣市 *</label>
          <input v-model="newAddressForm.city" required type="text" class="form-control form-control-sm py-2" placeholder="例如：台北市" />
        </div>

        <div class="col-6 col-sm-4">
          <label class="form-label text-secondary small mb-1.5">行政區 *</label>
          <input v-model="newAddressForm.district" required type="text" class="form-control form-control-sm py-2" placeholder="例如：中正區" />
        </div>

        <div class="col-12 col-sm-4">
          <label class="form-label text-secondary small mb-1.5">詳細街道門牌 *</label>
          <input v-model="newAddressForm.detail" required type="text" class="form-control form-control-sm py-2" placeholder="例如：忠孝西路一段 100 號" />
        </div>

        <div class="col-12 pt-2 text-end">
          <button type="submit" class="btn btn-dark btn-sm rounded-pill px-4 py-2 font-monospace fw-bold shadow-2xs">
            確認儲存地址
          </button>
        </div>
      </form>

      <!-- 已儲存地址清單 (寬鬆卡片留白) -->
      <div v-if="(currentUser.savedAddresses || []).length > 0" class="d-flex flex-column gap-3.5">
        <div
          v-for="addr in currentUser.savedAddresses"
          :key="addr.id"
          class="address-item-card p-3.5 p-md-4 rounded-4 border bg-white"
          :class="{ 'is-default': addr.isDefault }"
        >
          <div class="small min-w-0 flex-grow-1">
            <div class="d-flex align-items-center flex-wrap gap-2.5 mb-1.5">
              <strong class="text-dark fs-6">{{ addr.recipientName }}</strong>
              <span class="font-monospace text-muted">{{ addr.phone }}</span>
              
              <span
                v-if="addr.isDefault"
                class="badge bg-dark text-white rounded-pill font-monospace px-2.5 py-1"
                style="font-size: 10px;"
              >
                預設地址
              </span>
            </div>

            <div class="text-secondary" style="font-size: 13.5px; line-height: 1.5;">
              {{ addr.city }}{{ addr.district }}{{ addr.detail }}
            </div>
          </div>

          <div class="address-actions-group">
            <button
              v-if="!addr.isDefault"
              type="button"
              class="address-btn-sub font-monospace"
              @click="setDefaultAddress(addr.id)"
            >
              設為預設
            </button>
            <button
              type="button"
              class="address-btn-danger font-monospace"
              @click="authStore.removeAddress(addr.id)"
            >
              刪除
            </button>
          </div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div v-else class="text-center py-5 text-muted small font-monospace">
        <MapPin class="mb-2 opacity-25" style="width: 40px; height: 40px;" />
        <div>目前尚無儲存的收件地址，點擊上方「+ 新增地址」開始建立！</div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { MapPin } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user || {})

const showAddressForm = ref(false)
const newAddressForm = reactive({
  recipientName: '',
  phone: '',
  city: '台北市',
  district: '',
  detail: ''
})

const handleAddAddress = () => {
  if (!newAddressForm.recipientName || !newAddressForm.phone || !newAddressForm.city || !newAddressForm.district || !newAddressForm.detail) {
    alert('請完整填寫所有必填欄位！')
    return
  }

  const isFirst = (currentUser.value.savedAddresses || []).length === 0

  if (authStore.addAddress) {
    authStore.addAddress({
      type: 'HOME',
      recipientName: newAddressForm.recipientName.trim(),
      phone: newAddressForm.phone.trim(),
      city: newAddressForm.city.trim(),
      district: newAddressForm.district.trim(),
      detail: newAddressForm.detail.trim(),
      isDefault: isFirst
    })
  }

  newAddressForm.recipientName = ''
  newAddressForm.phone = ''
  newAddressForm.district = ''
  newAddressForm.detail = ''
  showAddressForm.value = false
  alert('新收件地址已成功儲存！')
}

const setDefaultAddress = (addressId) => {
  if (currentUser.value.savedAddresses) {
    currentUser.value.savedAddresses.forEach(a => {
      a.isDefault = (a.id === addressId)
    })
    alert('已成功切換預設收件地址！')
  }
}
</script>

<style scoped>
.profile-card {
  background-color: #ffffff;
  border: 1px solid #e8e2da;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(45, 38, 33, 0.03);
}

.address-form-box {
  background-color: #faf8f5 !important;
  border: 1px solid #e6dfd5 !important;
}

.address-item-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.2s ease;
}

@media (min-width: 576px) {
  .address-item-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }
}

.address-item-card:hover {
  border-color: #c8bfb5;
}

.address-item-card.is-default {
  border-color: #2d2621;
  background-color: #fcfaf7 !important;
  box-shadow: 0 4px 16px rgba(45, 38, 33, 0.04);
}

.address-actions-group {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px dashed #eee8df;
}

@media (min-width: 576px) {
  .address-actions-group {
    padding-top: 0;
    border-top: none;
    flex-shrink: 0;
  }
}

.address-btn-sub {
  background: transparent;
  border: 1px solid #c8bfb5;
  color: #595959;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.address-btn-sub:hover {
  background-color: #2d2621;
  color: #ffffff;
  border-color: #2d2621;
}

.address-btn-danger {
  background: transparent;
  border: 1px solid #ffa39e;
  color: #cf1322;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.address-btn-danger:hover {
  background-color: #cf1322;
  color: #ffffff;
  border-color: #cf1322;
}
</style>