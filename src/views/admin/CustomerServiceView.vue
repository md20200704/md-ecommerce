<template>
  <div class="cs-admin-page d-flex flex-column gap-4 w-100 px-3 px-sm-4 px-md-0 pb-4" style="min-width: 0;">
    
    <!-- 頂部頁頭 -->
    <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 py-2">
      <div>
        <h1 class="h4 fw-bold text-dark font-serif mb-1">客服訊息與即時對話管理</h1>
        <p class="small text-muted mb-0">即時回覆消費者諮詢、傳送商品實拍圖及檢視客戶歷史訂單資訊</p>
      </div>
      <div class="cs-unread-summary font-monospace">
        未回覆諮詢：<strong class="text-danger ms-1">{{ chatStore.totalUnreadCount }}</strong> 則
      </div>
    </div>

    <!-- 主客服工作台 -->
    <div class="cs-workbench bg-white rounded-4 overflow-hidden">
      <div class="row h-100 g-0">
        
        <!-- 左側：諮詢對話執行緒列表 -->
        <div class="col-12 col-md-4 col-xl-3 cs-sidebar-col d-flex flex-column h-100">
          <div class="cs-sidebar-search bg-white">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control cs-search-input rounded-pill"
              placeholder="🔍 搜尋客戶姓名或訊息內容..."
            />
          </div>

          <div class="cs-thread-list flex-grow-1 overflow-auto">
            <div
              v-for="thread in filteredThreads"
              :key="thread.userId"
              class="cs-thread-item"
              :class="{ 'is-active': chatStore.activeUserId === thread.userId }"
              @click="selectThread(thread.userId)"
            >
              <div class="cs-thread-inner">
                <img :src="thread.avatar" class="cs-avatar rounded-circle object-fit-cover" />
                
                <div class="cs-thread-content">
                  <div class="cs-thread-top-row">
                    <span class="cs-thread-name" :title="thread.userName">
                      {{ thread.userName }}
                    </span>
                    <span class="cs-thread-time font-monospace">
                      {{ thread.lastTime }}
                    </span>
                  </div>

                  <div class="cs-thread-msg font-monospace" :title="thread.lastMessage">
                    {{ thread.lastMessage }}
                  </div>

                  <div class="cs-thread-bottom-row">
                    <span
                      class="cs-status-tag font-monospace"
                      :class="`status-${thread.status.toLowerCase()}`"
                    >
                      {{ statusLabel(thread.status) }}
                    </span>
                    <span
                      v-if="thread.unreadCount > 0"
                      class="cs-thread-unread font-monospace"
                    >
                      {{ thread.unreadCount }} 則未讀
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中間：即時聊天室主視窗 -->
        <div class="col-12 col-md-8 col-xl-6 d-flex flex-column h-100 bg-white" style="min-width: 0;">
          <!-- 對話頭部資訊 -->
          <div class="cs-main-header d-flex align-items-center justify-content-between bg-white flex-wrap gap-2">
            <div class="d-flex align-items-center gap-3" style="min-width: 0;">
              <img :src="chatStore.activeThread.avatar" class="cs-avatar-sm rounded-circle object-fit-cover flex-shrink-0" />
              <div style="min-width: 0;">
                <div class="fw-bold text-dark text-truncate mb-1" style="font-size: 14.5px; line-height: 1.2;">
                  {{ chatStore.activeThread.userName }}
                </div>
                <div class="text-muted font-monospace text-truncate" style="font-size: 11.5px; line-height: 1.2;">
                  {{ chatStore.activeThread.userEmail }}
                </div>
              </div>
            </div>
            <div class="flex-shrink-0">
              <select
                :value="chatStore.activeThread.status"
                class="form-select cs-status-select font-monospace rounded-pill"
                @change="(e) => chatStore.updateThreadStatus(chatStore.activeThread.userId, e.target.value)"
              >
                <option value="PENDING">🔴 待處理</option>
                <option value="PROCESSING">🟡 處理中</option>
                <option value="RESOLVED">🟢 已結案</option>
              </select>
            </div>
          </div>

          <!-- 訊息歷史區 -->
          <div ref="adminScrollRef" class="cs-main-messages flex-grow-1 overflow-auto d-flex flex-column">
            <div
              v-for="msg in chatStore.activeThread.messages"
              :key="msg.id"
              class="d-flex flex-column"
              :class="msg.sender === 'admin' ? 'align-items-end' : 'align-items-start'"
            >
              <div class="d-flex align-items-center gap-2 mb-1 px-1">
                <span class="text-muted font-monospace" style="font-size: 10.5px;">
                  {{ msg.sender === 'admin' ? '商家客服回覆' : chatStore.activeThread.userName }}
                </span>
                <span class="text-muted font-monospace" style="font-size: 10px;">· {{ msg.time }}</span>
              </div>
              <div
                class="cs-admin-bubble font-monospace"
                :class="msg.sender === 'admin' ? 'is-admin' : 'is-customer'"
              >
                <!-- 圖片訊息渲染（點擊可放大預覽） -->
                <div v-if="msg.image" class="cs-admin-image-wrap" :class="{ 'mb-2': msg.text }">
                  <img
                    :src="msg.image"
                    alt="客服對話圖片"
                    class="cs-admin-image"
                    @click="previewLightboxImage = msg.image"
                  />
                </div>
                <!-- 文字訊息渲染 -->
                <div v-if="msg.text">{{ msg.text }}</div>
              </div>
            </div>
          </div>

          <!-- 商家回覆輸入列 -->
          <div class="cs-main-footer bg-white">
            <!-- 快捷罐頭訊息 -->
            <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
              <span class="text-muted font-monospace me-1" style="font-size: 11px;">快捷回覆：</span>
              <button
                type="button"
                class="cs-quick-reply-btn font-monospace"
                @click="inputText = '您好，請問還有其他關於尺寸或商品的疑問嗎？'"
              >
                + 尺寸詢問回覆
              </button>
              <button
                type="button"
                class="cs-quick-reply-btn font-monospace"
                @click="inputText = '訂單已幫您安排優先出貨，預計明日寄出！'"
              >
                + 出貨進度回覆
              </button>
              <button
                type="button"
                class="cs-quick-reply-btn font-monospace"
                @click="inputText = '感謝您的支持！若收到商品滿意，歡迎給予我們五星好評鼓勵喔 ✨'"
              >
                + 感謝購買回覆
              </button>
            </div>

            <!-- 待發送圖片預覽小卡 -->
            <div v-if="pendingImage" class="cs-pending-preview mb-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <img :src="pendingImage" class="cs-pending-thumb rounded-2 object-fit-cover" />
                <span class="text-secondary font-monospace" style="font-size: 11.5px;">已選取圖片準備發送</span>
              </div>
              <button
                type="button"
                class="btn btn-sm btn-link text-danger text-decoration-none font-monospace p-0"
                style="font-size: 11.5px;"
                @click="clearPendingImage"
              >
                ✕ 移除圖片
              </button>
            </div>

            <form @submit.prevent="handleAdminSend" class="d-flex align-items-center gap-2">
              <!-- 隱藏圖片選擇器 -->
              <input
                ref="adminFileInputRef"
                type="file"
                accept="image/*"
                class="d-none"
                @change="handleAdminImageSelect"
              />
              <!-- 上傳圖片按鈕 -->
              <button
                type="button"
                class="cs-upload-btn flex-shrink-0"
                title="傳送圖片給客戶"
                @click="triggerAdminFileSelect"
              >
                📷
              </button>

              <input
                v-model="inputText"
                type="text"
                class="form-control cs-reply-input rounded-pill"
                placeholder="輸入回覆給客戶的訊息或傳送圖片..."
              />
              <button
                type="submit"
                class="btn btn-dark rounded-pill cs-reply-btn font-monospace fw-bold flex-shrink-0"
                :disabled="!inputText.trim() && !pendingImage"
              >
                發送回覆
              </button>
            </form>
          </div>
        </div>

        <!-- 右側：客戶畫布與歷史訂單摘要 -->
        <div class="d-none d-xl-flex col-xl-3 cs-profile-col flex-column h-100 bg-white font-sans">
          <div class="fw-bold text-dark pb-3 mb-3 border-bottom" style="font-size: 14px; border-color: #ede8e1 !important;">
            客戶檔案與歷史訂單
          </div>
          
          <div class="d-flex flex-column gap-3 font-monospace">
            <div class="cs-info-card">
              <span class="text-muted d-block mb-1" style="font-size: 11px;">會員姓名</span>
              <strong class="text-dark" style="font-size: 13.5px;">{{ chatStore.activeThread.userName }}</strong>
            </div>

            <div class="cs-info-card">
              <span class="text-muted d-block mb-1" style="font-size: 11px;">電子信箱</span>
              <strong class="text-dark text-break" style="font-size: 12.5px;">{{ chatStore.activeThread.userEmail }}</strong>
            </div>

            <div class="cs-info-card">
              <span class="text-muted d-block mb-1" style="font-size: 11px;">會員等級與標籤</span>
              <div class="d-flex flex-wrap gap-2 mt-1">
                <span class="badge rounded-pill bg-dark text-white px-2 py-1" style="font-size: 10.5px;">VIP 金卡會員</span>
                <span class="badge rounded-pill bg-light text-secondary border px-2 py-1" style="font-size: 10.5px;">極簡韓系偏好</span>
              </div>
            </div>

            <div class="cs-info-card">
              <span class="text-muted d-block mb-2" style="font-size: 11px;">最近消費訂單</span>
              <div class="p-2 bg-white rounded-3 border mb-2" style="border-color: #ede8e1 !important;">
                <div class="fw-bold text-dark" style="font-size: 12.5px;">#MD-20261020-089</div>
                <div class="text-secondary mt-1" style="font-size: 11.5px;">NT$ 1,480 · 已完成取貨</div>
              </div>
              <div class="p-2 bg-white rounded-3 border" style="border-color: #ede8e1 !important;">
                <div class="fw-bold text-dark" style="font-size: 12.5px;">#MD-20260915-042</div>
                <div class="text-secondary mt-1" style="font-size: 11.5px;">NT$ 2,680 · 已完成取貨</div>
              </div>
            </div>
          </div>
        </div>

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
import { ref, computed, nextTick } from 'vue'
import { useChatStore } from '../../stores/chatStore'

