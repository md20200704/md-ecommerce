<template>
  <main class="profile-page-container">
    
    <!-- 1. 未登入狀態 -->
    <div v-if="!isUserLoggedIn" class="profile-card text-center py-5 my-3">
      <User class="mb-2 opacity-40 text-muted" style="width: 44px; height: 44px;" />
      <h2 class="h5 fw-bold text-dark font-serif">請先登入會員帳號</h2>
      <p class="small text-muted mb-3">登入後即可檢視各狀態訂單、VIP 專屬折扣與生日禮券</p>
      <router-link to="/" class="btn btn-dark btn-sm rounded-pill px-4 py-2 fw-bold">
        返回首頁登入
      </router-link>
    </div>

    <!-- 2. 已登入會員中心 -->
    <div v-else class="d-flex flex-column gap-3 gap-md-4">
      
      <!-- ==================== 頂部 VIP 尊榮摘要卡片 (RWD 優化) ==================== -->
      <section class="profile-card vip-summary-card">
        <div class="vip-top-grid">
          <!-- 左側：會員名稱、徽章與累計消費 -->
          <div class="vip-info-col">
            <div class="d-flex align-items-center flex-wrap gap-2 mb-2">
              <h1 class="vip-user-name font-serif mb-0">{{ currentUser.name || '尊榮會員' }}</h1>
              
              <span
                class="badge rounded-pill px-3 py-1.5 font-monospace fw-bold d-inline-flex align-items-center gap-1"
                :class="vipTierInfo.badgeColor"
              >
                <Crown style="width: 13px; height: 13px;" />
                <span>{{ vipTierInfo.name }}</span>
              </span>

              <span class="badge bg-light text-dark border rounded-pill px-2.5 py-1 font-monospace" style="font-size: 11px;">
                🎂 {{ currentUser.birthday || '尚未填寫生日' }}
              </span>

              <span
                v-if="authStore.isCurrentUserBirthdayMonth"
                class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 font-monospace"
                style="font-size: 11px;"
              >
                🎉 本月壽星！
              </span>
            </div>

            <p class="small text-muted mb-2">{{ vipTierInfo.description }}</p>

            <div class="vip-meta-row font-monospace">
              <span>已結算累積消費：<strong class="text-dark">NT$ {{ (currentUser.totalSpent || 0).toLocaleString() }}</strong></span>
              <span class="d-none d-sm-inline text-muted">•</span>
              <span>點數回饋率：<strong class="text-primary">{{ vipTierInfo.pointsEarnRate }}%</strong></span>
            </div>
          </div>

          <!-- 右側：可用紅利點數盒（手機版橫向滿版對齊，桌機版靠右方塊） -->
          <div class="vip-points-box">
            <span class="points-label font-monospace">可用紅利點數</span>
            <div class="points-value font-monospace text-primary">
              {{ (currentUser.points || 0).toLocaleString() }}
              <span class="points-unit text-muted">點</span>
            </div>
          </div>
        </div>

        <!-- VIP 階級升級進度條 -->
        <div class="vip-progress-section">
          <div v-if="vipUpgradeProgress.nextTier" class="d-flex flex-column gap-2">
            <div class="vip-progress-header">
              <div class="text-dark small">
                距離晉升
                <span class="badge rounded-pill font-monospace mx-1" :class="vipUpgradeProgress.nextTier.badgeColor" style="font-size: 10.5px;">
                  {{ vipUpgradeProgress.nextTier.name }}
                </span>
                還差
                <strong class="font-monospace text-danger">
                  NT$ {{ vipUpgradeProgress.amountNeeded.toLocaleString() }}
                </strong>
              </div>

              <div class="text-muted font-monospace" style="font-size: 11px;">
                升級解鎖：
                <strong class="text-dark">
                  {{ vipUpgradeProgress.nextTier.discountRate === 1 ? '原價' : Math.round(vipUpgradeProgress.nextTier.discountRate * 100) + ' 折' }}
                </strong>
                +
                <strong class="text-primary">{{ vipUpgradeProgress.nextTier.pointsEarnRate }}% 回饋</strong>
              </div>
            </div>

            <div class="progress bg-light border" style="height: 9px; border-radius: 999px;">
              <div
                class="progress-bar bg-dark"
                role="progressbar"
                :style="{ width: vipUpgradeProgress.percentage + '%' }"
                :aria-valuenow="vipUpgradeProgress.percentage"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>

            <div class="vip-progress-foot font-monospace text-muted">
              <span>目前門檻：${{ vipUpgradeProgress.currentMinSpend.toLocaleString() }}</span>
              <span class="text-dark fw-semibold">進度 {{ vipUpgradeProgress.percentage }}%</span>
              <span>下一階：${{ vipUpgradeProgress.nextTier.minSpend.toLocaleString() }}</span>
            </div>
          </div>

          <div v-else class="d-flex flex-column gap-2">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 small">
              <div class="text-dark fw-bold d-flex align-items-center gap-1.5">
                <Crown style="width: 15px; height: 15px; color: #d4a373;" />
                <span>您已達成全館最高尊榮等級【{{ vipTierInfo.name }}】！</span>
              </div>
              <span class="font-monospace text-primary" style="font-size: 11.5px;">
                持續享有最高 {{ vipTierInfo.discountRate === 1 ? '原價' : Math.round(vipTierInfo.discountRate * 100) + ' 折' }} 與 {{ vipTierInfo.pointsEarnRate }}% 點數回饋
              </span>
            </div>
            <div class="progress bg-light border" style="height: 9px; border-radius: 999px;">
              <div class="progress-bar bg-dark" role="progressbar" style="width: 100%;"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== 會員中心五大功能頁籤（支援手機橫向滑動不換行擠壓） ==================== -->
      <nav class="profile-tabs-bar no-scrollbar" aria-label="會員中心功能切換">
        <button
          v-for="tab in profileTabs"
          :key="tab.id"
          type="button"
          class="profile-tab-btn"
          :class="{ 'is-active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" style="width: 14px; height: 14px; flex-shrink: 0;" />
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.badge > 0"
            class="tab-badge font-monospace"
          >
            {{ tab.badge }}
          </span>
        </button>
      </nav>

      <!-- ==================== 分頁 1：我的訂單與進度（RWD 流程條 + 響應式收合訂單卡） ==================== -->
      <div v-if="activeTab === 'orders'" class="d-flex flex-column gap-3 gap-md-4">
        
        <!-- 1. 訂單狀態流程篩選條（手機版支援平滑橫向捲動，節點不擠壓） -->
        <div class="profile-card">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-dark font-monospace" style="font-size: 10px;">ORDER FLOW</span>
              <strong class="fs-6 font-serif text-dark">訂單狀態與售後進度</strong>
            </div>
            <span class="text-muted font-monospace" style="font-size: 11px;">
              點選節點篩選訂單
            </span>
          </div>

          <div class="order-flow-scroll no-scrollbar">
            <div class="order-flow-track">
              <div class="order-flow-line"></div>

              <button
                v-for="node in orderFlowNodes"
                :key="node.key"
                type="button"
                class="flow-node-btn"
                :class="{ 'is-selected': selectedOrderStatusFilter === node.key }"
                @click="selectedOrderStatusFilter = node.key"
              >
                <div class="position-relative">
                  <div class="flow-node-circle">
                    <component :is="node.icon" style="width: 16px; height: 16px;" />
                  </div>

                  <span
                    v-if="getOrderCountByNode(node.key) > 0"
                    class="flow-node-count font-monospace"
                  >
                    {{ getOrderCountByNode(node.key) }}
                  </span>
                </div>

                <div class="flow-node-label">{{ node.label }}</div>
                <div class="flow-node-sub font-monospace d-none d-md-block">{{ node.sublabel }}</div>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. 訂單列表區 -->
        <div class="d-flex flex-column gap-3">
          <div class="d-flex justify-content-between align-items-center px-1">
            <div class="d-flex align-items-center gap-2">
              <h2 class="fs-6 fw-bold text-dark font-serif mb-0">{{ currentFilterNodeLabel }}</h2>
              <span class="text-muted small font-monospace">({{ filteredUserOrders.length }})</span>
            </div>

            <div class="d-flex align-items-center gap-2">
              <button
                v-if="filteredUserOrders.length > 0"
                type="button"
                class="btn btn-link btn-sm text-secondary text-decoration-none p-0 px-2 font-monospace"
                style="font-size: 12px;"
                @click="toggleAllUserOrders"
              >
                {{ areAllFilteredExpanded ? '全部收合' : '全部展開' }}
              </button>
              <button
                v-if="selectedOrderStatusFilter !== 'ALL'"
                type="button"
                class="btn btn-outline-dark btn-sm rounded-pill px-3 py-0.5 font-monospace"
                style="font-size: 11px;"
                @click="selectedOrderStatusFilter = 'ALL'"
              >
                查看全部
              </button>
            </div>
          </div>

          <!-- 單筆訂單卡片（RWD 雙層標頭，手機版不亂折行） -->
          <div v-if="filteredUserOrders.length > 0" class="d-flex flex-column gap-3">
            <div
              v-for="ord in filteredUserOrders"
              :key="ord.orderId || ord.id"
              class="minimal-order-card bg-white rounded-4 border overflow-hidden"
              :class="{ 'is-open': isOrderExpanded(ord.orderId || ord.id) }"
            >
              <!-- 收合標頭列 -->
              <div
                class="minimal-order-header"
                @click="toggleOrderExpand(ord.orderId || ord.id)"
              >
                <!-- 第一區塊：單號與日期 -->
                <div class="order-head-main">
                  <span class="font-monospace fw-bold text-dark" style="font-size: 14.5px;">
                    #{{ ord.orderId || ord.id }}
                  </span>
                  <span class="text-muted font-monospace" style="font-size: 11.5px;">
                    {{ ord.createdAt || ord.date }}
                  </span>
                </div>

                <!-- 第二區塊：狀態與件數 -->
                <div class="order-head-status">
                  <span class="status-pill d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill fw-medium" :class="getCleanStatusClass(ord.status)">
                    <span class="status-dot"></span>
                    <span>{{ ord.status }}</span>
                  </span>
                  <span class="text-muted font-monospace" style="font-size: 12px;">
                    共 {{ getOrderTotalQty(ord) }} 件
                  </span>
                </div>

                <!-- 第三區塊：總額與展開箭頭 -->
                <div class="order-head-price">
                  <span class="font-monospace fw-bold text-dark" style="font-size: 15.5px;">
                    NT$ {{ (ord.totalAmount || ord.total || 0).toLocaleString() }}
                  </span>
                  <ChevronDown
                    style="width: 18px; height: 18px;"
                    class="text-muted transition-icon flex-shrink-0"
                    :class="{ 'rotate-180 text-dark': isOrderExpanded(ord.orderId || ord.id) }"
                  />
                </div>
              </div>

              <!-- 展開明細區 -->
              <div v-show="isOrderExpanded(ord.orderId || ord.id)" class="minimal-order-body border-top">
                
                <!-- 1. 配送與結算摘要列 -->
                <div class="order-meta-bar">
                  <div class="d-flex flex-wrap gap-2 gap-sm-3 font-monospace" style="font-size: 12px;">
                    <span>付款：<strong class="text-dark">{{ ord.paymentMethod || 'LINE Pay' }}</strong></span>
                    <span>配送：<strong class="text-dark">{{ ord.shippingMethod === 'CVS' ? '超商純取貨' : '黑貓宅配' }}</strong></span>
                    <span v-if="ord.trackingNumber">單號：<strong class="text-dark">{{ ord.trackingNumber }}</strong></span>
                  </div>

                  <div class="font-monospace" style="font-size: 11.5px;">
                    <span v-if="ord.rewardsSettled" class="text-success">✓ 已計入累積消費與點數</span>
                    <span v-else class="text-muted">簽收完成後計入累積消費</span>
                  </div>
                </div>

                <!-- 2. 購買商品明細（RWD 防破版） -->
                <div class="d-flex flex-column gap-2.5 mb-3">
                  <div
                    v-for="(item, idx) in (ord.items || [])"
                    :key="idx"
                    class="order-item-row"
                  >
                    <div class="d-flex align-items-center gap-2.5 min-w-0 flex-grow-1">
                      <div
                        v-if="item.image"
                        class="rounded-3 overflow-hidden border flex-shrink-0"
                        style="width: 50px; height: 62px; background-color: #f7f4ef;"
                      >
                        <img :src="item.image" class="w-100 h-100 object-fit-cover" />
                      </div>
                      <div class="min-w-0 flex-grow-1">
                        <div class="order-item-title text-dark fw-semibold">
                          {{ item.name }}
                        </div>
                        <div class="text-muted font-monospace mt-0.5" style="font-size: 11.5px;">
                          {{ item.color }} / {{ item.size }} × {{ item.quantity }}
                        </div>
                      </div>
                    </div>

                    <div class="order-item-right">
                      <span class="font-monospace text-dark fw-bold" style="font-size: 13.5px;">
                        NT$ {{ ((item.price || 0) * (item.quantity || 1)).toLocaleString() }}
                      </span>
                      <button
                        v-if="ord.status === '已完成'"
                        type="button"
                        class="btn btn-outline-secondary btn-sm rounded-pill px-2.5 py-0.5 font-monospace"
                        style="font-size: 11px;"
                        @click="openReviewPrompt(item, ord.orderId || ord.id)"
                      >
                        評價
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 3. 收件資訊與操作按鈕（手機版自動滿版按鈕） -->
                <div class="order-foot-bar">
                  <span class="text-muted font-monospace" style="font-size: 11.5px;">
                    收件：{{ ord.recipientName || currentUser.name }} · {{ ord.shippingAddress || '預設收件地址' }}
                  </span>

                  <div class="order-foot-actions">
                    <button
                      v-if="ord.status === '配送中'"
                      type="button"
                      class="btn btn-dark btn-sm rounded-pill px-4 py-1.5 font-monospace flex-grow-1 flex-sm-grow-0"
                      style="font-size: 12px;"
                      @click="confirmOrderReceived(ord)"
                    >
                      確認收貨完成
                    </button>
                    <button
                      v-if="ord.status === '已完成'"
                      type="button"
                      class="btn btn-outline-secondary btn-sm rounded-pill px-3.5 py-1.5 font-monospace flex-grow-1 flex-sm-grow-0"
                      style="font-size: 11.5px;"
                      @click="requestOrderReturn(ord)"
                    >
                      申請退貨
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div v-else class="profile-card text-center py-5 text-muted small">
            目前「{{ currentFilterNodeLabel }}」分類下尚無訂單紀錄。
          </div>
        </div>
      </div>

      <!-- ==================== 分頁 2：我的優惠券錢包（RWD 票券排版） ==================== -->
      <div v-else-if="activeTab === 'coupons'" class="d-flex flex-column gap-3">
        <div class="profile-card">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2.5">
            <label class="form-label fw-bold text-dark small mb-0 d-flex align-items-center gap-1.5">
              <Ticket style="width: 15px; height: 15px;" class="text-primary" />
              <span>輸入專屬優惠碼領取優惠券</span>
            </label>
            <span class="text-muted font-monospace" style="font-size: 11px;">
              可用代碼：<code>WINTER88</code>、<code>VIP200</code>、<code>HBD300</code>
            </span>
          </div>

          <div class="coupon-claim-row">
            <input
              v-model="claimCodeInput"
              type="text"
              class="form-control form-control-sm font-monospace text-uppercase"
              placeholder="輸入優惠碼領取..."
              @keyup.enter="handleClaimCoupon"
            />
            <button
              type="button"
              class="btn btn-dark btn-sm rounded-pill px-4 text-nowrap font-monospace"
              @click="handleClaimCoupon"
            >
              立即領取
            </button>
          </div>
        </div>

        <div v-if="(currentUser.myCoupons || []).length > 0" class="row g-3">
          <div
            v-for="cpn in currentUser.myCoupons"
            :key="cpn.instanceId"
            class="col-12 col-md-6"
          >
            <div
              class="coupon-ticket-card bg-white rounded-4 border h-100"
              :class="{ 'opacity-50 bg-light': cpn.isUsed }"
            >
              <div class="coupon-ticket-left">
                <div class="d-flex align-items-center flex-wrap gap-1.5 mb-1">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
                    {{ cpn.code }}
                  </span>
                  <strong class="text-dark small">{{ cpn.title }}</strong>
                </div>
                <div class="text-muted font-monospace" style="font-size: 11px;">
                  低消滿 NT$ {{ (cpn.minSpend || 0).toLocaleString() }} · 到期 {{ cpn.expiryDate }}
                </div>
                <div class="text-secondary mt-1" style="font-size: 10.5px;">
                  來源：{{ cpn.source }}
                </div>
              </div>

              <div class="coupon-ticket-right">
                <div class="fs-5 fw-bold font-monospace text-dark">
                  {{ cpn.type === 'FIXED' ? `-$${cpn.value}` : `${Math.round(cpn.value * 100)}折` }}
                </div>
                <span v-if="cpn.isUsed" class="badge bg-secondary font-monospace mt-1" style="font-size: 10px;">
                  已使用
                </span>
                <router-link
                  v-else
                  to="/checkout"
                  class="btn btn-outline-dark btn-sm rounded-pill py-1 px-2.5 font-monospace mt-1 text-nowrap"
                  style="font-size: 10.5px;"
                >
                  去結帳 →
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="profile-card text-center py-5 text-muted small">
          目前優惠券錢包尚無可用禮券，請於上方輸入優惠碼進行領取！
        </div>
      </div>

      <!-- ==================== 分頁 3：會員基本資料與生日設定 ==================== -->
      <div v-else-if="activeTab === 'profile'" class="profile-card">
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

      <!-- ==================== 分頁 4：我的愛心收藏清單 ==================== -->
      <div v-else-if="activeTab === 'wishlist'">
        <div v-if="wishlistProducts.length > 0" class="row g-3 g-md-4">
          <div v-for="prod in wishlistProducts" :key="prod.id" class="col-6 col-md-4 col-lg-3">
            <ProductCard :product="prod" />
          </div>
        </div>
        <div v-else class="profile-card text-center py-5 text-muted small">
          尚未收藏任何商品，點擊商品卡片右上角的愛心即可加入收藏！
        </div>
      </div>

      <!-- ==================== 分頁 5：常用收件地址簿 ==================== -->
      <div v-else-if="activeTab === 'addresses'" class="d-flex flex-column gap-3">
        <div class="profile-card">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
            <h2 class="fs-6 fw-bold text-dark mb-0">常用收件地址管理</h2>
            <button
              type="button"
              class="btn btn-outline-dark btn-sm rounded-pill px-3 font-monospace"
              style="font-size: 11px;"
              @click="showAddressForm = !showAddressForm"
            >
              {{ showAddressForm ? '取消新增' : '+ 新增收件地址' }}
            </button>
          </div>

          <form v-if="showAddressForm" @submit.prevent="handleAddAddress" class="p-3 bg-light rounded-3 border mb-3 row g-2.5 small">
            <div class="col-12 col-sm-6">
              <input v-model="newAddressForm.recipientName" required type="text" class="form-control form-control-sm" placeholder="收件人姓名 *" />
            </div>
            <div class="col-12 col-sm-6">
              <input v-model="newAddressForm.phone" required type="tel" class="form-control form-control-sm font-monospace" placeholder="聯絡手機 *" />
            </div>
            <div class="col-6 col-sm-4">
              <input v-model="newAddressForm.city" required type="text" class="form-control form-control-sm" placeholder="縣市" />
            </div>
            <div class="col-6 col-sm-4">
              <input v-model="newAddressForm.district" required type="text" class="form-control form-control-sm" placeholder="行政區" />
            </div>
            <div class="col-12 col-sm-4">
              <input v-model="newAddressForm.detail" required type="text" class="form-control form-control-sm" placeholder="詳細街道門牌 *" />
            </div>
            <div class="col-12 text-end">
              <button type="submit" class="btn btn-dark btn-sm rounded-pill px-4 py-1.5 font-monospace w-100 w-sm-auto">
                儲存此地址
              </button>
            </div>
          </form>

          <div class="d-flex flex-column gap-2.5">
            <div
              v-for="addr in (currentUser.savedAddresses || [])"
              :key="addr.id"
              class="address-item-card"
            >
              <div class="small min-w-0">
                <div class="d-flex align-items-center flex-wrap gap-2">
                  <strong class="text-dark">{{ addr.recipientName }}</strong>
                  <span class="font-monospace text-muted">{{ addr.phone }}</span>
                </div>
                <div class="text-secondary mt-1">{{ addr.city }}{{ addr.district }}{{ addr.detail }}</div>
              </div>
              <button
                type="button"
                class="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 font-monospace flex-shrink-0"
                style="font-size: 11px;"
                @click="authStore.removeAddress(addr.id)"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import {
  Crown,
  Ticket,
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Layers,
  Package,
  Truck,
  CheckCircle2,
  RotateCcw,
  ChevronDown
} from 'lucide-vue-next'
import ProductCard from '../components/ProductCard.vue'
import { useAuthStore } from '../stores/authStore'
import { useAdminStore } from '../stores/adminStore'
import { useProductStore } from '../stores/productStore'
import { useMarketingStore } from '../stores/marketingStore'

