<template>
  <div class="cs-widget-wrapper">
    <!-- 懸浮客服圓形按鈕（極簡精品線條圖標） -->
    <button
      v-if="!isOpen"
      type="button"
      class="cs-fab-btn shadow-lg d-flex align-items-center justify-content-center position-relative"
      @click="handleOpenWidget"
      title="聯絡線上風格客服"
      aria-label="聯絡線上風格客服"
    >
      <span class="cs-fab-inner-ring d-flex align-items-center justify-content-center">
        <MessageCircle :stroke-width="1.8" style="width: 23px; height: 23px;" />
      </span>
      <span
        v-if="authStore.isLoggedIn && chatStore.customerUnreadCount > 0"
        class="cs-unread-badge font-monospace"
      >
        {{ chatStore.customerUnreadCount }}
      </span>
    </button>

    <!-- 展開對話視窗 -->
    <div v-else class="cs-widget-box d-flex flex-column font-sans">
      <!-- 1. 頂部標題列 -->
      <div class="cs-widget-header d-flex align-items-center justify-content-between flex-shrink-0">
        <div class="d-flex align-items-center gap-3">
          <span class="cs-online-dot"></span>
          <div class="d-flex flex-column">
            <div class="fw-bold font-serif text-white" style="font-size: 15px; letter-spacing: 0.06em; line-height: 1.35;">
              M&amp;D 線上風格客服
            </div>
            <div class="text-white-50 font-monospace mt-1" style="font-size: 11px; line-height: 1.2;">
              {{ authStore.isLoggedIn ? `目前帳號：${authStore.user?.name || authStore.user?.id}` : '請先登入會員以開始對話' }}
            </div>
          </div>
        </div>
        <button
          type="button"
          class="btn-close btn-close-white shadow-none"
          style="font-size: 12px;"
          @click="isOpen = false"
        ></button>
      </div>

      <!-- 2. 中間訊息捲動區 -->
      <div ref="chatScrollRef" class="cs-widget-body flex-grow-1 overflow-auto d-flex flex-column">
        <div class="text-center my-2">
          <span class="cs-welcome-pill font-monospace d-inline-flex align-items-center gap-1.5">
            <Sparkles v-if="authStore.isLoggedIn" style="width: 13px; height: 13px; color: #9b7e68;" />
            <Lock v-else style="width: 13px; height: 13px; color: #9b7e68;" />
            <span>{{ authStore.isLoggedIn ? '您好！可輸入問題或點擊左下角傳送圖片' : '登入會員後即可檢視您的專屬客服紀錄' }}</span>
          </span>
        </div>

        <template v-if="authStore.isLoggedIn">
          <div
            v-for="msg in chatStore.activeThread.messages"
            :key="msg.id"
            class="d-flex flex-column"
            :class="msg.sender === 'user' ? 'align-items-end' : 'align-items-start'"
          >
            <div
              class="cs-chat-bubble font-monospace"
              :class="msg.sender === 'user' ? 'is-user' : 'is-admin'"
            >
              <div v-if="msg.image" class="cs-msg-image-wrap" :class="{ 'mb-2': msg.text }">
                <img
                  :src="msg.image"
                  alt="對話圖片"
                  class="cs-msg-image"
                  @click="previewLightboxImage = msg.image"
                />
              </div>
              <div v-if="msg.text">{{ msg.text }}</div>
            </div>
            <span class="text-muted font-monospace mt-1 px-1" style="font-size: 10px;">
              {{ msg.time }}
            </span>
          </div>
        </template>
      </div>

      <!-- 3. 底部輸入框與圖片預覽列 -->
      <div class="cs-widget-footer bg-white flex-shrink-0">
        <div v-if="pendingImage" class="cs-pending-preview mb-2 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <img :src="pendingImage" class="cs-pending-thumb rounded-2 object-fit-cover" />
            <span class="text-secondary font-monospace" style="font-size: 11px;">已選取 1 張圖片</span>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-link text-danger text-decoration-none font-monospace p-0"
            style="font-size: 11px;"
            @click="clearPendingImage"
          >
            ✕ 移除
          </button>
        </div>

        <form @submit.prevent="handleSend" class="d-flex align-items-center gap-2">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="d-none"
            @change="handleImageSelect"
          />
          <button
            type="button"
            class="cs-upload-btn flex-shrink-0"
            title="上傳圖片"
            @click="triggerFileSelect"
          >
            <ImagePlus :stroke-width="1.8" style="width: 17px; height: 17px; color: #5c534c;" />
          </button>

          <input
            v-model="inputText"
            type="text"
            class="form-control cs-input rounded-pill"
            :placeholder="authStore.isLoggedIn ? '輸入訊息或傳送圖片...' : '請先登入會員後發送訊息...'"
            :disabled="!authStore.isLoggedIn"
          />
          <button
            type="submit"
            class="btn btn-dark rounded-pill cs-send-btn font-monospace fw-bold flex-shrink-0"
            :disabled="!authStore.isLoggedIn || (!inputText.trim() && !pendingImage)"
          >
            發送
          </button>
        </form>
      </div>
    </div>

    <!-- 點擊圖片放大檢視燈箱 -->
    <Teleport to="body">
      <div
        v-if="previewLightboxImage"
        class="cs-lightbox-backdrop"
        @click="previewLightboxImage = null"
      >
        <img :src="previewLightboxImage" class="cs-lightbox-img" @click.stop />
        <button
          type="button"
          class="btn btn-light rounded-pill px-3 py-1 font-monospace fw-bold position-fixed top-0 end-0 m-4"
          style="font-size: 12px;"
          @click="previewLightboxImage = null"
        >
          ✕ 關閉預覽
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { MessageCircle, ImagePlus, Sparkles, Lock } from 'lucide-vue-next'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../stores/authStore'
import { showToast } from '../composables/useToast'

