<template>
  <!-- 外層加入安全的響應式內距，徹底解決手機貼邊與擠壓問題 -->
  <div class="d-flex flex-column gap-4 w-100 px-3 px-sm-4 px-md-0" style="min-width: 0; overflow-x: hidden; box-sizing: border-box;">
    
    <!-- 頂部頁頭與新增按鈕 -->
    <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 py-2">
      <div>
        <h1 class="h4 fw-bold text-dark font-serif mb-1">商品與即時庫存控管</h1>
        <p class="small text-muted mb-0">總庫存歸 0 時自動轉為「已下架」，點擊「編輯」按鈕即可進入彈窗調整各規格庫存與成本</p>
      </div>
      <button class="btn btn-dark btn-sm rounded-pill px-4 py-2 fw-bold shadow-2xs text-nowrap" @click="openNewProductModal">
        + 新增上架商品
      </button>
    </div>

    <!-- 1. 商品上下架與庫存狀態快速指標卡 -->
    <div class="row g-3">
      <div class="col-6 col-md-3">
        <div
          class="stat-filter-card bg-white rounded-4 border shadow-2xs h-100 p-3.5 cursor-pointer"
          :class="{ 'is-active-dark': stockFilter === 'ALL' }"
          @click="stockFilter = 'ALL'; triggerSearch()"
        >
          <div class="text-muted small font-monospace mb-1">全部商品總數</div>
          <div class="h4 fw-bold font-monospace text-dark mb-0">{{ allProducts.length }} <span class="fs-6 fw-normal text-muted">款</span></div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div
          class="stat-filter-card bg-white rounded-4 border shadow-2xs h-100 p-3.5 cursor-pointer"
          :class="{ 'is-active-success': stockFilter === 'PUBLISHED' }"
          @click="stockFilter = 'PUBLISHED'; triggerSearch()"
        >
          <div class="text-muted small font-monospace mb-1">前台販售中 (上架)</div>
          <div class="h4 fw-bold font-monospace text-success mb-0">{{ publishedCount }} <span class="fs-6 fw-normal text-muted">款</span></div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div
          class="stat-filter-card bg-white rounded-4 border shadow-2xs h-100 p-3.5 cursor-pointer"
          :class="{ 'is-active-warning': stockFilter === 'LOW_STOCK' }"
          @click="stockFilter = 'LOW_STOCK'; triggerSearch()"
        >
          <div class="text-muted small font-monospace mb-1">低庫存預警 (1~5件)</div>
          <div class="h4 fw-bold font-monospace text-warning-emphasis mb-0">{{ lowStockCount }} <span class="fs-6 fw-normal text-muted">款</span></div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div
          class="stat-filter-card bg-white rounded-4 border shadow-2xs h-100 p-3.5 cursor-pointer"
          :class="{ 'is-active-muted': stockFilter === 'UNPUBLISHED' }"
          @click="stockFilter = 'UNPUBLISHED'; triggerSearch()"
        >
          <div class="text-muted small font-monospace mb-1">已下架 / 庫存歸 0</div>
          <div class="h4 fw-bold font-monospace text-secondary mb-0">{{ unpublishedCount }} <span class="fs-6 fw-normal text-muted">款</span></div>
        </div>
      </div>
    </div>

    <!-- 2. 多條件進階篩選與搜尋工具列（點擊「查詢商品」才執行） -->
    <div class="card-korean p-4 bg-white rounded-4 border shadow-xs">
      <div class="row g-3 align-items-center">
        <!-- 關鍵字搜尋框 -->
        <div class="col-12 col-md-4">
          <label class="form-label text-secondary mb-1" style="font-size: 11px;">關鍵字搜尋</label>
          <input
            v-model="tempKeyword"
            type="text"
            class="form-control form-control-sm rounded-pill px-3.5 py-2"
            placeholder="搜尋商品名稱、細項或顏色..."
          />
        </div>

        <!-- 主分類篩選 -->
        <div class="col-6 col-sm-6 col-md-3">
          <label class="form-label text-secondary mb-1" style="font-size: 11px;">主分類篩選</label>
          <select
            v-model="tempCategoryFilter"
            class="form-select form-select-sm rounded-pill font-sans py-2"
            @change="tempSubcategoryFilter = 'ALL'"
          >
            <option value="ALL">全部主分類</option>
            <option v-for="cat in allMainCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- 細項子分類篩選 -->
        <div class="col-6 col-sm-6 col-md-2">
          <label class="form-label text-secondary mb-1" style="font-size: 11px;">細項子分類</label>
          <select
            v-model="tempSubcategoryFilter"
            class="form-select form-select-sm rounded-pill font-sans py-2"
          >
            <option value="ALL">全部細項</option>
            <option v-for="sub in availableSubcategoriesForFilter" :key="sub" :value="sub">{{ sub }}</option>
          </select>
        </div>

        <!-- 查詢與重置按鈕區 -->
        <div class="col-12 col-md-3 d-flex align-items-end gap-2 pt-1 pt-sm-0">
          <button
            type="button"
            class="btn btn-dark btn-sm rounded-pill px-3.5 py-2 font-monospace fw-bold shadow-2xs flex-grow-1"
            style="margin-top: auto;"
            @click="triggerSearch"
          >
            🔍 查詢商品
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-2 font-monospace flex-grow-1"
            style="margin-top: auto;"
            @click="resetFilters"
          >
            重置
          </button>
        </div>
      </div>
    </div>

    <!-- 3. 商品列表與即時庫存區 -->
    <div class="card-korean p-3.5 p-sm-4 bg-white rounded-4 border shadow-xs">
      <div class="d-flex justify-content-between align-items-center mb-3.5 pb-2 border-bottom flex-wrap gap-2 px-1 px-sm-2">
        <h2 class="fs-6 fw-bold text-dark mb-0">商品庫存與規格明細列表</h2>
        <span class="text-muted small font-monospace">共顯示 {{ filteredProducts.length }} 款商品</span>
      </div>

      <div v-if="filteredProducts.length > 0">
        
        <!-- 【桌機版顯示模式】：精緻完整表格 (d-none d-lg-block) -->
        <div class="d-none d-lg-block table-responsive px-1">
          <table class="table align-middle mb-0 font-sans product-manage-table">
            <thead>
              <tr class="text-secondary text-nowrap" style="font-size: 11.5px;">
                <th class="py-3 ps-3.5 pe-3" style="min-width: 250px;">商品資訊與分類</th>
                <th class="py-3 px-3" style="min-width: 105px;">販售狀態</th>
                <th class="py-3 px-3" style="min-width: 185px;">售價 / 成本 / 毛利</th>
                <th class="py-3 px-3" style="min-width: 260px;">SKU 規格與即時庫存</th>
                <th class="py-3 ps-3 pe-3.5 text-end text-nowrap" style="min-width: 135px;">管理操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="prod in filteredProducts"
                :key="prod.id"
                class="product-row"
                :class="{ 'is-unpublished': !isProductPublished(prod) }"
              >
                <!-- 欄位 1：主圖與名稱 -->
                <td class="py-3.5 ps-3.5 pe-3">
                  <div class="d-flex align-items-center gap-3">
                    <div class="rounded-3 overflow-hidden border flex-shrink-0" style="width: 48px; height: 60px; background-color: #f7f4ef;">
                      <img :src="prod.image" class="w-100 h-100 object-fit-cover" :class="{ 'opacity-50': !isProductPublished(prod) }" />
                    </div>
                    <div class="min-w-0">
                      <div class="fw-bold text-truncate mb-1" :class="isProductPublished(prod) ? 'text-dark' : 'text-muted'" style="max-width: 190px; font-size: 13.5px;" :title="prod.name">
                        {{ prod.name }}
                      </div>
                      <div class="text-muted small" style="font-size: 11.5px;">
                        <span>{{ prod.category }}</span>
                        <span v-if="prod.subcategory" class="text-secondary"> · {{ prod.subcategory }}</span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- 欄位 2：狀態 -->
                <td class="py-3.5 px-3 text-nowrap">
                  <span v-if="isProductPublished(prod)" class="status-pill pill-published d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-medium">
                    <span class="status-dot"></span>
                    <span>上架中</span>
                  </span>
                  <div v-else class="d-flex flex-column align-items-start gap-1">
                    <span class="status-pill pill-unpublished d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-medium">
                      <span class="status-dot"></span>
                      <span>已下架</span>
                    </span>
                    <span v-if="getTotalStock(prod) === 0" class="text-danger font-monospace ps-1" style="font-size: 9.5px;">
                      庫存歸 0
                    </span>
                  </div>
                </td>

                <!-- 欄位 3：售價成本毛利（金額與 % 之間保留清晰空格） -->
                <td class="py-3.5 px-3 font-monospace">
                  <div class="d-flex flex-column gap-1">
                    <div class="fw-bold text-dark" style="font-size: 13.5px;">NT$ {{ (prod.price || 0).toLocaleString() }}</div>
                    <div class="text-secondary" style="font-size: 11px;">成本 ${{ getProductCost(prod).toLocaleString() }}</div>
                    <div class="d-flex align-items-center gap-2" style="font-size: 11.5px;">
                      <span class="text-secondary">毛利 ${{ getGrossProfit(prod.price, getProductCost(prod)).toLocaleString() }}</span>
                      <span class="badge rounded-pill px-2 py-0.5 font-monospace ms-1" :class="getMarginBadgeClass(getGrossMarginRate(prod.price, getProductCost(prod)))" style="font-size: 10px;">
                        {{ getGrossMarginRate(prod.price, getProductCost(prod)) }} %
                      </span>
                    </div>
                  </div>
                </td>

                <!-- 欄位 4：SKU 庫存 -->
                <td class="py-3.5 px-3">
                  <div class="d-flex flex-column gap-1.5 py-1 font-monospace" style="font-size: 11.5px;">
                    <div v-for="sku in (prod.skus || [])" :key="sku.skuId" class="sku-stock-pill d-flex align-items-center justify-content-between px-2.5 py-1.5 rounded-2 border bg-white">
                      <span class="text-secondary text-truncate pe-2" style="max-width: 130px;">{{ sku.color }} / {{ sku.size }}</span>
                      <span class="fw-bold text-nowrap" :class="sku.stock === 0 ? 'text-danger' : sku.stock <= 5 ? 'text-warning-emphasis' : 'text-dark'">
                        {{ sku.stock }} 件
                      </span>
                    </div>
                    <div class="text-end text-muted font-monospace mt-0.5" style="font-size: 10.5px;">
                      總庫存：<strong :class="getTotalStock(prod) === 0 ? 'text-danger' : 'text-dark'">{{ getTotalStock(prod) }} 件</strong>
                    </div>
                  </div>
                </td>

                <!-- 欄位 5：操作（按鈕獨立分開、不擠壓） -->
                <td class="py-3.5 ps-3 pe-3.5 text-end text-nowrap">
                  <div class="d-flex flex-column align-items-end gap-2" style="width: 105px; margin-left: auto;">
                    <button type="button" class="btn btn-sm rounded-pill py-1.5 font-monospace w-100 shadow-2xs" :class="isProductPublished(prod) ? 'btn-outline-secondary' : 'btn-success fw-bold'" style="font-size: 11px;" @click="toggleProductPublishStatus(prod)">
                      {{ isProductPublished(prod) ? '下架' : '上架' }}
                    </button>
                    <button type="button" class="btn btn-outline-dark btn-sm rounded-pill py-1.5 font-monospace w-100 shadow-2xs" style="font-size: 11px;" @click="openEditProductModal(prod)">
                      編輯
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm rounded-pill py-1.5 font-monospace w-100 shadow-2xs" style="font-size: 11px;" @click="deleteProductPermanently(prod)">
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 【手機／窄螢幕版顯示模式】：精美獨立卡片清單 (d-lg-none) 獨立狀態、升級版展開收合按鈕 -->
        <div class="d-lg-none d-flex flex-column gap-3.5 px-1">
          <div
            v-for="prod in filteredProducts"
            :key="prod.id"
            class="bg-white rounded-4 border p-4 shadow-2xs position-relative overflow-hidden"
            :class="{ 'opacity-75 bg-light': !isProductPublished(prod) }"
          >
            <!-- 卡片頂部第一行：商品主圖、名稱與分類 -->
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="rounded-3 overflow-hidden border flex-shrink-0" style="width: 52px; height: 66px; background-color: #f7f4ef;">
                <img :src="prod.image" class="w-100 h-100 object-fit-cover" />
              </div>
              <div class="min-w-0 flex-grow-1">
                <div class="fw-bold text-dark text-truncate mb-1" style="font-size: 14.5px;" :title="prod.name">
                  {{ prod.name }}
                </div>
                <div class="text-muted small text-truncate" style="font-size: 11.5px;">
                  <span>{{ prod.category }}</span>
                  <span v-if="prod.subcategory"> · {{ prod.subcategory }}</span>
                </div>
              </div>
            </div>

            <!-- 卡片第二行：販售狀態膠囊（放置於圖片與名稱下方，絕對不跑版） -->
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2.5 border-bottom font-monospace" style="font-size: 12px;">
              <span class="text-secondary fw-semibold">販售狀態：</span>
              <div>
                <span v-if="isProductPublished(prod)" class="status-pill pill-published px-3 py-1 rounded-pill fw-medium d-inline-block text-center" style="font-size: 11px;">
                  ● 上架中
                </span>
                <span v-else class="status-pill pill-unpublished px-3 py-1 rounded-pill fw-medium d-inline-block text-center" style="font-size: 11px;">
                  ○ 已下架
                </span>
              </div>
            </div>

            <!-- 卡片第三行：價格、毛利（金額與 % 保持空格） -->
            <div class="d-flex justify-content-between align-items-center mb-3 font-monospace bg-light p-3 rounded-3 border" style="font-size: 12.5px;">
              <div>
                <span class="text-muted" style="font-size: 11px;">售價：</span>
                <strong class="text-dark">NT$ {{ (prod.price || 0).toLocaleString() }}</strong>
              </div>
              <div>
                <span class="text-muted" style="font-size: 11px;">毛利：</span>
                <strong class="text-success">${{ getGrossProfit(prod.price, getProductCost(prod)).toLocaleString() }}</strong>
              </div>
              <div>
                <span class="badge" :class="getMarginBadgeClass(getGrossMarginRate(prod.price, getProductCost(prod)))" style="font-size: 10px;">
                  {{ getGrossMarginRate(prod.price, getProductCost(prod)) }} %
                </span>
              </div>
            </div>

            <!-- 卡片第四行：升級版優化按鈕 —— 點擊可確實控制下方 SKU 庫存細節的展開與收合 -->
            <div class="d-flex align-items-center justify-content-between mb-2 pt-1">
              <span class="text-muted font-monospace" style="font-size: 11.5px;">
                全規格總庫存：<strong :class="getTotalStock(prod) === 0 ? 'text-danger' : 'text-dark'">{{ getTotalStock(prod) }} 件</strong>
              </span>
              <button
                type="button"
                class="btn btn-sm rounded-pill px-2 py-1 font-monospace fw-semibold d-flex align-items-center gap-1 shadow-2xs btn-korean-toggle"
                style="font-size: 11.5px;"
                @click="toggleMobileSkuExpand(prod.id)"
              >
                <span>{{ isMobileSkuExpanded(prod.id) ? '收合規格明細 ▲' : '展開規格明細 ▼' }}</span>
              </button>
            </div>

            <!-- 各規格庫存細節 (SKU) 區塊：受按鈕控制確實展開與收合 -->
            <div
              v-if="isMobileSkuExpanded(prod.id)"
              class="d-flex flex-column gap-2 my-3 font-monospace pt-3 border-top bg-light p-3 rounded-3 border shadow-2xs"
              style="font-size: 12px;"
            >
              <div class="text-dark mb-1 fw-bold" style="font-size: 11.5px;">各規格庫存細節 (SKU)：</div>
              <div
                v-for="sku in (prod.skus || [])"
                :key="sku.skuId"
                class="d-flex align-items-center justify-content-between px-3 py-2 rounded-2 border bg-white"
              >
                <span class="text-secondary fw-medium">{{ sku.color }} / {{ sku.size }}</span>
                <span class="fw-bold" :class="sku.stock === 0 ? 'text-danger' : sku.stock <= 5 ? 'text-warning-emphasis' : 'text-dark'">
                  {{ sku.stock }} 件
                </span>
              </div>
            </div>

            <!-- 卡片第五行：管理操作按鈕（分開排列、大面積觸控） -->
            <div class="d-flex align-items-center gap-2.5 pt-2.5 border-top">
              <button
                type="button"
                class="btn btn-sm rounded-pill py-2 font-monospace flex-grow-1 fw-semibold shadow-2xs"
                :class="isProductPublished(prod) ? 'btn-outline-secondary' : 'btn-success fw-bold'"
                style="font-size: 11.5px;"
                @click="toggleProductPublishStatus(prod)"
              >
                {{ isProductPublished(prod) ? '下架' : '上架' }}
              </button>
              <button
                type="button"
                class="btn btn-outline-dark btn-sm rounded-pill py-2 font-monospace flex-grow-1 fw-semibold shadow-2xs"
                style="font-size: 11.5px;"
                @click="openEditProductModal(prod)"
              >
                編輯商品
              </button>
              <button
                type="button"
                class="btn btn-outline-danger btn-sm rounded-pill py-2 font-monospace px-3 shadow-2xs"
                style="font-size: 11.5px;"
                @click="deleteProductPermanently(prod)"
              >
                刪除
              </button>
            </div>
          </div>
        </div>

      </div>

      <div v-else class="text-center py-5 text-muted small font-monospace">
        目前查無符合條件的商品紀錄。
      </div>
    </div>

    <!-- ==================== 彈窗 1：編輯商品 Modal (RWD 寬幅放大與防貼邊) ==================== -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal fade show d-block modal-backdrop-custom d-flex align-items-center justify-content-center p-2 p-sm-3" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable w-100 m-2 m-sm-auto" style="max-width: 740px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl box-sizing-border">
            <div class="modal-header border-0 pb-2">
              <div>
                <h3 class="modal-title fs-5 fw-bold text-dark font-serif">編輯商品資料與庫存</h3>
                <span class="text-muted font-monospace" style="font-size: 11px;">商品編號：#{{ editForm.id }}</span>
              </div>
              <button type="button" class="btn-close shadow-none" @click="showEditModal = false"></button>
            </div>

            <div class="modal-body small px-1 py-2">
              <form id="editProductForm" @submit.prevent="saveEditedProduct" class="d-flex flex-column gap-3.5">
                <div class="row g-3">
                  <div class="col-12 col-sm-8">
                    <label class="form-label text-secondary fw-semibold mb-1">商品名稱 *</label>
                    <input v-model="editForm.name" required type="text" class="form-control form-control-sm py-2" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">前台販售狀態</label>
                    <select v-model="editForm.isPublished" class="form-select form-select-sm font-monospace py-2">
                      <option :value="true">● 上架販售中</option>
                      <option :value="false">○ 已下架 (前台隱藏)</option>
                    </select>
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">銷售價格 (NT$) *</label>
                    <input v-model.number="editForm.price" required type="number" min="0" class="form-control form-control-sm font-monospace py-2" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">單位進貨成本 (NT$) *</label>
                    <input v-model.number="editForm.cost" required type="number" min="0" class="form-control form-control-sm font-monospace py-2" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">預估單件毛利 / 毛利率</label>
                    <div
                      class="p-2 px-3 rounded-3 border d-flex align-items-center justify-content-between font-monospace"
                      :class="editGrossProfit < 0 ? 'bg-danger-subtle border-danger-subtle text-danger' : 'bg-light text-dark'"
                      style="height: 34px;"
                    >
                      <strong class="small">NT$ {{ editGrossProfit.toLocaleString() }}</strong>
                      <span class="badge" :class="getMarginBadgeClass(editGrossMarginRate)" style="font-size: 10px;">
                        {{ editGrossMarginRate }} %
                      </span>
                    </div>
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-12 col-sm-6">
                    <label class="form-label text-secondary fw-semibold mb-1">主分類 *</label>
                    <select
                      v-model="editForm.category"
                      class="form-select form-select-sm py-2"
                      required
                      @change="onEditMainCategoryChange"
                    >
                      <option v-for="cat in allMainCategories" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                  </div>

                  <div class="col-12 col-sm-6">
                    <label class="form-label text-dark fw-bold mb-1">細項分類 (Subcategory) *</label>
                    <div class="input-group input-group-sm">
                      <select
                        v-if="!editForm.isCustomSubcategory"
                        v-model="editForm.subcategory"
                        class="form-select py-2"
                        required
                      >
                        <option value="" disabled>請選擇細項分類...</option>
                        <option v-for="sub in editSubcategoryOptions" :key="sub" :value="sub">
                          {{ sub }}
                        </option>
                      </select>
                      <input
                        v-else
                        v-model="editForm.subcategory"
                        type="text"
                        required
                        class="form-control py-2"
                        placeholder="輸入自訂細項名稱..."
                      />
                      <button
                        type="button"
                        class="btn btn-outline-secondary font-monospace px-3"
                        style="font-size: 10.5px;"
                        @click="editForm.isCustomSubcategory = !editForm.isCustomSubcategory"
                      >
                        {{ editForm.isCustomSubcategory ? '選單' : '自訂' }}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="form-label text-secondary fw-semibold mb-1">商品版型與材質說明</label>
                  <textarea
                    v-model="editForm.description"
                    rows="2"
                    class="form-control form-control-sm"
                    placeholder="輸入商品剪裁細節、材質成分或穿搭建議..."
                  ></textarea>
                </div>

                <div class="p-3 rounded-3 bg-light border">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <label class="form-label text-dark fw-bold mb-0">商品展示圖集管理</label>
                    <span class="text-muted font-monospace" style="font-size: 10.5px;">目前共 {{ editForm.images.length }} 張圖片</span>
                  </div>

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    class="form-control form-control-sm mb-2.5"
                    @change="handleEditImagesUpload"
                  />

                  <div v-if="editForm.images.length > 0" class="d-flex flex-wrap gap-2.5">
                    <div
                      v-for="(imgUrl, idx) in editForm.images"
                      :key="idx"
                      class="position-relative rounded-2 overflow-hidden border bg-white shadow-2xs"
                      :class="{ 'border-dark border-2': idx === 0 }"
                      style="width: 76px; height: 96px;"
                    >
                      <img :src="imgUrl" class="w-100 h-100 object-fit-cover" />
                      
                      <span
                        v-if="idx === 0"
                        class="position-absolute bottom-0 start-0 w-100 bg-dark text-white text-center font-monospace py-0.5"
                        style="font-size: 9.5px;"
                      >
                        ★ 主封面
                      </span>
                      <button
                        v-else
                        type="button"
                        class="btn btn-light btn-sm p-0 position-absolute bottom-0 start-0 w-100 border-top font-monospace"
                        style="font-size: 9.5px; border-radius: 0;"
                        @click="setEditCoverImage(idx)"
                      >
                        設為封面
                      </button>

                      <button
                        v-if="editForm.images.length > 1"
                        type="button"
                        class="btn btn-danger btn-sm p-0 position-absolute top-0 end-0 rounded-circle m-1"
                        style="width: 18px; height: 18px; font-size: 10px; line-height: 1;"
                        @click="editForm.images.splice(idx, 1)"
                      >×</button>
                    </div>
                  </div>
                </div>

                <div class="p-3 rounded-3 bg-light border">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <label class="form-label text-dark fw-bold mb-0">規格與即時庫存明細 (SKU)</label>
                    <button
                      type="button"
                      class="btn btn-outline-dark btn-sm rounded-pill px-3 py-1 font-monospace"
                      style="font-size: 11px;"
                      @click="addEditSkuRow"
                    >
                      + 新增規格列
                    </button>
                  </div>

                  <div class="d-flex flex-column gap-2">
                    <div
                      v-for="(sku, sIdx) in editForm.skus"
                      :key="sku.skuId || sIdx"
                      class="row g-2 align-items-center bg-white p-2 rounded-2 border mx-0"
                    >
                      <div class="col-4">
                        <input
                          v-model="sku.color"
                          required
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="顏色"
                        />
                      </div>
                      <div class="col-3">
                        <input
                          v-model="sku.size"
                          required
                          type="text"
                          class="form-control form-control-sm font-monospace"
                          placeholder="尺寸"
                        />
                      </div>
                      <div class="col-3">
                        <div class="input-group input-group-sm">
                          <span class="input-group-text bg-light font-monospace" style="font-size: 10.5px;">庫存</span>
                          <input
                            v-model.number="sku.stock"
                            required
                            type="number"
                            min="0"
                            class="form-control font-monospace"
                          />
                        </div>
                      </div>
                      <div class="col-2 text-end">
                        <button
                          v-if="editForm.skus.length > 1"
                          type="button"
                          class="btn btn-link btn-sm text-danger text-decoration-none font-monospace p-0"
                          style="font-size: 11px;"
                          @click="editForm.skus.splice(sIdx, 1)"
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div class="modal-footer border-0 pt-3 px-1">
              <button type="button" class="btn btn-light border rounded-pill px-4 btn-sm" @click="showEditModal = false">
                取消
              </button>
              <button type="submit" form="editProductForm" class="btn btn-dark rounded-pill px-4 py-2 fw-bold btn-sm shadow-2xs">
                ✓ 儲存商品變更
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ==================== 彈窗 2：新增上架商品 Modal (支援多 SKU 尺寸與無預設值) ==================== -->
    <Teleport to="body">
      <div v-if="showNewModal" class="modal fade show d-block modal-backdrop-custom d-flex align-items-center justify-content-center p-2 p-sm-3" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable w-100 m-2 m-sm-auto" style="max-width: 740px;">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl box-sizing-border">
            <div class="modal-header border-0 pb-0">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">新增上架商品</h3>
              <button type="button" class="btn-close shadow-none" @click="showNewModal = false"></button>
            </div>
            <div class="modal-body small px-1 py-3">
              <form @submit.prevent="createNewProduct" class="d-flex flex-column gap-3.5">
                <div>
                  <label class="form-label text-secondary fw-semibold mb-1">商品名稱 *</label>
                  <input v-model="newForm.name" required type="text" class="form-control form-control-sm py-2" placeholder="請輸入商品名稱..." />
                </div>

                <div class="row g-3">
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">銷售價格 (NT$) *</label>
                    <input v-model.number="newForm.price" required type="number" min="0" class="form-control form-control-sm font-monospace py-2" placeholder="0" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">單位進貨成本 (NT$) *</label>
                    <input v-model.number="newForm.cost" required type="number" min="0" class="form-control form-control-sm font-monospace py-2" placeholder="0" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">預估單件毛利 / 毛利率</label>
                    <div
                      class="p-2 px-3 rounded-3 border d-flex align-items-center justify-content-between font-monospace"
                      :class="newGrossProfit < 0 ? 'bg-danger-subtle border-danger-subtle text-danger' : 'bg-light text-dark'"
                      style="height: 34px;"
                    >
                      <strong class="small">NT$ {{ newGrossProfit.toLocaleString() }}</strong>
                      <span class="badge" :class="getMarginBadgeClass(newGrossMarginRate)" style="font-size: 10px;">
                        {{ newGrossMarginRate }} %
                      </span>
                    </div>
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-12 col-sm-6">
                    <label class="form-label text-secondary fw-semibold mb-1">主分類 *</label>
                    <select
                      v-model="newForm.category"
                      class="form-select form-select-sm py-2"
                      required
                      @change="onNewMainCategoryChange"
                    >
                      <option v-for="cat in allMainCategories" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                  </div>

                  <div class="col-12 col-sm-6">
                    <label class="form-label text-dark fw-bold mb-1">細項分類 (Subcategory) *</label>
                    <div class="input-group input-group-sm">
                      <select
                        v-if="!newForm.isCustomSubcategory"
                        v-model="newForm.subcategory"
                        class="form-select py-2"
                        required
                      >
                        <option value="" disabled>請選擇細項分類...</option>
                        <option v-for="sub in newSubcategoryOptions" :key="sub" :value="sub">
                          {{ sub }}
                        </option>
                      </select>
                      <input
                        v-else
                        v-model="newForm.subcategory"
                        type="text"
                        required
                        class="form-control py-2"
                        placeholder="輸入自訂細項名稱..."
                      />
                      <button
                        type="button"
                        class="btn btn-outline-secondary font-monospace px-3"
                        style="font-size: 10.5px;"
                        @click="newForm.isCustomSubcategory = !newForm.isCustomSubcategory"
                      >
                        {{ newForm.isCustomSubcategory ? '選單' : '自訂' }}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="form-label text-secondary fw-semibold mb-1">商品版型與材質說明</label>
                  <textarea
                    v-model="newForm.description"
                    rows="2"
                    class="form-control form-control-sm"
                    placeholder="輸入商品剪裁細節、材質成分或穿搭建議..."
                  ></textarea>
                </div>

                <div class="p-3 rounded-3 bg-light border">
                  <label class="form-label text-dark fw-bold mb-1.5">商品展示圖集 (支援一次選取多張照片上傳)</label>
                  <input type="file" multiple accept="image/*" class="form-control form-control-sm mb-2" @change="handleNewImagesUpload" />
                  <div v-if="newForm.images.length > 0" class="d-flex flex-wrap gap-2 mt-2">
                    <div
                      v-for="(imgUrl, idx) in newForm.images"
                      :key="idx"
                      class="position-relative rounded-2 overflow-hidden border bg-white"
                      style="width: 64px; height: 80px;"
                    >
                      <img :src="imgUrl" class="w-100 h-100 object-fit-cover" />
                      <span v-if="idx === 0" class="position-absolute bottom-0 start-0 w-100 bg-dark text-white text-center font-monospace" style="font-size: 9px;">封面</span>
                      <button
                        type="button"
                        class="btn btn-danger btn-sm p-0 position-absolute top-0 end-0 rounded-circle"
                        style="width: 18px; height: 18px; font-size: 10px; line-height: 1;"
                        @click="newForm.images.splice(idx, 1)"
                      >×</button>
                    </div>
                  </div>
                </div>

                <!-- 動態多尺寸 SKU 規格與庫存設定 -->
                <div class="p-3 rounded-3 bg-light border">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <label class="form-label text-dark fw-bold mb-0">規格與即時庫存明細 (SKU) *</label>
                    <button
                      type="button"
                      class="btn btn-outline-dark btn-sm rounded-pill px-3 py-1 font-monospace"
                      style="font-size: 11px;"
                      @click="addNewSkuRow"
                    >
                      + 增加規格 (顏色/尺寸)
                    </button>
                  </div>

                  <div class="d-flex flex-column gap-2">
                    <div
                      v-for="(sku, sIdx) in newForm.skus"
                      :key="sku.skuId || sIdx"
                      class="row g-2 align-items-center bg-white p-2 rounded-2 border mx-0"
                    >
                      <div class="col-4">
                        <input
                          v-model="sku.color"
                          required
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="顏色 (例: 燕麥)"
                        />
                      </div>
                      <div class="col-3">
                        <input
                          v-model="sku.size"
                          required
                          type="text"
                          class="form-control form-control-sm font-monospace"
                          placeholder="尺寸 (例: S/F)"
                        />
                      </div>
                      <div class="col-3">
                        <div class="input-group input-group-sm">
                          <span class="input-group-text bg-light font-monospace" style="font-size: 10.5px;">庫存</span>
                          <input
                            v-model.number="sku.stock"
                            required
                            type="number"
                            min="0"
                            class="form-control font-monospace"
                          />
                        </div>
                      </div>
                      <div class="col-2 text-end">
                        <button
                          v-if="newForm.skus.length > 1"
                          type="button"
                          class="btn btn-link btn-sm text-danger text-decoration-none font-monospace p-0"
                          style="font-size: 11px;"
                          @click="newForm.skus.splice(sIdx, 1)"
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" class="btn btn-dark w-100 rounded-pill py-2.5 fw-bold mt-1 shadow-2xs">
                  確認上架商品
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
import { ref, reactive, computed, watchEffect } from 'vue'
import { useProductStore } from '../../stores/productStore'
import { useAdminStore } from '../../stores/adminStore'
import { useMarketingStore } from '../../stores/marketingStore'