const authStore = useAuthStore()
const adminStore = useAdminStore()
const productStore = useProductStore()
const marketingStore = useMarketingStore()

const activeTab = ref('orders')

const currentUser = computed(() => authStore.user || {})
const isUserLoggedIn = computed(() => Boolean(authStore.user?.isLoggedIn || authStore.isLoggedIn))

const vipTierInfo = computed(() => {
  return authStore.currentVipTier || {
    id: 'GENERAL',
    name: '一般會員 (GENERAL)',
    minSpend: 0,
    discountRate: 1.0,
    pointsEarnRate: 1,
    badgeColor: 'bg-secondary-subtle text-secondary',
    description: '註冊即享基礎會員資格'
  }
})

const vipUpgradeProgress = computed(() => {
  const spent = Number(currentUser.value.totalSpent || 0)
  const tiers = [...(marketingStore.vipTiers || [])].sort((a, b) => a.minSpend - b.minSpend)

  const currentIndex = tiers.findIndex(t => t.id === vipTierInfo.value.id)
  const nextTier = currentIndex >= 0 && currentIndex < tiers.length - 1
    ? tiers[currentIndex + 1]
    : tiers.find(t => t.minSpend > spent) || null

  if (!nextTier) {
    return {
      nextTier: null,
      currentMinSpend: vipTierInfo.value.minSpend || 0,
      amountNeeded: 0,
      percentage: 100
    }
  }

  const currentMinSpend = vipTierInfo.value.minSpend || 0
  const targetMinSpend = nextTier.minSpend
  const amountNeeded = Math.max(0, targetMinSpend - spent)
  const range = Math.max(1, targetMinSpend - currentMinSpend)
  const percentage = Math.min(100, Math.max(5, Math.round(((spent - currentMinSpend) / range) * 100)))

  return {
    nextTier,
    currentMinSpend,
    amountNeeded,
    percentage
  }
})

