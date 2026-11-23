<template>
  <Teleport to="body">
    <Transition name="md-modal-fade">
      <div
        v-if="isOpen"
        class="md-modal-backdrop"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        @click.self="$emit('close')"
      >
        <div class="md-modal-dialog" style="max-width: 440px;">
          <!-- 標頭 -->
          <div class="md-modal-header">
            <div>
              <span class="md-modal-eyebrow font-monospace">MD.SELECT MEMBER</span>
              <h3 class="md-modal-title font-serif">
                {{ headerTitle }}
              </h3>
            </div>
            <button type="button" class="md-modal-close" aria-label="關閉" @click="$emit('close')">
              ×
            </button>
          </div>

          <!-- 切換 登入 / 註冊 / 忘記密碼 -->
          <div class="md-auth-tabs my-3">
            <button
              type="button"
              class="md-auth-tab-btn"
              :class="{ 'is-active': mode === 'login' }"
              @click="mode = 'login'"
            >
              會員登入
            </button>
            <button
              type="button"
              class="md-auth-tab-btn"
              :class="{ 'is-active': mode === 'register' }"
              @click="mode = 'register'"
            >
              免費註冊
            </button>
            <button
              type="button"
              class="md-auth-tab-btn"
              :class="{ 'is-active': mode === 'forgot' }"
              @click="mode = 'forgot'"
            >
              忘記密碼
            </button>
          </div>

          <!-- 登入表單 -->
          <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="d-flex flex-column gap-3 small">
            <div>
              <label class="form-label text-secondary mb-1">電子信箱或手機號碼 *</label>
              <input
                v-model="loginForm.account"
                required
                type="text"
                class="form-control form-control-sm font-monospace md-modal-input"
                placeholder="請輸入電子信箱或手機號碼"
              />
            </div>
            <div>
              <div class="d-flex justify-content-between align-items-center mb-1">
                <label class="form-label text-secondary mb-0">登入密碼 *</label>
                <button
                  type="button"
                  class="btn btn-link p-0 text-decoration-none font-monospace"
                  style="font-size: 11px; color: #8c735b;"
                  @click="openForgotWithAccount"
                >
                  忘記密碼？
                </button>
              </div>
              <input
                v-model="loginForm.password"
                required
                type="password"
                class="form-control form-control-sm font-monospace md-modal-input"
                placeholder="請輸入密碼"
              />
            </div>
            <button
              type="submit"
              class="btn btn-dark w-100 rounded-pill py-2.5 fw-bold mt-1 font-monospace shadow-xs"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? '登入驗證中...' : '立即登入' }}
            </button>
          </form>

          <!-- 註冊表單 -->
          <form v-else-if="mode === 'register'" @submit.prevent="handleRegister" class="d-flex flex-column gap-2.5 small">
            <div>
              <label class="form-label text-secondary mb-1">真實姓名 *</label>
              <input
                v-model="registerForm.name"
                required
                type="text"
                class="form-control form-control-sm md-modal-input"
                placeholder="請輸入您的姓名"
              />
            </div>
            <div>
              <label class="form-label text-secondary mb-1">聯絡手機號碼 *</label>
              <input
                v-model="registerForm.phone"
                required
                type="tel"
                class="form-control form-control-sm font-monospace md-modal-input"
                placeholder="0912345678"
              />
            </div>
            <div>
              <label class="form-label text-secondary mb-1">電子郵件信箱 *</label>
              <input
                v-model="registerForm.email"
                required
                type="email"
                class="form-control form-control-sm font-monospace md-modal-input"
                placeholder="example@gmail.com"
              />
            </div>
            <div>
              <label class="form-label text-dark fw-bold mb-1">
                🎂 會員生日 * <span class="text-muted fw-normal" style="font-size: 11px;">(享生日當月專屬禮券)</span>
              </label>
              <input
                v-model="registerForm.birthday"
                required
                type="date"
                class="form-control form-control-sm font-monospace md-modal-input"
              />
            </div>
            <div>
              <label class="form-label text-secondary mb-1">設定密碼 *</label>
              <input
                v-model="registerForm.password"
                required
                type="password"
                minlength="6"
                class="form-control form-control-sm font-monospace md-modal-input"
                placeholder="至少 6 位英數字"
              />
            </div>
            <button
              type="submit"
              class="btn btn-dark w-100 rounded-pill py-2.5 fw-bold mt-2 font-monospace shadow-xs"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? '建立帳號中...' : '完成註冊並領取新客禮' }}
            </button>
          </form>

          <!-- 忘記密碼表單（需同時驗證 Email 與手機號碼相符） -->
          <form v-else @submit.prevent="handleResetPassword" class="d-flex flex-column gap-2.5 small">
            <div>
              <label class="form-label text-secondary mb-1">註冊電子郵件信箱 *</label>
              <input
                v-model="forgotForm.email"
                required
                type="email"
                class="form-control form-control-sm font-monospace md-modal-input"
                placeholder="請輸入您的註冊信箱"
              />
            </div>
            <div>
              <label class="form-label text-secondary mb-1">註冊聯絡手機號碼 *</label>
              <input
                v-model="forgotForm.phone"
                required
                type="tel"
                class="form-control form-control-sm font-monospace md-modal-input"
                placeholder="請輸入與信箱相符的手機號碼"
              />
            </div>
            <div>
              <label class="form-label text-secondary mb-1">設定新密碼 *</label>
              <input
                v-model="forgotForm.newPassword"
                required
                type="password"
                minlength="6"
                class="form-control form-control-sm font-monospace md-modal-input"
                placeholder="請輸入至少 6 位新密碼"
              />
            </div>
            <div>
              <label class="form-label text-secondary mb-1">再次確認新密碼 *</label>
              <input
                v-model="forgotForm.confirmPassword"
                required
                type="password"
                minlength="6"
                class="form-control form-control-sm font-monospace md-modal-input"
                placeholder="請再次輸入新密碼"
              />
            </div>
            <button
              type="submit"
              class="btn btn-dark w-100 rounded-pill py-2.5 fw-bold mt-1 font-monospace shadow-xs"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? '核對資料並重設中...' : '核對信箱與手機並重設密碼' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { apiRequest } from '../services/apiClient'
