<template>
  <div class="d-flex flex-column gap-4 w-100" style="min-width: 0;">
    <div>
      <h1 class="h4 fw-bold text-dark font-serif mb-1">會員 VIP 制度、優惠券自動派發與風控管理</h1>
      <p class="small text-muted mb-0">支援新增/刪除 VIP 階級、設定百分比折扣上限、自訂多組自動化發券排程與會員生日維護</p>
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
        VIP 階級與點數回饋 ({{ marketingStore.vipTiers.length }})
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
        會員名冊、生日與黑名單 ({{ authStore.memberList.length }})
      </button>
    </div>

    <!-- ==================== 模組 1：VIP 階級與紅利點數設定（支援新增與刪除階級） ==================== -->
    <div v-if="activeTab === 'vip_tiers'" class="d-flex flex-column gap-3.5">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span class="small text-muted">可隨時新增、修改或刪除 VIP 階級，系統會依據累積消費門檻自動排序</span>
        <button type="button" class="btn btn-primary btn-sm rounded-pill px-3.5 fw-bold" @click="openNewTierModal">
          + 新增 VIP 階級
        </button>
      </div>

      <div class="row g-3">
        <div v-for="tier in marketingStore.vipTiers" :key="tier.id" class="col-12 col-md-6">
          <div class="card-korean bg-white p-4 border shadow-xs h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <span class="badge rounded-pill px-3 py-1.5 font-monospace fw-bold" :class="tier.badgeColor">
                  {{ tier.name }}
                </span>
                <div class="d-flex align-items-center gap-2">
                  <span class="text-muted font-monospace small">代碼: {{ tier.id }}</span>
                  <button
                    v-if="marketingStore.vipTiers.length > 1"
                    type="button"
                    class="btn btn-outline-danger btn-sm rounded-pill px-2.5 py-0 font-monospace"
                    style="font-size: 10.5px;"
                    @click="handleDeleteTier(tier)"
                  >
                    刪除階級
                  </button>
                </div>
              </div>

              <div class="row g-3 small">
                <div class="col-6">
                  <label class="form-label text-secondary mb-1 fw-semibold">階級顯示名稱</label>
                  <input v-model="tier.name" type="text" class="form-control form-control-sm" />
                </div>

                <div class="col-6">
                  <label class="form-label text-secondary mb-1 fw-semibold">升級門檻 (NT$)</label>
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

    <!-- ==================== 模組 2：優惠券管理與可新增的自動化發送規則 ==================== -->
    <div v-else-if="activeTab === 'coupons'" class="d-flex flex-column gap-4">
      
      <!-- ★ 自動化優惠券派發規則設定（支援新增規則、自訂對象與每月1號/指定日期） ★ -->
      <div class="card-korean bg-white p-4 border shadow-xs">
        <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
          <div>
            <h2 class="fs-6 fw-bold text-dark mb-0">自動化優惠券派發規則排程</h2>
            <span class="text-muted small">自訂發送對象（本月壽星 / 各階層 VIP / 全體會員）與發送時間（每月 1 號或指定日期）</span>
          </div>
          <button type="button" class="btn btn-dark btn-sm rounded-pill px-3.5 fw-bold" @click="openNewRuleModal">
            + 新增自動派發規則
          </button>
        </div>

        <div class="row g-3">
          <div v-for="rule in marketingStore.autoDispatchRules" :key="rule.id" class="col-12 col-lg-6">
            <div class="p-3.5 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between gap-2.5">
              <div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <strong class="text-dark small">{{ rule.name }}</strong>
                  <div class="d-flex align-items-center gap-2">
                    <div class="form-check form-switch m-0">
                      <input v-model="rule.isActive" class="form-check-input" type="checkbox" />
                    </div>
                    <button
                      type="button"
                      class="btn btn-link btn-sm text-danger p-0 text-decoration-none font-monospace"
                      style="font-size: 11px;"
                      @click="marketingStore.removeAutoDispatchRule(rule.id)"
                    >
                      刪除
                    </button>
                  </div>
                </div>

                <div class="d-flex flex-column gap-1.5 small text-secondary">
                  <div>
                    <strong>發送對象：</strong>
                    <span class="badge bg-white text-dark border font-sans">{{ getTargetGroupLabel(rule.targetGroup) }}</span>
                  </div>
                  <div>
                    <strong>發送排程：</strong>
                    <span class="font-monospace text-dark">
                      {{ rule.scheduleType === 'MONTHLY_1ST' ? '每月 1 號自動發送' : `指定日期發送 (${rule.specificDate || '未設日期'})` }}
                    </span>
                  </div>
                  <div class="d-flex align-items-center gap-2 mt-1">
                    <strong>派發優惠券：</strong>
                    <select v-model="rule.couponCode" class="form-select form-select-sm font-monospace" style="max-width: 240px;">
                      <option v-for="c in marketingStore.couponTemplates" :key="c.id" :value="c.code">
                        {{ c.code }} - {{ c.title }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="pt-2 border-top d-flex justify-content-between align-items-center">
                <span class="font-monospace" :class="rule.isActive ? 'text-success' : 'text-muted'" style="font-size: 11px;">
                  {{ rule.isActive ? '● 排程啟用中' : '○ 已暫停' }}
                </span>
                <button
                  type="button"
                  class="btn btn-dark btn-sm rounded-pill px-3 font-monospace"
                  style="font-size: 11px;"
                  @click="executeRuleNow(rule)"
                >
                  ▶ 立即執行派發
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 全館優惠券庫列表（百分比折扣支援最高折抵上限顯示） -->
      <div class="card-korean bg-white p-4 border shadow-xs">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 class="fs-6 fw-bold text-dark mb-0">優惠券與優惠碼庫存</h2>
            <span class="text-muted small">百分比打折優惠券可設定「最高折抵上限金額」</span>
          </div>
          <button class="btn btn-primary btn-sm rounded-pill px-3.5 fw-bold" @click="openNewCouponModal">+ 建立新優惠券</button>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle small mb-0 font-sans">
            <thead class="table-light">
              <tr class="text-secondary text-nowrap" style="font-size: 11px;">
                <th>優惠碼</th>
                <th>名稱</th>
                <th>折扣內容與上限</th>
                <th>低消門檻</th>
                <th>到期日</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cpn in marketingStore.couponTemplates" :key="cpn.id">
                <td class="font-monospace fw-bold text-primary">{{ cpn.code }}</td>
                <td class="fw-bold text-dark">{{ cpn.title }}</td>
                <td class="font-monospace">
                  <span v-if="cpn.type === 'FIXED'">定額折抵 NT$ {{ cpn.value }}</span>
                  <span v-else>
                    {{ Math.round(cpn.value * 100) }} 折
                    <span v-if="cpn.maxDiscount > 0" class="badge bg-warning-subtle text-warning-emphasis ms-1">
                      最高折 NT$ {{ cpn.maxDiscount }}
                    </span>
                    <span v-else class="text-muted">(無上限)</span>
                  </span>
                </td>
                <td class="font-monospace text-muted">NT$ {{ cpn.minSpend.toLocaleString() }}</td>
                <td class="font-monospace text-muted">{{ cpn.expiryDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== 模組 3：會員名冊、生日與黑名單 ==================== -->
    <div v-else-if="activeTab === 'members'" class="d-flex flex-column gap-3.5">
      <div class="card-korean p-3 bg-white border d-flex flex-wrap gap-2.5 justify-content-between align-items-center">
        <div class="d-flex flex-wrap gap-2 flex-grow-1">
          <input
            v-model="searchKeyword"
            type="text"
            class="form-control form-control-sm rounded-pill font-sans"
            style="max-width: 240px;"
            placeholder="搜尋姓名、手機、Email..."
          />
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

      <div class="card-korean bg-white shadow-xs p-3.5 p-md-4 border">
        <div class="table-responsive">
          <table class="table table-hover align-middle small mb-0 font-sans">
            <thead class="table-light">
              <tr class="text-secondary text-nowrap" style="font-size: 11px;">
                <th>會員資料</th>
                <th>🎂 會員生日</th>
                <th>VIP 階級</th>
                <th>累積消費</th>
                <th>風控狀態</th>
                <th class="text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in filteredMembers" :key="member.id">
                <td>
                  <strong class="text-dark d-block">{{ member.name }}</strong>
                  <span class="text-muted font-monospace small">{{ member.phone }}</span>
                </td>
                <td>
                  <span class="font-monospace text-dark">{{ member.birthday || '未填寫' }}</span>
                  <span v-if="isMemberBirthdayMonth(member.birthday)" class="badge bg-warning-subtle text-warning-emphasis ms-1" style="font-size: 9.5px;">
                    本月壽星
                  </span>
                </td>
                <td>
                  <select
                    :value="member.vipTierId || 'GENERAL'"
                    @change="changeMemberVipTier(member, $event.target.value)"
                    class="form-select form-select-sm font-monospace"
                    style="font-size: 11px; max-width: 155px;"
                  >
                    <option v-for="t in marketingStore.vipTiers" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </td>
                <td class="font-monospace fw-semibold">NT$ {{ member.totalSpent.toLocaleString() }}</td>
                <td>
                  <span class="badge rounded-pill font-monospace" :class="member.riskStatus === 'NORMAL' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                    {{ member.riskStatus }}
                  </span>
                </td>
                <td class="text-end">
                  <button type="button" class="btn btn-outline-primary btn-sm rounded-pill px-2.5 py-0.5 font-monospace" style="font-size: 11px;" @click="openEditMemberModal(member)">
                    編輯/生日
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== 彈窗 1：新增 VIP 階級 Modal ==================== -->
    <Teleport to="body">
      <div v-if="showNewTierModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-0">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">新增 VIP 會員階級</h3>
              <button type="button" class="btn-close" @click="showNewTierModal = false"></button>
            </div>
            <div class="modal-body small px-1 py-3">
              <form @submit.prevent="submitNewTier" class="d-flex flex-column gap-3">
                <div class="row g-2">
                  <div class="col-5">
                    <label class="form-label text-secondary mb-1">階級代碼 (英文) *</label>
                    <input v-model="newTierForm.id" required type="text" class="form-control form-control-sm font-monospace text-uppercase" placeholder="如：PLATINUM" />
                  </div>
                  <div class="col-7">
                    <label class="form-label text-secondary mb-1">階級顯示名稱 *</label>
                    <input v-model="newTierForm.name" required type="text" class="form-control form-control-sm" placeholder="如：白金 VIP (PLATINUM)" />
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-4">
                    <label class="form-label text-secondary mb-1">升級門檻 (NT$) *</label>
                    <input v-model.number="newTierForm.minSpend" required type="number" min="0" step="500" class="form-control form-control-sm font-monospace" />
                  </div>
                  <div class="col-4">
                    <label class="form-label text-secondary mb-1">折扣率 (0.88=88折)</label>
                    <input v-model.number="newTierForm.discountRate" required type="number" min="0.1" max="1" step="0.01" class="form-control form-control-sm font-monospace" />
                  </div>
                  <div class="col-4">
                    <label class="form-label text-secondary mb-1">點數回饋 (%) *</label>
                    <input v-model.number="newTierForm.pointsEarnRate" required type="number" min="0" max="50" class="form-control form-control-sm font-monospace" />
                  </div>
                </div>
                <div>
                  <label class="form-label text-secondary mb-1">權益說明文案</label>
                  <input v-model="newTierForm.description" type="text" class="form-control form-control-sm" placeholder="描述此階級享有的專屬折扣與點數權益" />
                </div>
                <button type="submit" class="btn btn-primary w-100 rounded-pill py-2 fw-bold mt-1">確認新增 VIP 階級</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ==================== 彈窗 2：新增自動化發券規則 Modal ==================== -->
    <Teleport to="body">
      <div v-if="showNewRuleModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-0">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">新增自動化優惠券派發規則</h3>
              <button type="button" class="btn-close" @click="showNewRuleModal = false"></button>
            </div>
            <div class="modal-body small px-1 py-3">
              <form @submit.prevent="submitNewRule" class="d-flex flex-column gap-3">
                <div>
                  <label class="form-label text-secondary mb-1">規則名稱 *</label>
                  <input v-model="newRuleForm.name" required type="text" class="form-control form-control-sm" placeholder="如：黑鑽 VIP 每月專屬禮遇" />
                </div>

                <div>
                  <label class="form-label text-secondary mb-1">發送對象種類 *</label>
                  <select v-model="newRuleForm.targetGroup" class="form-select form-select-sm" required>
                    <option value="BIRTHDAY_MONTH">🎂 本月壽星會員</option>
                    <option value="ALL_ACTIVE">👥 全體活躍會員</option>
                    <option value="ALL_VIP">👑 全體 VIP 會員 (含白銀以上)</option>
                    <option v-for="t in marketingStore.vipTiers" :key="t.id" :value="'TIER:' + t.id">
                      🏅 指定階層：{{ t.name }}
                    </option>
                  </select>
                </div>

                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">發送時間排程 *</label>
                    <select v-model="newRuleForm.scheduleType" class="form-select form-select-sm">
                      <option value="MONTHLY_1ST">每月 1 號自動發送</option>
                      <option value="SPECIFIC_DATE">指定特定日期發送</option>
                    </select>
                  </div>
                  <div class="col-6" v-if="newRuleForm.scheduleType === 'SPECIFIC_DATE'">
                    <label class="form-label text-secondary mb-1">選擇發送日期 *</label>
                    <input v-model="newRuleForm.specificDate" required type="date" class="form-control form-control-sm font-monospace" />
                  </div>
                </div>

                <div>
                  <label class="form-label text-secondary mb-1">選擇派發的優惠券 *</label>
                  <select v-model="newRuleForm.couponCode" class="form-select form-select-sm font-monospace" required>
                    <option v-for="c in marketingStore.couponTemplates" :key="c.id" :value="c.code">
                      {{ c.code }} - {{ c.title }}
                    </option>
                  </select>
                </div>

                <button type="submit" class="btn btn-dark w-100 rounded-pill py-2 fw-bold mt-1">確認建立自動派發規則</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ==================== 彈窗 3：建立新優惠券 (含百分比最高折抵上限) ==================== -->
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
                    <input v-model="newCouponForm.code" required type="text" class="form-control form-control-sm font-monospace text-uppercase" placeholder="如：VIP85" />
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">優惠券標題 *</label>
                    <input v-model="newCouponForm.title" required type="text" class="form-control form-control-sm" placeholder="如：VIP 專屬 85 折券" />
                  </div>
                </div>

                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">折扣類型 *</label>
                    <select v-model="newCouponForm.type" class="form-select form-select-sm">
                      <option value="FIXED">定額折抵 (NT$)</option>
                      <option value="PERCENT">百分比打折 (如 0.85 = 85折)</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">折扣數值 *</label>
                    <input v-model.number="newCouponForm.value" required type="number" step="0.01" class="form-control form-control-sm font-monospace" />
                  </div>
                </div>

                <!-- ★ 當選擇「百分比打折」時，顯示「最高折扣上限金額」設定欄位 ★ -->
                <div v-if="newCouponForm.type === 'PERCENT'" class="p-2.5 rounded-3 bg-warning-subtle border border-warning-subtle">
                  <label class="form-label text-dark fw-bold mb-1">最高折扣金額上限 (NT$)</label>
                  <input
                    v-model.number="newCouponForm.maxDiscount"
                    type="number"
                    min="0"
                    step="50"
                    class="form-control form-control-sm font-monospace"
                    placeholder="輸入 0 表示無上限，例如 500 表示最多折 500 元"
                  />
                  <div class="text-muted mt-1" style="font-size: 10.5px;">填寫 0 代表無折抵上限；填寫 500 代表單筆最高折抵 NT$ 500</div>
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

                <button type="submit" class="btn btn-primary w-100 rounded-pill py-2 fw-bold mt-2">確認建立優惠券</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 彈窗 4：編輯會員生日與基本資料 -->
    <Teleport to="body">
      <div v-if="showEditMemberModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 460px;">
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
                  <label class="form-label text-dark fw-bold mb-1">🎂 會員生日</label>
                  <input v-model="memberEditForm.birthday" type="date" class="form-control form-control-sm font-monospace" />
                </div>
                <div>
                  <label class="form-label text-secondary mb-1">VIP 階級</label>
                  <select v-model="memberEditForm.vipTierId" class="form-select form-select-sm font-monospace">
                    <option v-for="t in marketingStore.vipTiers" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary w-100 rounded-pill py-2 fw-bold">儲存修改</button>
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

const activeTab = ref('vip_tiers')

// ==================== 1. VIP 階級新增 / 刪除 / 修改 ====================
const showNewTierModal = ref(false)
const newTierForm = reactive({
  id: '',
  name: '',
  minSpend: 20000,
  discountRate: 0.88,
  pointsEarnRate: 6,
  description: ''
})

const openNewTierModal = () => {
  newTierForm.id = ''
  newTierForm.name = ''
  newTierForm.minSpend = 20000
  newTierForm.discountRate = 0.88
  newTierForm.pointsEarnRate = 6
  newTierForm.description = ''
  showNewTierModal.value = true
}

const submitNewTier = () => {
  const res = marketingStore.addVipTier(newTierForm)
  alert(res.message)
  if (res.success) {
    if (adminStore.addAuditLog) adminStore.addAuditLog('新增 VIP 階級', res.message)
    showNewTierModal.value = false
  }
}

const handleDeleteTier = (tier) => {
  if (confirm(`確定要刪除 VIP 階級【${tier.name}】嗎？`)) {
    const res = marketingStore.removeVipTier(tier.id)
    alert(res.message)
    if (res.success && adminStore.addAuditLog) {
      adminStore.addAuditLog('刪除 VIP 階級', res.message)
    }
  }
}

const saveTierSetting = (tier) => {
  if (adminStore.addAuditLog) adminStore.addAuditLog('調整 VIP 階級設定', `更新【${tier.name}】設定`)
  alert(`已儲存【${tier.name}】設定！`)
}

// ==================== 2. 自動派發規則新增與執行 ====================
const showNewRuleModal = ref(false)
const newRuleForm = reactive({
  name: '',
  targetGroup: 'BIRTHDAY_MONTH',
  scheduleType: 'MONTHLY_1ST',
  specificDate: '',
  couponCode: 'HBD300'
})

const openNewRuleModal = () => {
  newRuleForm.name = ''
  newRuleForm.targetGroup = 'BIRTHDAY_MONTH'
  newRuleForm.scheduleType = 'MONTHLY_1ST'
  newRuleForm.specificDate = ''
  newRuleForm.couponCode = marketingStore.couponTemplates[0]?.code || ''
  showNewRuleModal.value = true
}

const submitNewRule = () => {
  marketingStore.addAutoDispatchRule(newRuleForm)
  if (adminStore.addAuditLog) {
    adminStore.addAuditLog('新增自動發券規則', `建立規則【${newRuleForm.name}】`)
  }
  alert('已成功新增自動化派發規則！')
  showNewRuleModal.value = false
}

const getTargetGroupLabel = (targetGroup) => {
  if (targetGroup === 'BIRTHDAY_MONTH') return '🎂 本月壽星會員'
  if (targetGroup === 'ALL_ACTIVE') return '👥 全體活躍會員'
  if (targetGroup === 'ALL_VIP') return '👑 全體 VIP 會員'
  if (targetGroup && targetGroup.startsWith('TIER:')) {
    const tierId = targetGroup.replace('TIER:', '')
    const found = marketingStore.vipTiers.find(t => t.id === tierId)
    return found ? `🏅 指定階層：${found.name}` : `指定階層 (${tierId})`
  }
  return targetGroup
}

const executeRuleNow = (rule) => {
  const res = authStore.dispatchCouponToMembers({
    couponCode: rule.couponCode,
    targetGroup: rule.targetGroup,
    sourceName: rule.name
  })
  if (res.success && adminStore.addAuditLog) {
    adminStore.addAuditLog('執行派發優惠券', res.message)
  }
  alert(res.message)
}

// ==================== 3. 建立新優惠券（含百分比最高折抵上限） ====================
const showCouponModal = ref(false)
const newCouponForm = reactive({
  code: '',
  title: '',
  type: 'FIXED',
  value: 150,
  maxDiscount: 500,
  minSpend: 1000,
  expiryDate: '2026-12-31'
})

const openNewCouponModal = () => {
  newCouponForm.code = ''
  newCouponForm.title = ''
  newCouponForm.type = 'FIXED'
  newCouponForm.value = 150
  newCouponForm.maxDiscount = 500
  showCouponModal.value = true
}

const createNewCoupon = () => {
  marketingStore.couponTemplates.unshift({
    id: 'CPN-' + Date.now(),
    code: newCouponForm.code.trim().toUpperCase(),
    title: newCouponForm.title,
    type: newCouponForm.type,
    value: newCouponForm.value,
    maxDiscount: newCouponForm.type === 'PERCENT' ? (Number(newCouponForm.maxDiscount) || 0) : 0,
    minSpend: newCouponForm.minSpend,
    expiryDate: newCouponForm.expiryDate,
    isActive: true,
    description: `${newCouponForm.title} 專屬優惠`
  })
  alert('新優惠券已建立！')
  showCouponModal.value = false
}

// ==================== 4. 會員名冊與生日編輯 ====================
const searchKeyword = ref('')
const onlyBirthdayMonth = ref(false)

const isMemberBirthdayMonth = (birthdayStr) => {
  if (!birthdayStr) return false
  const currentMonth = new Date().getMonth() + 1
  const bMonth = Number(birthdayStr.split('-')[1])
  return currentMonth === bMonth
}

const filteredMembers = computed(() => {
  let list = [...authStore.memberList]
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

const changeMemberVipTier = (member, newTierId) => {
  authStore.updateMemberTier(member.id, newTierId)
}

const showEditMemberModal = ref(false)
const editingMember = ref(null)
const memberEditForm = reactive({ name: '', phone: '', birthday: '', vipTierId: 'GENERAL' })

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
  alert(res.message)
  showEditMemberModal.value = false
}
</script>