const availableCouponsCount = computed(() => {
  return (authStore.availableUserCoupons || []).length
})

const profileTabs = computed(() => [
  { id: 'orders', label: '我的訂單與進度', icon: ShoppingBag, badge: userOrders.value.length },
  { id: 'coupons', label: '我的優惠券錢包', icon: Ticket, badge: availableCouponsCount.value },
  { id: 'profile', label: '會員資料與生日', icon: User, badge: 0 },
  { id: 'wishlist', label: '愛心收藏清單', icon: Heart, badge: wishlistProducts.value.length },
  { id: 'addresses', label: '常用收件地址', icon: MapPin, badge: 0 }
])

const userOrders = computed(() => {
  const allOrders = adminStore.orders || []
  const email = currentUser.value.email
  const phone = currentUser.value.phone
  const name = currentUser.value.name
  const matched = allOrders.filter(
    o => o.email === email || o.phone === phone || o.recipientName === name || o.customerName === name
  )
  return matched.length > 0 ? matched : allOrders
})

const selectedOrderStatusFilter = ref('ALL')

const expandedOrderIds = ref({})
const hasInitializedExpand = ref(false)

const isOrderExpanded = (id) => {
  if (!hasInitializedExpand.value && userOrders.value.length > 0) {
    const firstId = userOrders.value[0].orderId || userOrders.value[0].id
    expandedOrderIds.value[firstId] = true
    hasInitializedExpand.value = true
  }
  return Boolean(expandedOrderIds.value[id])
}

