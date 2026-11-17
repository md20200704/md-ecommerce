<template>
  <div class="d-flex flex-column gap-4 w-100" style="min-width: 0;">
    <!-- 頂部頁頭與統計摘要 -->
    <div class="d-flex justify-content-between align-items-end flex-wrap gap-3">
      <div>
        <h1 class="h4 fw-bold text-dark font-serif mb-1">商品與即時庫存控管</h1>
        <p class="small text-muted mb-0">支援分類與庫存狀態篩選、商品多圖上傳預覽及即時 SKU 庫存調整</p>
      </div>
      <button class="btn btn-primary btn-sm rounded-pill px-4 py-2 fw-bold shadow-xs" @click="openNewProductModal">
        + 新增上架商品
      </button>
    </div>

    <!-- 庫存狀態快速指標卡 (點擊可直接篩選) -->
    <div class="row g-3">
      <div class="col-6 col-md-3">
        <div
          class="card-korean p-3 bg-white border shadow-2xs cursor-pointer"
          :class="{ 'border-dark': stockFilter === 'ALL' }"
          @click="stockFilter = 'ALL'"
        >
          <div class="text-muted small font-monospace">全部架上商品</div>
          <div class="h4 fw-bold font-monospace text-dark mb-0 mt-1">{{ allProducts.length }} 款</div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div
          class="card-korean p-3 bg-white border shadow-2xs cursor-pointer"
          :class="{ 'border-success': stockFilter === 'IN_STOCK' }"
          @click="stockFilter = 'IN_STOCK'"
        >
          <div class="text-muted small font-monospace">庫存充足 (>5件)</div>
          <div class="h4 fw-bold font-monospace text-success mb-0 mt-1">{{ inStockCount }} 款</div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div
          class="card-korean p-3 bg-white border shadow-2xs cursor-pointer"
          :class="{ 'border-warning': stockFilter === 'LOW_STOCK' }"
          @click="stockFilter = 'LOW_STOCK'"
        >
          <div class="text-muted small font-monospace">低庫存預警 (1~5件)</div>
          <div class="h4 fw-bold font-monospace text-warning-emphasis mb-0 mt-1">{{ lowStockCount }} 款</div>
        </div>
      </div>

      <div class="col-6 col-md-3">
        <div
          class="card-korean p-3 bg-white border shadow-2xs cursor-pointer"
          :class="{ 'border-danger': stockFilter === 'OUT_OF_STOCK' }"
          @click="stockFilter = 'OUT_OF_STOCK'"
        >
          <div class="text-muted small font-monospace">含缺貨規格 (0件)</div>
          <div class="h4 fw-bold font-monospace text-danger mb-0 mt-1">{{ outOfStockCount }} 款</div>
        </div>
      </div>
    </div>

    <!-- 多條件篩選與搜尋工具列 -->
    <div class="card-korean p-3 bg-white border shadow-xs d-flex flex-wrap justify-content-between align-items-center gap-2.5">
      <div class="d-flex flex-wrap gap-2 flex-grow-1">
        <input
          v-model="searchKeyword"
          type="text"
          class="form-control form-control-sm rounded-pill"
          style="max-width: 240px;"
          placeholder="搜尋商品名稱或顏色規格..."
        />

        <select v-model="categoryFilter" class="form-select form-select-sm rounded-pill font-sans" style="width: 165px;">
          <option value="ALL">全部商品分類</option>
          <option v-for="cat in availableCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <select v-model="stockFilter" class="form-select form-select-sm rounded-pill font-monospace" style="width: 175px;">
          <option value="ALL">全部庫存狀態</option>
          <option value="IN_STOCK">庫存充足</option>
          <option value="LOW_STOCK">低庫存預警 (≤ 5)</option>
          <option value="OUT_OF_STOCK">含已售完規格 (0)</option>
        </select>

        <button
          v-if="searchKeyword || categoryFilter !== 'ALL' || stockFilter !== 'ALL'"
          type="button"
          class="btn btn-outline-secondary btn-sm rounded-pill px-3 font-monospace"
          style="font-size: 11px;"
          @click="resetFilters"
        >
          重設篩選
        </button>
      </div>

      <span class="text-muted small font-monospace">符合條件：{{ filteredProducts.length }} 款商品</span>
    </div>

    <!-- 商品與庫存清單表格 -->
    <div class="card-korean bg-white p-3.5 p-md-4 border shadow-xs">
      <div v-if="filteredProducts.length > 0" class="table-responsive">
        <table class="table table-hover align-middle small mb-0 font-sans">
          <thead class="table-light">
            <tr class="text-secondary text-nowrap" style="font-size: 11px;">
              <th style="min-width: 240px;">商品主圖 / 名稱與分類</th>
              <th style="min-width: 110px;">售價</th>
              <th style="min-width: 280px;">SKU 規格與即時庫存調整</th>
              <th style="min-width: 90px;">總庫存</th>
              <th class="text-end text-nowrap" style="min-width: 120px;">管理操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prod in filteredProducts" :key="prod.id">
              <td>
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-2 overflow-hidden border flex-shrink-0" style="width: 48px; height: 60px; background-color: #f5f2ed;">
                    <img :src="prod.image" class="w-100 h-100 object-fit-cover" />
                  </div>
                  <div>
                    <strong class="text-dark d-block">{{ prod.name }}</strong>
                    <span class="badge bg-light text-secondary border font-sans mt-1" style="font-size: 10px;">
                      {{ prod.category }}
                    </span>
                    <span v-if="prod.images && prod.images.length > 1" class="badge bg-primary-subtle text-primary font-monospace ms-1" style="font-size: 10px;">
                      {{ prod.images.length }} 張圖
                    </span>
                  </div>
                </div>
              </td>

              <td class="font-monospace fw-bold text-dark">
                NT$ {{ (prod.price || 0).toLocaleString() }}
              </td>

              <td>
                <div class="d-flex flex-column gap-1.5">
                  <div
                    v-for="sku in (prod.skus || [])"
                    :key="sku.skuId"
                    class="d-flex align-items-center justify-content-between gap-2 px-2.5 py-1 rounded-2 bg-light border"
                    style="max-width: 270px;"
                  >
                    <span class="font-monospace text-dark" style="font-size: 11px;">
                      {{ sku.color }} / {{ sku.size }}
                    </span>
                    <div class="d-flex align-items-center gap-1.5">
                      <span
                        class="badge font-monospace"
                        :class="sku.stock === 0 ? 'bg-danger' : sku.stock <= 5 ? 'bg-warning text-dark' : 'bg-success-subtle text-success'"
                        style="font-size: 9.5px;"
                      >
                        {{ sku.stock === 0 ? '缺貨' : sku.stock <= 5 ? '低庫存' : '正常' }}
                      </span>
                      <input
                        v-model.number="sku.stock"
                        type="number"
                        min="0"
                        class="form-control form-control-sm font-monospace text-center py-0 px-1"
                        style="width: 58px; height: 24px; font-size: 11.5px;"
                      />
                    </div>
                  </div>
                </div>
              </td>

              <td class="font-monospace fw-bold text-dark">
                {{ getTotalStock(prod) }} 件
              </td>

              <td class="text-end text-nowrap">
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 font-monospace"
                  style="font-size: 11px;"
                  @click="deleteProduct(prod)"
                >
                  下架刪除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-5 text-muted small">
        找不到符合目前篩選條件的商品資料。
      </div>
    </div>

    <!-- 新增上架商品彈窗 (支援多張圖片檔案上傳與網址匯入) -->
    <Teleport to="body">
      <div v-if="showNewModal" class="modal fade show d-block modal-backdrop-custom" tabindex="-1" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content rounded-4 border-0 p-4 shadow-xl">
            <div class="modal-header border-0 pb-0">
              <h3 class="modal-title fs-5 fw-bold text-dark font-serif">新增上架商品 (支援多圖上傳)</h3>
              <button type="button" class="btn-close" @click="showNewModal = false"></button>
            </div>
            <div class="modal-body small px-1 py-3">
              <form @submit.prevent="createProduct" class="d-flex flex-column gap-3">
                <div class="row g-3">
                  <div class="col-12 col-md-6">
                    <label class="form-label text-secondary fw-semibold mb-1">商品名稱 *</label>
                    <input v-model="newForm.name" required type="text" class="form-control form-control-sm" placeholder="如：首爾氣質羊絨針織開襟衫" />
                  </div>
                  <div class="col-6 col-md-3">
                    <label class="form-label text-secondary fw-semibold mb-1">商品分類 *</label>
                    <select v-model="newForm.category" class="form-select form-select-sm">
                      <option value="Top 上衣">Top 上衣</option>
                      <option value="Outer 外套">Outer 外套</option>
                      <option value="Bottom 下身">Bottom 下身</option>
                    </select>
                  </div>
                  <div class="col-6 col-md-3">
                    <label class="form-label text-secondary fw-semibold mb-1">銷售價格 (NT$) *</label>
                    <input v-model.number="newForm.price" required type="number" min="100" class="form-control form-control-sm font-monospace" />
                  </div>
                </div>

                <!-- 多圖上傳區塊 -->
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

                <button type="submit" class="btn btn-primary w-100 rounded-pill py-2.5 fw-bold mt-1">
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
import { ref, reactive, computed } from 'vue'
import { useProductStore } from '../../stores/productStore'
import { useAdminStore } from '../../stores/adminStore'

