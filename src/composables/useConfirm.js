import { reactive } from 'vue'

const confirmState = reactive({
  visible: false,
  title: '請確認操作',
  message: '',
  confirmText: '確定',
  cancelText: '取消',
  danger: false,
  resolver: null
})

export function showConfirm(message, options = {}) {
  return new Promise((resolve) => {
    confirmState.visible = true
    confirmState.title = options.title || '請確認操作'
    confirmState.message = String(message ?? '')
    confirmState.confirmText = options.confirmText || '確定'
    confirmState.cancelText = options.cancelText || '取消'
    confirmState.danger = Boolean(options.danger)
    confirmState.resolver = resolve
  })
}

export function resolveConfirm(result) {
  const fn = confirmState.resolver
  confirmState.visible = false
  confirmState.resolver = null
  if (typeof fn === 'function') {
    fn(Boolean(result))
  }
}

export function useConfirm() {
  return {
    confirmState,
    showConfirm,
    resolveConfirm
  }
}