const toggleOrderExpand = (id) => {
  expandedOrderIds.value[id] = !isOrderExpanded(id)
}

const areAllFilteredExpanded = computed(() => {
  if (filteredUserOrders.value.length === 0) return false
  return filteredUserOrders.value.every(o => isOrderExpanded(o.orderId || o.id))
})

const toggleAllUserOrders = () => {
  const targetState = !areAllFilteredExpanded.value
  filteredUserOrders.value.forEach(o => {
    expandedOrderIds.value[o.orderId || o.id] = targetState
  })
}

const getOrderTotalQty = (ord) => {
  return (ord.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
}

const orderFlowNodes = [
  { key: 'ALL', label: '全部訂單', sublabel: '所有交易紀錄', icon: Layers },
  { key: 'PACKING', label: '待出貨', sublabel: '已付款理貨中', icon: Package },
  { key: 'SHIPPING', label: '配送中', sublabel: '宅配/超商轉運', icon: Truck },
  { key: 'COMPLETED', label: '已完成', sublabel: '計入消費與點數', icon: CheckCircle2 },
  { key: 'RETURN', label: '售後/退貨', sublabel: '退貨與取消紀錄', icon: RotateCcw }
]

const matchOrderNode = (ord, nodeKey) => {
  if (nodeKey === 'ALL') return true
  const st = ord.status || ''
  if (nodeKey === 'PACKING') return ['待出貨', '處理中', '已付款'].includes(st)
  if (nodeKey === 'SHIPPING') return st === '配送中'
  if (nodeKey === 'COMPLETED') return st === '已完成'
  if (nodeKey === 'RETURN') return ['退貨審核中', '已退貨', '已取消'].includes(st)
  return false
}

const getOrderCountByNode = (nodeKey) => {
  return userOrders.value.filter(o => matchOrderNode(o, nodeKey)).length
}

const filteredUserOrders = computed(() => {
  return userOrders.value.filter(o => matchOrderNode(o, selectedOrderStatusFilter.value))
})

const currentFilterNodeLabel = computed(() => {
  const found = orderFlowNodes.find(n => n.key === selectedOrderStatusFilter.value)
  return found ? found.label : '全部訂單'
})

const getCleanStatusClass = (status) => {
  if (['待出貨', '處理中'].includes(status)) return 'pill-pending'
  if (status === '配送中') return 'pill-shipping'
  if (status === '已完成') return 'pill-completed'
  return 'pill-return'
}

const confirmOrderReceived = (ord) => {
  if (confirm(`確認已收到訂單 #${ord.orderId || ord.id} 的所有商品嗎？確認後將正式計入您的累積消費與紅利點數。`)) {
    ord.status = '已完成'

    let notifyMsg = '訂單已完成簽收！'
    if (authStore.settleCompletedOrderRewards) {
      const res = authStore.settleCompletedOrderRewards(ord)
      if (res.settled) {
        notifyMsg += `\n已為您累積消費 NT$ ${(ord.totalAmount || ord.total || 0).toLocaleString()}，並入帳 ${res.earnedPoints} 點紅利點數！`
        if (res.upgraded) {
          const giftNames = (res.issuedCoupons || []).map(c => `【${c.title}】`).join('、')
          notifyMsg += `\n🎉 恭喜晉升為「${res.newTier.name}」！${giftNames ? `系統已自動發送升級禮券 ${giftNames} 至您的優惠券錢包！` : ''}`
        }
      }
    }

    if (adminStore.addAuditLog) {
      adminStore.addAuditLog('會員確認收貨', `訂單 #${ord.orderId || ord.id} 已由會員確認收貨並完成消費結算`)
    }
    alert(notifyMsg)
  }
}

const requestOrderReturn = (ord) => {
  const reason = prompt(`申請訂單 #${ord.orderId || ord.id} 退貨/售後服務，請填寫原因：`, '尺寸不合需申請退貨')
  if (reason && reason.trim()) {
    ord.status = '退貨審核中'
    if (adminStore.addAuditLog) {
      adminStore.addAuditLog('會員申請售後退貨', `訂單 #${ord.orderId || ord.id} 提出售後申請，原因：${reason}`)
    }
    selectedOrderStatusFilter.value = 'RETURN'
    alert('已送出售後退貨申請，已為您切換至「售後/退貨」分類檢視！')
  }
}

const openReviewPrompt = (item, orderId) => {
  const content = prompt(`為商品【${item.name}】(訂單 #${orderId}) 撰寫五星好評：`, '版型非常修飾，材質親膚有質感！')
  if (content && content.trim()) {
    alert('感謝您的真實評價，已發布至商品頁面！')
  }
}

const claimCodeInput = ref('')

const handleClaimCoupon = () => {
  if (!claimCodeInput.value.trim()) {
    alert('請輸入優惠碼！')
    return
  }
  if (authStore.claimCouponByCode) {
    const res = authStore.claimCouponByCode(claimCodeInput.value, '會員中心輸入優惠碼領取')
    alert(res.message)
    if (res.success) claimCodeInput.value = ''
  }
}

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

const wishlistProducts = computed(() => {
  const ids = currentUser.value.wishlist || []
  return (productStore.products || []).filter(p => ids.includes(p.id))
})

const showAddressForm = ref(false)
const newAddressForm = reactive({ recipientName: '', phone: '', city: '台北市', district: '', detail: '' })

const handleAddAddress = () => {
  if (authStore.addAddress) {
    authStore.addAddress({
      type: 'HOME',
      recipientName: newAddressForm.recipientName,
      phone: newAddressForm.phone,
      city: newAddressForm.city,
      district: newAddressForm.district,
      detail: newAddressForm.detail,
      isDefault: false
    })
  }
  newAddressForm.recipientName = ''
  newAddressForm.phone = ''
  newAddressForm.district = ''
  newAddressForm.detail = ''
  showAddressForm.value = false
}
</script>

<style scoped>
/* ==================== 1. 頁面外框與基礎卡片 RWD ==================== */
.profile-page-container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 16px 14px 48px;
}

