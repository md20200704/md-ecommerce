<template>
  <div class="d-flex flex-column gap-3">
    <div class="profile-card">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
        <h2 class="fs-6 fw-bold text-dark mb-0">常用收件地址管理</h2>
        <button
          type="button"
          class="btn btn-outline-dark btn-sm rounded-pill px-3 font-monospace"
          style="font-size: 11px;"
          @click="showAddressForm = !showAddressForm"
        >
          {{ showAddressForm ? '取消新增' : '+ 新增收件地址' }}
        </button>
      </div>

      <form v-if="showAddressForm" @submit.prevent="handleAddAddress" class="p-3 bg-light rounded-3 border mb-3 row g-2.5 small">
        <div class="col-12 col-sm-6">
          <input v-model="newAddressForm.recipientName" required type="text" class="form-control form-control-sm" placeholder="收件人姓名 *" />
        </div>
        <div class="col-12 col-sm-6">
          <input v-model="newAddressForm.phone" required type="tel" class="form-control form-control-sm font-monospace" placeholder="聯絡手機 *" />
        </div>
        <div class="col-6 col-sm-4">
          <input v-model="newAddressForm.city" required type="text" class="form-control form-control-sm" placeholder="縣市" />
        </div>
        <div class="col-6 col-sm-4">
          <input v-model="newAddressForm.district" required type="text" class="form-control form-control-sm" placeholder="行政區" />
        </div>
        <div class="col-12 col-sm-4">
          <input v-model="newAddressForm.detail" required type="text" class="form-control form-control-sm" placeholder="詳細街道門牌 *" />
        </div>
        <div class="col-12 text-end">
          <button type="submit" class="btn btn-dark btn-sm rounded-pill px-4 py-1.5 font-monospace w-100 w-sm-auto">
            儲存此地址
          </button>
        </div>
      </form>

      <div class="d-flex flex-column gap-2.5">
        <div
          v-for="addr in (currentUser.savedAddresses || [])"
          :key="addr.id"
          class="address-item-card"
        >
          <div class="small min-w-0">
            <div class="d-flex align-items-center flex-wrap gap-2">
              <strong class="text-dark">{{ addr.recipientName }}</strong>
              <span class="font-monospace text-muted">{{ addr.phone }}</span>
            </div>
            <div class="text-secondary mt-1">{{ addr.city }}{{ addr.district }}{{ addr.detail }}</div>
          </div>
          <button
            type="button"
            class="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 font-monospace flex-shrink-0"
            style="font-size: 11px;"
            @click="authStore.removeAddress(addr.id)"
          >
            刪除
          </button>
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
  if (authStore.addAddress) {
    authStore.addAddress({
      type: 'HOME',
      recipientName: newAddressForm.recipientName,
      phone: newAddressForm.phone,
      city: newAddressForm.city,
      district: newAddressForm.district,
      detail: newAddressForm.detail,
      isDefault: false
    })
  }
  newAddressForm.recipientName = ''
  newAddressForm.phone = ''
  newAddressForm.district = ''
  newAddressForm.detail = ''
  showAddressForm.value = false
}
</script>

<style scoped>
.profile-card {
  background-color: #ffffff;
  border: 1px solid #e8e2da;
  border-radius: 16px;
  padding: 18px 16px;
  box-shadow: 0 2px 10px rgba(45, 38, 33, 0.03);
}

@media (min-width: 768px) {
  .profile-card {
    padding: 24px 28px;
  }
}

.address-item-card {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #e8e2da;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>