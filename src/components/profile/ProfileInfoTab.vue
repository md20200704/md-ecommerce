<template>
  <div class="profile-card">
    <div class="mb-3 pb-2 border-bottom">
      <h2 class="fs-6 fw-bold text-dark mb-0">會員基本資料與生日設定</h2>
      <span class="text-muted small">填寫生日後，系統將於您生日月份自動派發專屬生日禮券</span>
    </div>

    <form @submit.prevent="saveUserProfile" class="row g-3" style="max-width: 680px;">
      <div class="col-12 col-sm-6">
        <label class="form-label text-secondary small mb-1">會員姓名 *</label>
        <input v-model="profileForm.name" required type="text" class="form-control form-control-sm" />
      </div>
      <div class="col-12 col-sm-6">
        <label class="form-label text-secondary small mb-1">聯絡手機 *</label>
        <input v-model="profileForm.phone" required type="tel" class="form-control form-control-sm font-monospace" />
      </div>
      <div class="col-12 col-sm-6">
        <label class="form-label text-secondary small mb-1">電子信箱帳號</label>
        <input v-model="profileForm.email" disabled type="email" class="form-control form-control-sm font-monospace bg-light" />
      </div>
      <div class="col-12 col-sm-6">
        <label class="form-label text-dark fw-bold small mb-1">🎂 會員生日日期 (YYYY-MM-DD)</label>
        <input v-model="profileForm.birthday" type="date" class="form-control form-control-sm font-monospace" />
      </div>
      <div class="col-12 pt-2">
        <button type="submit" class="btn btn-dark btn-sm rounded-pill px-4 py-2.5 fw-bold w-100 w-sm-auto">
          儲存會員資料與生日
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user || {})

const profileForm = reactive({
  name: currentUser.value.name || '',
  phone: currentUser.value.phone || '',
  email: currentUser.value.email || '',
  birthday: currentUser.value.birthday || ''
})

const saveUserProfile = () => {
  if (authStore.updateProfile) {
    authStore.updateProfile({
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      birthday: profileForm.birthday
    })
  }
  alert('會員資料與生日已儲存！')
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
</style>