@media (min-width: 768px) {
  .profile-page-container {
    padding: 32px 24px 64px;
  }
}

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

/* ==================== 2. 頂部 VIP 摘要卡 RWD ==================== */
.vip-top-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 992px) {
  .vip-top-grid {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.vip-user-name {
  font-size: 20px;
  font-weight: 700;
  color: #2d2621;
}

@media (min-width: 768px) {
  .vip-user-name {
    font-size: 24px;
  }
}

.vip-meta-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6e655f;
}

@media (min-width: 576px) {
  .vip-meta-row {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }
}

/* 紅利點數盒：手機版為橫向全寬列，桌機版為固定寬度方塊 */
.vip-points-box {
  background-color: #faf8f5;
  border: 1px solid #e8e2da;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media (min-width: 992px) {
  .vip-points-box {
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    min-width: 210px;
    padding: 14px 20px;
  }
}

.points-label {
  font-size: 11px;
  color: #8c8279;
}

.points-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
}

.points-unit {
  font-size: 13px;
  font-weight: 400;
}

.vip-progress-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #eee8df;
}

.vip-progress-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@media (min-width: 768px) {
  .vip-progress-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.vip-progress-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px;
  font-size: 10.5px;
}

/* ==================== 3. 五大功能頁籤橫軸 RWD ==================== */
.profile-tabs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 10px;
  border-bottom: 1px solid #e8e2da;
  -webkit-overflow-scrolling: touch;
}

