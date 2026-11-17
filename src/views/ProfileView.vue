<template>
  <main class="container py-4 py-md-5 profile-page-container" style="max-width: 1120px; margin: 0 auto;">
    
    <!-- 1. 未登入狀態 -->
    <div v-if="!isUserLoggedIn" class="card-korean text-center py-5 my-4 bg-white border shadow-xs">
      <User class="mb-2 opacity-40 text-muted" style="width: 44px; height: 44px;" />
      <h2 class="h5 fw-bold text-dark font-serif">請先登入會員帳號</h2>
      <p class="small text-muted mb-3">登入後即可檢視各狀態訂單、VIP 專屬折扣與生日禮券</p>
      <router-link to="/" class="btn btn-primary btn-sm rounded-pill px-4 py-2 fw-bold">
        返回首頁登入
      </router-link>
    </div>

    <!-- 2. 已登入會員中心 -->
    <div v-else class="d-flex flex-column gap-4">
      
      <!-- 頂部 VIP 尊榮摘要卡片 (含動態 VIP 階級升級進度條) -->
      <div class="card-korean p-4 bg-white border shadow-xs">
        <div class="row g-3 align-items-center justify-content-between">
          <div class="col-12 col-lg-7">
            <div class="d-flex align-items-center flex-wrap gap-2 mb-2">
              <h1 class="h4 fw-bold text-dark font-serif mb-0">{{ currentUser.name || '尊榮會員' }}</h1>
              
              <span
                class="badge rounded-pill px-3 py-1.5 font-monospace fw-bold d-inline-flex align-items-center gap-1"
                :class="vipTierInfo.badgeColor"
              >
                <Crown style="width: 13px; height: 13px;" />
                <span>{{ vipTierInfo.name }}</span>
              </span>

              <span class="badge bg-light text-dark border rounded-pill px-2.5 py-1 font-monospace" style="font-size: 11px;">
                🎂 生日：{{ currentUser.birthday || '尚未填寫' }}
              </span>

              <span
                v-if="authStore.isCurrentUserBirthdayMonth"
                class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 font-monospace"
                style="font-size: 11px;"
              >
                🎉 本月壽星快樂！
              </span>
            </div>

            <p class="small text-muted mb-2">{{ vipTierInfo.description }}</p>

            <div class="d-flex align-items-center flex-wrap gap-3 small font-monospace text-secondary" style="font-size: 11.5px;">
              <span>累積消費：<strong class="text-dark">NT$ {{ (currentUser.totalSpent || 0).toLocaleString() }}</strong></span>
              <span>•</span>
              <span>點數回饋率：<strong class="text-primary">{{ vipTierInfo.pointsEarnRate }}%</strong></span>
            </div>
          </div>

          <div class="col-12 col-lg-5">
            <div class="row g-2.5 text-center text-lg-end">
              <div class="col-6">
                <div class="p-3 rounded-3 bg-light border h-100 d-flex flex-column justify-content-center">
                  <span class="text-muted font-monospace mb-1" style="font-size: 10.5px;">可用紅利點數</span>
                  <div class="fs-4 fw-bold font-monospace text-primary lh-1">
                    {{ (currentUser.points || 0).toLocaleString() }} <span class="fs-6 fw-normal text-muted">點</span>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="p-3 rounded-3 bg-light border h-100 d-flex flex-column justify-content-center">
                  <span class="text-muted font-monospace mb-1" style="font-size: 10.5px;">VIP 專屬折扣</span>
                  <div class="fs-4 fw-bold font-monospace text-dark lh-1">
                    {{ vipTierInfo.discountRate === 1 ? '原價' : Math.round(vipTierInfo.discountRate * 100) + ' 折' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ★ VIP 階級升級進度條區塊 ★ -->
        <div class="mt-3.5 pt-3 border-top">
          <div v-if="vipUpgradeProgress.nextTier" class="d-flex flex-column gap-2">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 small">
              <div class="text-dark">
                距離晉升
                <span class="badge rounded-pill font-monospace mx-1" :class="vipUpgradeProgress.nextTier.badgeColor" style="font-size: 10.5px;">
                  {{ vipUpgradeProgress.nextTier.name }}
                </span>
                還差
                <strong class="font-monospace text-danger fs-6">
                  NT$ {{ vipUpgradeProgress.amountNeeded.toLocaleString() }}
                </strong>
              </div>

              <div class="text-muted font-monospace" style="font-size: 11px;">
                升級解鎖：
                <strong class="text-dark">
                  {{ vipUpgradeProgress.nextTier.discountRate === 1 ? '原價' : Math.round(vipUpgradeProgress.nextTier.discountRate * 100) + ' 折' }}
                </strong>
                +
                <strong class="text-primary">{{ vipUpgradeProgress.nextTier.pointsEarnRate }}% 點數回饋</strong>
              </div>
            </div>

            <!-- 進度條主體 -->
            <div class="progress bg-light border" style="height: 10px; border-radius: 999px;">
              <div
                class="progress-bar bg-dark progress-bar-striped progress-bar-animated"
                role="progressbar"
                :style="{ width: vipUpgradeProgress.percentage + '%' }"
                :aria-valuenow="vipUpgradeProgress.percentage"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>

            <div class="d-flex justify-content-between align-items-center font-monospace text-muted" style="font-size: 10.5px;">
              <span>目前門檻：NT$ {{ vipUpgradeProgress.currentMinSpend.toLocaleString() }}</span>
              <span>進度 {{ vipUpgradeProgress.percentage }}%（NT$ {{ (currentUser.totalSpent || 0).toLocaleString() }} / NT$ {{ vipUpgradeProgress.nextTier.minSpend.toLocaleString() }}）</span>
              <span>下一階門檻：NT$ {{ vipUpgradeProgress.nextTier.minSpend.toLocaleString() }}</span>
            </div>
          </div>

          <!-- 已達最高等級 VIP 狀態顯示 -->
          <div v-else class="d-flex flex-column gap-2">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 small">
              <div class="text-dark fw-bold d-flex align-items-center gap-1.5">
                <Crown style="width: 15px; height: 15px; color: #d4a373;" />
                <span>您已達成全館最高尊榮等級【{{ vipTierInfo.name }}】！</span>
              </div>
              <span class="font-monospace text-primary small">
                持續享有最高 {{ vipTierInfo.discountRate === 1 ? '原價' : Math.round(vipTierInfo.discountRate * 100) + ' 折' }} 與 {{ vipTierInfo.pointsEarnRate }}% 點數回饋
              </span>
            </div>
            <div class="progress bg-light border" style="height: 10px; border-radius: 999px;">
              <div class="progress-bar bg-dark" role="progressbar" style="width: 100%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 會員中心五大功能頁籤 -->
      <div class="d-flex gap-2 border-bottom pb-2.5 overflow-x-auto no-scrollbar">
        <button
          v-for="tab in profileTabs"
          :key="tab.id"
          type="button"
          class="btn btn-sm rounded-pill px-3.5 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 text-nowrap"
          :class="activeTab === tab.id ? 'btn-dark shadow-2xs' : 'btn-light text-secondary border'"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" style="width: 14px; height: 14px;" />
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.badge > 0"
            class="badge rounded-pill font-monospace ms-0.5"
            :class="activeTab === tab.id ? 'bg-white text-dark' : 'bg-secondary-subtle text-dark'"
            style="font-size: 10px;"
          >
            {{ tab.badge }}
          </span>
        </button>
      </div>

      <!-- ==================== 分頁 1：我的訂單與可點擊狀態總流程條 ==================== -->
      <div v-if="activeTab === 'orders'" class="d-flex flex-column gap-4">
        
        <!-- 互動式訂單與售後總流程進度條（點擊任一狀態節點即可篩選檢視該狀態訂單） -->
        <div class="card-korean p-4 bg-white border shadow-xs">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
            <div>
              <span class="badge bg-dark font-monospace me-2" style="font-size: 10px;">ORDER FLOW FILTER</span>
              <strong class="fs-6 font-serif text-dark">訂單狀態與售後進度總覽</strong>
            </div>
            <span class="small text-muted font-monospace" style="font-size: 11px;">
              點擊下方各流程節點，即可篩選查看對應狀態的訂單
            </span>
          </div>

          <div class="py-3 px-2 px-md-4 rounded-3 bg-light border">
            <div class="d-flex justify-content-between align-items-start position-relative">
              <div
                class="position-absolute start-0 w-100 bg-secondary-subtle"
                style="top: 19px; height: 2px; z-index: 1;"
              ></div>

              <button
                v-for="node in orderFlowNodes"
                :key="node.key"
                type="button"
                class="btn p-0 border-0 bg-transparent d-flex flex-column align-items-center text-center position-relative flow-node-btn"
                style="z-index: 2; width: 20%;"
                @click="selectedOrderStatusFilter = node.key"
              >
                <div class="position-relative">
                  <div
                    class="rounded-circle d-flex align-items-center justify-content-center font-monospace fw-bold border shadow-2xs transition"
                    :class="selectedOrderStatusFilter === node.key ? 'bg-dark text-white border-dark scale-active' : 'bg-white text-secondary border-secondary-subtle'"
                    style="width: 38px; height: 38px;"
                  >
                    <component :is="node.icon" style="width: 16px; height: 16px;" />
                  </div>

                  <span
                    v-if="getOrderCountByNode(node.key) > 0"
                    class="position-absolute top-0 start-100 translate-middle badge rounded-pill font-monospace"
                    :class="selectedOrderStatusFilter === node.key ? 'bg-primary text-white' : 'bg-secondary text-white'"
                    style="font-size: 9.5px;"
                  >
                    {{ getOrderCountByNode(node.key) }}
                  </span>
                </div>

                <div
                  class="mt-2 font-sans fw-bold"
                  :class="selectedOrderStatusFilter === node.key ? 'text-dark' : 'text-muted'"
                  style="font-size: 12px;"
                >
                  {{ node.label }}
                </div>

                <div class="text-muted font-monospace d-none d-sm-block mt-0.5" style="font-size: 10px;">
                  {{ node.sublabel }}
                </div>

                <div
                  v-if="selectedOrderStatusFilter === node.key"
                  class="mt-1.5 rounded-pill bg-dark"
                  style="width: 24px; height: 3px;"
                ></div>
              </button>
            </div>
          </div>
        </div>

        <!-- 依選中狀態篩選後的訂單明細列表 -->
        <div class="d-flex flex-column gap-3">
          <div class="d-flex justify-content-between align-items-center">
            <h2 class="fs-6 fw-bold text-dark font-serif mb-0">
              {{ currentFilterNodeLabel }} ({{ filteredUserOrders.length }} 筆)
            </h2>
            <button
              v-if="selectedOrderStatusFilter !== 'ALL'"
              type="button"
              class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-0.5 font-monospace"
              style="font-size: 11px;"
              @click="selectedOrderStatusFilter = 'ALL'"
            >
              顯示全部訂單
            </button>
          </div>

          <div v-if="filteredUserOrders.length > 0" class="d-flex flex-column gap-3">
            <div
              v-for="ord in filteredUserOrders"
              :key="ord.orderId || ord.id"
              class="card-korean p-3.5 p-md-4 bg-white border shadow-xs"
            >
              <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-2.5 mb-2.5 border-bottom">
                <div>
                  <span class="font-monospace fw-bold text-dark me-2">#{{ ord.orderId || ord.id }}</span>
                  <span class="text-muted font-monospace small">{{ ord.createdAt || ord.date }}</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span v-if="ord.trackingNumber" class="badge bg-light text-dark border font-monospace" style="font-size: 10.5px;">
                    物流單號：{{ ord.trackingNumber }}
                  </span>
                  <span class="badge rounded-pill font-monospace px-2.5 py-1" :class="getOrderStatusBadge(ord.status)">
                    {{ ord.status }}
                  </span>
                </div>
              </div>

              <div class="d-flex flex-column gap-2 mb-3">
                <div
                  v-for="(item, idx) in (ord.items || [])"
                  :key="idx"
                  class="d-flex justify-content-between align-items-center flex-wrap gap-2 small py-1"
                >
                  <div class="text-dark">
                    • <strong>{{ item.name }}</strong>
                    <span class="text-muted font-monospace ms-1">({{ item.color }}/{{ item.size }}) × {{ item.quantity }}</span>
                  </div>

                  <div class="d-flex align-items-center gap-2.5">
                    <span class="font-monospace text-secondary">NT$ {{ ((item.price || 0) * (item.quantity || 1)).toLocaleString() }}</span>
                    <button
                      v-if="ord.status === '已完成'"
                      type="button"
                      class="btn btn-outline-primary btn-sm rounded-pill py-0 px-2.5 font-monospace"
                      style="font-size: 10.5px;"
                      @click="openReviewPrompt(item, ord.orderId || ord.id)"
                    >
                      撰寫評價
                    </button>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2.5 border-top small">
                <span class="text-muted font-monospace">
                  付款方式：{{ ord.paymentMethod || 'LINE Pay' }} · 配送：{{ ord.shippingMethod === 'CVS' ? '超商純取貨' : '黑貓宅配' }}
                </span>
                <div class="d-flex align-items-center gap-2.5">
                  <span class="font-monospace">
                    實付金額：<strong class="fs-6 text-dark">NT$ {{ (ord.totalAmount || ord.total || 0).toLocaleString() }}</strong>
                  </span>
                  <button
                    v-if="ord.status === '配送中'"
                    type="button"
                    class="btn btn-dark btn-sm rounded-pill px-3 py-1 font-monospace"
                    style="font-size: 11px;"
                    @click="confirmOrderReceived(ord)"
                  >
                    ✓ 確認收貨完成
                  </button>
                  <button
                    v-if="ord.status === '已完成'"
                    type="button"
                    class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 font-monospace"
                    style="font-size: 11px;"
                    @click="requestOrderReturn(ord)"
                  >
                    申請退貨 / 售後
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="card-korean text-center py-5 bg-white border text-muted small">
            目前「{{ currentFilterNodeLabel }}」分類下沒有任何訂單紀錄。
          </div>
        </div>
      </div>

      <!-- ==================== 分頁 2：我的優惠券錢包 (輸入優惠碼領取) ==================== -->
      <div v-else-if="activeTab === 'coupons'" class="d-flex flex-column gap-3.5">
        <div class="card-korean p-3.5 p-md-4 bg-white border shadow-xs">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <label class="form-label fw-bold text-dark small mb-0 d-flex align-items-center gap-1.5">
              <Ticket style="width: 15px; height: 15px;" class="text-primary" />
              <span>輸入專屬優惠碼領取優惠券</span>
            </label>
            <span class="text-muted font-monospace" style="font-size: 11px;">
              可用優惠碼參考：<code>WINTER88</code>、<code>VIP200</code>、<code>HBD300</code>
            </span>
          </div>

          <div class="d-flex gap-2" style="max-width: 480px;">
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
              class="card-korean p-3.5 bg-white border d-flex justify-content-between align-items-center h-100"
              :class="{ 'opacity-50 bg-light': cpn.isUsed }"
            >
              <div class="pe-2">
                <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
                    {{ cpn.code }}
                  </span>
                  <strong class="text-dark small">{{ cpn.title }}</strong>
                </div>
                <div class="text-muted font-monospace" style="font-size: 11px;">
                  低消門檻：滿 NT$ {{ (cpn.minSpend || 0).toLocaleString() }} · 到期：{{ cpn.expiryDate }}
                </div>
                <div class="text-secondary mt-1" style="font-size: 10.5px;">
                  取得來源：{{ cpn.source }}
                </div>
              </div>

              <div class="text-end flex-shrink-0">
                <div class="fs-5 fw-bold font-monospace text-dark">
                  {{ cpn.type === 'FIXED' ? `-$${cpn.value}` : `${Math.round(cpn.value * 100)}折` }}
                </div>
                <span v-if="cpn.isUsed" class="badge bg-secondary font-monospace mt-1" style="font-size: 10px;">
                  已使用
                </span>
                <router-link
                  v-else
                  to="/checkout"
                  class="btn btn-outline-dark btn-sm rounded-pill py-0.5 px-2.5 font-monospace mt-1"
                  style="font-size: 10.5px;"
                >
                  去結帳使用 →
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="card-korean text-center py-5 bg-white border text-muted small">
          目前優惠券錢包尚無可用禮券，請於上方輸入優惠碼進行領取！
        </div>
      </div>

      <!-- ==================== 分頁 3：會員基本資料與生日設定 ==================== -->
      <div v-else-if="activeTab === 'profile'" class="card-korean p-4 bg-white border shadow-xs">
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
            <button type="submit" class="btn btn-primary btn-sm rounded-pill px-4 py-2 fw-bold shadow-2xs">
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
        <div v-else class="card-korean text-center py-5 bg-white border text-muted small">
          尚未收藏任何商品，點擊商品卡片右上角的愛心即可加入收藏！
        </div>
      </div>

      <!-- ==================== 分頁 5：常用收件地址簿 ==================== -->
      <div v-else-if="activeTab === 'addresses'" class="d-flex flex-column gap-3">
        <div class="card-korean p-4 bg-white border shadow-xs">
          <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
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
              <button type="submit" class="btn btn-dark btn-sm rounded-pill px-4 font-monospace">儲存此地址</button>
            </div>
          </form>

          <div class="d-flex flex-column gap-2.5">
            <div
              v-for="addr in (currentUser.savedAddresses || [])"
              :key="addr.id"
              class="p-3 rounded-3 border d-flex justify-content-between align-items-center"
            >
              <div class="small">
                <strong class="text-dark me-2">{{ addr.recipientName }}</strong>
                <span class="font-monospace text-muted">{{ addr.phone }}</span>
                <div class="text-secondary mt-1">{{ addr.city }}{{ addr.district }}{{ addr.detail }}</div>
              </div>
              <button
                type="button"
                class="btn btn-link btn-sm text-danger text-decoration-none font-monospace"
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
  RotateCcw
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

// ★ VIP 階級升級進度計算屬性（動態比對後台設定的階級門檻） ★
const vipUpgradeProgress = computed(() => {
  const spent = Number(currentUser.value.totalSpent || 0)
  const tiers = [...(marketingStore.vipTiers || [])].sort((a, b) => a.minSpend - b.minSpend)

  // 尋找下一個門檻高於目前消費金額（或階級順位於目前等級之後）的目標階級
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

// ==================== 1. 可點擊的訂單總流程狀態篩選 ====================
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

const orderFlowNodes = [
  { key: 'ALL', label: '全部訂單', sublabel: '所有交易紀錄', icon: Layers },
  { key: 'PACKING', label: '待出貨 / 備貨', sublabel: '已付款理貨中', icon: Package },
  { key: 'SHIPPING', label: '物流配送中', sublabel: '宅配/超商轉運', icon: Truck },
  { key: 'COMPLETED', label: '已完成簽收', sublabel: '可評價與累積點數', icon: CheckCircle2 },
  { key: 'RETURN', label: '售後 / 退貨', sublabel: '退貨與取消紀錄', icon: RotateCcw }
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

const getOrderStatusBadge = (status) => {
  const map = {
    '待出貨': 'bg-danger-subtle text-danger border border-danger-subtle',
    '處理中': 'bg-danger-subtle text-danger border border-danger-subtle',
    '配送中': 'bg-warning-subtle text-warning-emphasis border border-warning-subtle',
    '已完成': 'bg-success-subtle text-success border border-success-subtle',
    '退貨審核中': 'bg-danger text-white',
    '已取消': 'bg-secondary-subtle text-secondary'
  }
  return map[status] || 'bg-light text-dark'
}

const confirmOrderReceived = (ord) => {
  if (confirm(`確認已收到訂單 #${ord.orderId || ord.id} 的所有商品嗎？`)) {
    ord.status = '已完成'
    if (adminStore.addAuditLog) {
      adminStore.addAuditLog('會員確認收貨', `訂單 #${ord.orderId || ord.id} 已由會員確認收貨完成`)
    }
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
    alert('已送出售後退貨申請，已為您切換至「售後 / 退貨」分類檢視！')
  }
}

const openReviewPrompt = (item, orderId) => {
  const content = prompt(`為商品【${item.name}】(訂單 #${orderId}) 撰寫五星好評：`, '版型非常修飾，材質親膚有質感！')
  if (content && content.trim()) {
    alert('感謝您的真實評價，已發布至商品頁面！')
  }
}

// ==================== 2. 優惠碼領取 ====================
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

// ==================== 3. 會員基本資料與生日更新 ====================
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

// ==================== 4. 收藏與地址簿 ====================
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
.flow-node-btn {
  cursor: pointer;
}
.flow-node-btn:hover .rounded-circle {
  transform: translateY(-2px);
  border-color: #2d2621 !important;
}
.scale-active {
  transform: scale(1.08);
}
</style>