const productStore = useProductStore()
const adminStore = useAdminStore()

const allProducts = computed(() => productStore.products || [])

const searchKeyword = ref('')
const categoryFilter = ref('ALL')
const stockFilter = ref('ALL')

const availableCategories = computed(() => {
  const set = new Set(allProducts.value.map(p => p.category).filter(Boolean))
  return Array.from(set)
})

const getTotalStock = (prod) => {
  return (prod.skus || []).reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
}

const inStockCount = computed(() =>
  allProducts.value.filter(p => (p.skus || []).every(s => s.stock > 5)).length
)

const lowStockCount = computed(() =>
  allProducts.value.filter(p => (p.skus || []).some(s => s.stock > 0 && s.stock <= 5)).length
)

const outOfStockCount = computed(() =>
  allProducts.value.filter(p => (p.skus || []).some(s => s.stock === 0)).length
)

const filteredProducts = computed(() => {
  return allProducts.value.filter(prod => {
    if (categoryFilter.value !== 'ALL' && prod.category !== categoryFilter.value) {
      return false
    }
    if (stockFilter.value === 'IN_STOCK') {
      if (!(prod.skus || []).every(s => s.stock > 5)) return false
    } else if (stockFilter.value === 'LOW_STOCK') {
      if (!(prod.skus || []).some(s => s.stock > 0 && s.stock <= 5)) return false
    } else if (stockFilter.value === 'OUT_OF_STOCK') {
      if (!(prod.skus || []).some(s => s.stock === 0)) return false
    }
    if (searchKeyword.value.trim()) {
      const q = searchKeyword.value.trim().toLowerCase()
      const matchName = (prod.name || '').toLowerCase().includes(q)
      const matchSku = (prod.skus || []).some(s => (s.color || '').toLowerCase().includes(q))
      if (!matchName && !matchSku) return false
    }
    return true
  })
})