.profile-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid #e4ddd3;
  background-color: #ffffff;
  color: #595959;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.profile-tab-btn.is-active {
  background-color: #2d2621;
  border-color: #2d2621;
  color: #ffffff;
}

.tab-badge {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 999px;
  background-color: #f0ece6;
  color: #2d2621;
}

.profile-tab-btn.is-active .tab-badge {
  background-color: #ffffff;
  color: #2d2621;
}

/* ==================== 4. 訂單流程條 RWD（手機橫向滑動不重疊） ==================== */
.order-flow-scroll {
  background-color: #faf8f5;
  border: 1px solid #ebe5dd;
  border-radius: 12px;
  padding: 16px 10px;
  overflow-x: auto;
}

.order-flow-track {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  min-width: 390px;
}

.order-flow-line {
  position: absolute;
  top: 19px;
  left: 36px;
  right: 36px;
  height: 2px;
  background-color: #dfd8ce;
  z-index: 1;
}

.flow-node-btn {
  position: relative;
  z-index: 2;
  flex: 1 0 78px;
  background: transparent;
  border: none;
  padding: 0 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
}

.flow-node-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: #ffffff;
  border: 1px solid #d8d0c5;
  color: #6e655f;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.flow-node-btn.is-selected .flow-node-circle {
  background-color: #2d2621;
  border-color: #2d2621;
  color: #ffffff;
  transform: scale(1.08);
}

