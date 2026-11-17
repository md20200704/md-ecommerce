<template>
  <div class="d-flex flex-column gap-4 w-100" style="min-width: 0;">
    <div class="px-1">
      <h1 class="h4 fw-bold text-dark font-serif mb-1">會員 VIP 制度、優惠券自動派發與風控管理</h1>
      <p class="small text-muted mb-0">統一管理 VIP 階級折數與點數回饋、自動化發券排程規則及會員資料、生日與風控黑名單</p>
    </div>

    <!-- 功能頁籤切換 -->
    <div class="d-flex gap-2 border-bottom pb-2.5 overflow-x-auto no-scrollbar">
      <button
        type="button"
        class="btn btn-sm rounded-pill px-4 py-1.5 fw-bold text-nowrap"
        :class="activeTab === 'vip_tiers' ? 'btn-dark' : 'btn-light text-secondary border'"
        @click="activeTab = 'vip_tiers'"
      >
        <Crown style="width: 14px; height: 14px;" class="me-1.5 text-warning" />
        VIP 階級與點數回饋 ({{ marketingStore.vipTiers.length }})
      </button>

      <button
        type="button"
        class="btn btn-sm rounded-pill px-4 py-1.5 fw-bold text-nowrap"
        :class="activeTab === 'coupons' ? 'btn-dark' : 'btn-light text-secondary border'"
        @click="activeTab = 'coupons'"
      >
        <Ticket style="width: 14px; height: 14px;" class="me-1.5" />
        優惠券與自動發送規則 ({{ marketingStore.couponTemplates.length }})
      </button>

      <button
        type="button"
        class="btn btn-sm rounded-pill px-4 py-1.5 fw-bold text-nowrap"
        :class="activeTab === 'members' ? 'btn-dark' : 'btn-light text-secondary border'"
        @click="activeTab = 'members'"
      >
        <Users style="width: 14px; height: 14px;" class="me-1.5" />
        會員名冊、生日與風控 ({{ authStore.memberList.length }})
      </button>
    </div>

    <!-- ==================== 模組 1：VIP 階級與紅利點數設定 ==================== -->
    <div v-if="activeTab === 'vip_tiers'" class="d-flex flex-column gap-4">
      <div class="card-korean bg-white p-3.5 px-4 rounded-4 border shadow-xs d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h2 class="fs-6 fw-bold text-dark font-serif mb-0.5">VIP 會員階級與回饋制度設定</h2>
          <p class="small text-muted mb-0">可隨時新增、修改或刪除 VIP 階級，系統會依據累積消費門檻自動由低至高排序</p>
        </div>
        <button type="button" class="btn btn-dark btn-sm rounded-pill px-4 py-2 fw-bold shadow-2xs" @click="openNewTierModal">
          + 新增 VIP 階級
        </button>
      </div>

      <div class="row g-4">
        <div v-for="tier in marketingStore.vipTiers" :key="tier.id" class="col-12 col-xl-6">
          <div class="vip-tier-card bg-white rounded-4 border shadow-xs h-100 d-flex flex-column justify-content-between gap-3">
            <div>
              <div class="d-flex justify-content-between align-items-center gap-3 pb-3 mb-3.5 border-bottom flex-wrap">
                <div class="d-flex align-items-center gap-2.5">
                  <span class="badge rounded-pill px-3.5 py-2 font-monospace fw-bold" :class="tier.badgeColor" style="font-size: 11.5px;">
                    {{ tier.name }}
                  </span>
                </div>

                <div class="d-flex align-items-center gap-2.5">
                  <span class="badge bg-light text-secondary border font-monospace px-2.5 py-1" style="font-size: 10.5px;">
                    代碼：{{ tier.id }}
                  </span>
                  <button
                    v-if="marketingStore.vipTiers.length > 1"
                    type="button"
                    class="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 font-monospace"
                    style="font-size: 11px;"
                    @click="handleDeleteTier(tier)"
                  >
                    刪除階級
                  </button>
                </div>
              </div>

              <div class="d-flex flex-column gap-3 small">
                <div class="p-3 px-3.5 rounded-3 bg-light border">
                  <div class="row g-3">
                    <div class="col-12 col-sm-6">
                      <label class="form-label text-secondary fw-semibold mb-1.5">階級顯示名稱</label>
                      <input v-model="tier.name" type="text" class="form-control form-control-sm py-1.5 px-2.5 bg-white" />
                    </div>
                    <div class="col-12 col-sm-6">
                      <label class="form-label text-secondary fw-semibold mb-1.5">升級門檻：累積消費 (NT$)</label>
                      <input v-model.number="tier.minSpend" type="number" min="0" step="500" class="form-control form-control-sm font-monospace py-1.5 px-2.5 bg-white" />
                    </div>
                  </div>
                </div>

                <div class="p-3 px-3.5 rounded-3 bg-light border">
                  <div class="row g-3">
                    <div class="col-12 col-sm-6">
                      <label class="form-label text-secondary fw-semibold mb-1.5">專屬結帳折扣率</label>
                      <div class="input-group input-group-sm">
                        <input v-model.number="tier.discountRate" type="number" min="0.1" max="1.0" step="0.01" class="form-control font-monospace py-1.5 px-2.5 bg-white" />
                        <span class="input-group-text font-monospace bg-white text-dark fw-bold px-2.5">
                          {{ tier.discountRate === 1 ? '原價' : Math.round(tier.discountRate * 100) + ' 折' }}
                        </span>
                      </div>
                    </div>
                    <div class="col-12 col-sm-6">
                      <label class="form-label text-secondary fw-semibold mb-1.5">消費紅利點數回饋 (%)</label>
                      <div class="input-group input-group-sm">
                        <input v-model.number="tier.pointsEarnRate" type="number" min="0" max="50" step="1" class="form-control font-monospace py-1.5 px-2.5 bg-white" />
                        <span class="input-group-text font-monospace bg-white text-primary fw-bold px-2.5">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="p-3 px-3.5 rounded-3 bg-light border">
                  <label class="form-label text-secondary fw-semibold mb-1.5">等級權益說明文案</label>
                  <input v-model="tier.description" type="text" class="form-control form-control-sm py-1.5 px-2.5 bg-white" />
                </div>
              </div>
            </div>

            <div class="pt-3 mt-1 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span class="text-muted font-monospace px-1" style="font-size: 11px;">
                權益摘要：{{ tier.discountRate === 1 ? '無折扣' : Math.round(tier.discountRate * 100) + '折' }} · 回饋 {{ tier.pointsEarnRate }}%
              </span>
              <button
                type="button"
                class="btn btn-dark btn-sm rounded-pill px-4 py-1.5 font-monospace shadow-2xs"
                style="font-size: 11.5px;"
                @click="saveTierSetting(tier)"
              >
                ✓ 儲存此階級設定
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 模組 2：優惠券與自動化發送規則排程 ==================== -->
    <div v-else-if="activeTab === 'coupons'" class="d-flex flex-column gap-4">
      <div class="card-korean bg-white p-4 rounded-4 border shadow-xs">
        <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-3">
          <div>
            <h2 class="h5 fw-bold text-dark font-serif mb-1">自動化優惠券派發規則排程</h2>
            <p class="text-muted small mb-0">可設定「每月 1 號」、「指定日期」或「VIP 升級時自動發送」，並指定目標族群</p>
          </div>
          <button type="button" class="btn btn-dark btn-sm rounded-pill px-4 py-2 fw-bold shadow-2xs" @click="openNewRuleModal">
            + 新增自動派發規則
          </button>
        </div>

        <div class="row g-4">
          <div v-for="rule in marketingStore.autoDispatchRules" :key="rule.id" class="col-12 col-xl-6">
            <div class="rule-schedule-card rounded-4 border bg-light h-100 d-flex flex-column justify-content-between gap-3">
              <div>
                <div class="d-flex justify-content-between align-items-start gap-3 pb-3 mb-3 border-bottom">
                  <div class="min-w-0">
                    <span class="badge bg-white text-secondary border font-monospace px-2.5 py-1 mb-2 d-inline-block" style="font-size: 10px;">
                      {{ rule.id }}
                    </span>
                    <h3 class="fs-6 fw-bold text-dark mb-0 lh-base">{{ rule.name }}</h3>
                  </div>

                  <div class="d-flex align-items-center gap-3 flex-shrink-0 pt-1">
                    <div class="form-check form-switch m-0" title="啟用或暫停此規則">
                      <input v-model="rule.isActive" class="form-check-input" type="checkbox" style="cursor: pointer;" />
                    </div>
                    <button
                      type="button"
                      class="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 font-monospace"
                      style="font-size: 11px;"
                      @click="marketingStore.removeAutoDispatchRule(rule.id)"
                    >
                      刪除
                    </button>
                  </div>
                </div>

                <div class="row g-3 small">
                  <div class="col-12 col-sm-6">
                    <div class="p-3 px-3.5 rounded-3 bg-white border h-100 d-flex flex-column justify-content-center">
                      <div class="text-muted font-monospace mb-1.5" style="font-size: 10.5px;">觸發排程時間</div>
                      <div class="fw-bold text-dark lh-sm" style="font-size: 12.5px;">
                        {{ getScheduleLabel(rule) }}
                      </div>
                    </div>
                  </div>

                  <div class="col-12 col-sm-6">
                    <div class="p-3 px-3.5 rounded-3 bg-white border h-100 d-flex flex-column justify-content-center">
                      <div class="text-muted font-monospace mb-1.5" style="font-size: 10.5px;">發送目標對象</div>
                      <div class="fw-bold text-dark lh-sm" style="font-size: 12.5px;">
                        {{ getTargetGroupLabel(rule.targetGroup) }}
                      </div>
                    </div>
                  </div>

                  <div class="col-12">
                    <div class="p-3 px-3.5 rounded-3 bg-white border">
                      <label class="form-label text-muted font-monospace mb-1.5 d-block" style="font-size: 10.5px;">
                        綁定派發優惠券模板
                      </label>
                      <select v-model="rule.couponCode" class="form-select form-select-sm font-monospace py-1.5 px-2.5">
                        <option v-for="c in marketingStore.couponTemplates" :key="c.id" :value="c.code">
                          {{ c.code }} — {{ c.title }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div class="pt-3 mt-1 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span class="font-monospace fw-semibold px-1" :class="rule.isActive ? 'text-success' : 'text-muted'" style="font-size: 11.5px;">
                  {{ rule.isActive ? '● 排程規則啟用中' : '○ 規則已暫停' }}
                </span>
                <button
                  type="button"
                  class="btn btn-dark btn-sm rounded-pill px-4 py-1.5 font-monospace shadow-2xs"
                  style="font-size: 11.5px;"
                  @click="executeRuleNow(rule)"
                >
                  ▶ 立即執行派發
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 全館優惠券庫列表 -->
      <div class="card-korean bg-white p-4 rounded-4 border shadow-xs">
        <div class="d-flex justify-content-between align-items-center mb-3.5 pb-2.5 border-bottom flex-wrap gap-2">
          <div>
            <h2 class="fs-6 fw-bold text-dark mb-0">優惠券與優惠碼庫存</h2>
            <span class="text-muted small">百分比打折優惠券可設定「最高折抵上限金額」</span>
          </div>
          <button class="btn btn-primary btn-sm rounded-pill px-4 py-1.5 fw-bold" @click="openNewCouponModal">+ 建立新優惠券</button>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle small mb-0 font-sans">
            <thead class="table-light">
              <tr class="text-secondary text-nowrap" style="font-size: 11px;">
                <th class="py-2.5 px-3">優惠碼</th>
                <th class="py-2.5 px-3">名稱</th>
                <th class="py-2.5 px-3">折扣內容與上限</th>
                <th class="py-2.5 px-3">低消門檻</th>
                <th class="py-2.5 px-3">到期日</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cpn in marketingStore.couponTemplates" :key="cpn.id">
                <td class="py-2.5 px-3 font-monospace fw-bold text-primary">{{ cpn.code }}</td>
                <td class="py-2.5 px-3 fw-bold text-dark">{{ cpn.title }}</td>
                <td class="py-2.5 px-3 font-monospace">
                  <span v-if="cpn.type === 'FIXED'">定額折抵 NT$ {{ cpn.value }}</span>
                  <span v-else>
                    {{ Math.round(cpn.value * 100) }} 折
                    <span v-if="cpn.maxDiscount > 0" class="badge bg-warning-subtle text-warning-emphasis ms-1">
                      最高折 NT$ {{ cpn.maxDiscount }}
                    </span>
                    <span v-else class="text-muted">(無上限)</span>
                  </span>
                </td>
                <td class="py-2.5 px-3 font-monospace text-muted">NT$ {{ cpn.minSpend.toLocaleString() }}</td>
                <td class="py-2.5 px-3 font-monospace text-muted">{{ cpn.expiryDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== 模組 3：會員名冊、生日與風控 ==================== -->
    <div v-else-if="activeTab === 'members'" class="d-flex flex-column gap-3.5">
      <div class="card-korean p-3.5 bg-white rounded-4 border d-flex flex-wrap gap-2.5 justify-content-between align-items-center">
        <div class="d-flex flex-wrap gap-2 flex-grow-1">
          <input
            v-model="searchKeyword"
            type="text"
            class="form-control form-control-sm rounded-pill font-sans px-3"
            style="max-width: 240px;"
            placeholder="搜尋姓名、手機、Email..."
          />

          <select v-model="filterRiskStatus" class="form-select form-select-sm rounded-pill font-monospace" style="width: 180px;">
            <option value="ALL">全部風控狀態</option>
            <option value="NORMAL">正常 (NORMAL)</option>
            <option value="WARNING">黃燈觀察 (WARNING)</option>
            <option value="RESTRICT_COD">限制取到付 (RESTRICT_COD)</option>
            <option value="RESTRICT_PROMO">限制優惠 (RESTRICT_PROMO)</option>
            <option value="BLOCK_ORDER">禁止下單 (BLOCK_ORDER)</option>
            <option value="BANNED">永久黑名單 (BANNED)</option>
          </select>

          <button
            type="button"
            class="btn btn-sm rounded-pill px-3.5 font-monospace"
            :class="onlyBirthdayMonth ? 'btn-warning fw-bold text-dark' : 'btn-outline-secondary'"
            style="font-size: 11px;"
            @click="onlyBirthdayMonth = !onlyBirthdayMonth"
          >
            🎂 {{ onlyBirthdayMonth ? '✓ 僅顯示本月壽星' : '篩選本月壽星' }}
          </button>
        </div>
        <span class="text-muted small font-monospace px-1">共 {{ filteredMembers.length }} 位會員</span>
      </div>

      <div class="card-korean bg-white rounded-4 shadow-xs p-3.5 p-md-4 border">
        <div class="table-responsive">
          <table class="table table-hover align-middle small mb-0 font-sans">
            <thead class="table-light">
              <tr class="text-secondary text-nowrap" style="font-size: 11px;">
                <th class="py-2.5 px-3" style="min-width: 175px;">會員資料</th>
                <th class="py-2.5 px-3" style="min-width: 135px;">會員生日</th>
                <th class="py-2.5 px-3" style="min-width: 175px;">VIP 階級</th>
                <th class="py-2.5 px-3" style="min-width: 125px;">累積消費</th>
                <th class="py-2.5 px-3" style="min-width: 165px;">風控狀態</th>
                <th class="py-2.5 px-3 text-end text-nowrap" style="min-width: 145px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in filteredMembers" :key="member.id">
                <td class="py-3 px-3">
                  <strong class="text-dark d-block">
                    {{ member.name }}
                    <span class="text-muted font-monospace fw-normal" style="font-size: 10px;">({{ member.id }})</span>
                  </strong>
                  <span class="text-muted font-monospace d-block" style="font-size: 11px;">{{ member.phone }}</span>
                  <span class="text-muted font-monospace d-block" style="font-size: 10.5px;">{{ member.email }}</span>
                </td>

                <td class="py-3 px-3">
                  <div class="font-monospace text-dark fw-medium" style="font-size: 12px;">
                    {{ member.birthday || '尚未填寫' }}
                  </div>
                  <span
                    v-if="isMemberBirthdayMonth(member.birthday)"
                    class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle font-monospace mt-1"
                    style="font-size: 9.5px;"
                  >
                    🎉 本月壽星
                  </span>
                </td>

                <td class="py-3 px-3">
                  <select
                    :value="member.vipTierId || 'GENERAL'"
                    @change="changeMemberVipTier(member, $event.target.value)"
                    class="form-select form-select-sm font-monospace"
                    style="font-size: 11px; max-width: 170px;"
                  >
                    <option v-for="t in marketingStore.vipTiers" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </td>

                <td class="py-3 px-3">
                  <div class="font-monospace fw-semibold text-dark">NT$ {{ (member.totalSpent || 0).toLocaleString() }}</div>
                  <div class="text-muted font-monospace" style="font-size: 10.5px;">成交 {{ member.orderCount || 0 }} 筆</div>
                  <div v-if="member.abandonCount > 0" class="text-danger font-monospace fw-bold" style="font-size: 10px;">
                    ⚠ 未取 {{ member.abandonCount }} 次
                  </div>
                </td>

                <td class="py-3 px-3">
                  <span class="badge py-1 px-2.5 rounded-pill font-monospace" :class="getRiskBadgeClass(member.riskStatus)">
                    {{ getRiskStatusLabel(member.riskStatus) }}
                  </span>
                  <div
                    v-if="member.notes && member.riskStatus !== 'NORMAL'"
                    class="text-muted text-truncate mt-1"
                    style="max-width: 165px; font-size: 10.5px;"
                    :title="member.notes"
                  >
                    {{ member.notes }}
                  </div>
                </td>

                <td class="py-3 px-3 text-end text-nowrap">
                  <div class="d-flex justify-content-end gap-1.5">
                    <button
                      type="button"
                      class="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 font-monospace"
                      style="font-size: 11px;"
                      @click="openMemberOrdersModal(member)"
                    >
                      查看
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline-dark btn-sm rounded-pill px-3 py-1 font-monospace"
                      style="font-size: 11px;"
                      @click="openEditMemberModal(member)"
                    >
                      編輯
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== ★ 彈窗 0：查看會員歷史訂單 Modal (CSS 排版優化 + 單筆收合) ★ ==================== -->
    <Teleport to="body">
      <div v-if="showViewOrdersModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-2 px-2">
              <div>
                <h3 class="modal-title fs-5 fw-bold text-dark font-serif mb-1">
                  會員歷史訂單紀錄 — {{ viewingMember?.name }}
                </h3>
                <span class="text-muted font-monospace d-block" style="font-size: 11px;" v-if="viewingMember">
                  編號：{{ viewingMember.id }} · 手機：{{ viewingMember.phone }} · Email：{{ viewingMember.email }}
                </span>
              </div>
              <button type="button" class="btn-close" @click="showViewOrdersModal = false"></button>
            </div>

            <div class="modal-body small px-2 py-2" v-if="viewingMember">
              <!-- 頂部會員消費概況摘要卡 -->
              <div class="p-3.5 px-4 rounded-4 bg-light border mb-4">
                <div class="row g-3 align-items-center">
                  <div class="col-6 col-sm-3">
                    <div class="text-muted font-monospace mb-1" style="font-size: 10.5px;">目前 VIP 階級</div>
                    <div class="fw-bold text-dark">{{ getTierNameById(viewingMember.vipTierId) }}</div>
                  </div>
                  <div class="col-6 col-sm-3">
                    <div class="text-muted font-monospace mb-1" style="font-size: 10.5px;">歷史訂單數</div>
                    <div class="fw-bold font-monospace text-dark">{{ viewingMemberOrders.length }} 筆</div>
                  </div>
                  <div class="col-6 col-sm-3">
                    <div class="text-muted font-monospace mb-1" style="font-size: 10.5px;">已結算累積消費</div>
                    <div class="fw-bold font-monospace text-primary">
                      NT$ {{ (viewingMember.totalSpent || 0).toLocaleString() }}
                    </div>
                  </div>
                  <div class="col-6 col-sm-3">
                    <div class="text-muted font-monospace mb-1" style="font-size: 10.5px;">風控狀態</div>
                    <div>
                      <span class="badge rounded-pill font-monospace px-2.5 py-1" :class="getRiskBadgeClass(viewingMember.riskStatus)">
                        {{ getRiskStatusLabel(viewingMember.riskStatus) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 列表工具列：提示與全部展開/收合 -->
              <div v-if="viewingMemberOrders.length > 0" class="d-flex justify-content-between align-items-center mb-3 px-1">
                <span class="text-muted font-monospace" style="font-size: 11px;">
                  點擊單筆訂單標頭可展開或收合商品明細
                </span>
                <button
                  type="button"
                  class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-0.5 font-monospace"
                  style="font-size: 11px;"
                  @click="toggleAllModalOrders"
                >
                  {{ areAllModalOrdersExpanded ? '全部收合' : '全部展開' }}
                </button>
              </div>

              <!-- 可收合的歷史訂單清單 -->
              <div v-if="viewingMemberOrders.length > 0" class="d-flex flex-column gap-3">
                <div
                  v-for="ord in viewingMemberOrders"
                  :key="ord.orderId || ord.id"
                  class="modal-order-accordion rounded-4 border bg-white shadow-2xs overflow-hidden"
                  :class="{ 'is-expanded': isModalOrderExpanded(ord.orderId || ord.id) }"
                >
                  <!-- 訂單標頭摘要（點擊切換收合/展開） -->
                  <div
                    class="modal-order-header p-3 px-3.5 d-flex justify-content-between align-items-center flex-wrap gap-2.5"
                    @click="toggleModalOrderExpand(ord.orderId || ord.id)"
                  >
                    <div class="d-flex align-items-center flex-wrap gap-2">
                      <span class="font-monospace fw-bold text-dark">#{{ ord.orderId || ord.id }}</span>
                      <span class="badge rounded-pill font-monospace px-2.5 py-1" :class="getOrderStatusBadgeClass(ord.status)">
                        {{ ord.status }}
                      </span>
                      <span class="text-muted font-monospace" style="font-size: 11px;">{{ ord.createdAt || ord.date }}</span>
                      <span class="badge bg-light text-secondary border font-monospace" style="font-size: 10px;">
                        {{ getModalOrderTotalQty(ord) }} 件商品
                      </span>
                    </div>

                    <div class="d-flex align-items-center gap-2.5 ms-auto">
                      <span class="font-monospace text-dark">
                        實付 <strong class="fs-6">NT$ {{ (ord.totalAmount || ord.total || 0).toLocaleString() }}</strong>
                      </span>
                      <div
                        class="rounded-circle bg-light border d-flex align-items-center justify-content-center transition-icon"
                        :class="{ 'rotate-180': isModalOrderExpanded(ord.orderId || ord.id) }"
                        style="width: 26px; height: 26px;"
                      >
                        <ChevronDown style="width: 14px; height: 14px;" class="text-dark" />
                      </div>
                    </div>
                  </div>

                  <!-- 可折疊的訂單商品明細內容區 -->
                  <div v-show="isModalOrderExpanded(ord.orderId || ord.id)" class="p-3.5 px-4 border-top bg-light bg-opacity-50">
                    <!-- 付款與配送資訊條 -->
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-2.5 mb-2.5 border-bottom text-muted font-monospace" style="font-size: 11px;">
                      <div>
                        付款方式：<strong class="text-dark">{{ ord.paymentMethod || 'LINE Pay' }}</strong>
                        <span class="mx-2">·</span>
                        配送方式：<strong class="text-dark">{{ ord.shippingMethod === 'CVS' ? '超商純取貨' : '黑貓宅配' }}</strong>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <span v-if="ord.trackingNumber" class="badge bg-white text-dark border font-monospace" style="font-size: 10px;">
                          物流單號：{{ ord.trackingNumber }}
                        </span>
                        <span v-if="ord.rewardsSettled" class="text-success fw-semibold">✓ 已計入累積消費</span>
                      </div>
                    </div>

                    <!-- 商品項目清單 -->
                    <div class="d-flex flex-column gap-2 mb-2.5">
                      <div
                        v-for="(item, idx) in (ord.items || [])"
                        :key="idx"
                        class="d-flex justify-content-between align-items-center p-2.5 px-3 rounded-3 bg-white border"
                      >
                        <div class="d-flex align-items-center gap-2.5">
                          <div v-if="item.image" class="rounded-2 overflow-hidden border flex-shrink-0" style="width: 36px; height: 45px;">
                            <img :src="item.image" class="w-100 h-100 object-fit-cover" />
                          </div>
                          <div class="text-dark">
                            <strong class="d-block">{{ item.name }}</strong>
                            <span class="text-muted font-monospace" style="font-size: 10.5px;">
                              規格：{{ item.color }} / {{ item.size }} × {{ item.quantity }} 件
                            </span>
                          </div>
                        </div>
                        <span class="font-monospace fw-semibold text-dark">
                          NT$ {{ ((item.price || 0) * (item.quantity || 1)).toLocaleString() }}
                        </span>
                      </div>
                    </div>

                    <!-- 收件地址備註 -->
                    <div class="text-muted font-monospace pt-1" style="font-size: 11px;">
                      收件資訊：{{ ord.recipientName || viewingMember.name }} ({{ ord.phone || viewingMember.phone }}) · {{ ord.shippingAddress || '預設配送地址' }}
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-5 rounded-4 bg-light border text-muted">
                該會員目前尚無任何歷史訂單紀錄。
              </div>
            </div>

            <div class="modal-footer border-0 pt-3 px-2">
              <button type="button" class="btn btn-dark rounded-pill px-4 py-1.5 btn-sm fw-bold" @click="showViewOrdersModal = false">
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ==================== 彈窗 1：新增 VIP 階級 Modal ==================== -->
    <Teleport to="body">
      <div v-if="showNewTierModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-2">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">新增 VIP 會員階級</h3>
              <button type="button" class="btn-close" @click="showNewTierModal = false"></button>
            </div>
            <div class="modal-body small px-2 py-3">
              <form @submit.prevent="submitNewTier" class="d-flex flex-column gap-3.5">
                <div class="row g-3">
                  <div class="col-5">
                    <label class="form-label text-secondary fw-semibold mb-1.5">階級代碼 (英文) *</label>
                    <input v-model="newTierForm.id" required type="text" class="form-control form-control-sm font-monospace text-uppercase py-2 px-3" placeholder="如：PLATINUM" />
                  </div>
                  <div class="col-7">
                    <label class="form-label text-secondary fw-semibold mb-1.5">階級顯示名稱 *</label>
                    <input v-model="newTierForm.name" required type="text" class="form-control form-control-sm py-2 px-3" placeholder="如：白金 VIP (PLATINUM)" />
                  </div>
                </div>
                <div class="row g-3">
                  <div class="col-4">
                    <label class="form-label text-secondary fw-semibold mb-1.5">升級門檻 (NT$) *</label>
                    <input v-model.number="newTierForm.minSpend" required type="number" min="0" step="500" class="form-control form-control-sm font-monospace py-2 px-2.5" />
                  </div>
                  <div class="col-4">
                    <label class="form-label text-secondary fw-semibold mb-1.5">折扣率 (0.88=88折)</label>
                    <input v-model.number="newTierForm.discountRate" required type="number" min="0.1" max="1" step="0.01" class="form-control form-control-sm font-monospace py-2 px-2.5" />
                  </div>
                  <div class="col-4">
                    <label class="form-label text-secondary fw-semibold mb-1.5">點數回饋 (%) *</label>
                    <input v-model.number="newTierForm.pointsEarnRate" required type="number" min="0" max="50" class="form-control form-control-sm font-monospace py-2 px-2.5" />
                  </div>
                </div>
                <div>
                  <label class="form-label text-secondary fw-semibold mb-1.5">權益說明文案</label>
                  <input v-model="newTierForm.description" type="text" class="form-control form-control-sm py-2 px-3" placeholder="描述此階級享有的專屬折扣與點數權益" />
                </div>
                <button type="submit" class="btn btn-dark w-100 rounded-pill py-2.5 fw-bold mt-2">確認新增 VIP 階級</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ==================== 彈窗 2：新增自動化發券規則 Modal ==================== -->
    <Teleport to="body">
      <div v-if="showNewRuleModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 520px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-2">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">新增自動化優惠券派發規則</h3>
              <button type="button" class="btn-close" @click="showNewRuleModal = false"></button>
            </div>
            <div class="modal-body small px-2 py-3">
              <form @submit.prevent="submitNewRule" class="d-flex flex-column gap-3.5">
                <div>
                  <label class="form-label text-secondary fw-semibold mb-1.5">規則名稱 *</label>
                  <input v-model="newRuleForm.name" required type="text" class="form-control form-control-sm py-2 px-3" placeholder="如：晉升黑鑽 VIP 自動發送 500 元賀禮" />
                </div>

                <div>
                  <label class="form-label text-secondary fw-semibold mb-1.5">觸發條件 / 發送時間排程 *</label>
                  <select v-model="newRuleForm.scheduleType" class="form-select form-select-sm py-2 px-3" @change="onScheduleTypeChange">
                    <option value="VIP_UPGRADE">👑 當會員 VIP 升級時自動發送 (事件觸發)</option>
                    <option value="MONTHLY_1ST">📅 每月 1 號自動發送</option>
                    <option value="SPECIFIC_DATE">🗓️ 指定特定日期發送</option>
                  </select>
                </div>

                <div v-if="newRuleForm.scheduleType === 'SPECIFIC_DATE'">
                  <label class="form-label text-secondary fw-semibold mb-1.5">選擇發送日期 *</label>
                  <input v-model="newRuleForm.specificDate" required type="date" class="form-control form-control-sm font-monospace py-2 px-3" />
                </div>

                <div>
                  <label class="form-label text-secondary fw-semibold mb-1.5">
                    {{ newRuleForm.scheduleType === 'VIP_UPGRADE' ? '觸發升級之目標階級 *' : '發送對象種類 *' }}
                  </label>

                  <select v-if="newRuleForm.scheduleType === 'VIP_UPGRADE'" v-model="newRuleForm.targetGroup" class="form-select form-select-sm py-2 px-3" required>
                    <option value="ANY_UPGRADE">✨ 任一 VIP 階級升級時皆自動發送</option>
                    <option v-for="t in upgradableVipTiers" :key="t.id" :value="'TIER:' + t.id">
                      🏅 僅當升級至【{{ t.name }}】時發送
                    </option>
                  </select>

                  <select v-else v-model="newRuleForm.targetGroup" class="form-select form-select-sm py-2 px-3" required>
                    <option value="BIRTHDAY_MONTH">🎂 本月壽星會員</option>
                    <option value="ALL_ACTIVE">👥 全體活躍會員</option>
                    <option value="ALL_VIP">👑 全體 VIP 會員 (含白銀以上)</option>
                    <option v-for="t in marketingStore.vipTiers" :key="t.id" :value="'TIER:' + t.id">
                      🏅 指定階層：{{ t.name }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="form-label text-secondary fw-semibold mb-1.5">選擇派發的優惠券 *</label>
                  <select v-model="newRuleForm.couponCode" class="form-select form-select-sm font-monospace py-2 px-3" required>
                    <option v-for="c in marketingStore.couponTemplates" :key="c.id" :value="c.code">
                      {{ c.code }} - {{ c.title }}
                    </option>
                  </select>
                </div>

                <button type="submit" class="btn btn-dark w-100 rounded-pill py-2.5 fw-bold mt-2">確認建立自動派發規則</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ==================== 彈窗 3：建立新優惠券 ==================== -->
    <Teleport to="body">
      <div v-if="showCouponModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-2">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">建立新優惠券與優惠碼</h3>
              <button type="button" class="btn-close" @click="showCouponModal = false"></button>
            </div>
            <div class="modal-body small px-2 py-3">
              <form @submit.prevent="createNewCoupon" class="d-flex flex-column gap-3">
                <div class="row g-2.5">
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">優惠代碼 *</label>
                    <input v-model="newCouponForm.code" required type="text" class="form-control form-control-sm font-monospace text-uppercase" placeholder="如：VIP85" />
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">優惠券標題 *</label>
                    <input v-model="newCouponForm.title" required type="text" class="form-control form-control-sm" placeholder="如：VIP 專屬 85 折券" />
                  </div>
                </div>

                <div class="row g-2.5">
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

                <div v-if="newCouponForm.type === 'PERCENT'" class="p-3 rounded-3 bg-warning-subtle border border-warning-subtle">
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

                <div class="row g-2.5">
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">最低消費門檻 (NT$)</label>
                    <input v-model.number="newCouponForm.minSpend" required type="number" min="0" class="form-control form-control-sm font-monospace" />
                  </div>
                  <div class="col-6">
                    <label class="form-label text-secondary mb-1">到期日 *</label>
                    <input v-model="newCouponForm.expiryDate" required type="date" class="form-control form-control-sm font-monospace" />
                  </div>
                </div>

                <button type="submit" class="btn btn-primary w-100 rounded-pill py-2.5 fw-bold mt-2">確認建立優惠券</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ==================== 彈窗 4：整合編輯會員資料、生日與風控狀態 Modal ==================== -->
    <Teleport to="body">
      <div v-if="showEditMemberModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-2">
              <div>
                <h3 class="modal-title fs-5 fw-bold text-dark font-serif">編輯會員資料與風控狀態</h3>
                <span class="text-muted font-monospace" style="font-size: 11px;" v-if="editingMember">
                  會員編號：{{ editingMember.id }} · 電子信箱：{{ editingMember.email }}
                </span>
              </div>
              <button type="button" class="btn-close" @click="showEditMemberModal = false"></button>
            </div>

            <div class="modal-body small px-2 py-2" v-if="editingMember">
              <form id="editMemberAllForm" @submit.prevent="submitMemberAllUpdate" class="d-flex flex-column gap-3.5">
                <div class="p-3.5 rounded-3 bg-light border">
                  <div class="fw-bold text-dark mb-2.5 pb-1.5 border-bottom">一、基本資料、生日與 VIP 階級</div>
                  <div class="row g-3">
                    <div class="col-12 col-sm-6">
                      <label class="form-label text-secondary mb-1">會員姓名 *</label>
                      <input v-model="memberEditForm.name" required type="text" class="form-control form-control-sm" />
                    </div>
                    <div class="col-12 col-sm-6">
                      <label class="form-label text-secondary mb-1">聯絡手機 *</label>
                      <input v-model="memberEditForm.phone" required type="tel" class="form-control form-control-sm font-monospace" />
                    </div>
                    <div class="col-12 col-sm-6">
                      <label class="form-label text-dark fw-bold mb-1">🎂 會員生日 (YYYY-MM-DD)</label>
                      <input v-model="memberEditForm.birthday" type="date" class="form-control form-control-sm font-monospace" />
                    </div>
                    <div class="col-12 col-sm-6">
                      <label class="form-label text-secondary mb-1">VIP 階級</label>
                      <select v-model="memberEditForm.vipTierId" class="form-select form-select-sm font-monospace">
                        <option v-for="t in marketingStore.vipTiers" :key="t.id" :value="t.id">{{ t.name }}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="p-3.5 rounded-3 bg-light border">
                  <div class="fw-bold text-danger mb-2.5 pb-1.5 border-bottom">二、會員風控管制與黑名單狀態</div>
                  <div class="row g-3">
                    <div class="col-12">
                      <label class="form-label text-secondary fw-semibold mb-1">風控管制等級設定 *</label>
                      <select v-model="memberEditForm.riskStatus" class="form-select form-select-sm font-monospace" required>
                        <option value="NORMAL">● 正常狀態 (NORMAL) - 全站功能正常使用</option>
                        <option value="WARNING">▲ 黃燈觀察 (WARNING) - 標記觀察名單，不限制交易</option>
                        <option value="RESTRICT_COD">✕ 限制取貨付款 (RESTRICT_COD) - 禁止超商取貨付款/貨到付款</option>
                        <option value="RESTRICT_PROMO">✕ 限制優惠權益 (RESTRICT_PROMO) - 禁止領取/使用優惠券與點數</option>
                        <option value="BLOCK_ORDER">⛔ 禁止下單 (BLOCK_ORDER) - 可登入檢視訂單，但禁止新結帳</option>
                        <option value="BANNED">🚫 永久封鎖黑名單 (BANNED) - 全面封鎖登入與一切交易權限</option>
                      </select>
                    </div>

                    <div class="col-12">
                      <label class="form-label text-secondary fw-semibold mb-1">風控備忘錄 / 封鎖原因說明</label>
                      <textarea
                        v-model="memberEditForm.notes"
                        rows="2"
                        class="form-control form-control-sm"
                        placeholder="填寫管制原因（例如：多次超商未取退貨、爭議款項等），受限會員結帳時將看到對應提示..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div class="modal-footer border-0 pt-3 px-2">
              <button type="button" class="btn btn-light border rounded-pill px-4 btn-sm" @click="showEditMemberModal = false">
                取消
              </button>
              <button type="submit" form="editMemberAllForm" class="btn btn-dark rounded-pill px-4 py-2 fw-bold btn-sm">
                ✓ 儲存會員資料與風控設定
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Users, Ticket, Crown, ChevronDown } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import { useMarketingStore } from '../../stores/marketingStore'
import { useAdminStore } from '../../stores/adminStore'

const authStore = useAuthStore()
const marketingStore = useMarketingStore()
const adminStore = useAdminStore()

const activeTab = ref('members')

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
  targetGroup: 'ANY_UPGRADE',
  scheduleType: 'VIP_UPGRADE',
  specificDate: '',
  couponCode: 'UPGRADE500'
})

const upgradableVipTiers = computed(() => {
  return (marketingStore.vipTiers || []).filter(t => t.minSpend > 0)
})

const onScheduleTypeChange = () => {
  if (newRuleForm.scheduleType === 'VIP_UPGRADE') {
    newRuleForm.targetGroup = 'ANY_UPGRADE'
  } else {
    newRuleForm.targetGroup = 'BIRTHDAY_MONTH'
  }
}

const openNewRuleModal = () => {
  newRuleForm.name = ''
  newRuleForm.scheduleType = 'VIP_UPGRADE'
  newRuleForm.targetGroup = 'ANY_UPGRADE'
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
  if (targetGroup === 'ANY_UPGRADE') return '✨ 任一 VIP 階級升級時'
  if (targetGroup === 'BIRTHDAY_MONTH') return '🎂 本月壽星會員'
  if (targetGroup === 'ALL_ACTIVE') return '👥 全體活躍會員'
  if (targetGroup === 'ALL_VIP') return '👑 全體 VIP 會員'
  if (targetGroup && targetGroup.startsWith('TIER:')) {
    const tierId = targetGroup.replace('TIER:', '')
    const found = marketingStore.vipTiers.find(t => t.id === tierId)
    return found ? `🏅 目標階層：${found.name}` : `目標階層 (${tierId})`
  }
  return targetGroup
}

const getScheduleLabel = (rule) => {
  if (rule.scheduleType === 'VIP_UPGRADE') return '👑 VIP 升級時自動發送'
  if (rule.scheduleType === 'MONTHLY_1ST') return '📅 每月 1 號自動發送'
  return `🗓️ 指定日期 (${rule.specificDate || '未設日期'})`
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

// ==================== 3. 建立新優惠券 ====================
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

// ==================== 4. 會員名冊、查看歷史訂單(可收合)與整合編輯 ====================
const searchKeyword = ref('')
const filterRiskStatus = ref('ALL')
const onlyBirthdayMonth = ref(false)

const isMemberBirthdayMonth = (birthdayStr) => {
  if (!birthdayStr) return false
  const currentMonth = new Date().getMonth() + 1
  const bMonth = Number(birthdayStr.split('-')[1])
  return currentMonth === bMonth
}

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

const getTierNameById = (tierId) => {
  const found = (marketingStore.vipTiers || []).find(t => t.id === tierId)
  return found ? found.name : (tierId || '一般會員')
}

const getOrderStatusBadgeClass = (status) => {
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

// 查看會員歷史訂單狀態與可收合控制
const showViewOrdersModal = ref(false)
const viewingMember = ref(null)
const expandedModalOrderIds = ref({})

const openMemberOrdersModal = (member) => {
  viewingMember.value = member
  expandedModalOrderIds.value = {}
  showViewOrdersModal.value = true
  // 預設自動展開最新第一筆訂單
  if (viewingMemberOrders.value.length > 0) {
    const firstId = viewingMemberOrders.value[0].orderId || viewingMemberOrders.value[0].id
    expandedModalOrderIds.value[firstId] = true
  }
}

const viewingMemberOrders = computed(() => {
  if (!viewingMember.value) return []
  const m = viewingMember.value
  return (adminStore.orders || []).filter(
    ord =>
      (m.email && ord.email === m.email) ||
      (m.phone && ord.phone === m.phone) ||
      (m.name && (ord.recipientName === m.name || ord.customerName === m.name))
  )
})

const isModalOrderExpanded = (id) => Boolean(expandedModalOrderIds.value[id])

const toggleModalOrderExpand = (id) => {
  expandedModalOrderIds.value[id] = !expandedModalOrderIds.value[id]
}

const areAllModalOrdersExpanded = computed(() => {
  if (viewingMemberOrders.value.length === 0) return false
  return viewingMemberOrders.value.every(o => isModalOrderExpanded(o.orderId || o.id))
})

const toggleAllModalOrders = () => {
  const target = !areAllModalOrdersExpanded.value
  viewingMemberOrders.value.forEach(o => {
    expandedModalOrderIds.value[o.orderId || o.id] = target
  })
}

const getModalOrderTotalQty = (ord) => {
  return (ord.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
}

const changeMemberVipTier = (member, newTierId) => {
  const res = authStore.updateMemberTier(member.id, newTierId)
  if (res.issuedCoupons && res.issuedCoupons.length > 0) {
    const couponNames = res.issuedCoupons.map(c => c.title).join('、')
    if (adminStore.addAuditLog) {
      adminStore.addAuditLog('VIP 升級自動發券', `會員【${member.name}】晉升至【${newTierId}】，自動發送升級禮券：${couponNames}`)
    }
    alert(`已將【${member.name}】調升為【${newTierId}】，並觸發自動發券規則發送【${couponNames}】！`)
  }
}

const showEditMemberModal = ref(false)
const editingMember = ref(null)
const memberEditForm = reactive({
  name: '',
  phone: '',
  birthday: '',
  vipTierId: 'GENERAL',
  riskStatus: 'NORMAL',
  notes: ''
})

const openEditMemberModal = (member) => {
  editingMember.value = member
  memberEditForm.name = member.name
  memberEditForm.phone = member.phone
  memberEditForm.birthday = member.birthday || ''
  memberEditForm.vipTierId = member.vipTierId || 'GENERAL'
  memberEditForm.riskStatus = member.riskStatus || 'NORMAL'
  memberEditForm.notes = member.notes || ''
  showEditMemberModal.value = true
}

const submitMemberAllUpdate = () => {
  if (!editingMember.value) return

  const infoRes = authStore.adminUpdateMemberInfo(editingMember.value.id, {
    name: memberEditForm.name,
    phone: memberEditForm.phone,
    birthday: memberEditForm.birthday,
    vipTierId: memberEditForm.vipTierId
  })

  authStore.updateMemberRisk(editingMember.value.id, {
    riskStatus: memberEditForm.riskStatus,
    notes: memberEditForm.notes
  })

  if (adminStore.addAuditLog) {
    adminStore.addAuditLog(
      '編輯會員資料與風控狀態',
      `更新會員【${memberEditForm.name}】（生日：${memberEditForm.birthday || '未設'}，等級：${memberEditForm.vipTierId}，風控：${getRiskStatusLabel(memberEditForm.riskStatus)}）`
    )
  }

  alert(`${infoRes.message}\n風控狀態已同步更新為【${getRiskStatusLabel(memberEditForm.riskStatus)}】！`)
  showEditMemberModal.value = false
}
</script>

<style scoped>
.vip-tier-card,
.rule-schedule-card {
  padding: 1.5rem !important;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.vip-tier-card:hover,
.rule-schedule-card:hover {
  border-color: #cfc6bc !important;
  box-shadow: 0 6px 18px rgba(45, 38, 33, 0.05) !important;
}

.modal-order-accordion {
  transition: border-color 0.2s ease;
}
.modal-order-accordion.is-expanded {
  border-color: #2d2621 !important;
}
.modal-order-header {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}
.modal-order-header:hover {
  background-color: #faf8f5;
}
.transition-icon {
  transition: transform 0.25s ease;
}
.rotate-180 {
  transform: rotate(180deg);
}
</style>