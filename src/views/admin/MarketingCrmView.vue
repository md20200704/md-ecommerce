<template>
  <div class="d-flex flex-column gap-4 w-100" style="min-width: 0;">
    <!-- 頂部頁頭 -->
    <div>
      <h1 class="h4 fw-bold text-dark font-serif mb-1">會員 VIP 制度、優惠券自動派發與黑名單控管</h1>
      <p class="small text-muted mb-0">統一管理 VIP 等級折數、紅利點數回饋趴數、生日/月度自動派券規則與會員風控</p>
    </div>

    <!-- 功能頁籤切換 -->
    <div class="d-flex gap-2 border-bottom pb-2 overflow-x-auto no-scrollbar">
      <button
        type="button"
        class="btn btn-sm rounded-pill px-3.5 fw-bold text-nowrap"
        :class="activeTab === 'vip_tiers' ? 'btn-dark' : 'btn-light text-secondary border'"
        @click="activeTab = 'vip_tiers'"
      >
        <Crown style="width: 14px; height: 14px;" class="me-1 text-warning" />
        VIP 階級與點數回饋設定
      </button>

      <button
        type="button"
        class="btn btn-sm rounded-pill px-3.5 fw-bold text-nowrap"
        :class="activeTab === 'coupons' ? 'btn-dark' : 'btn-light text-secondary border'"
        @click="activeTab = 'coupons'"
      >
        <Ticket style="width: 14px; height: 14px;" class="me-1" />
        優惠券與自動發送規則 ({{ marketingStore.couponTemplates.length }})
      </button>

      <button
        type="button"
        class="btn btn-sm rounded-pill px-3.5 fw-bold text-nowrap"
        :class="activeTab === 'members' ? 'btn-dark' : 'btn-light text-secondary border'"
        @click="activeTab = 'members'"
      >
        <Users style="width: 14px; height: 14px;" class="me-1" />
        會員名冊、生日與黑名單控管 ({{ authStore.memberList.length }})
      </button>
    </div>

    <!-- ==================== 模組 1：VIP 階級與紅利點數趴數設定 ==================== -->
    <div v-if="activeTab === 'vip_tiers'" class="d-flex flex-column gap-3">
      <div class="alert alert-info border-0 small py-2.5 px-3 rounded-3 d-flex align-items-center gap-2 mb-0">
        <Sparkles style="width: 16px; height: 16px;" class="flex-shrink-0" />
        <span>
          在此調整的 <strong>VIP 階級折扣率</strong> 與 <strong>紅利點數回饋趴數 (%)</strong> 會即時套用至前台會員中心與結帳金額計算！
        </span>
      </div>

      <div class="row g-3">
        <div
          v-for="tier in marketingStore.vipTiers"
          :key="tier.id"
          class="col-12 col-md-6"
        >
          <div class="card-korean bg-white p-4 border shadow-xs h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <span class="badge rounded-pill px-3 py-1.5 font-monospace fw-bold" :class="tier.badgeColor">
                  {{ tier.name }}
                </span>
                <span class="text-muted font-monospace small">代碼: {{ tier.id }}</span>
              </div>

              <div class="row g-3 small">
                <div class="col-12">
                  <label class="form-label text-secondary mb-1 fw-semibold">升級門檻：累積消費金額 (NT$)</label>
                  <input
                    v-model.number="tier.minSpend"
                    type="number"
                    min="0"
                    step="500"
                    class="form-control form-control-sm font-monospace"
                  />
                </div>

                <div class="col-6">
                  <label class="form-label text-secondary mb-1 fw-semibold">專屬結帳折扣率 (如 0.9 = 9折)</label>
                  <div class="input-group input-group-sm">
                    <input
                      v-model.number="tier.discountRate"
                      type="number"
                      min="0.1"
                      max="1.0"
                      step="0.01"
                      class="form-control font-monospace"
                    />
                    <span class="input-group-text font-monospace bg-light">
                      {{ tier.discountRate === 1 ? '原價' : Math.round(tier.discountRate * 100) + ' 折' }}
                    </span>
                  </div>
                </div>

                <div class="col-6">
                  <label class="form-label text-secondary mb-1 fw-semibold">消費紅利點數回饋趴數 (%)</label>
                  <div class="input-group input-group-sm">
                    <input
                      v-model.number="tier.pointsEarnRate"
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      class="form-control font-monospace"
                    />
                    <span class="input-group-text font-monospace bg-light">% 回饋</span>
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label text-secondary mb-1 fw-semibold">等級權益說明文案</label>
                  <input v-model="tier.description" type="text" class="form-control form-control-sm" />
                </div>
              </div>
            </div>

            <div class="mt-3 pt-2 border-top text-end">
              <button
                type="button"
                class="btn btn-outline-dark btn-sm rounded-pill px-3 font-monospace"
                style="font-size: 11px;"
                @click="saveTierSetting(tier)"
              >
                ✓ 儲存此階級設定
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 模組 2：優惠券管理與自動發送規則設定 ==================== -->
    <div v-else-if="activeTab === 'coupons'" class="d-flex flex-column gap-4">
      
      <!-- 自動化發送排程規則設定卡片 -->
      <div class="card-korean bg-white p-4 border shadow-xs">
        <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div>
            <h2 class="fs-6 fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
              <Send style="width: 16px; height: 16px;" class="text-primary" />
              <span>自動化優惠券派發規則設定</span>
            </h2>
            <p class="text-muted small mb-0 mt-0.5">設定系統自動針對「當月壽星」或「VIP 會員」發送專屬優惠券，亦可手動立即觸發派發</p>
          </div>
        </div>

        <div class="row g-3">
          <!-- 規則 A：會員生日自動發券 -->
          <div class="col-12 col-lg-6">
            <div class="p-3.5 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between gap-2.5">
              <div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <strong class="text-dark small d-flex align-items-center gap-1.5">
                    <Cake style="width: 15px; height: 15px; color: #d4a373;" />
                    <span>規則 1：會員生日月自動發送生日禮券</span>
                  </strong>
                  <div class="form-check form-switch m-0">
                    <input v-model="marketingStore.autoDispatchRules.birthdayEnabled" class="form-check-input" type="checkbox" />
                  </div>
                </div>
                <p class="text-muted small mb-2" style="font-size: 11.5px;">
                  系統每月 1 號自動比對會員生日月份，符合當月壽星即自動將生日禮券匯入其會員錢包。
                </p>
                <div class="d-flex align-items-center gap-2">
                  <span class="small text-secondary text-nowrap">派發券代碼：</span>
                  <select v-model="marketingStore.autoDispatchRules.birthdayCouponCode" class="form-select form-select-sm font-monospace">
                    <option v-for="c in marketingStore.couponTemplates" :key="c.id" :value="c.code">
                      {{ c.code }} - {{ c.title }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="pt-2 border-top d-flex justify-content-end">
                <button
                  type="button"
                  class="btn btn-dark btn-sm rounded-pill px-3 font-monospace"
                  style="font-size: 11px;"
                  @click="triggerAutoDispatch('BIRTHDAY_MONTH', marketingStore.autoDispatchRules.birthdayCouponCode)"
                >
                  ▶ 立即對本月壽星發送
                </button>
              </div>
            </div>
          </div>

          <!-- 規則 B：VIP 會員每月定期發券 -->
          <div class="col-12 col-lg-6">
            <div class="p-3.5 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between gap-2.5">
              <div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <strong class="text-dark small d-flex align-items-center gap-1.5">
                    <Crown style="width: 15px; height: 15px; color: #d4a373;" />
                    <span>規則 2：VIP 會員每月定期發送尊榮券</span>
                  </strong>
                  <div class="form-check form-switch m-0">
                    <input v-model="marketingStore.autoDispatchRules.monthlyVipEnabled" class="form-check-input" type="checkbox" />
                  </div>
                </div>
                <p class="text-muted small mb-2" style="font-size: 11.5px;">
                  每月自動發放專屬購物禮金給白銀 VIP（含）以上等級之活躍會員。
                </p>
                <div class="d-flex align-items-center gap-2">
                  <span class="small text-secondary text-nowrap">派發券代碼：</span>
                  <select v-model="marketingStore.autoDispatchRules.monthlyVipCouponCode" class="form-select form-select-sm font-monospace">
                    <option v-for="c in marketingStore.couponTemplates" :key="c.id" :value="c.code">
                      {{ c.code }} - {{ c.title }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="pt-2 border-top d-flex justify-content-end">
                <button
                  type="button"
                  class="btn btn-dark btn-sm rounded-pill px-3 font-monospace"
                  style="font-size: 11px;"
                  @click="triggerAutoDispatch('ALL_VIP', marketingStore.autoDispatchRules.monthlyVipCouponCode)"
                >
                  ▶ 立即對全體 VIP 發送
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 全館優惠券庫列表與新增按鈕 -->
      <div class="card-korean bg-white p-4 border shadow-xs">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h2 class="fs-6 fw-bold text-dark mb-0">優惠券與優惠碼庫存設定</h2>
            <span class="text-muted small">顧客可在會員中心或結帳頁輸入「優惠碼」領取以下優惠券</span>
          </div>
          <button class="btn btn-primary btn-sm rounded-pill px-3.5 fw-bold" @click="openNewCouponModal">
            + 建立新優惠券
          </button>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle small mb-0 font-sans">
            <thead class="table-light">
              <tr class="text-secondary text-nowrap" style="font-size: 11px;">
                <th>優惠碼 (Code)</th>
                <th>優惠券名稱</th>
                <th>折扣內容</th>
                <th>低消門檻</th>
                <th>有效期限</th>
                <th class="text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cpn in marketingStore.couponTemplates" :key="cpn.id">
                <td class="font-monospace fw-bold text-primary">{{ cpn.code }}</td>
                <td>
                  <strong class="text-dark d-block">{{ cpn.title }}</strong>
                  <span class="text-muted" style="font-size: 11px;">{{ cpn.description }}</span>
                </td>
                <td class="font-monospace fw-bold text-dark">
                  {{ cpn.type === 'FIXED' ? `折抵 NT$ ${cpn.value}` : `${Math.round(cpn.value * 100)} 折` }}
                </td>
                <td class="font-monospace text-muted">滿 NT$ {{ cpn.minSpend.toLocaleString() }}</td>
                <td class="font-monospace text-muted">{{ cpn.expiryDate }}</td>
                <td class="text-end text-nowrap">
                  <button
                    type="button"
                    class="btn btn-outline-dark btn-sm rounded-pill px-2.5 py-0.5 font-monospace me-1"
                    style="font-size: 11px;"
                    @click="triggerAutoDispatch('ALL_ACTIVE', cpn.code)"
                  >
                    全體派發
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== 模組 3：會員名冊、生日、VIP調整與黑名單控管 ==================== -->
    <div v-else-if="activeTab === 'members'" class="d-flex flex-column gap-3.5">
      
      <!-- 搜尋與篩選列 -->
      <div class="card-korean p-3 bg-white border d-flex flex-wrap gap-2.5 justify-content-between align-items-center">
        <div class="d-flex gap-2 flex-grow-1" style="max-width: 520px;">
          <input
            v-model="searchKeyword"
            type="text"
            class="form-control form-control-sm rounded-pill font-sans"
            placeholder="搜尋姓名、手機號碼、Email..."
          />
          <select v-model="filterRiskStatus" class="form-select form-select-sm rounded-pill font-monospace" style="width: 175px;">
            <option value="ALL">全部風控狀態</option>
            <option value="NORMAL">正常 (NORMAL)</option>
            <option value="WARNING">黃燈觀察 (WARNING)</option>
            <option value="RESTRICT_COD">限制取到付 (RESTRICT_COD)</option>
            <option value="RESTRICT_PROMO">限制優惠 (RESTRICT_PROMO)</option>
            <option value="BLOCK_ORDER">禁止下單 (BLOCK_ORDER)</option>
            <option value="BANNED">永久封鎖 (BANNED)</option>
          </select>
        </div>
        <span class="text-muted small font-monospace">共 {{ filteredMembers.length }} 位會員</span>
      </div>

      <!-- 會員清單表格 -->
      <div class="card-korean bg-white shadow-xs p-3.5 p-md-4 border">
        <div class="table-responsive">
          <table class="table table-hover align-middle small mb-0 font-sans">
            <thead class="table-light">
              <tr class="text-secondary text-nowrap" style="font-size: 11px;">
                <th style="min-width: 150px;">會員資料 / 生日</th>
                <th style="min-width: 150px;">VIP 階級 (可即時調整)</th>
                <th style="min-width: 110px;">消費與未取紀錄</th>
                <th style="min-width: 120px;">風控管制狀態</th>
                <th style="min-width: 190px;">備註原因</th>
                <th class="text-end text-nowrap" style="min-width: 130px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in filteredMembers" :key="member.id">
                <td>
                  <strong class="text-dark d-block">{{ member.name }} <span class="text-muted font-monospace fw-normal" style="font-size: 10px;">({{ member.id }})</span></strong>
                  <span class="text-muted font-monospace d-block" style="font-size: 11px;">{{ member.phone }}</span>
                  <span class="text-primary font-monospace d-block" style="font-size: 10.5px;">🎂 生日：{{ member.birthday || '未設定' }}</span>
                </td>
                <td>
                  <select
                    :value="member.vipTierId || 'GENERAL'"
                    @change="changeMemberVipTier(member, $event.target.value)"
                    class="form-select form-select-sm font-monospace"
                    style="font-size: 11px; max-width: 155px;"
                  >
                    <option v-for="t in marketingStore.vipTiers" :key="t.id" :value="t.id">
                      {{ t.name }}
                    </option>
                  </select>
                </td>
                <td>
                  <div class="font-monospace fw-semibold text-dark">NT$ {{ member.totalSpent.toLocaleString() }}</div>
                  <div class="text-muted font-monospace" style="font-size: 10.5px;">成交 {{ member.orderCount }} 筆</div>
                  <div v-if="member.abandonCount > 0" class="text-danger font-monospace fw-bold" style="font-size: 10.5px;">
                    ⚠ 未取 {{ member.abandonCount }} 次
                  </div>
                </td>
                <td>
                  <span class="badge py-1 px-2.5 rounded-pill font-monospace" :class="getRiskBadgeClass(member.riskStatus)">
                    {{ getRiskStatusLabel(member.riskStatus) }}
                  </span>
                </td>
                <td>
                  <div class="text-secondary small text-truncate" style="max-width: 200px;" :title="member.notes">
                    {{ member.notes || '—' }}
                  </div>
                </td>
                <td class="text-end text-nowrap">
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 font-monospace"
                    style="font-size: 11px;"
                    @click="openRiskModal(member)"
                  >
                    <ShieldAlert style="width: 12px; height: 12px;" class="me-1" />
                    管制設定
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== 彈窗 1：建立新優惠券 Modal ==================== -->
    <Teleport to="body">
      <div v-if="showCouponModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-0">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">建立新優惠券與優惠碼</h3>
              <button type="button" class="btn-close" @click="showCouponModal = false"></button>
            </div>
            <div class="modal-body small px-1 py-3">
              <form @submit.prevent="createNewCoupon" class="d-flex flex-column gap-3">
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">優惠代碼 (英文數字) *</label>
                    <input v-model="newCouponForm.code" required type="text" class="form-control form-control-sm font-monospace text-uppercase" placeholder="如：SPRING250" />
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">優惠券標題 *</label>
                    <input v-model="newCouponForm.title" required type="text" class="form-control form-control-sm" placeholder="如：春季換季購物金" />
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">折扣類型 *</label>
                    <select v-model="newCouponForm.type" class="form-select form-select-sm">
                      <option value="FIXED">定額折抵金額 (NT$)</option>
                      <option value="PERCENT">百分比打折 (如 0.85 = 85折)</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">折扣數值 *</label>
                    <input v-model.number="newCouponForm.value" required type="number" step="0.01" class="form-control form-control-sm font-monospace" />
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">最低消費門檻 (NT$)</label>
                    <input v-model.number="newCouponForm.minSpend" required type="number" min="0" class="form-control form-control-sm font-monospace" />
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">到期日 *</label>
                    <input v-model="newCouponForm.expiryDate" required type="date" class="form-control form-control-sm font-monospace" />
                  </div>
                </div>
                <div>
                  <label class="form-label text-secondary mb-1">使用規則說明</label>
                  <input v-model="newCouponForm.description" type="text" class="form-control form-control-sm" placeholder="說明適用範圍與條件" />
                </div>
                <button type="submit" class="btn btn-primary w-100 rounded-pill py-2 fw-bold mt-2">
                  確認建立優惠券
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ==================== 彈窗 2：風險管制調整 Modal ==================== -->
    <Teleport to="body">
      <div v-if="showRiskModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-0">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">會員風控與黑名單管制</h3>
              <button type="button" class="btn-close" @click="showRiskModal = false"></button>
            </div>
            <div class="modal-body small px-1 py-3" v-if="activeMember">
              <form @submit.prevent="submitRiskAdjustment" class="d-flex flex-column gap-3">
                <div>
                  <label class="form-label text-secondary fw-semibold mb-1">管制等級設定 *</label>
                  <select v-model="riskForm.riskStatus" class="form-select form-select-sm font-monospace" required>
                    <option value="NORMAL">● 正常狀態 (NORMAL)</option>
                    <option value="WARNING">▲ 黃燈警示 (WARNING)</option>
                    <option value="RESTRICT_COD">✕ 限制取貨付款 (RESTRICT_COD)</option>
                    <option value="RESTRICT_PROMO">✕ 限制點數與優惠券 (RESTRICT_PROMO)</option>
                    <option value="BLOCK_ORDER">⛔ 暫停下單 (BLOCK_ORDER)</option>
                    <option value="BANNED">🚫 全面封鎖黑名單 (BANNED)</option>
                  </select>
                </div>
                <div>
                  <label class="form-label text-secondary fw-semibold mb-1">管制備忘錄 *</label>
                  <textarea v-model="riskForm.notes" required rows="3" class="form-control form-control-sm"></textarea>
                </div>
                <button type="submit" class="btn btn-danger w-100 rounded-pill py-2 fw-bold">
                  確認更新風控狀態
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Users, Ticket, ShieldAlert, Crown, Sparkles, Send, Cake } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import { useMarketingStore } from '../../stores/marketingStore'
import { useAdminStore } from '../../stores/adminStore'

const authStore = useAuthStore()
const marketingStore = useMarketingStore()
const adminStore = useAdminStore()

const activeTab = ref('vip_tiers')
const searchKeyword = ref('')
const filterRiskStatus = ref('ALL')

// 儲存 VIP 階級修改
const saveTierSetting = (tier) => {
  adminStore.addAuditLog(
    '調整 VIP 階級與回饋率',
    `更新【${tier.name}】：門檻 NT$${tier.minSpend}，折扣 ${tier.discountRate}，紅利回饋 ${tier.pointsEarnRate}%`
  )
  alert(`已儲存【${tier.name}】設定，前台結帳折扣與點數回饋已同步生效！`)
}

// 觸發自動/批量派發優惠券
const triggerAutoDispatch = (targetGroup, couponCode) => {
  const res = authStore.dispatchCouponToMembers({ couponCode, targetGroup })
  if (res.success) {
    adminStore.addAuditLog('派發會員優惠券', res.message)
    alert(res.message)
  } else {
    alert(res.message)
  }
}

// 建立新優惠券
const showCouponModal = ref(false)
const newCouponForm = reactive({
  code: '',
  title: '',
  type: 'FIXED',
  value: 150,
  minSpend: 1000,
  expiryDate: '2026-12-31',
  description: ''
})

const openNewCouponModal = () => {
  newCouponForm.code = ''
  newCouponForm.title = ''
  newCouponForm.type = 'FIXED'
  newCouponForm.value = 150
  newCouponForm.minSpend = 1000
  newCouponForm.expiryDate = '2026-12-31'
  newCouponForm.description = ''
  showCouponModal.value = true
}

const createNewCoupon = () => {
  marketingStore.couponTemplates.unshift({
    id: 'CPN-' + Date.now(),
    code: newCouponForm.code.trim().toUpperCase(),
    title: newCouponForm.title,
    type: newCouponForm.type,
    value: newCouponForm.value,
    minSpend: newCouponForm.minSpend,
    expiryDate: newCouponForm.expiryDate,
    isActive: true,
    autoTrigger: 'NONE',
    description: newCouponForm.description || `${newCouponForm.title} 專屬優惠`
  })
  adminStore.addAuditLog('建立新優惠券', `建立代碼【${newCouponForm.code.toUpperCase()}】(${newCouponForm.title})`)
  alert('新優惠券已建立！會員可立即憑優惠碼領取。')
  showCouponModal.value = false
}

// 手動調整會員 VIP 等級
const changeMemberVipTier = (member, newTierId) => {
  authStore.updateMemberTier(member.id, newTierId)
  adminStore.addAuditLog('手動調整會員 VIP 等級', `將會員【${member.name}】等級調整為【${newTierId}】`)
}

// 會員列表篩選
const filteredMembers = computed(() => {
  let list = [...authStore.memberList]
  if (filterRiskStatus.value !== 'ALL') {
    list = list.filter(m => m.riskStatus === filterRiskStatus.value)
  }
  if (searchKeyword.value.trim()) {
    const q = searchKeyword.value.trim().toLowerCase()
    list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  }
  return list
})

const getRiskStatusLabel = (status) => {
  const map = {
    NORMAL: '正常',
    WARNING: '黃燈觀察',
    RESTRICT_COD: '限制取到付',
    RESTRICT_PROMO: '限制優惠',
    BLOCK_ORDER: '禁止下單',
    BANNED: '永久黑名單'
  }
  return map[status] || status
}

const getRiskBadgeClass = (status) => {
  const map = {
    NORMAL: 'bg-success-subtle text-success border border-success-subtle',
    WARNING: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle',
    RESTRICT_COD: 'bg-danger-subtle text-danger border border-danger-subtle',
    RESTRICT_PROMO: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
    BLOCK_ORDER: 'bg-danger text-white',
    BANNED: 'bg-dark text-white'
  }
  return map[status] || 'bg-light text-dark'
}

// 風險管制彈窗
const showRiskModal = ref(false)
const activeMember = ref(null)
const riskForm = reactive({ riskStatus: 'NORMAL', notes: '' })

const openRiskModal = (member) => {
  activeMember.value = member
  riskForm.riskStatus = member.riskStatus
  riskForm.notes = member.notes || ''
  showRiskModal.value = true
}

const submitRiskAdjustment = () => {
  if (!activeMember.value) return
  const res = authStore.updateMemberRisk(activeMember.value.id, {
    riskStatus: riskForm.riskStatus,
    notes: riskForm.notes
  })
  adminStore.addAuditLog('調整會員風控狀態', res.message)
  alert(res.message)
  showRiskModal.value = false
}
</script>