.flow-node-count {
  position: absolute;
  top: -4px;
  right: -8px;
  background-color: #9b7e68;
  color: #ffffff;
  font-size: 9.5px;
  padding: 1px 6px;
  border-radius: 999px;
}

.flow-node-label {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #787167;
  white-space: nowrap;
}

.flow-node-btn.is-selected .flow-node-label {
  color: #2d2621;
}

.flow-node-sub {
  font-size: 10px;
  color: #9c9289;
  margin-top: 2px;
}

/* ==================== 5. 單筆訂單卡片 RWD ==================== */
.minimal-order-card {
  border-color: #e8e2da !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.minimal-order-card.is-open {
  border-color: #2d2621 !important;
  box-shadow: 0 6px 20px rgba(45, 38, 33, 0.05);
}

/* 手機版改用 Grid 雙層對齊，桌機版自動轉為單列 Flex */
.minimal-order-header {
  padding: 16px;
  cursor: pointer;
  background-color: #ffffff;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px 12px;
  align-items: center;
}

@media (min-width: 768px) {
  .minimal-order-header {
    padding: 18px 24px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }
}

.order-head-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-head-status {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-self: end;
}

@media (min-width: 768px) {
  .order-head-status {
    justify-self: auto;
    gap: 12px;
  }
}