const chatStore = useChatStore()
const authStore = useAuthStore()
const isOpen = ref(false)
const inputText = ref('')
const pendingImage = ref(null)
const previewLightboxImage = ref(null)
const fileInputRef = ref(null)
const chatScrollRef = ref(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
    }
  })
}

const handleOpenWidget = async () => {
  if (!authStore.isLoggedIn) {
    showToast('請先登入會員以使用線上客服功能', 'warning', '請先登入')
    return
  }
  isOpen.value = true
  await chatStore.fetchThreads()
  chatStore.markCustomerAsRead(authStore.user?.id)
  scrollToBottom()
}

watch(isOpen, (val) => {
  if (val && authStore.isLoggedIn) {
    chatStore.markCustomerAsRead(authStore.user?.id)
    scrollToBottom()
  }
})

watch(
  () => authStore.user?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      isOpen.value = false
      inputText.value = ''
      clearPendingImage()
      if (!newId) {
        chatStore.resetChatState()
      }
    }
  }
)

watch(
  () => chatStore.activeThread.messages?.length,
  () => {
    if (isOpen.value && authStore.isLoggedIn) {
      chatStore.markCustomerAsRead(authStore.user?.id)
      scrollToBottom()
    }
  }
)

const triggerFileSelect = () => {
  if (!authStore.isLoggedIn) {
    showToast('請先登入會員後再傳送圖片', 'warning', '請先登入')
    return
  }
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleImageSelect = (event) => {
  const file = event.target.files && event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    if (e.target && e.target.result) {
      pendingImage.value = e.target.result
    }
  }
  reader.readAsDataURL(file)
}