const chatStore = useChatStore()
const inputText = ref('')
const pendingImage = ref(null)
const previewLightboxImage = ref(null)
const adminFileInputRef = ref(null)
const searchQuery = ref('')
const adminScrollRef = ref(null)

const filteredThreads = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return chatStore.threads
  return chatStore.threads.filter(t =>
    t.userName.toLowerCase().includes(q) ||
    t.lastMessage.toLowerCase().includes(q) ||
    t.userEmail.toLowerCase().includes(q)
  )
})

const statusLabel = (status) => {
  if (status === 'PENDING') return '待處理'
  if (status === 'PROCESSING') return '處理中'
  return '已結案'
}

const scrollToBottom = () => {
  nextTick(() => {
    if (adminScrollRef.value) {
      adminScrollRef.value.scrollTop = adminScrollRef.value.scrollHeight
    }
  })
}

const selectThread = (userId) => {
  chatStore.activeUserId = userId
  chatStore.markAsRead(userId)
  scrollToBottom()
}

const triggerAdminFileSelect = () => {
  if (adminFileInputRef.value) {
    adminFileInputRef.value.click()
  }
}

const handleAdminImageSelect = (event) => {
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
  if (adminFileInputRef.value) {
    adminFileInputRef.value.value = ''
  }
}

const handleAdminSend = () => {
  if (!inputText.value.trim() && !pendingImage.value) return
  const userId = chatStore.activeThread.userId
  chatStore.sendMessage(userId, inputText.value.trim(), 'admin', pendingImage.value)
  inputText.value = ''
  clearPendingImage()
  scrollToBottom()
}
</script>