const resetFilters = () => {
  searchKeyword.value = ''
  categoryFilter.value = 'ALL'
  stockFilter.value = 'ALL'
}

const deleteProduct = (prod) => {
  if (confirm(`確定要下架並刪除【${prod.name}】嗎？`)) {
    const idx = productStore.products.findIndex(p => p.id === prod.id)
    if (idx > -1) productStore.products.splice(idx, 1)
    if (adminStore.addAuditLog) {
      adminStore.addAuditLog('下架刪除商品', `刪除商品【${prod.name}】`)
    }
  }
}

// 新增上架商品彈窗
const showNewModal = ref(false)
const newForm = reactive({
  name: '',
  category: 'Top 上衣',
  price: 1480,
  color: '燕麥白',
  size: 'F',
  stock: 20,
  images: []
})

const openNewProductModal = () => {
  newForm.name = ''
  newForm.price = 1480
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

  productStore.products.unshift({
    id: Date.now(),
    name: newForm.name,
    category: newForm.category,
    price: newForm.price,
    image: coverImg,
    images: gallery,
    salesCount: 0,
    skus: [
      {
        skuId: 'SKU-' + Date.now(),
        color: newForm.color,
        size: newForm.size,
        stock: newForm.stock
      }
    ]
  })

  if (adminStore.addAuditLog) {
    adminStore.addAuditLog('新增上架商品', `上架商品【${newForm.name}】，售價 NT$${newForm.price}，共 ${gallery.length} 張圖片`)
  }
  alert('新商品已成功上架！')
  showNewModal.value = false
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
  transition: all 0.2s ease;
}
.cursor-pointer:hover {
  transform: translateY(-2px);
}
</style>