const productStore = useProductStore()
const adminStore = useAdminStore()
const marketingStore = useMarketingStore()

const allProducts = computed(() => productStore.products || [])

const getTotalStock = (prod) => {
  return (prod.skus || []).reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
}

watchEffect(() => {
  allProducts.value.forEach(prod => {
    if (prod.isPublished === undefined) {
      prod.isPublished = getTotalStock(prod) > 0
    }
    if (getTotalStock(prod) === 0 && prod.isPublished === true) {
      prod.isPublished = false
    }
  })
})

const isProductPublished = (prod) => {
  return prod.isPublished !== false && getTotalStock(prod) > 0
}

const toggleProductPublishStatus = (prod) => {
  if (isProductPublished(prod)) {
    prod.isPublished = false
    if (adminStore.addAuditLog) {
      adminStore.addAuditLog('手動下架商品', `商品【${prod.name}】已下架隱藏（保留資料與庫存）`)
    }
  } else {
    if (getTotalStock(prod) === 0) {
      alert(`商品【${prod.name}】目前總庫存為 0，請點擊「編輯」按鈕進入彈窗補貨後即可上架！`)
      return
    }
    prod.isPublished = true
    if (adminStore.addAuditLog) {
      adminStore.addAuditLog('重新上架商品', `商品【${prod.name}】已重新恢復上架販售`)
    }
    alert(`已將【${prod.name}】重新上架！`)
  }
}

