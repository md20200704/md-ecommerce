<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1060;">
      <div class="modal-dialog modal-dialog-centered" style="max-width: 440px; margin: 0.75rem auto;">
        <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
          
          <div class="modal-header border-0 pb-1">
            <div>
              <span class="font-monospace text-muted small" style="font-size: 10px; letter-spacing: 0.1em;">MD.SELECT MEMBER</span>
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">
                {{ mode === 'login' ? '會員登入' : '註冊新會員' }}
              </h3>
            </div>
            <button type="button" class="btn-close" @click="$emit('close')"></button>
          </div>

          <!-- 切換 登入 / 註冊 -->
          <div class="d-flex gap-2 p-1 bg-light rounded-pill my-3 border">
            <button
              type="button"
              class="btn btn-sm rounded-pill flex-grow-1 fw-bold"
              :class="mode === 'login' ? 'btn-dark' : 'text-secondary border-0'"
              @click="mode = 'login'"
            >
              會員登入
            </button>
            <button
              type="button"
              class="btn btn-sm rounded-pill flex-grow-1 fw-bold"
              :class="mode === 'register' ? 'btn-dark' : 'text-secondary border-0'"
              @click="mode = 'register'"
            >
              免費註冊
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
                class="form-control form-control-sm font-monospace"
                placeholder="請輸入電子信箱或手機號碼"
              />
            </div>
            <div>
              <label class="form-label text-secondary mb-1">登入密碼 *</label>
              <input
                v-model="loginForm.password"
                required
                type="password"
                class="form-control form-control-sm font-monospace"
                placeholder="請輸入密碼"
              />
            </div>
            <button
              type="submit"
              class="btn btn-primary w-100 rounded-pill py-2.5 fw-bold mt-1"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? '登入驗證中...' : '立即登入' }}
            </button>
          </form>

          <!-- 註冊表單（包含生日欄位） -->
          <form v-else @submit.prevent="handleRegister" class="d-flex flex-column gap-2.5 small">
            <div>
              <label class="form-label text-secondary mb-1">真實姓名 *</label>
              <input v-model="registerForm.name" required type="text" class="form-control form-control-sm" placeholder="請輸入您的姓名" />
            </div>
            <div>
              <label class="form-label text-secondary mb-1">聯絡手機號碼 *</label>
              <input v-model="registerForm.phone" required type="tel" class="form-control form-control-sm font-monospace" placeholder="0912345678" />
            </div>
            <div>
              <label class="form-label text-secondary mb-1">電子郵件信箱 *</label>
              <input v-model="registerForm.email" required type="email" class="form-control form-control-sm font-monospace" placeholder="example@gmail.com" />
            </div>
            <div>
              <label class="form-label text-dark fw-bold mb-1">🎂 會員生日 * <span class="text-muted fw-normal" style="font-size: 11px;">(享生日當月專屬禮券)</span></label>
              <input v-model="registerForm.birthday" required type="date" class="form-control form-control-sm font-monospace" />
            </div>
            <div>
              <label class="form-label text-secondary mb-1">設定密碼 *</label>
              <input v-model="registerForm.password" required type="password" class="form-control form-control-sm font-monospace" placeholder="至少 6 位英數字" />
            </div>
            <button
              type="submit"
              class="btn btn-primary w-100 rounded-pill py-2.5 fw-bold mt-2"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? '建立帳號中...' : '完成註冊並領取新客禮' }}
            </button>
          </form>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { showToast } from '../composables/useToast'

defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])
const authStore = useAuthStore()

const mode = ref('login')
const isSubmitting = ref(false)

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
</script>