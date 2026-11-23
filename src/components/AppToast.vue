<template>
  <Teleport to="body">
    <Transition name="md-toast-slide">
      <div
        v-if="toastState.visible"
        class="md-toast-wrapper"
        role="status"
        aria-live="polite"
      >
        <div
          class="md-toast-card"
          :class="`is-${toastState.type}`"
          :style="{ '--toast-duration': `${toastState.duration}ms` }"
        >
          <div class="md-toast-icon" aria-hidden="true">
            <span v-if="toastState.type === 'success'">✓</span>
            <span v-else-if="toastState.type === 'error'">✕</span>
            <span v-else-if="toastState.type === 'warning'">!</span>
            <span v-else>i</span>
          </div>

          <div class="md-toast-content">
            <div class="md-toast-title">{{ toastState.title }}</div>
            <div class="md-toast-message">{{ toastState.message }}</div>
          </div>

          <button
            type="button"
            class="md-toast-close"
            aria-label="關閉提示"
            @click="closeToast"
          >
            ×
          </button>

          <div class="md-toast-progress"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useToast } from '../composables/useToast'

const { toastState, closeToast } = useToast()
</script>

<style scoped>
.md-toast-wrapper {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  max-width: min(420px, calc(100vw - 32px));
  pointer-events: none;
}

.md-toast-card {
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px 17px;
  border-radius: 16px;
  background: rgba(250, 248, 245, 0.96);
  backdrop-filter: blur(12px);
  border: 1px solid #e4ddd3;
  box-shadow:
    0 14px 34px rgba(45, 38, 33, 0.12),
    0 2px 6px rgba(45, 38, 33, 0.06);
  color: #2d2621;
}

.md-toast-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  margin-top: 1px;
}

.md-toast-content {
  flex: 1 1 auto;
  min-width: 0;
}

.md-toast-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.35;
  margin-bottom: 2px;
}

.md-toast-message {
  font-size: 12.5px;
  line-height: 1.5;
  color: #5a5149;
  word-break: break-word;
}

.md-toast-close {
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: #8c8278;
  font-size: 18px;
  line-height: 1;
  padding: 0 2px;
  cursor: pointer;
  border-radius: 6px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.md-toast-close:hover {
  color: #2d2621;
  background-color: rgba(45, 38, 33, 0.06);
}

/* 狀態色彩主題 */
.md-toast-card.is-success {
  border-color: #c8dfd0;
  background: linear-gradient(180deg, #f8fcf9 0%, #f1f8f3 100%);
}
.md-toast-card.is-success .md-toast-icon {
  background-color: #2b6e44;
  color: #ffffff;
}
.md-toast-card.is-success .md-toast-title {
  color: #1f5433;
}
.md-toast-card.is-success .md-toast-progress {
  background: linear-gradient(90deg, #3b8a58, #2b6e44);
}

.md-toast-card.is-error {
  border-color: #e8c7c7;
  background: linear-gradient(180deg, #fff9f9 0%, #fdf2f2 100%);
}
.md-toast-card.is-error .md-toast-icon {
  background-color: #a8383b;
  color: #ffffff;
}
.md-toast-card.is-error .md-toast-title {
  color: #8a282b;
}
.md-toast-card.is-error .md-toast-progress {
  background: linear-gradient(90deg, #c94a4e, #a8383b);
}

.md-toast-card.is-warning {
  border-color: #ead7b7;
  background: linear-gradient(180deg, #fffcf6 0%, #fbf5e8 100%);
}
.md-toast-card.is-warning .md-toast-icon {
  background-color: #9e6b1b;
  color: #ffffff;
}
.md-toast-card.is-warning .md-toast-title {
  color: #7c5211;
}
.md-toast-card.is-warning .md-toast-progress {
  background: linear-gradient(90deg, #c48827, #9e6b1b);
}

.md-toast-card.is-info {
  border-color: #dfd7cc;
}
.md-toast-card.is-info .md-toast-icon {
  background-color: #2d2621;
  color: #faf8f5;
}
.md-toast-card.is-info .md-toast-progress {
  background: linear-gradient(90deg, #7c6d5f, #2d2621);
}

/* 底部自動消失進度條 */
.md-toast-progress {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  transform-origin: left center;
  animation: mdToastShrink var(--toast-duration, 3200ms) linear forwards;
}

@keyframes mdToastShrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* 進出轉場動畫 */
.md-toast-slide-enter-active,
.md-toast-slide-leave-active {
  transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.md-toast-slide-enter-from {
  opacity: 0;
  transform: translateY(-14px) scale(0.97);
}

.md-toast-slide-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(0.97);
}

@media (max-width: 576px) {
  .md-toast-wrapper {
    top: 14px;
    right: 14px;
    left: 14px;
    max-width: none;
  }
}
</style>