.order-head-price {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px dashed #eee8df;
}

@media (min-width: 768px) {
  .order-head-price {
    grid-column: auto;
    padding-top: 0;
    border-top: none;
    gap: 12px;
    margin-left: auto;
  }
}

.minimal-order-body {
  padding: 16px;
  background-color: #faf8f5;
  border-color: #eee9e2 !important;
}

@media (min-width: 768px) {
  .minimal-order-body {
    padding: 22px 24px;
  }
}

.order-meta-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid #ebe5dd;
}

@media (min-width: 768px) {
  .order-meta-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.order-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
}

.order-item-title {
  font-size: 13.5px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.order-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

@media (min-width: 576px) {
  .order-item-right {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }
}

.order-foot-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid #ebe5dd;
}

@media (min-width: 576px) {
  .order-foot-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.order-foot-actions {
  display: flex;
  gap: 8px;
  width: 100%;
}

@media (min-width: 576px) {
  .order-foot-actions {
    width: auto;
  }
}

/* ==================== 6. 優惠券票卡與地址簿 RWD ==================== */
.coupon-claim-row {
  display: flex;
  gap: 8px;
  max-width: 480px;
}

.coupon-ticket-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-color: #e8e2da !important;
}

.coupon-ticket-left {
  min-width: 0;
  flex: 1 1 auto;
}

.coupon-ticket-right {
  flex-shrink: 0;
  text-align: right;
  padding-left: 14px;
  border-left: 1px dashed #dfd8ce;
}

.address-item-card {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #e8e2da;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* 狀態圓點標籤 */
.status-pill {
  font-size: 11.5px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.pill-pending {
  background-color: #fff2f0;
  color: #cf1322;
}
.pill-pending .status-dot {
  background-color: #cf1322;
}

.pill-shipping {
  background-color: #fffbe6;
  color: #d48806;
}
.pill-shipping .status-dot {
  background-color: #d48806;
}

.pill-completed {
  background-color: #f6ffed;
  color: #389e0d;
}
.pill-completed .status-dot {
  background-color: #389e0d;
}

.pill-return {
  background-color: #f5f5f5;
  color: #595959;
}
.pill-return .status-dot {
  background-color: #8c8c8c;
}

.transition-icon {
  transition: transform 0.25s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>