const clearPendingImage = () => {
  pendingImage.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleSend = async () => {
  if (!authStore.isLoggedIn || !authStore.user?.id) {
    showToast('請先登入會員後再使用線上客服功能', 'warning', '請先登入')
    return
  }
  if (!inputText.value.trim() && !pendingImage.value) return

  const uid = authStore.user.id
  const textToSend = inputText.value.trim()
  const imgToSend = pendingImage.value

  const created = await chatStore.sendMessage(uid, textToSend, 'user', imgToSend, false)
  if (!created) return

  inputText.value = ''
  clearPendingImage()
  scrollToBottom()

  setTimeout(async () => {
    if (!authStore.isLoggedIn || authStore.user?.id !== uid) return
    await chatStore.sendMessage(
      uid,
      '感謝您的留言！客服專員已收到您的訊息與圖片，將立即為您查詢處理。',
      'admin',
      null,
      true
    )
    if (isOpen.value) {
      chatStore.markCustomerAsRead(uid)
      scrollToBottom()
    }
  }, 1500)
}
</script>

<style scoped>
.cs-widget-wrapper {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1060;
}

@media (max-width: 991.98px) {
  .cs-widget-wrapper {
    right: 16px;
    bottom: 84px;
  }
}

.cs-fab-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(145deg, #352d27 0%, #231d19 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.9);
  color: #f7f3ee;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 8px 24px rgba(45, 38, 33, 0.22);
  transition: transform 0.22s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.22s ease, background 0.22s ease;
}

.cs-fab-inner-ring {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid rgba(212, 163, 115, 0.35);
  transition: border-color 0.22s ease, transform 0.22s ease;
}

.cs-fab-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(45, 38, 33, 0.28);
}

.cs-fab-btn:hover .cs-fab-inner-ring {
  border-color: rgba(212, 163, 115, 0.75);
  transform: scale(1.04);
}

.cs-unread-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #b85042;
  color: #ffffff;
  border: 2px solid #ffffff;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  line-height: 1.1;
}

.cs-widget-box {
  width: 375px;
  max-width: calc(100vw - 32px);
  height: 550px;
  max-height: calc(100vh - 120px);
  background-color: #ffffff;
  border: 1px solid #e8e2da;
  border-radius: 20px;
  box-shadow: 0 14px 40px rgba(45, 38, 33, 0.14);
  overflow: hidden;
  animation: csFadeInUp 0.22s ease;
}

.cs-widget-header {
  background-color: #2d2621;
  padding: 18px 20px;
  min-height: 72px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.cs-online-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #389e0d;
  box-shadow: 0 0 0 3px rgba(56, 158, 13, 0.25);
  flex-shrink: 0;
}

.cs-widget-body {
  background-color: #faf8f5;
  padding: 20px 18px;
  gap: 16px;
}

.cs-welcome-pill {
  background-color: #ffffff;
  color: #70665f;
  border: 1px solid #e8e2da;
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 11px;
  box-shadow: 0 2px 6px rgba(45, 38, 33, 0.03);
}

.cs-chat-bubble {
  max-width: 80%;
  padding: 12px 15px;
  font-size: 13px;
  line-height: 1.55;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(45, 38, 33, 0.04);
}

.cs-chat-bubble.is-user {
  background-color: #2d2621;
  color: #ffffff;
  border-radius: 18px 18px 4px 18px;
}

.cs-chat-bubble.is-admin {
  background-color: #ffffff;
  color: #2d2621;
  border: 1px solid #e8e2da;
  border-radius: 18px 18px 18px 4px;
}

.cs-msg-image-wrap {
  border-radius: 12px;
  overflow: hidden;
  max-width: 220px;
}

.cs-msg-image {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  display: block;
  cursor: zoom-in;
  transition: opacity 0.15s ease;
}

.cs-msg-image:hover {
  opacity: 0.92;
}

.cs-widget-footer {
  padding: 12px 16px;
  border-top: 1px solid #ede8e1;
}

.cs-pending-preview {
  background-color: #faf8f5;
  border: 1px solid #e8e2da;
  border-radius: 12px;
  padding: 8px 12px;
}

.cs-pending-thumb {
  width: 38px;
  height: 38px;
  border: 1px solid #ded6cb;
}

.cs-upload-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid #dcd6cd;
  background-color: #faf8f5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
}

.cs-upload-btn:hover {
  background-color: #f0ebe3;
  border-color: #9b7e68;
}

.cs-input {
  font-size: 13px;
  padding: 9px 15px;
  border-color: #dcd6cd;
  background-color: #faf8f5;
}

.cs-input:focus {
  background-color: #ffffff;
  border-color: #2d2621;
  box-shadow: none;
}

.cs-send-btn {
  font-size: 12px;
  padding: 9px 16px;
}

.cs-lightbox-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(20, 17, 15, 0.82);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.cs-lightbox-img {
  max-width: 90vw;
  max-height: 86vh;
  border-radius: 14px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
}

@keyframes csFadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>