const deleteProductPermanently = (prod) => {
  if (confirm(`確定要「永久刪除」商品【${prod.name}】嗎？\n（若僅需暫時停售，建議點選「下架」即可保留商品資料）`)) {
    const idx = productStore.products.findIndex(p => p.id === prod.id)
    if (idx > -1) productStore.products.splice(idx, 1)
    if (adminStore.addAuditLog) {
      adminStore.addAuditLog('永久刪除商品', `刪除商品【${prod.name}】`)
    }
  }
}

const safeGetSubItems = (categoryName) => {
  if (typeof marketingStore.getSubItemsByCategory === 'function') {
    return marketingStore.getSubItemsByCategory(categoryName)
  }
  const cat = (marketingStore.categoryTree || []).find(c => c.name === categoryName)
  if (!cat || !Array.isArray(cat.subcategories)) return []
  const items = []
  cat.subcategories.forEach(group => {
    if (Array.isArray(group.items)) items.push(...group.items)
  })
  return items
}

const getProductCost = (prod) => {
  if (typeof prod.cost === 'number' && !Number.isNaN(prod.cost)) {
    return prod.cost
  }
  return Math.round((Number(prod.price) || 0) * 0.45)
}

const getGrossProfit = (price, cost) => {
  return (Number(price) || 0) - (Number(cost) || 0)
}

