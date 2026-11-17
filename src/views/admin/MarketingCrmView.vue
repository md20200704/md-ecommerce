<template>
  <div class="d-flex flex-column gap-4 w-100" style="min-width: 0;">
    <!-- 頂部頁頭 -->
    <div>
      <h1 class="h4 fw-bold text-dark font-serif mb-1">會員 VIP 制度、優惠券自動派發與黑名單控管</h1>
      <p class="small text-muted mb-0">統一管理 VIP 等級折數、紅利點數回饋趴數、生日/月度自動派券規則與會員資料/生日維護</p>
    </div>

    <!-- 功能頁籤切換 -->
    <div class="d-flex gap-2 border-bottom pb-2 overflow-x-auto no-scrollbar">
      <button
        type="button"
        class="btn btn-sm rounded-pill px-3.5 fw-bold text-nowrap"
        :class="activeTab === 'members' ? 'btn-dark' : 'btn-light text-secondary border'"
        @click="activeTab = 'members'"
      >
        <Users style="width: 14px; height: 14px;" class="me-1" />
        會員名冊、生日與黑名單控管 ({{ authStore.memberList.length }})
      </button>

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
    </div>

    <!-- ==================== 模組 1：會員名冊、生日、VIP調整與黑名單控管 ==================== -->
    <div v-if="activeTab === 'members'" class="d-flex flex-column gap-3.5">
      
      <!-- 搜尋與篩選列 (支援篩選本月壽星) -->
      <div class="card-korean p-3 bg-white border d-flex flex-wrap gap-2.5 justify-content-between align-items-center">
        <div class="d-flex flex-wrap gap-2 flex-grow-1">
          <input
            v-model="searchKeyword"
            type="text"
            class="form-control form-control-sm rounded-pill font-sans"
            style="max-width: 240px;"
            placeholder="搜尋姓名、手機、Email..."
          />
          <select v-model="filterRiskStatus" class="form-select form-select-sm rounded-pill font-monospace" style="width: 170px;">
            <option value="ALL">全部風控狀態</option>
            <option value="NORMAL">正常 (NORMAL)</option>
            <option value="WARNING">黃燈觀察 (WARNING)</option>
            <option value="RESTRICT_COD">限制取到付 (RESTRICT_COD)</option>
            <option value="RESTRICT_PROMO">限制優惠 (RESTRICT_PROMO)</option>
            <option value="BLOCK_ORDER">禁止下單 (BLOCK_ORDER)</option>
            <option value="BANNED">永久封鎖 (BANNED)</option>
          </select>

          <button
            type="button"
            class="btn btn-sm rounded-pill px-3 font-monospace"
            :class="onlyBirthdayMonth ? 'btn-warning fw-bold text-dark' : 'btn-outline-secondary'"
            style="font-size: 11px;"
            @click="onlyBirthdayMonth = !onlyBirthdayMonth"
          >
            🎂 {{ onlyBirthdayMonth ? '✓ 僅顯示本月壽星' : '篩選本月壽星' }}
          </button>
        </div>
        <span class="text-muted small font-monospace">共 {{ filteredMembers.length }} 位會員</span>
      </div>

      <!-- 會員清單表格 -->
      <div class="card-korean bg-white shadow-xs p-3.5 p-md-4 border">
        <div class="table-responsive">
          <table class="table table-hover align-middle small mb-0 font-sans">
            <thead class="table-light">
              <tr class="text-secondary text-nowrap" style="font-size: 11px;">
                <th style="min-width: 150px;">會員資料 / 聯絡方式</th>
                <th style="min-width: 140px;">🎂 會員生日</th>
                <th style="min-width: 155px;">VIP 階級</th>
                <th style="min-width: 110px;">消費與未取紀錄</th>
                <th style="min-width: 115px;">風控管制狀態</th>
                <th class="text-end text-nowrap" style="min-width: 165px;">管理操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in filteredMembers" :key="member.id">
                <td>
                  <strong class="text-dark d-block">
                    {{ member.name }}
                    <span class="text-muted font-monospace fw-normal" style="font-size: 10px;">({{ member.id }})</span>
                  </strong>
                  <span class="text-muted font-monospace d-block" style="font-size: 11px;">{{ member.phone }}</span>
                  <span class="text-muted font-monospace d-block" style="font-size: 10.5px;">{{ member.email }}</span>
                </td>

                <!-- ★ 獨立生日顯示欄位 ★ -->
                <td>
                  <div class="font-monospace text-dark fw-medium" style="font-size: 12px;">
                    {{ member.birthday || '尚未填寫' }}
                  </div>
                  <span
                    v-if="isMemberBirthdayMonth(member.birthday)"
                    class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle font-monospace mt-0.5"
                    style="font-size: 9.5px;"
                  >
                    🎉 本月壽星
                  </span>
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

                <td class="text-end text-nowrap">
                  <div class="d-flex justify-content-end gap-1.5">
                    <button
                      type="button"
                      class="btn btn-outline-primary btn-sm rounded-pill px-2.5 py-1 font-monospace"
                      style="font-size: 11px;"
                      @click="openEditMemberModal(member)"
                    >
                      編輯/生日
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline-danger btn-sm rounded-pill px-2.5 py-1 font-monospace"
                      style="font-size: 11px;"
                      @click="openRiskModal(member)"
                    >
                      風控
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== 模組 2：VIP 階級與紅利點數趴數設定 ==================== -->
    <div v-else-if="activeTab === 'vip_tiers'" class="d-flex flex-column gap-3">
      <div class="row g-3">
        <div v-for="tier in marketingStore.vipTiers" :key="tier.id" class="col-12 col-md-6">
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
                  <input v-model.number="tier.minSpend" type="number" min="0" step="500" class="form-control form-control-sm font-monospace" />
                </div>

                <div class="col-6">
                  <label class="form-label text-secondary mb-1 fw-semibold">專屬結帳折扣率</label>
                  <div class="input-group input-group-sm">
                    <input v-model.number="tier.discountRate" type="number" min="0.1" max="1.0" step="0.01" class="form-control font-monospace" />
                    <span class="input-group-text font-monospace bg-light">
                      {{ tier.discountRate === 1 ? '原價' : Math.round(tier.discountRate * 100) + ' 折' }}
                    </span>
                  </div>
                </div>

                <div class="col-6">
                  <label class="form-label text-secondary mb-1 fw-semibold">消費紅利點數回饋 (%)</label>
                  <div class="input-group input-group-sm">
                    <input v-model.number="tier.pointsEarnRate" type="number" min="0" max="50" step="1" class="form-control font-monospace" />
                    <span class="input-group-text font-monospace bg-light">%</span>
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label text-secondary mb-1 fw-semibold">等級權益說明</label>
                  <input v-model="tier.description" type="text" class="form-control form-control-sm" />
                </div>
              </div>
            </div>

            <div class="mt-3 pt-2 border-top text-end">
              <button type="button" class="btn btn-outline-dark btn-sm rounded-pill px-3 font-monospace" style="font-size: 11px;" @click="saveTierSetting(tier)">
                ✓ 儲存此階級設定
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 模組 3：優惠券管理與自動發送規則 ==================== -->
    <div v-else-if="activeTab === 'coupons'" class="d-flex flex-column gap-4">
      <div class="card-korean bg-white p-4 border shadow-xs">
        <h2 class="fs-6 fw-bold text-dark mb-3 pb-2 border-bottom">自動化優惠券派發規則設定</h2>
        <div class="row g-3">
          <div class="col-12 col-lg-6">
            <div class="p-3.5 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between gap-2.5">
              <div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <strong class="text-dark small">🎂 規則 1：會員生日月自動發送生日禮券</strong>
                  <div class="form-check form-switch m-0">
                    <input v-model="marketingStore.autoDispatchRules.birthdayEnabled" class="form-check-input" type="checkbox" />
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="small text-secondary text-nowrap">派發券代碼：</span>
                  <select v-model="marketingStore.autoDispatchRules.birthdayCouponCode" class="form-select form-select-sm font-monospace">
                    <option v-for="c in marketingStore.couponTemplates" :key="c.id" :value="c.code">
                      {{ c.code }} - {{ c.title }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="pt-2 border-top text-end">
                <button type="button" class="btn btn-dark btn-sm rounded-pill px-3 font-monospace" style="font-size: 11px;" @click="triggerAutoDispatch('BIRTHDAY_MONTH', marketingStore.autoDispatchRules.birthdayCouponCode)">
                  ▶ 立即對本月壽星發送
                </button>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-6">
            <div class="p-3.5 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between gap-2.5">
              <div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <strong class="text-dark small">👑 規則 2：VIP 會員每月定期發送尊榮券</strong>
                  <div class="form-check form-switch m-0">
                    <input v-model="marketingStore.autoDispatchRules.monthlyVipEnabled" class="form-check-input" type="checkbox" />
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="small text-secondary text-nowrap">派發券代碼：</span>
                  <select v-model="marketingStore.autoDispatchRules.monthlyVipCouponCode" class="form-select form-select-sm font-monospace">
                    <option v-for="c in marketingStore.couponTemplates" :key="c.id" :value="c.code">
                      {{ c.code }} - {{ c.title }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="pt-2 border-top text-end">
                <button type="button" class="btn btn-dark btn-sm rounded-pill px-3 font-monospace" style="font-size: 11px;" @click="triggerAutoDispatch('ALL_VIP', marketingStore.autoDispatchRules.monthlyVipCouponCode)">
                  ▶ 立即對全體 VIP 發送
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-korean bg-white p-4 border shadow-xs">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="fs-6 fw-bold text-dark mb-0">優惠券與優惠碼庫存</h2>
          <button class="btn btn-primary btn-sm rounded-pill px-3.5 fw-bold" @click="openNewCouponModal">+ 建立新優惠券</button>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle small mb-0 font-sans">
            <thead class="table-light">
              <tr class="text-secondary text-nowrap" style="font-size: 11px;">
                <th>優惠碼</th>
                <th>名稱</th>
                <th>折扣</th>
                <th>低消</th>
                <th>到期日</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cpn in marketingStore.couponTemplates" :key="cpn.id">
                <td class="font-monospace fw-bold text-primary">{{ cpn.code }}</td>
                <td class="fw-bold text-dark">{{ cpn.title }}</td>
                <td class="font-monospace">{{ cpn.type === 'FIXED' ? `折 NT$ ${cpn.value}` : `${Math.round(cpn.value * 100)} 折` }}</td>
                <td class="font-monospace text-muted">NT$ {{ cpn.minSpend.toLocaleString() }}</td>
                <td class="font-monospace text-muted">{{ cpn.expiryDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== ★ 彈窗：後台編輯會員基本資料與生日 Modal ★ ==================== -->
    <Teleport to="body">
      <div v-if="showEditMemberModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-0">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">編輯會員基本資料與生日</h3>
              <button type="button" class="btn-close" @click="showEditMemberModal = false"></button>
            </div>
            <div class="modal-body small px-1 py-3" v-if="editingMember">
              <form @submit.prevent="submitMemberInfoUpdate" class="d-flex flex-column gap-3">
                <div>
                  <label class="form-label text-secondary mb-1">會員姓名 *</label>
                  <input v-model="memberEditForm.name" required type="text" class="form-control form-control-sm" />
                </div>
                <div>
                  <label class="form-label text-secondary mb-1">聯絡手機 *</label>
                  <input v-model="memberEditForm.phone" required type="tel" class="form-control form-control-sm font-monospace" />
                </div>
                <div>
                  <label class="form-label text-dark fw-bold mb-1">🎂 會員生日 (YYYY-MM-DD)</label>
                  <input v-model="memberEditForm.birthday" type="date" class="form-control form-control-sm font-monospace" />
                </div>
                <div>
                  <label class="form-label text-secondary mb-1">VIP 會員階級</label>
                  <select v-model="memberEditForm.vipTierId" class="form-select form-select-sm font-monospace">
                    <option v-for="t in marketingStore.vipTiers" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary w-100 rounded-pill py-2 fw-bold mt-1">
                  儲存會員資料與生日
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 風險管制彈窗 -->
    <Teleport to="body">
      <div v-if="showRiskModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
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

    <!-- 建立新優惠券彈窗 -->
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
                    <label class="form-label text-secondary mb-1">優惠代碼 *</label>
                    <input v-model="newCouponForm.code" required type="text" class="form-control form-control-sm font-monospace text-uppercase" />
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">優惠券標題 *</label>
                    <input v-model="newCouponForm.title" required type="text" class="form-control form-control-sm" />
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">折扣類型</label>
                    <select v-model="newCouponForm.type" class="form-select form-select-sm">
                      <option value="FIXED">定額折抵 (NT$)</option>
                      <option value="PERCENT">百分比打折 (如 0.85)</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">折扣數值</label>
                    <input v-model.number="newCouponForm.value" required type="number" step="0.01" class="form-control form-control-sm font-monospace" />
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">最低消費門檻</label>
                    <input v-model.number="newCouponForm.minSpend" required type="number" min="0" class="form-control form-control-sm font-monospace" />
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">到期日</label>
                    <input v-model="newCouponForm.expiryDate" required type="date" class="form-control form-control-sm font-monospace" />
                  </div>
                </div>
                <button type="submit" class="btn btn-primary w-100 rounded-pill py-2 fw-bold mt-2">確認建立</button>
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
import { Users, Ticket, Crown } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import { useMarketingStore } from '../../stores/marketingStore'
import { useAdminStore } from '../../stores/adminStore'

const authStore = useAuthStore()
const marketingStore = useMarketingStore()
const adminStore = useAdminStore()

const activeTab = ref('members')
const searchKeyword = ref('')
const filterRiskStatus = ref('ALL')
const onlyBirthdayMonth = ref(false)

// 判斷生日是否為當月
const isMemberBirthdayMonth = (birthdayStr) => {
  if (!birthdayStr) return false
  const currentMonth = new Date().getMonth() + 1
  const bMonth = Number(birthdayStr.split('-')[1])
  return currentMonth === bMonth
}

// 會員列表篩選
const filteredMembers = computed(() => {
  let list = [...authStore.memberList]
  if (filterRiskStatus.value !== 'ALL') {
    list = list.filter(m => m.riskStatus === filterRiskStatus.value)
  }
  if (onlyBirthdayMonth.value) {
    list = list.filter(m => isMemberBirthdayMonth(m.birthday))
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

// 後台編輯會員基本資料與生日 Modal
const showEditMemberModal = ref(false)
const editingMember = ref(null)
const memberEditForm = reactive({
  name: '',
  phone: '',
  birthday: '',
  vipTierId: 'GENERAL'
})

const openEditMemberModal = (member) => {
  editingMember.value = member
  memberEditForm.name = member.name
  memberEditForm.phone = member.phone
  memberEditForm.birthday = member.birthday || ''
  memberEditForm.vipTierId = member.vipTierId || 'GENERAL'
  showEditMemberModal.value = true
}

const submitMemberInfoUpdate = () => {
  if (!editingMember.value) return
  const res = authStore.adminUpdateMemberInfo(editingMember.value.id, {
    name: memberEditForm.name,
    phone: memberEditForm.phone,
    birthday: memberEditForm.birthday,
    vipTierId: memberEditForm.vipTierId
  })
  adminStore.addAuditLog('修改會員基本資料與生日', `更新會員【${memberEditForm.name}】生日為 ${memberEditForm.birthday || '未設定'}`)
  alert(res.message)
  showEditMemberModal.value = false
}

const changeMemberVipTier = (member, newTierId) => {
  authStore.updateMemberTier(member.id, newTierId)
  adminStore.addAuditLog('調整會員 VIP 等級', `將會員【${member.name}】等級調整為【${newTierId}】`)
}

const saveTierSetting = (tier) => {
  adminStore.addAuditLog('調整 VIP 階級與回饋率', `更新【${tier.name}】設定`)
  alert(`已儲存【${tier.name}】設定！`)
}

const triggerAutoDispatch = (targetGroup, couponCode) => {
  const res = authStore.dispatchCouponToMembers({ couponCode, targetGroup })
  if (res.success) {
    adminStore.addAuditLog('派發會員優惠券', res.message)
    alert(res.message)
  } else {
    alert(res.message)
  }
}

const showCouponModal = ref(false)
const newCouponForm = reactive({
  code: '',
  title: '',
  type: 'FIXED',
  value: 150,
  minSpend: 1000,
  expiryDate: '2026-12-31'
})

const openNewCouponModal = () => {
  newCouponForm.code = ''
  newCouponForm.title = ''
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
    description: `${newCouponForm.title} 專屬優惠`
  })
  alert('新優惠券已建立！')
  showCouponModal.value = false
}

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
</script><template>
  <div class="d-flex flex-column gap-4 w-100" style="min-width: 0;">
    <!-- 頂部頁頭 -->
    <div>
      <h1 class="h4 fw-bold text-dark font-serif mb-1">會員 VIP 制度、優惠券自動派發與黑名單控管</h1>
      <p class="small text-muted mb-0">統一管理 VIP 等級折數、紅利點數回饋趴數、生日/月度自動派券規則與會員資料/生日維護</p>
    </div>

    <!-- 功能頁籤切換 -->
    <div class="d-flex gap-2 border-bottom pb-2 overflow-x-auto no-scrollbar">
      <button
        type="button"
        class="btn btn-sm rounded-pill px-3.5 fw-bold text-nowrap"
        :class="activeTab === 'members' ? 'btn-dark' : 'btn-light text-secondary border'"
        @click="activeTab = 'members'"
      >
        <Users style="width: 14px; height: 14px;" class="me-1" />
        會員名冊、生日與黑名單控管 ({{ authStore.memberList.length }})
      </button>

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
    </div>

    <!-- ==================== 模組 1：會員名冊、生日、VIP調整與黑名單控管 ==================== -->
    <div v-if="activeTab === 'members'" class="d-flex flex-column gap-3.5">
      
      <!-- 搜尋與篩選列 (支援篩選本月壽星) -->
      <div class="card-korean p-3 bg-white border d-flex flex-wrap gap-2.5 justify-content-between align-items-center">
        <div class="d-flex flex-wrap gap-2 flex-grow-1">
          <input
            v-model="searchKeyword"
            type="text"
            class="form-control form-control-sm rounded-pill font-sans"
            style="max-width: 240px;"
            placeholder="搜尋姓名、手機、Email..."
          />
          <select v-model="filterRiskStatus" class="form-select form-select-sm rounded-pill font-monospace" style="width: 170px;">
            <option value="ALL">全部風控狀態</option>
            <option value="NORMAL">正常 (NORMAL)</option>
            <option value="WARNING">黃燈觀察 (WARNING)</option>
            <option value="RESTRICT_COD">限制取到付 (RESTRICT_COD)</option>
            <option value="RESTRICT_PROMO">限制優惠 (RESTRICT_PROMO)</option>
            <option value="BLOCK_ORDER">禁止下單 (BLOCK_ORDER)</option>
            <option value="BANNED">永久封鎖 (BANNED)</option>
          </select>

          <button
            type="button"
            class="btn btn-sm rounded-pill px-3 font-monospace"
            :class="onlyBirthdayMonth ? 'btn-warning fw-bold text-dark' : 'btn-outline-secondary'"
            style="font-size: 11px;"
            @click="onlyBirthdayMonth = !onlyBirthdayMonth"
          >
            🎂 {{ onlyBirthdayMonth ? '✓ 僅顯示本月壽星' : '篩選本月壽星' }}
          </button>
        </div>
        <span class="text-muted small font-monospace">共 {{ filteredMembers.length }} 位會員</span>
      </div>

      <!-- 會員清單表格 -->
      <div class="card-korean bg-white shadow-xs p-3.5 p-md-4 border">
        <div class="table-responsive">
          <table class="table table-hover align-middle small mb-0 font-sans">
            <thead class="table-light">
              <tr class="text-secondary text-nowrap" style="font-size: 11px;">
                <th style="min-width: 150px;">會員資料 / 聯絡方式</th>
                <th style="min-width: 140px;">🎂 會員生日</th>
                <th style="min-width: 155px;">VIP 階級</th>
                <th style="min-width: 110px;">消費與未取紀錄</th>
                <th style="min-width: 115px;">風控管制狀態</th>
                <th class="text-end text-nowrap" style="min-width: 165px;">管理操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in filteredMembers" :key="member.id">
                <td>
                  <strong class="text-dark d-block">
                    {{ member.name }}
                    <span class="text-muted font-monospace fw-normal" style="font-size: 10px;">({{ member.id }})</span>
                  </strong>
                  <span class="text-muted font-monospace d-block" style="font-size: 11px;">{{ member.phone }}</span>
                  <span class="text-muted font-monospace d-block" style="font-size: 10.5px;">{{ member.email }}</span>
                </td>

                <!-- ★ 獨立生日顯示欄位 ★ -->
                <td>
                  <div class="font-monospace text-dark fw-medium" style="font-size: 12px;">
                    {{ member.birthday || '尚未填寫' }}
                  </div>
                  <span
                    v-if="isMemberBirthdayMonth(member.birthday)"
                    class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle font-monospace mt-0.5"
                    style="font-size: 9.5px;"
                  >
                    🎉 本月壽星
                  </span>
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

                <td class="text-end text-nowrap">
                  <div class="d-flex justify-content-end gap-1.5">
                    <button
                      type="button"
                      class="btn btn-outline-primary btn-sm rounded-pill px-2.5 py-1 font-monospace"
                      style="font-size: 11px;"
                      @click="openEditMemberModal(member)"
                    >
                      編輯/生日
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline-danger btn-sm rounded-pill px-2.5 py-1 font-monospace"
                      style="font-size: 11px;"
                      @click="openRiskModal(member)"
                    >
                      風控
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== 模組 2：VIP 階級與紅利點數趴數設定 ==================== -->
    <div v-else-if="activeTab === 'vip_tiers'" class="d-flex flex-column gap-3">
      <div class="row g-3">
        <div v-for="tier in marketingStore.vipTiers" :key="tier.id" class="col-12 col-md-6">
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
                  <input v-model.number="tier.minSpend" type="number" min="0" step="500" class="form-control form-control-sm font-monospace" />
                </div>

                <div class="col-6">
                  <label class="form-label text-secondary mb-1 fw-semibold">專屬結帳折扣率</label>
                  <div class="input-group input-group-sm">
                    <input v-model.number="tier.discountRate" type="number" min="0.1" max="1.0" step="0.01" class="form-control font-monospace" />
                    <span class="input-group-text font-monospace bg-light">
                      {{ tier.discountRate === 1 ? '原價' : Math.round(tier.discountRate * 100) + ' 折' }}
                    </span>
                  </div>
                </div>

                <div class="col-6">
                  <label class="form-label text-secondary mb-1 fw-semibold">消費紅利點數回饋 (%)</label>
                  <div class="input-group input-group-sm">
                    <input v-model.number="tier.pointsEarnRate" type="number" min="0" max="50" step="1" class="form-control font-monospace" />
                    <span class="input-group-text font-monospace bg-light">%</span>
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label text-secondary mb-1 fw-semibold">等級權益說明</label>
                  <input v-model="tier.description" type="text" class="form-control form-control-sm" />
                </div>
              </div>
            </div>

            <div class="mt-3 pt-2 border-top text-end">
              <button type="button" class="btn btn-outline-dark btn-sm rounded-pill px-3 font-monospace" style="font-size: 11px;" @click="saveTierSetting(tier)">
                ✓ 儲存此階級設定
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 模組 3：優惠券管理與自動發送規則 ==================== -->
    <div v-else-if="activeTab === 'coupons'" class="d-flex flex-column gap-4">
      <div class="card-korean bg-white p-4 border shadow-xs">
        <h2 class="fs-6 fw-bold text-dark mb-3 pb-2 border-bottom">自動化優惠券派發規則設定</h2>
        <div class="row g-3">
          <div class="col-12 col-lg-6">
            <div class="p-3.5 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between gap-2.5">
              <div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <strong class="text-dark small">🎂 規則 1：會員生日月自動發送生日禮券</strong>
                  <div class="form-check form-switch m-0">
                    <input v-model="marketingStore.autoDispatchRules.birthdayEnabled" class="form-check-input" type="checkbox" />
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="small text-secondary text-nowrap">派發券代碼：</span>
                  <select v-model="marketingStore.autoDispatchRules.birthdayCouponCode" class="form-select form-select-sm font-monospace">
                    <option v-for="c in marketingStore.couponTemplates" :key="c.id" :value="c.code">
                      {{ c.code }} - {{ c.title }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="pt-2 border-top text-end">
                <button type="button" class="btn btn-dark btn-sm rounded-pill px-3 font-monospace" style="font-size: 11px;" @click="triggerAutoDispatch('BIRTHDAY_MONTH', marketingStore.autoDispatchRules.birthdayCouponCode)">
                  ▶ 立即對本月壽星發送
                </button>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-6">
            <div class="p-3.5 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between gap-2.5">
              <div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <strong class="text-dark small">👑 規則 2：VIP 會員每月定期發送尊榮券</strong>
                  <div class="form-check form-switch m-0">
                    <input v-model="marketingStore.autoDispatchRules.monthlyVipEnabled" class="form-check-input" type="checkbox" />
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="small text-secondary text-nowrap">派發券代碼：</span>
                  <select v-model="marketingStore.autoDispatchRules.monthlyVipCouponCode" class="form-select form-select-sm font-monospace">
                    <option v-for="c in marketingStore.couponTemplates" :key="c.id" :value="c.code">
                      {{ c.code }} - {{ c.title }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="pt-2 border-top text-end">
                <button type="button" class="btn btn-dark btn-sm rounded-pill px-3 font-monospace" style="font-size: 11px;" @click="triggerAutoDispatch('ALL_VIP', marketingStore.autoDispatchRules.monthlyVipCouponCode)">
                  ▶ 立即對全體 VIP 發送
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-korean bg-white p-4 border shadow-xs">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="fs-6 fw-bold text-dark mb-0">優惠券與優惠碼庫存</h2>
          <button class="btn btn-primary btn-sm rounded-pill px-3.5 fw-bold" @click="openNewCouponModal">+ 建立新優惠券</button>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle small mb-0 font-sans">
            <thead class="table-light">
              <tr class="text-secondary text-nowrap" style="font-size: 11px;">
                <th>優惠碼</th>
                <th>名稱</th>
                <th>折扣</th>
                <th>低消</th>
                <th>到期日</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cpn in marketingStore.couponTemplates" :key="cpn.id">
                <td class="font-monospace fw-bold text-primary">{{ cpn.code }}</td>
                <td class="fw-bold text-dark">{{ cpn.title }}</td>
                <td class="font-monospace">{{ cpn.type === 'FIXED' ? `折 NT$ ${cpn.value}` : `${Math.round(cpn.value * 100)} 折` }}</td>
                <td class="font-monospace text-muted">NT$ {{ cpn.minSpend.toLocaleString() }}</td>
                <td class="font-monospace text-muted">{{ cpn.expiryDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== ★ 彈窗：後台編輯會員基本資料與生日 Modal ★ ==================== -->
    <Teleport to="body">
      <div v-if="showEditMemberModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-0">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">編輯會員基本資料與生日</h3>
              <button type="button" class="btn-close" @click="showEditMemberModal = false"></button>
            </div>
            <div class="modal-body small px-1 py-3" v-if="editingMember">
              <form @submit.prevent="submitMemberInfoUpdate" class="d-flex flex-column gap-3">
                <div>
                  <label class="form-label text-secondary mb-1">會員姓名 *</label>
                  <input v-model="memberEditForm.name" required type="text" class="form-control form-control-sm" />
                </div>
                <div>
                  <label class="form-label text-secondary mb-1">聯絡手機 *</label>
                  <input v-model="memberEditForm.phone" required type="tel" class="form-control form-control-sm font-monospace" />
                </div>
                <div>
                  <label class="form-label text-dark fw-bold mb-1">🎂 會員生日 (YYYY-MM-DD)</label>
                  <input v-model="memberEditForm.birthday" type="date" class="form-control form-control-sm font-monospace" />
                </div>
                <div>
                  <label class="form-label text-secondary mb-1">VIP 會員階級</label>
                  <select v-model="memberEditForm.vipTierId" class="form-select form-select-sm font-monospace">
                    <option v-for="t in marketingStore.vipTiers" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary w-100 rounded-pill py-2 fw-bold mt-1">
                  儲存會員資料與生日
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 風險管制彈窗 -->
    <Teleport to="body">
      <div v-if="showRiskModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
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

    <!-- 建立新優惠券彈窗 -->
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
                    <label class="form-label text-secondary mb-1">優惠代碼 *</label>
                    <input v-model="newCouponForm.code" required type="text" class="form-control form-control-sm font-monospace text-uppercase" />
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">優惠券標題 *</label>
                    <input v-model="newCouponForm.title" required type="text" class="form-control form-control-sm" />
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">折扣類型</label>
                    <select v-model="newCouponForm.type" class="form-select form-select-sm">
                      <option value="FIXED">定額折抵 (NT$)</option>
                      <option value="PERCENT">百分比打折 (如 0.85)</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">折扣數值</label>
                    <input v-model.number="newCouponForm.value" required type="number" step="0.01" class="form-control form-control-sm font-monospace" />
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">最低消費門檻</label>
                    <input v-model.number="newCouponForm.minSpend" required type="number" min="0" class="form-control form-control-sm font-monospace" />
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">到期日</label>
                    <input v-model="newCouponForm.expiryDate" required type="date" class="form-control form-control-sm font-monospace" />
                  </div>
                </div>
                <button type="submit" class="btn btn-primary w-100 rounded-pill py-2 fw-bold mt-2">確認建立</button>
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
import { Users, Ticket, Crown } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import { useMarketingStore } from '../../stores/marketingStore'
import { useAdminStore } from '../../stores/adminStore'

const authStore = useAuthStore()
const marketingStore = useMarketingStore()
const adminStore = useAdminStore()

const activeTab = ref('members')
const searchKeyword = ref('')
const filterRiskStatus = ref('ALL')
const onlyBirthdayMonth = ref(false)

// 判斷生日是否為當月
const isMemberBirthdayMonth = (birthdayStr) => {
  if (!birthdayStr) return false
  const currentMonth = new Date().getMonth() + 1
  const bMonth = Number(birthdayStr.split('-')[1])
  return currentMonth === bMonth
}

// 會員列表篩選
const filteredMembers = computed(() => {
  let list = [...authStore.memberList]
  if (filterRiskStatus.value !== 'ALL') {
    list = list.filter(m => m.riskStatus === filterRiskStatus.value)
  }
  if (onlyBirthdayMonth.value) {
    list = list.filter(m => isMemberBirthdayMonth(m.birthday))
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

// 後台編輯會員基本資料與生日 Modal
const showEditMemberModal = ref(false)
const editingMember = ref(null)
const memberEditForm = reactive({
  name: '',
  phone: '',
  birthday: '',
  vipTierId: 'GENERAL'
})

const openEditMemberModal = (member) => {
  editingMember.value = member
  memberEditForm.name = member.name
  memberEditForm.phone = member.phone
  memberEditForm.birthday = member.birthday || ''
  memberEditForm.vipTierId = member.vipTierId || 'GENERAL'
  showEditMemberModal.value = true
}

const submitMemberInfoUpdate = () => {
  if (!editingMember.value) return
  const res = authStore.adminUpdateMemberInfo(editingMember.value.id, {
    name: memberEditForm.name,
    phone: memberEditForm.phone,
    birthday: memberEditForm.birthday,
    vipTierId: memberEditForm.vipTierId
  })
  adminStore.addAuditLog('修改會員基本資料與生日', `更新會員【${memberEditForm.name}】生日為 ${memberEditForm.birthday || '未設定'}`)
  alert(res.message)
  showEditMemberModal.value = false
}

const changeMemberVipTier = (member, newTierId) => {
  authStore.updateMemberTier(member.id, newTierId)
  adminStore.addAuditLog('調整會員 VIP 等級', `將會員【${member.name}】等級調整為【${newTierId}】`)
}

const saveTierSetting = (tier) => {
  adminStore.addAuditLog('調整 VIP 階級與回饋率', `更新【${tier.name}】設定`)
  alert(`已儲存【${tier.name}】設定！`)
}

const triggerAutoDispatch = (targetGroup, couponCode) => {
  const res = authStore.dispatchCouponToMembers({ couponCode, targetGroup })
  if (res.success) {
    adminStore.addAuditLog('派發會員優惠券', res.message)
    alert(res.message)
  } else {
    alert(res.message)
  }
}

const showCouponModal = ref(false)
const newCouponForm = reactive({
  code: '',
  title: '',
  type: 'FIXED',
  value: 150,
  minSpend: 1000,
  expiryDate: '2026-12-31'
})

const openNewCouponModal = () => {
  newCouponForm.code = ''
  newCouponForm.title = ''
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
    description: `${newCouponForm.title} 專屬優惠`
  })
  alert('新優惠券已建立！')
  showCouponModal.value = false
}

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