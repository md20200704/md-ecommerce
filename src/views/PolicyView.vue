<template>
  <main class="policy-page container">
    <!-- 頂部品牌標題 -->
    <header class="policy-hero">
      <div class="policy-eyebrow font-monospace">
        M & D SELECT · STORE POLICIES
      </div>
      <h1 class="policy-main-title font-serif">顧客服務與政策說明</h1>
      <p class="policy-subtitle">
        為提供安心流暢的選品購物體驗，請詳閱以下退換貨說明、隱私權政策與購物須知。
      </p>
    </header>

    <!-- 分頁切換列（手機版 3 欄等寬不折行，桌機版膠囊置中） -->
    <nav class="policy-tabs" aria-label="政策說明分類">
      <button
        type="button"
        class="policy-tab-btn font-monospace"
        :class="{ 'is-active': activeTab === 'returns' }"
        @click="switchTab('returns')"
      >
        退換貨說明
      </button>
      <button
        type="button"
        class="policy-tab-btn font-monospace"
        :class="{ 'is-active': activeTab === 'privacy' }"
        @click="switchTab('privacy')"
      >
        隱私權政策
      </button>
      <button
        type="button"
        class="policy-tab-btn font-monospace"
        :class="{ 'is-active': activeTab === 'shopping' }"
        @click="switchTab('shopping')"
      >
        購物須知
      </button>
    </nav>

    <!-- 1. 退換貨說明 -->
    <section v-if="activeTab === 'returns'" class="policy-card">
      <div class="policy-card-head">
        <h2 class="policy-card-title font-serif">退換貨說明（Returns &amp; Exchanges）</h2>
        <span class="policy-badge font-monospace">7 DAYS APPRECIATION PERIOD</span>
      </div>

      <div class="policy-sections">
        <article class="policy-item">
          <h3 class="policy-item-title">一、鑑賞期與申請期限</h3>
          <p class="policy-item-text">
            依消費者保護法規定，享有商品到貨<strong>次日起 7 天鑑賞期</strong>（非試用期）；如需辦理退貨請於七天內退回、或售後申請，請於鑑賞期內至會員中心「訂單紀錄」提出申請。
          </p>
        </article>

        <article class="policy-item">
          <h3 class="policy-item-title">二、退換貨條件</h3>
          <ul class="policy-list">
            <li>商品須保持<strong>全新、未下水、未剪標、無香水／菸味／妝容沾染</strong>，且隨附配件、吊牌、贈品與完整包裝皆齊全。</li>
            <li>貼身衣物、襪類、客製化或已剪標／使用過之商品，除瑕疵或寄錯外<strong>恕不接受退換</strong>。</li>
          </ul>
        </article>

        <article class="policy-item">
          <h3 class="policy-item-title">三、瑕疵與寄錯處理</h3>
          <p class="policy-item-text">
            若收到商品有瑕疵、破損或與訂購品項／規格不符，請於<strong>拆封時錄影</strong>，並透過退貨視窗或線上客服聯繫處理，相關寄回運費由本店負擔。
          </p>
        </article>

        <article class="policy-item">
          <h3 class="policy-item-title">四、退款與折抵說明</h3>
          <p class="policy-item-text">
            退貨商品經倉庫驗收確認無誤後辦理<strong>換貨或退款</strong>；訂單若有使用優惠券或紅利點數折抵，將依系統規則處理點數／券項狀態，實際入帳時間視付款方式與銀行作業流程而定。
          </p>
        </article>
      </div>
    </section>

    <!-- 2. 隱私權政策 -->
    <section v-else-if="activeTab === 'privacy'" class="policy-card">
      <div class="policy-card-head">
        <h2 class="policy-card-title font-serif">隱私權政策（Privacy Policy）</h2>
        <span class="policy-badge font-monospace">PRIVACY &amp; DATA PROTECTION</span>
      </div>

      <div class="policy-sections">
        <article class="policy-item">
          <h3 class="policy-item-title">一、蒐集之個人資料類別</h3>
          <p class="policy-item-text">
            包含會員註冊與個人資料（姓名、電子信箱、手機號碼、生日）、收件與超商取貨資訊（收件人、寄送地址、指定超商門市資訊）、訂單與交易紀錄、客服對話與照片附件，以及必要的登入連線資訊。
          </p>
        </article>

        <article class="policy-item">
          <h3 class="policy-item-title">二、蒐集與利用目的</h3>
          <p class="policy-item-text">
            用於會員身分驗證與帳號管理、訂單成立與出貨配送、LINE Pay 金流對帳與售後服務、VIP 會員等級與優惠／生日禮遇派發、客服回覆與系統安全稽核。
          </p>
        </article>

        <article class="policy-item">
          <h3 class="policy-item-title">三、資料保存與安全保護</h3>
          <p class="policy-item-text">
            採用加密密碼雜湊與權限控管機制保護帳號安全；於達成蒐集目的或依法規保存期間內保存資料，除法律規定或履行訂單與物流配送必要外，不會任意向第三方揭露。
          </p>
        </article>

        <article class="policy-item">
          <h3 class="policy-item-title">四、當事人權利</h3>
          <p class="policy-item-text">
            會員可隨時至「會員中心」查詢、修改個人資料，或透過客服管道聯繫查詢／更正／停止利用或刪除帳號相關資料。
          </p>
        </article>
      </div>
    </section>

    <!-- 3. 購物須知 -->
    <section v-else class="policy-card">
      <div class="policy-card-head">
        <h2 class="policy-card-title font-serif">購物須知（Shopping Guide）</h2>
        <span class="policy-badge font-monospace">SHOPPING GUIDELINES</span>
      </div>

      <div class="policy-sections">
        <article class="policy-item">
          <h3 class="policy-item-title">一、會員與帳號安全</h3>
          <p class="policy-item-text">
            建議註冊時填寫正確的電子信箱、手機號碼與生日資訊（生日資訊可用於生日當月禮遇）；為保護帳號安全，系統設有閒置自動登出與活躍續期機制，請勿共用帳號或於公共裝置忘記登出。
          </p>
        </article>

        <article class="policy-item">
          <h3 class="policy-item-title">二、商品規格、庫存與色差提醒</h3>
          <p class="policy-item-text">
            商品庫存採即時同步機制，若遇熱門款式缺貨或斷貨，可留意庫存狀態或登記貨到通知；因每部電腦、手機解析度不同、以及拍攝光線差異，實品顏色與圖片略有色差，屬正常；尺寸與版型請參考商品頁面說明。
          </p>
        </article>

        <article class="policy-item">
          <h3 class="policy-item-title">三、付款與配送方式</h3>
          <p class="policy-item-text">
            支援線上付款（如 LINE Pay）與指定配送方式（如超商純取貨或宅配到府，依結帳頁面顯示為準），運費與折抵金額將依購物袋與優惠／點數使用條件計算。
          </p>
        </article>

        <article class="policy-item">
          <h3 class="policy-item-title">四、未取件與訂單規範</h3>
          <p class="policy-item-text">
            選擇超商取貨者，請於門市通知期限內完成取件；若 <strong>3 次未取件</strong>導致退回，會影響帳號下單權益或付款方式權限，敬請留意取件通知。
          </p>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const validTabs = ['returns', 'privacy', 'shopping']