import { showToast } from '../composables/useToast'

defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])
const authStore = useAuthStore()

const mode = ref('login')
const isSubmitting = ref(false)

const headerTitle = computed(() => {
  if (mode.value === 'login') return '會員登入'
  if (mode.value === 'register') return '註冊新會員'
  return '忘記密碼重設'
})

const loginForm = reactive({
  account: '',
  password: ''
})

const registerForm = reactive({
  name: '',
  phone: '',
  email: '',
  birthday: '',
  password: ''
})

const forgotForm = reactive({
  email: '',
  phone: '',
  newPassword: '',
  confirmPassword: ''
})

const openForgotWithAccount = () => {
  const raw = loginForm.account.trim()
  if (raw.includes('@')) {
    forgotForm.email = raw
  } else if (/^09\d{7,8}$/.test(raw.replace(/\D+/g, ''))) {
    forgotForm.phone = raw
  }
  mode.value = 'forgot'
}

const handleLogin = async () => {
  isSubmitting.value = true
  const success = await authStore.login({
    email: loginForm.account.includes('@') ? loginForm.account : '',
    account: loginForm.account,
    password: loginForm.password
  })
  isSubmitting.value = false
  if (success) emit('close')
}

const handleRegister = async () => {
  if (!registerForm.birthday) {
    showToast('請選擇您的生日日期以享有生日禮遇！', 'warning', '資料未完整')
    return
  }

  isSubmitting.value = true
  const success = await authStore.login({
    isRegister: true,
    name: registerForm.name,
    phone: registerForm.phone,
    email: registerForm.email,
    birthday: registerForm.birthday,
    password: registerForm.password
  })
  isSubmitting.value = false

  if (success) {
    showToast(
      `歡迎加入 MD.SELECT，${registerForm.name}！已記錄您的生日（${registerForm.birthday}），祝您購物愉快！`,
      'success',
      '註冊成功'
    )
    emit('close')
  }
}

const handleResetPassword = async () => {
  if (!forgotForm.email.trim() || !forgotForm.phone.trim()) {
    showToast('請同時填寫註冊信箱與手機號碼！', 'warning', '資料未完整')
    return
  }
  if (forgotForm.newPassword.length < 6) {
    showToast('新密碼長度至少需 6 個字元！', 'warning', '密碼過短')
    return
  }
  if (forgotForm.newPassword !== forgotForm.confirmPassword) {
    showToast('兩次輸入的新密碼不一致！', 'warning', '密碼不一致')
    return
  }

  isSubmitting.value = true
  try {
    const cleanEmail = forgotForm.email.trim()
    const res = await apiRequest('/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        action: 'reset-password',
        email: cleanEmail,
        phone: forgotForm.phone.trim(),
        newPassword: forgotForm.newPassword
      })
    })
    showToast(res.message || '密碼已重設完成，請重新登入', 'success', '重設成功')
    loginForm.account = cleanEmail
    loginForm.password = ''
    forgotForm.phone = ''
    forgotForm.newPassword = ''
    forgotForm.confirmPassword = ''
    mode.value = 'login'
  } catch (err) {
    showToast(err.message || '重設密碼失敗', 'error', '重設失敗')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.md-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1060;
  background: rgba(34, 29, 25, 0.48);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  overflow-y: auto;
}

.md-modal-dialog {
  width: 100%;
  background: #faf8f5;
  border: 1px solid #e3dbd0;
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 20px 48px rgba(45, 38, 33, 0.18);
  color: #2d2621;
}

.md-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebe4da;
}

.md-modal-eyebrow {
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

.md-modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #2d2621;
  margin: 0;
}

.md-modal-close {
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

.md-modal-close:hover {
  background: #e2d9cc;
  color: #2d2621;
}

.md-auth-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #f1ece4;
  border: 1px solid #e3dbd0;
  border-radius: 999px;
}

.md-auth-tab-btn {
  flex: 1;
  border: 0;
  border-radius: 999px;
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 600;
  background: transparent;
  color: #6e645b;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.md-auth-tab-btn.is-active {
  background: #2d2621;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(45, 38, 33, 0.16);
}

.md-modal-input {
  background-color: #ffffff !important;
  border-color: #dfd7cc !important;
  border-radius: 12px !important;
}

.md-modal-fade-enter-active,
.md-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.md-modal-fade-enter-from,
.md-modal-fade-leave-to {
  opacity: 0;
}
</style>