const getGrossMarginRate = (price, cost) => {
  const p = Number(price) || 0
  if (p <= 0) return 0
  const profit = getGrossProfit(p, cost)
  return Math.round((profit / p) * 1000) / 10
}

const getMarginBadgeClass = (marginRate) => {
  if (marginRate < 0) return 'bg-danger text-white'
  if (marginRate < 30) return 'bg-danger-subtle text-danger border border-danger-subtle'
  if (marginRate >= 50) return 'bg-success-subtle text-success border border-success-subtle'
  return 'bg-secondary-subtle text-dark border border-secondary-subtle'
}

const allMainCategories = computed(() => {
  const set = new Set()
  ;(marketingStore.categoryTree || []).forEach(c => set.add(c.name))
  allProducts.value.forEach(p => { if (p.category) set.add(p.category) })
  return Array.from(set)
})

// 手機版 SKU 展開／收合狀態管理
const mobileSkuExpanded = ref({})

const isMobileSkuExpanded = (prodId) => {
  return Boolean(mobileSkuExpanded.value[prodId])
}

const toggleMobileSkuExpand = (prodId) => {
  mobileSkuExpanded.value[prodId] = !isMobileSkuExpanded(prodId)
}

// 暫存篩選條件（輸入時不即時篩選）
const tempKeyword = ref('')
const tempCategoryFilter = ref('ALL')
const tempSubcategoryFilter = ref('ALL')
const stockFilter = ref('ALL')