<style scoped>
.cs-unread-summary {
  background-color: #ffffff;
  border: 1px solid #e8e2da;
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 12.5px;
  color: #2d2621;
  box-shadow: 0 2px 6px rgba(45, 38, 33, 0.03);
}

.cs-workbench {
  height: 720px;
  border: 1px solid #e8e2da;
  box-shadow: 0 6px 24px rgba(45, 38, 33, 0.04);
}

@media (max-width: 767.98px) {
  .cs-workbench {
    height: auto;
  }
}

/* 左欄：客戶對話列表 */
.cs-sidebar-col {
  background-color: #faf8f5;
  border-right: 1px solid #e8e2da;
  min-width: 0;
}

.cs-sidebar-search {
  padding: 16px 16px;
  border-bottom: 1px solid #ede8e1;
}

.cs-search-input {
  font-size: 12.5px;
  padding: 9px 16px;
  border-color: #dcd6cd;
  background-color: #faf8f5;
}

.cs-search-input:focus {
  background-color: #ffffff;
  border-color: #2d2621;
  box-shadow: none;
}

.cs-thread-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cs-thread-item {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 14px;
  border-radius: 14px;
  background-color: #ffffff;
  border: 1px solid #ede8e1;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.18s ease;
}

.cs-thread-item:hover {
  background-color: #fcfaf7;
  border-color: #ded6cb;
}

.cs-thread-item.is-active {
  background-color: #ffffff;
  border-color: #2d2621;
  box-shadow: 0 4px 14px rgba(45, 38, 33, 0.07);
}

