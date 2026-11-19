<template>
  <section class="profile-card">
    <div class="vip-top-grid">
      <!-- 左側：會員名稱、徽章、登出按鈕與累計消費 -->
      <div class="vip-info-col">
        <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
          <div class="d-flex align-items-center flex-wrap gap-2">
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

          <!-- 會員登出按鈕（手機與桌機皆可一鍵登出） -->
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 font-monospace d-inline-flex align-items-center gap-1 flex-shrink-0"
            style="font-size: 11.5px; border-color: #dcd6cd;"
            @click="handleLogout"
          >
            <LogOut style="width: 12px; height: 12px;" />
            <span>登出帳號</span>
          </button>
        </div>

        <p class="small text-muted mb-2">{{ vipTierInfo.description }}</p>

        <div class="vip-meta-row font-monospace">
          <span>已結算累積消費：<strong class="text-dark">NT$ {{ (currentUser.totalSpent || 0).toLocaleString() }}</strong></span>
          <span class="d-none d-sm-inline text-muted">•</span>
          <span>點數回饋率：<strong class="text-primary">{{ vipTierInfo.pointsEarnRate }}%</strong></span>
        </div>
      </div>

      <!-- 右側：可用紅利點數盒 -->
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
</template>

<script setup>
import { computed } from 'vue'
import { Crown, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import { useMarketingStore } from '../../stores/marketingStore'

const authStore = useAuthStore()
const marketingStore = useMarketingStore()

const currentUser = computed(() => authStore.user || {})

const handleLogout = () => {
  if (confirm('確定要登出目前的會員帳號嗎？')) {
    authStore.logout()
  }
}

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
</script>

<style scoped>
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

.vip-info-col {
  flex: 1 1 auto;
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
</style>