// 套用後的篩選條件（點擊「查詢」後才生效）
const appliedKeyword = ref('')
const appliedCategoryFilter = ref('ALL')
const appliedSubcategoryFilter = ref('ALL')

const triggerSearch = () => {
  appliedKeyword.value = tempKeyword.value.trim()
  appliedCategoryFilter.value = tempCategoryFilter.value
  appliedSubcategoryFilter.value = tempSubcategoryFilter.value
}

const resetFilters = () => {
  tempKeyword.value = ''
  tempCategoryFilter.value = 'ALL'
  tempSubcategoryFilter.value = 'ALL'
  appliedKeyword.value = ''
  appliedCategoryFilter.value = 'ALL'
  appliedSubcategoryFilter.value = 'ALL'
  stockFilter.value = 'ALL'
}

const availableSubcategoriesForFilter = computed(() => {
  const set = new Set()
  if (tempCategoryFilter.value !== 'ALL') {
    safeGetSubItems(tempCategoryFilter.value).forEach(item => set.add(item))
    allProducts.value
      .filter(p => p.category === tempCategoryFilter.value && p.subcategory)
      .forEach(p => set.add(p.subcategory))
  } else {
    ;(marketingStore.categoryTree || []).forEach(cat => {
      safeGetSubItems(cat.name).forEach(item => set.add(item))
    })
    allProducts.value.forEach(p => { if (p.subcategory) set.add(p.subcategory) })
  }
  return Array.from(set)
})

