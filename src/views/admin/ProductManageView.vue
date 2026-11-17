<template>
  <div class="d-flex flex-column gap-4 w-100" style="min-width: 0;">
    <!-- 頂部頁頭與新增按鈕 -->
    <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 px-1">
      <div>
        <h1 class="h4 fw-bold text-dark font-serif mb-1">商品與即時庫存控管</h1>
        <p class="small text-muted mb-0">總庫存歸 0 時自動轉為「已下架」，點擊「編輯」按鈕即可進入彈窗調整各規格庫存與成本</p>
      </div>
      <button class="btn btn-dark btn-sm rounded-pill px-4 py-2 fw-bold shadow-2xs" @click="openNewProductModal">
        + 新增上架商品
      </button>
    </div>

    <!-- 1. 商品上下架與庫存狀態快速指標卡 -->
    <div class="row g-3">
      <div class="col-6 col-md-3">
        <div
          class="stat-filter-card bg-white rounded-4 border shadow-2xs h-100"
          :class="{ 'is-active-dark': stockFilter === 'ALL' }"
          @click="stockFilter = 'ALL'"
        >
          <div class="text-muted small font-monospace mb-1">全部商品總數</div>
          <div class="h4 fw-bold font-monospace text-dark mb-0">{{ allProducts.length }} <span class="fs-6 fw-normal text-muted">款</span></div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div
          class="stat-filter-card bg-white rounded-4 border shadow-2xs h-100"
          :class="{ 'is-active-success': stockFilter === 'PUBLISHED' }"
          @click="stockFilter = 'PUBLISHED'"
        >
          <div class="text-muted small font-monospace mb-1">前台販售中 (上架)</div>
          <div class="h4 fw-bold font-monospace text-success mb-0">{{ publishedCount }} <span class="fs-6 fw-normal text-muted">款</span></div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div
          class="stat-filter-card bg-white rounded-4 border shadow-2xs h-100"
          :class="{ 'is-active-warning': stockFilter === 'LOW_STOCK' }"
          @click="stockFilter = 'LOW_STOCK'"
        >
          <div class="text-muted small font-monospace mb-1">低庫存預警 (1~5件)</div>
          <div class="h4 fw-bold font-monospace text-warning-emphasis mb-0">{{ lowStockCount }} <span class="fs-6 fw-normal text-muted">款</span></div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div
          class="stat-filter-card bg-white rounded-4 border shadow-2xs h-100"
          :class="{ 'is-active-muted': stockFilter === 'UNPUBLISHED' }"
          @click="stockFilter = 'UNPUBLISHED'"
        >
          <div class="text-muted small font-monospace mb-1">已下架 / 庫存歸 0</div>
          <div class="h4 fw-bold font-monospace text-secondary mb-0">{{ unpublishedCount }} <span class="fs-6 fw-normal text-muted">款</span></div>
        </div>
      </div>
    </div>

    <!-- 2. 多條件篩選與搜尋工具列 -->
    <div class="card-korean p-3.5 px-4 bg-white rounded-4 border shadow-xs d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div class="d-flex flex-wrap gap-2.5 flex-grow-1">
        <input
          v-model="searchKeyword"
          type="text"
          class="form-control form-control-sm rounded-pill px-3"
          style="max-width: 230px;"
          placeholder="搜尋商品名稱、細項或顏色..."
        />

        <!-- 主分類篩選 -->
        <select
          v-model="categoryFilter"
          class="form-select form-select-sm rounded-pill font-sans"
          style="width: 165px;"
          @change="subcategoryFilter = 'ALL'"
        >
          <option value="ALL">全部主分類</option>
          <option v-for="cat in allMainCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <!-- 細項子分類篩選 -->
        <select
          v-model="subcategoryFilter"
          class="form-select form-select-sm rounded-pill font-sans"
          style="width: 165px;"
        >
          <option value="ALL">全部細項分類</option>
          <option v-for="sub in availableSubcategoriesForFilter" :key="sub" :value="sub">
            {{ sub }}
          </option>
        </select>

        <!-- 上下架與庫存狀態篩選 -->
        <select v-model="stockFilter" class="form-select form-select-sm rounded-pill font-monospace" style="width: 185px;">
          <option value="ALL">全部上下架與庫存</option>
          <option value="PUBLISHED">● 前台販售中 (上架)</option>
          <option value="UNPUBLISHED">○ 已下架 / 庫存歸 0</option>
          <option value="IN_STOCK">庫存充足 (＞ 5 件)</option>
          <option value="LOW_STOCK">低庫存預警 (1~5 件)</option>
          <option value="OUT_OF_STOCK">含缺貨規格 (0 件)</option>
        </select>

        <button
          v-if="searchKeyword || categoryFilter !== 'ALL' || subcategoryFilter !== 'ALL' || stockFilter !== 'ALL'"
          type="button"
          class="btn btn-outline-secondary btn-sm rounded-pill px-3 font-monospace"
          style="font-size: 11px;"
          @click="resetFilters"
        >
          重設篩選
        </button>
      </div>

      <span class="text-muted small font-monospace">共 {{ filteredProducts.length }} 款商品</span>
    </div>

    <!-- 3. 極簡清爽版商品與即時庫存控管表格 -->
    <div class="bg-white rounded-4 border shadow-xs overflow-hidden">
      <div v-if="filteredProducts.length > 0" class="table-responsive">
        <table class="table align-middle mb-0 font-sans product-manage-table">
          <thead>
            <tr class="text-secondary text-nowrap" style="font-size: 11.5px;">
              <th class="py-3 ps-4 pe-3" style="min-width: 250px;">商品資訊與分類</th>
              <th class="py-3 px-3" style="min-width: 110px;">販售狀態</th>
              <th class="py-3 px-3" style="min-width: 175px;">售價 / 成本 / 毛利</th>
              <th class="py-3 px-3" style="min-width: 260px;">SKU 規格與即時庫存</th>
              <th class="py-3 ps-3 pe-4 text-end text-nowrap" style="min-width: 135px;">管理操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="prod in filteredProducts"
              :key="prod.id"
              class="product-row"
              :class="{ 'is-unpublished': !isProductPublished(prod) }"
            >
              <!-- 欄位 1：商品主圖、名稱與分類階層 -->
              <td class="py-3.5 ps-4 pe-3">
                <div class="d-flex align-items-center gap-3">
                  <div
                    class="rounded-3 overflow-hidden border flex-shrink-0"
                    style="width: 52px; height: 64px; background-color: #f7f4ef;"
                  >
                    <img
                      :src="prod.image"
                      class="w-100 h-100 object-fit-cover"
                      :class="{ 'opacity-50': !isProductPublished(prod) }"
                    />
                  </div>
                  <div class="min-w-0">
                    <div
                      class="fw-bold text-truncate mb-1"
                      :class="isProductPublished(prod) ? 'text-dark' : 'text-muted'"
                      style="max-width: 210px; font-size: 14px;"
                      :title="prod.name"
                    >
                      {{ prod.name }}
                    </div>
                    <div class="text-muted small">
                      <span>{{ prod.category }}</span>
                      <span v-if="prod.subcategory" class="text-secondary"> · {{ prod.subcategory }}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- 欄位 2：極簡圓點販售狀態膠囊 -->
              <td class="py-3.5 px-3 text-nowrap">
                <span
                  v-if="isProductPublished(prod)"
                  class="status-pill pill-published d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-medium"
                >
                  <span class="status-dot"></span>
                  <span>上架中</span>
                </span>
                <div v-else class="d-flex flex-column align-items-start gap-1">
                  <span
                    class="status-pill pill-unpublished d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-medium"
                  >
                    <span class="status-dot"></span>
                    <span>已下架</span>
                  </span>
                  <span v-if="getTotalStock(prod) === 0" class="text-danger font-monospace ps-1" style="font-size: 10px;">
                    庫存歸 0 自動下架
                  </span>
                </div>
              </td>

              <!-- 欄位 3：售價 / 成本 / 毛利 -->
              <td class="py-3.5 px-3 font-monospace">
                <div class="d-flex flex-column gap-1">
                  <div class="fw-bold text-dark" style="font-size: 14px;">
                    NT$ {{ (prod.price || 0).toLocaleString() }}
                  </div>
                  <div class="text-secondary" style="font-size: 11.5px;">
                    成本 ${{ getProductCost(prod).toLocaleString() }}
                  </div>
                  <div class="d-flex align-items-center flex-wrap gap-2" style="font-size: 11.5px;">
                    <span class="text-secondary">
                      毛利 ${{ getGrossProfit(prod.price, getProductCost(prod)).toLocaleString() }}
                    </span>
                    <span
                      class="badge rounded-pill px-2 py-0.5 font-monospace"
                      :class="getMarginBadgeClass(getGrossMarginRate(prod.price, getProductCost(prod)))"
                      style="font-size: 9.5px;"
                    >
                      {{ getGrossMarginRate(prod.price, getProductCost(prod)) }}%
                    </span>
                  </div>
                </div>
              </td>

              <!-- 欄位 4：SKU 規格與即時庫存（統整為一致的排版設計） -->
              <td class="py-3.5 px-3">
                <div class="d-flex flex-column gap-1.5" style="max-width: 255px;">
                  <div
                    v-for="sku in (prod.skus || [])"
                    :key="sku.skuId"
                    class="sku-stock-pill d-flex align-items-center justify-content-between px-3 py-1.5 rounded-3 border bg-white"
                  >
                    <div class="d-flex align-items-center gap-2 min-w-0 pe-2">
                      <span
                        class="sku-dot flex-shrink-0"
                        :class="sku.stock === 0 ? 'bg-danger' : sku.stock <= 5 ? 'bg-warning' : 'bg-success'"
                        :title="sku.stock === 0 ? '缺貨' : sku.stock <= 5 ? '低庫存' : '庫存充足'"
                      ></span>
                      <span class="font-monospace text-dark text-truncate" style="font-size: 12px;">
                        {{ sku.color }} / {{ sku.size }}
                      </span>
                    </div>

                    <div class="font-monospace text-nowrap" style="font-size: 12px;">
                      <span :class="sku.stock === 0 ? 'text-danger fw-bold' : 'text-secondary fw-semibold'">
                        {{ sku.stock }}
                      </span>
                      <span class="text-muted ms-0.5" style="font-size: 11px;">件</span>
                    </div>
                  </div>

                  <!-- 總庫存摘要小字 -->
                  <div class="d-flex justify-content-between align-items-center px-1 pt-0.5 font-monospace" style="font-size: 11px;">
                    <span class="text-muted">全規格總庫存</span>
                    <strong :class="getTotalStock(prod) === 0 ? 'text-danger' : 'text-dark'">
                      {{ getTotalStock(prod) }} 件
                    </strong>
                  </div>
                </div>
              </td>

              <!-- 欄位 5：管理操作 -->
              <td class="py-3.5 ps-3 pe-4 text-end text-nowrap">
                <div class="d-flex flex-column align-items-end gap-2" style="width: 105px; margin-left: auto;">
                  <button
                    type="button"
                    class="btn btn-sm rounded-pill py-1 font-monospace w-100"
                    :class="isProductPublished(prod) ? 'btn-outline-secondary' : 'btn-success fw-bold'"
                    style="font-size: 11px;"
                    @click="toggleProductPublishStatus(prod)"
                  >
                    {{ isProductPublished(prod) ? '下架' : '重新上架' }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-dark btn-sm rounded-pill py-1 font-monospace w-100"
                    style="font-size: 11px;"
                    @click="openEditProductModal(prod)"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm rounded-pill py-1 font-monospace w-100"
                    style="font-size: 11px;"
                    @click="deleteProductPermanently(prod)"
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-5 text-muted small">
        找不到符合目前篩選條件的商品資料。
      </div>
    </div>

    <!-- ==================== 彈窗 1：編輯商品 Modal ==================== -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-2">
              <div>
                <h3 class="modal-title fs-5 fw-bold text-dark font-serif">編輯商品資料與庫存</h3>
                <span class="text-muted font-monospace" style="font-size: 11px;">商品編號：#{{ editForm.id }}</span>
              </div>
              <button type="button" class="btn-close" @click="showEditModal = false"></button>
            </div>

            <div class="modal-body small px-1 py-2">
              <form id="editProductForm" @submit.prevent="saveEditedProduct" class="d-flex flex-column gap-3.5">
                <div class="row g-3">
                  <div class="col-12 col-sm-8">
                    <label class="form-label text-secondary fw-semibold mb-1">商品名稱 *</label>
                    <input v-model="editForm.name" required type="text" class="form-control form-control-sm" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">前台販售狀態</label>
                    <select v-model="editForm.isPublished" class="form-select form-select-sm font-monospace">
                      <option :value="true">● 上架販售中</option>
                      <option :value="false">○ 已下架 (前台隱藏)</option>
                    </select>
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">銷售價格 (NT$) *</label>
                    <input v-model.number="editForm.price" required type="number" min="0" class="form-control form-control-sm font-monospace" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">單位進貨成本 (NT$) *</label>
                    <input v-model.number="editForm.cost" required type="number" min="0" class="form-control form-control-sm font-monospace" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">預估單件毛利 / 毛利率</label>
                    <div
                      class="p-2 px-3 rounded-3 border d-flex align-items-center justify-content-between font-monospace"
                      :class="editGrossProfit < 0 ? 'bg-danger-subtle border-danger-subtle text-danger' : 'bg-light text-dark'"
                      style="height: 31px;"
                    >
                      <strong class="small">NT$ {{ editGrossProfit.toLocaleString() }}</strong>
                      <span class="badge" :class="getMarginBadgeClass(editGrossMarginRate)" style="font-size: 10px;">
                        {{ editGrossMarginRate }}%
                      </span>
                    </div>
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-12 col-sm-6">
                    <label class="form-label text-secondary fw-semibold mb-1">主分類 *</label>
                    <select
                      v-model="editForm.category"
                      class="form-select form-select-sm"
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
                        class="form-select"
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
                        class="form-control"
                        placeholder="輸入自訂細項名稱..."
                      />
                      <button
                        type="button"
                        class="btn btn-outline-secondary font-monospace"
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
                    <label class="form-label text-dark fw-bold mb-0">商品展示圖集管理 (點擊設為封面或新增圖片)</label>
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
                    <label class="form-label text-dark fw-bold mb-0">顏色 / 尺寸 SKU 規格與庫存設定 * (總庫存歸 0 將自動下架)</label>
                    <button
                      type="button"
                      class="btn btn-outline-dark btn-sm rounded-pill px-2.5 py-0.5 font-monospace"
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
                          placeholder="顏色 (如：燕麥白)"
                        />
                      </div>
                      <div class="col-3">
                        <input
                          v-model="sku.size"
                          required
                          type="text"
                          class="form-control form-control-sm font-monospace"
                          placeholder="尺寸 (如：F / M)"
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
              <button type="submit" form="editProductForm" class="btn btn-dark rounded-pill px-4 py-2 fw-bold btn-sm">
                ✓ 儲存商品變更
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ==================== 彈窗 2：新增上架商品 Modal ==================== -->
    <Teleport to="body">
      <div v-if="showNewModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-0">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">新增上架商品</h3>
              <button type="button" class="btn-close" @click="showNewModal = false"></button>
            </div>
            <div class="modal-body small px-1 py-3">
              <form @submit.prevent="createProduct" class="d-flex flex-column gap-3">
                <div>
                  <label class="form-label text-secondary fw-semibold mb-1">商品名稱 *</label>
                  <input v-model="newForm.name" required type="text" class="form-control form-control-sm" placeholder="如：首爾氣質羊絨針織開襟衫" />
                </div>

                <div class="row g-3">
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">銷售價格 (NT$) *</label>
                    <input v-model.number="newForm.price" required type="number" min="0" class="form-control form-control-sm font-monospace" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">單位進貨成本 (NT$) *</label>
                    <input v-model.number="newForm.cost" required type="number" min="0" class="form-control form-control-sm font-monospace" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <label class="form-label text-secondary fw-semibold mb-1">預估單件毛利 / 毛利率</label>
                    <div
                      class="p-2 px-3 rounded-3 border d-flex align-items-center justify-content-between font-monospace"
                      :class="newGrossProfit < 0 ? 'bg-danger-subtle border-danger-subtle text-danger' : 'bg-light text-dark'"
                      style="height: 31px;"
                    >
                      <strong class="small">NT$ {{ newGrossProfit.toLocaleString() }}</strong>
                      <span class="badge" :class="getMarginBadgeClass(newGrossMarginRate)" style="font-size: 10px;">
                        {{ newGrossMarginRate }}%
                      </span>
                    </div>
                  </div>
                </div>

                <div class="row g-3">
                  <div class="col-12 col-sm-6">
                    <label class="form-label text-secondary fw-semibold mb-1">主分類 *</label>
                    <select
                      v-model="newForm.category"
                      class="form-select form-select-sm"
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
                        class="form-select"
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
                        class="form-control"
                        placeholder="輸入自訂細項名稱..."
                      />
                      <button
                        type="button"
                        class="btn btn-outline-secondary font-monospace"
                        style="font-size: 10.5px;"
                        @click="newForm.isCustomSubcategory = !newForm.isCustomSubcategory"
                      >
                        {{ newForm.isCustomSubcategory ? '選單' : '自訂' }}
                      </button>
                    </div>
                  </div>
                </div>

                <div class="p-3 rounded-3 bg-light border">
                  <label class="form-label text-dark fw-bold mb-1.5">商品展示圖集 (支援一次選取多張照片上傳)</label>
                  <input type="file" multiple accept="image/*" class="form-control form-control-sm mb-2" @change="handleMultipleImagesUpload" />
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

                <div class="row g-2">
                  <div class="col-4">
                    <label class="form-label text-secondary mb-1">預設顏色 *</label>
                    <input v-model="newForm.color" required type="text" class="form-control form-control-sm" placeholder="燕麥白" />
                  </div>
                  <div class="col-4">
                    <label class="form-label text-secondary mb-1">預設尺寸 *</label>
                    <input v-model="newForm.size" required type="text" class="form-control form-control-sm font-monospace" placeholder="F / S / M" />
                  </div>
                  <div class="col-4">
                    <label class="form-label text-secondary mb-1">初始庫存數量 *</label>
                    <input v-model.number="newForm.stock" required type="number" min="0" class="form-control form-control-sm font-monospace" />
                  </div>
                </div>

                <button type="submit" class="btn btn-dark w-100 rounded-pill py-2.5 fw-bold mt-1">
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

const searchKeyword = ref('')
const categoryFilter = ref('ALL')
const subcategoryFilter = ref('ALL')
const stockFilter = ref('ALL')

const availableSubcategoriesForFilter = computed(() => {
  const set = new Set()
  if (categoryFilter.value !== 'ALL') {
    safeGetSubItems(categoryFilter.value).forEach(item => set.add(item))
    allProducts.value
      .filter(p => p.category === categoryFilter.value && p.subcategory)
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
    if (categoryFilter.value !== 'ALL' && prod.category !== categoryFilter.value) {
      return false
    }
    if (subcategoryFilter.value !== 'ALL' && prod.subcategory !== subcategoryFilter.value) {
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
    if (searchKeyword.value.trim()) {
      const q = searchKeyword.value.trim().toLowerCase()
      const matchName = (prod.name || '').toLowerCase().includes(q)
      const matchSub = (prod.subcategory || '').toLowerCase().includes(q)
      const matchSku = (prod.skus || []).some(s => (s.color || '').toLowerCase().includes(q))
      if (!matchName && !matchSub && !matchSku) return false
    }
    return true
  })
})

const resetFilters = () => {
  searchKeyword.value = ''
  categoryFilter.value = 'ALL'
  subcategoryFilter.value = 'ALL'
  stockFilter.value = 'ALL'
}

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

// ==================== 新增上架商品邏輯 ====================
const showNewModal = ref(false)
const newForm = reactive({
  name: '',
  category: 'Top 上衣',
  subcategory: '針織毛衣',
  isCustomSubcategory: false,
  price: 1480,
  cost: 650,
  color: '燕麥白',
  size: 'F',
  stock: 20,
  images: []
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
  newForm.price = 1480
  newForm.cost = 650
  newForm.stock = 20
  newForm.images = []
  showNewModal.value = true
}

const handleMultipleImagesUpload = (event) => {
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

const createProduct = () => {
  const defaultImg = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
  const coverImg = newForm.images[0] || defaultImg
  const gallery = newForm.images.length > 0 ? [...newForm.images] : [defaultImg]
  const cleanCost = Math.max(0, Number(newForm.cost) || 0)
  const cleanStock = Math.max(0, Number(newForm.stock) || 0)

  productStore.products.unshift({
    id: Date.now(),
    name: newForm.name.trim(),
    isPublished: cleanStock > 0,
    category: newForm.category,
    subcategory: newForm.subcategory.trim(),
    price: Number(newForm.price) || 0,
    cost: cleanCost,
    image: coverImg,
    images: gallery,
    salesCount: 0,
    skus: [
      {
        skuId: 'SKU-' + Date.now(),
        color: newForm.color,
        size: newForm.size,
        stock: cleanStock
      }
    ]
  })

  if (adminStore.addAuditLog) {
    adminStore.addAuditLog(
      '新增上架商品',
      `建立商品【${newForm.name}】（狀態：${cleanStock > 0 ? '上架中' : '已下架'}，初始庫存：${cleanStock} 件）`
    )
  }
  alert(cleanStock > 0 ? '新商品已成功上架！' : '新商品已建立（因初始庫存為 0，目前為已下架狀態）！')
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

/* SKU 規格膠囊條（統整一致性） */
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
</style>