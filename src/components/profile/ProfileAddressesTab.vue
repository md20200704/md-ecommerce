<template>
  <div class="d-flex flex-column gap-3 w-100">
    <!-- 外層容器：確保手機與桌機皆有安全的左右內距，絕不貼邊 -->
    <div class="profile-card p-4 p-md-5 mx-2 mx-sm-0 w-100 box-sizing-border">
      
      <!-- 標頭列 -->
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2.5 mb-4 pb-3 border-bottom">
        <div>
          <h2 class="fs-6 fw-bold text-dark mb-0">常用收件地址管理</h2>
          <p class="text-muted small mb-0 mt-1" style="font-size: 12px;">管理您的常用收件地址，結帳時可快速選取</p>
        </div>
        <button
          type="button"
          class="btn btn-outline-dark btn-sm rounded-pill px-3 py-1.5 font-monospace"
          style="font-size: 11.5px;"
          @click="showAddressForm = !showAddressForm"
        >
          {{ showAddressForm ? '取消新增' : '+ 新增收件地址' }}
        </button>
      </div>

      <!-- 新增地址表單 -->
      <form v-if="showAddressForm" @submit.prevent="handleAddAddress" class="p-4 bg-light rounded-4 border mb-4 row g-3 small w-100 m-0 box-sizing-border">
        <div class="col-12 mb-1 px-0">
          <span class="font-monospace fw-bold text-dark" style="font-size: 13px;">填寫新地址資訊</span>
        </div>
        <div class="col-12 col-sm-6 px-1 px-sm-2">
          <label class="form-label text-secondary mb-1.5" style="font-size: 11.5px;">收件人姓名 *</label>
          <input v-model="newAddressForm.recipientName" required type="text" class="form-control form-control-sm py-2" placeholder="例如：陳哲偉" />
        </div>
        <div class="col-12 col-sm-6 px-1 px-sm-2">
          <label class="form-label text-secondary mb-1.5" style="font-size: 11.5px;">聯絡手機 *</label>
          <input v-model="newAddressForm.phone" required type="tel" class="form-control form-control-sm font-monospace py-2" placeholder="例如：0912345678" />
        </div>
        <div class="col-6 col-sm-4 px-1 px-sm-2">
          <label class="form-label text-secondary mb-1.5" style="font-size: 11.5px;">縣市 *</label>
          <input v-model="newAddressForm.city" required type="text" class="form-control form-control-sm py-2" placeholder="例如：台北市" />
        </div>
        <div class="col-6 col-sm-4 px-1 px-sm-2">
          <label class="form-label text-secondary mb-1.5" style="font-size: 11.5px;">行政區 *</label>
          <input v-model="newAddressForm.district" required type="text" class="form-control form-control-sm py-2" placeholder="例如：中正區" />
        </div>
        <div class="col-12 col-sm-4 px-1 px-sm-2">
          <label class="form-label text-secondary mb-1.5" style="font-size: 11.5px;">詳細街道門牌 *</label>
          <input v-model="newAddressForm.detail" required type="text" class="form-control form-control-sm py-2" placeholder="例如：忠孝西路一段 100 號" />
        </div>
        <div class="col-12 text-end pt-2 px-0">
          <button type="submit" class="btn btn-dark btn-sm rounded-pill px-4 py-2 font-monospace w-100 w-sm-auto fw-bold">
            儲存此地址
          </button>
        </div>
      </form>

      <!-- 已儲存地址清單 (排版寬鬆、層次分明) -->
      <div class="d-flex flex-column gap-3.5 w-100">
        <div
          v-for="addr in (currentUser.savedAddresses || [])"
          :key="addr.id"
          class="address-item-card p-4 rounded-4 border bg-white w-100 box-sizing-border"
          :class="{ 'is-default': addr.isDefault }"
        >
          <!-- 地址詳細資訊區 (多行結構，絕不擠在一起) -->
          <div class="small min-w-0 flex-grow-1 w-100">
            
            <!-- 第一行：姓名、手機、預設標籤 -->
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2.5">
              <div class="d-flex align-items-center gap-2.5 flex-wrap">
                <strong class="text-dark" style="font-size: 16px;">{{ addr.recipientName }}</strong>
                <span class="font-monospace text-muted" style="font-size: 13.5px;">{{ addr.phone }}</span>
              </div>

              <span
                v-if="addr.isDefault"
                class="badge bg-dark text-white rounded-pill font-monospace"
                style="font-size: 10.5px; padding: 4px 10px;"
              >
                預設地址
              </span>
            </div>

            <!-- 第二行：帶有清晰空格的完整門牌地址 -->
            <div class="text-secondary mb-3" style="font-size: 14px; line-height: 1.6;">
              {{ addr.city }} {{ addr.district }} {{ addr.detail }}
            </div>

            <!-- 第三行：底部操作按鈕列（設為預設、刪除） -->
            <div class="address-actions-row">
              <button
                v-if="!addr.isDefault"
                type="button"
                class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 font-monospace"
                style="font-size: 11.5px;"
                @click="setDefaultAddress(addr.id)"
              >
                設為預設地址
              </button>
              <button
                type="button"
                class="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 font-monospace"
                style="font-size: 11.5px;"
                @click="authStore.removeAddress(addr.id)"
              >
                刪除
              </button>
            </div>

          </div>
        </div>

        <div v-if="!(currentUser.savedAddresses || []).length" class="text-center py-5 text-muted small font-monospace">
          目前尚無儲存的收件地址。
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
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

// 設為預設地址
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
  width: 100%;
  box-sizing: border-box;
}

.box-sizing-border {
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .profile-card {
    padding: 32px 36px;
  }
}

.address-item-card {
  display: flex;
  flex-direction: column;
  border-color: #e8e2da !important;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.address-item-card:hover {
  border-color: #c8bfb5 !important;
}

.address-item-card.is-default {
  border-color: #2d2621 !important;
  background-color: #fcfaf7 !important;
  box-shadow: 0 4px 16px rgba(45, 38, 33, 0.04);
}

.address-actions-row {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
  padding-top: 12px;
  border-top: 1px dashed #eee8df;
  width: 100%;
  box-sizing: border-box;
}
</style>