const publishedCount = computed(() =>
  allProducts.value.filter(p => isProductPublished(p)).length
)

const unpublishedCount = computed(() =>
  allProducts.value.filter(p => !isProductPublished(p)).length
)

const lowStockCount = computed(() =>
  allProducts.value.filter(p => (p.skus || []).some(s => s.stock > 0 && s.stock <= 5)).length
)

const filteredProducts = computed(() => {
  return allProducts.value.filter(prod => {
    if (appliedCategoryFilter.value !== 'ALL' && prod.category !== appliedCategoryFilter.value) {
      return false
    }
    if (appliedSubcategoryFilter.value !== 'ALL' && prod.subcategory !== appliedSubcategoryFilter.value) {
      return false
    }
    if (stockFilter.value === 'PUBLISHED') {
      if (!isProductPublished(prod)) return false
    } else if (stockFilter.value === 'UNPUBLISHED') {
      if (isProductPublished(prod)) return false
    } else if (stockFilter.value === 'IN_STOCK') {
      if (!(prod.skus || []).every(s => s.stock > 5)) return false
    } else if (stockFilter.value === 'LOW_STOCK') {
      if (!(prod.skus || []).some(s => s.stock > 0 && s.stock <= 5)) return false
    } else if (stockFilter.value === 'OUT_OF_STOCK') {
      if (!(prod.skus || []).some(s => s.stock === 0)) return false
    }
    if (appliedKeyword.value) {
      const q = appliedKeyword.value.toLowerCase()
      const matchName = (prod.name || '').toLowerCase().includes(q)
      const matchSub = (prod.subcategory || '').toLowerCase().includes(q)
      const matchSku = (prod.skus || []).some(s => (s.color || '').toLowerCase().includes(q))
      if (!matchName && !matchSub && !matchSku) return false
    }
    return true
  })
})

