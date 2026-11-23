<template>
  <div class="d-flex flex-column gap-3 gap-md-4">
    <!-- 1. 會員基本資料與生日設定 -->
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

    <!-- 2. 修改帳號密碼（需核對 Email 與手機號碼相符） -->
    <div class="profile-card">
      <div class="mb-3 pb-2 border-bottom">
        <h2 class="fs-6 fw-bold text-dark mb-0">修改帳號密碼</h2>
        <span class="text-muted small">請輸入與本帳號相符的電子信箱與手機號碼進行核對後設定新密碼</span>
      </div>

      <form @submit.prevent="handleChangePassword" class="row g-3" style="max-width: 680px;">
        <div class="col-12 col-sm-6">
          <label class="form-label text-secondary small mb-1">帳號電子信箱 *</label>
          <input
            v-model="passwordForm.email"
            required
            type="email"
            class="form-control form-control-sm font-monospace"
            placeholder="請輸入本帳號信箱"
          />
        </div>

        <div class="col-12 col-sm-6">
          <label class="form-label text-secondary small mb-1">帳號聯絡手機 *</label>
          <input
            v-model="passwordForm.phone"
            required
            type="tel"
            class="form-control form-control-sm font-monospace"
            placeholder="請輸入與信箱相符的手機號碼"
          />
        </div>

        <div class="col-12 col-sm-6">
          <label class="form-label text-secondary small mb-1">設定新密碼 *</label>
          <input
            v-model="passwordForm.newPassword"
            required
            type="password"
            minlength="6"
            class="form-control form-control-sm font-monospace"
            placeholder="至少 6 位英數字"
          />
        </div>

        <div class="col-12 col-sm-6">
          <label class="form-label text-secondary small mb-1">再次確認新密碼 *</label>
          <input
            v-model="passwordForm.confirmPassword"
            required
            type="password"
            minlength="6"
            class="form-control form-control-sm font-monospace"
            placeholder="請再次輸入新密碼"
          />
        </div>

        <div class="col-12 pt-2">
          <button
            type="submit"
            class="btn btn-dark btn-sm rounded-pill px-4 py-2.5 fw-bold w-100 w-sm-auto"
            :disabled="submittingPassword"
          >
            {{ submittingPassword ? '核對並更新中...' : '核對資料並確認修改密碼' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { apiRequest } from '../../services/apiClient'
import { showToast } from '../../composables/useToast'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user || {})

const profileForm = reactive({
  name: currentUser.value.name || '',
  phone: currentUser.value.phone || '',
  email: currentUser.value.email || '',
  birthday: currentUser.value.birthday || ''
})

const passwordForm = reactive({
  email: currentUser.value.email || '',
  phone: '',
  newPassword: '',
  confirmPassword: ''
})

const submittingPassword = ref(false)

const handleChangePassword = async () => {
  if (!passwordForm.email.trim() || !passwordForm.phone.trim()) {
    showToast('請同時輸入電子信箱與手機號碼進行核對！', 'warning', '資料未完整')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    showToast('新密碼長度至少需 6 個字元！', 'warning', '密碼過短')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showToast('兩次輸入的新密碼不一致！', 'warning', '密碼不一致')
    return
  }

  submittingPassword.value = true
  try {
    const res = await apiRequest('/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        action: 'change-password',
        email: passwordForm.email.trim(),
        phone: passwordForm.phone.trim(),
        newPassword: passwordForm.newPassword
      })
    })
    showToast(res.message || '密碼已更新完成！', 'success', '修改成功')
    passwordForm.phone = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err) {
    showToast(err.message || '修改密碼失敗', 'error', '修改失敗')
  } finally {
    submittingPassword.value = false
  }
}

const saveUserProfile = () => {
  if (authStore.updateProfile) {
    authStore.updateProfile({
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      birthday: profileForm.birthday
    })
  }
  showToast('會員資料與生日已儲存！', 'success', '儲存成功')
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