const resolveTab = (val) => {
  const key = String(val || '').toLowerCase()
  return validTabs.includes(key) ? key : 'returns'
}

const activeTab = ref(resolveTab(route.params.tab || route.query.tab))

watch(
  () => [route.params.tab, route.query.tab],
  ([paramTab, queryTab]) => {
    activeTab.value = resolveTab(paramTab || queryTab)
  }
)

const switchTab = (tab) => {
  activeTab.value = tab
  router.replace({ name: 'policy', params: { tab } })
}
</script>

<style scoped>
/* 手機優先（Mobile First < 576px） */
.policy-page {
  max-width: 920px;
  margin: 0 auto;
  padding: 20px 14px 36px;
}

.policy-hero {
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e8e2da;
}

.policy-eyebrow {
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #9b7e68;
  margin-bottom: 4px;
}

.policy-main-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d2621;
  margin-bottom: 6px;
  line-height: 1.35;
}

.policy-subtitle {
  font-size: 0.8125rem;
  color: #70675f;
  line-height: 1.6;
  margin: 0;
}

/* 3 欄等寬分頁列：小螢幕不換行、不溢出 */
.policy-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  padding: 5px;
  margin-bottom: 18px;
  border-radius: 999px;
  background-color: #f3efe9;
  border: 1px solid #e3dbd0;
}

.policy-tab-btn {
  appearance: none;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #4a423b;
  font-size: 0.78rem;
  font-weight: 500;
  padding: 8px 6px;
  white-space: nowrap;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.policy-tab-btn:hover {
  color: #2d2621;
}

.policy-tab-btn.is-active {
  background-color: #2d2621;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(45, 38, 33, 0.16);
}

/* 內容卡片 */
.policy-card {
  background-color: #ffffff;
  border: 1px solid #e8e2da;
  border-radius: 16px;
  padding: 18px 16px;
  box-shadow: 0 4px 18px rgba(45, 38, 33, 0.04);
}

.policy-card-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding-bottom: 14px;
  margin-bottom: 18px;
  border-bottom: 1px solid #ebe5dd;
}

.policy-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #2d2621;
  margin: 0;
  line-height: 1.4;
}

.policy-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background-color: #f2ece3;
  color: #705844;
  font-size: 10px;
  letter-spacing: 0.04em;
}

.policy-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.policy-item-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #2d2621;
  margin-bottom: 6px;
  line-height: 1.45;
}

.policy-item-text {
  font-size: 0.84375rem;
  color: #5c534b;
  line-height: 1.8;
  margin: 0;
  word-break: break-word;
}

.policy-list {
  margin: 0;
  padding-left: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.84375rem;
  color: #5c534b;
  line-height: 1.8;
}

/* 平板裝置（>= 576px） */
@media (min-width: 576px) {
  .policy-page {
    padding: 32px 24px 48px;
  }

  .policy-main-title {
    font-size: 1.45rem;
  }

  .policy-subtitle {
    font-size: 0.875rem;
  }

  .policy-tabs {
    gap: 8px;
    padding: 6px;
    margin-bottom: 24px;
  }

  .policy-tab-btn {
    font-size: 0.85rem;
    padding: 9px 16px;
  }

  .policy-card {
    border-radius: 20px;
    padding: 26px 28px;
  }

  .policy-card-head {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .policy-card-title {
    font-size: 1.2rem;
  }

  .policy-badge {
    font-size: 11px;
  }
}

/* 桌機裝置（>= 992px） */
@media (min-width: 992px) {
  .policy-page {
    padding: 44px 20px 64px;
  }

  .policy-hero {
    padding-bottom: 18px;
    margin-bottom: 24px;
  }

  .policy-main-title {
    font-size: 1.6rem;
  }

  .policy-card {
    padding: 34px 38px;
  }

  .policy-sections {
    gap: 26px;
  }

  .policy-item-title {
    font-size: 1rem;
  }

  .policy-item-text,
  .policy-list {
    font-size: 0.9rem;
  }
}
</style>