// ==================== 編輯商品邏輯 ====================
const showEditModal = ref(false)
const editForm = reactive({
  id: null,
  name: '',
  isPublished: true,
  category: '',
  subcategory: '',
  isCustomSubcategory: false,
  price: 0,
  cost: 0,
  description: '',
  images: [],
  skus: []
})

const editGrossProfit = computed(() => getGrossProfit(editForm.price, editForm.cost))
const editGrossMarginRate = computed(() => getGrossMarginRate(editForm.price, editForm.cost))

const editSubcategoryOptions = computed(() => {
  const list = safeGetSubItems(editForm.category)
  if (editForm.subcategory && !list.includes(editForm.subcategory)) {
    return [editForm.subcategory, ...list]
  }
  return list
})

const onEditMainCategoryChange = () => {
  const options = safeGetSubItems(editForm.category)
  editForm.subcategory = options[0] || ''
  editForm.isCustomSubcategory = false
}

const openEditProductModal = (prod) => {
  editForm.id = prod.id
  editForm.name = prod.name || ''
  editForm.isPublished = isProductPublished(prod)
  editForm.category = prod.category || allMainCategories.value[0] || 'Top 上衣'
  const defaultSubs = safeGetSubItems(editForm.category)
  editForm.subcategory = prod.subcategory || defaultSubs[0] || ''
  editForm.isCustomSubcategory = false
  editForm.price = Number(prod.price) || 0
  editForm.cost = getProductCost(prod)
  editForm.description = prod.description || ''
  editForm.images = prod.images && prod.images.length > 0
    ? [...prod.images]
    : (prod.image ? [prod.image] : [])
  editForm.skus = (prod.skus || []).map(s => ({
    skuId: s.skuId || 'SKU-' + Date.now() + Math.random(),
    color: s.color || '',
    size: s.size || 'F',
    stock: Number(s.stock) || 0
  }))
  if (editForm.skus.length === 0) {
    editForm.skus.push({ skuId: 'SKU-' + Date.now(), color: '預設色', size: 'F', stock: 10 })
  }
  showEditModal.value = true
}

const handleEditImagesUpload = (event) => {
  const files = Array.from(event.target.files || [])
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        editForm.images.push(e.target.result)
      }
    }
    reader.readAsDataURL(file)
  })
}

const setEditCoverImage = (idx) => {
  if (idx <= 0 || idx >= editForm.images.length) return
  const [selected] = editForm.images.splice(idx, 1)
  editForm.images.unshift(selected)
}

const addEditSkuRow = () => {
  editForm.skus.push({
    skuId: 'SKU-' + Date.now() + Math.floor(Math.random() * 100),
    color: '',
    size: 'F',
    stock: 10
  })
}

const saveEditedProduct = () => {
  const target = productStore.products.find(p => p.id === editForm.id)
  if (!target) return

  target.name = editForm.name.trim()
  target.category = editForm.category
  target.subcategory = editForm.subcategory.trim()
  target.price = Number(editForm.price) || 0
  target.cost = Math.max(0, Number(editForm.cost) || 0)
  target.description = editForm.description.trim()

  if (editForm.images.length > 0) {
    target.images = [...editForm.images]
    target.image = editForm.images[0]
  }

  target.skus = editForm.skus.map(s => ({
    skuId: s.skuId,
    color: s.color.trim() || '單一色',
    size: s.size.trim() || 'F',
    stock: Math.max(0, Number(s.stock) || 0)
  }))

  const newTotal = (target.skus || []).reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
  target.isPublished = newTotal > 0 ? Boolean(editForm.isPublished) : false

  if (adminStore.addAuditLog) {
    adminStore.addAuditLog(
      '編輯商品資料',
      `更新商品【${target.name}】（狀態：${target.isPublished ? '上架中' : '已下架'}，總庫存：${newTotal} 件）`
    )
  }

  alert(`已成功儲存【${target.name}】的所有修改！${newTotal === 0 ? '\n（因總庫存為 0，系統已自動設為已下架狀態）' : ''}`)
  showEditModal.value = false
}

