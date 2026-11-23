import { reactive } from 'vue'

const state = reactive({
  visible: false,
  type: 'info', // 'success' | 'error' | 'warning' | 'info'
  title: '',
  message: '',
  duration: 3200
})

let hideTimer = null

const defaultTitles = {
  success: '領取成功',
  error: '領取失敗',
  warning: '溫馨提醒',
  info: '系統通知'
}

export function showToast(message, type = 'info', title = '') {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  state.type = type
  state.title = title || defaultTitles[type] || defaultTitles.info
  state.message = String(message ?? '')
  state.visible = true

  if (state.duration > 0) {
    hideTimer = setTimeout(() => {
      state.visible = false
    }, state.duration)
  }
}

export function closeToast() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  state.visible = false
}

export function useToast() {
  return {
    toastState: state,
    showToast,
    closeToast
  }
}