<template>
  <Teleport to="body">
    <Transition name="md-confirm-fade">
      <div
        v-if="confirmState.visible"
        class="md-confirm-backdrop"
        @click.self="resolveConfirm(false)"
      >
        <div class="md-confirm-dialog" role="dialog" aria-modal="true">
          <div class="md-confirm-badge" :class="{ 'is-danger': confirmState.danger }">
            {{ confirmState.danger ? '!' : '?' }}
          </div>
          <h3 class="md-confirm-title">{{ confirmState.title }}</h3>
          <p class="md-confirm-message">{{ confirmState.message }}</p>

          <div class="md-confirm-actions">
            <button
              type="button"
              class="md-confirm-btn is-cancel"
              @click="resolveConfirm(false)"
            >
              {{ confirmState.cancelText }}
            </button>
            <button
              type="button"
              class="md-confirm-btn"
              :class="confirmState.danger ? 'is-danger' : 'is-primary'"
              @click="resolveConfirm(true)"
            >
              {{ confirmState.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useConfirm } from '../composables/useConfirm'

const { confirmState, resolveConfirm } = useConfirm()
</script>

<style scoped>
.md-confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(34, 29, 25, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.md-confirm-dialog {
  width: 100%;
  max-width: 400px;
  background: #faf8f5;
  border: 1px solid #e3dbd0;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 20px 48px rgba(45, 38, 33, 0.18);
  text-align: center;
}

.md-confirm-badge {
  width: 38px;
  height: 38px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: #2d2621;
  color: #faf8f5;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.md-confirm-badge.is-danger {
  background: #a8383b;
  color: #ffffff;
}

.md-confirm-title {
  font-size: 15px;
  font-weight: 700;
  color: #2d2621;
  margin-bottom: 8px;
}

.md-confirm-message {
  font-size: 13px;
  line-height: 1.6;
  color: #5c5249;
  white-space: pre-line;
  margin-bottom: 20px;
}

.md-confirm-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.md-confirm-btn {
  flex: 1;
  border: 0;
  border-radius: 999px;
  padding: 9px 16px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.md-confirm-btn.is-cancel {
  background: #efeae2;
  color: #4a4139;
}
.md-confirm-btn.is-cancel:hover {
  background: #e4ddd2;
}

.md-confirm-btn.is-primary {
  background: #2d2621;
  color: #ffffff;
}
.md-confirm-btn.is-primary:hover {
  background: #181411;
}

.md-confirm-btn.is-danger {
  background: #a8383b;
  color: #ffffff;
}
.md-confirm-btn.is-danger:hover {
  background: #8b2b2e;
}

.md-confirm-fade-enter-active,
.md-confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}
.md-confirm-fade-enter-from,
.md-confirm-fade-leave-to {
  opacity: 0;
}
</style>