// ==================== 新增上架商品邏輯 (無預設值) ====================
const showNewModal = ref(false)
const newForm = reactive({
  name: '',
  category: 'Top 上衣',
  subcategory: '',
  isCustomSubcategory: false,
  price: 0,
  cost: 0,
  description: '',
  images: [],
  skus: [
    { skuId: 'SKU-NEW-1', color: '', size: '', stock: 0 }
  ]
})

const newGrossProfit = computed(() => getGrossProfit(newForm.price, newForm.cost))
const newGrossMarginRate = computed(() => getGrossMarginRate(newForm.price, newForm.cost))

const newSubcategoryOptions = computed(() => {
  return safeGetSubItems(newForm.category)
})

const onNewMainCategoryChange = () => {
  const options = safeGetSubItems(newForm.category)
  newForm.subcategory = options[0] || ''
  newForm.isCustomSubcategory = false
}

const openNewProductModal = () => {
  newForm.name = ''
  newForm.category = allMainCategories.value[0] || 'Top 上衣'
  const options = safeGetSubItems(newForm.category)
  newForm.subcategory = options[0] || ''
  newForm.isCustomSubcategory = false
  newForm.price = 0
  newForm.cost = 0
  newForm.description = ''
  newForm.images = []
  newForm.skus = [
    { skuId: 'SKU-' + Date.now(), color: '', size: '', stock: 0 }
  ]
  showNewModal.value = true
}

const handleNewImagesUpload = (event) => {
  const files = Array.from(event.target.files || [])
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        newForm.images.push(e.target.result)
      }
    }
    reader.readAsDataURL(file)
  })
}

const addNewSkuRow = () => {
  newForm.skus.push({
    skuId: 'SKU-' + Date.now() + Math.floor(Math.random() * 100),
    color: '',
    size: '',
    stock: 0
  })
}

const createNewProduct = () => {
  const defaultImg = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
  const coverImg = newForm.images[0] || defaultImg
  const gallery = newForm.images.length > 0 ? [...newForm.images] : [defaultImg]
  const cleanCost = Math.max(0, Number(newForm.cost) || 0)

  const cleanSkus = newForm.skus.map(s => ({
    skuId: s.skuId || 'SKU-' + Date.now(),
    color: s.color.trim() || '預設色',
    size: s.size.trim() || 'F',
    stock: Math.max(0, Number(s.stock) || 0)
  }))

  const totalStock = cleanSkus.reduce((sum, s) => sum + s.stock, 0)

  productStore.products.unshift({
    id: Date.now(),
    name: newForm.name.trim(),
    isPublished: totalStock > 0,
    category: newForm.category,
    subcategory: newForm.subcategory.trim(),
    price: Number(newForm.price) || 0,
    cost: cleanCost,
    image: coverImg,
    images: gallery,
    description: newForm.description.trim(),
    salesCount: 0,
    skus: cleanSkus
  })

  if (adminStore.addAuditLog) {
    adminStore.addAuditLog(
      '新增上架商品',
      `建立商品【${newForm.name}】（狀態：${totalStock > 0 ? '上架中' : '已下架'}，總庫存：${totalStock} 件）`
    )
  }
  alert(totalStock > 0 ? '新商品已成功上架！' : '新商品已建立（因總庫存為 0，目前為已下架狀態）！')
  showNewModal.value = false
}
</script>

<style scoped>
/* 頂部指標篩選卡 */
.stat-filter-card {
  padding: 1.15rem 1.35rem;
  cursor: pointer;
  border-color: #e8e2da !important;
  transition: all 0.2s ease;
}

.stat-filter-card:hover {
  transform: translateY(-2px);
  border-color: #c8bfb5 !important;
  box-shadow: 0 6px 16px rgba(45, 38, 33, 0.05) !important;
}

.stat-filter-card.is-active-dark {
  border-color: #2d2621 !important;
  background-color: #fcfaf7 !important;
}
.stat-filter-card.is-active-success {
  border-color: #198754 !important;
  background-color: #f6ffed !important;
}
.stat-filter-card.is-active-warning {
  border-color: #d48806 !important;
  background-color: #fffbe6 !important;
}
.stat-filter-card.is-active-muted {
  border-color: #8c8c8c !important;
  background-color: #f8f9fa !important;
}

/* 極簡商品管理表格樣式 */
.product-manage-table thead {
  background-color: #faf8f5;
  border-bottom: 1px solid #ebe5dd;
}

.product-manage-table thead th {
  font-weight: 600;
  letter-spacing: 0.03em;
  border-bottom: none;
}

.product-row {
  border-bottom: 1px solid #f0ece6;
  transition: background-color 0.15s ease;
}

.product-row:last-child {
  border-bottom: none;
}

.product-row:hover {
  background-color: #fcfaf7;
}

.product-row.is-unpublished {
  background-color: #fafafa;
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

.pill-published {
  background-color: #f6ffed;
  color: #389e0d;
}
.pill-published .status-dot {
  background-color: #389e0d;
}

.pill-unpublished {
  background-color: #f5f5f5;
  color: #595959;
}
.pill-unpublished .status-dot {
  background-color: #8c8c8c;
}

/* SKU 規格膠囊條 */
.sku-stock-pill {
  border-color: #e8e2da !important;
  background-color: #fcfaf7 !important;
}

.sku-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

/* 簡約韓系風格規格展開／收合按鈕 */
.btn-korean-toggle {
  background-color: #faf8f5 !important;
  border: 1px solid #ded6cb !important;
  color: #70665f !important;
  font-family: inherit;
  font-weight: 500;
  letter-spacing: 0.03em;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  box-shadow: 0 1px 2px rgba(45, 38, 33, 0.03);
}

.btn-korean-toggle:hover {
  background-color: #f5f2ed !important;
  border-color: #9b7e68 !important;
  color: #2d2621 !important;
  transform: translateY(-1px);
}

.btn-korean-toggle:active {
  transform: translateY(0);
  box-shadow: none;
}
</style>