.cs-thread-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.cs-avatar {
  width: 42px;
  height: 42px;
  border: 1px solid #ede8e1;
  flex-shrink: 0;
}

.cs-avatar-sm {
  width: 40px;
  height: 40px;
  border: 1px solid #ede8e1;
}

.cs-thread-content {
  flex: 1 1 0%;
  min-width: 0;
  overflow: hidden;
}

.cs-thread-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: 0;
  margin-bottom: 4px;
}

.cs-thread-name {
  font-size: 13.5px;
  font-weight: 700;
  color: #2d2621;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1 1 auto;
  min-width: 0;
}

.cs-thread-time {
  font-size: 10.5px;
  color: #8c827a;
  white-space: nowrap;
  flex-shrink: 0;
}

.cs-thread-msg {
  font-size: 11.5px;
  color: #70665f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  margin-bottom: 8px;
}

.cs-thread-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex-wrap: wrap;
}

.cs-status-tag {
  font-size: 10px;
  padding: 2px 9px;
  border-radius: 999px;
  font-weight: 600;
  white-space: nowrap;
}

.cs-status-tag.status-pending {
  background-color: #fff1f0;
  color: #cf1322;
  border: 1px solid #ffa39e;
}

.cs-status-tag.status-processing {
  background-color: #fffbe6;
  color: #d48806;
  border: 1px solid #ffe58f;
}

.cs-status-tag.status-resolved {
  background-color: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}

.cs-thread-unread {
  background-color: #dc3545;
  color: #ffffff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 中欄：主對話視窗 */
.cs-main-header {
  padding: 18px 24px;
  border-bottom: 1px solid #ede8e1;
  min-height: 76px;
}

.cs-status-select {
  font-size: 12px;
  padding: 6px 32px 6px 14px;
  border-color: #dcd6cd;
  cursor: pointer;
}

.cs-main-messages {
  background-color: #faf8f5;
  padding: 24px 28px;
  gap: 20px;
}

.cs-admin-bubble {
  max-width: 74%;
  padding: 14px 18px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(45, 38, 33, 0.04);
}

.cs-admin-bubble.is-admin {
  background-color: #2d2621;
  color: #ffffff;
  border-radius: 18px 18px 4px 18px;
}

.cs-admin-bubble.is-customer {
  background-color: #ffffff;
  color: #2d2621;
  border: 1px solid #e8e2da;
  border-radius: 18px 18px 18px 4px;
}

.cs-admin-image-wrap {
  border-radius: 12px;
  overflow: hidden;
  max-width: 280px;
}

.cs-admin-image {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  display: block;
  cursor: zoom-in;
  transition: opacity 0.15s ease;
}

.cs-admin-image:hover {
  opacity: 0.92;
}

.cs-main-footer {
  padding: 18px 24px;
  border-top: 1px solid #ede8e1;
}

.cs-pending-preview {
  background-color: #faf8f5;
  border: 1px solid #e8e2da;
  border-radius: 12px;
  padding: 8px 14px;
}

.cs-pending-thumb {
  width: 44px;
  height: 44px;
  border: 1px solid #ded6cb;
}

.cs-upload-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid #dcd6cd;
  background-color: #faf8f5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cs-upload-btn:hover {
  background-color: #f0ebe3;
  border-color: #9b7e68;
}

.cs-quick-reply-btn {
  background-color: #faf8f5;
  border: 1px solid #ded6cb;
  color: #70665f;
  border-radius: 999px;
  padding: 5px 13px;
  font-size: 11.5px;
  transition: all 0.15s ease;
}

.cs-quick-reply-btn:hover {
  background-color: #f0ebe3;
  color: #2d2621;
  border-color: #9b7e68;
}

.cs-reply-input {
  font-size: 13px;
  padding: 11px 18px;
  border-color: #dcd6cd;
  background-color: #faf8f5;
}

.cs-reply-input:focus {
  background-color: #ffffff;
  border-color: #2d2621;
  box-shadow: none;
}

.cs-reply-btn {
  font-size: 12.5px;
  padding: 11px 24px;
}

/* 右欄：客戶檔案區 */
.cs-profile-col {
  padding: 22px 20px;
  border-left: 1px solid #ede8e1;
  background-color: #fcfaf7 !important;
}

.cs-info-card {
  padding: 14px 16px;
  border-radius: 14px;
  background-color: #ffffff;
  border: 1px solid #ede8e1;
  box-shadow: 0 2px 6px rgba(45, 38, 33, 0.02);
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
</style>