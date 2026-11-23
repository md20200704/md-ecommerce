import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiRequest } from '../services/apiClient'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const reviews = ref([])
  const categories = ref(['ALL', 'Top 上衣', 'Outer 外套', 'Bottom 下身', 'Dress 洋裝 / 套裝', 'Accessories 配件'])
  const selectedCategory = ref('ALL')
  const sortBy = ref('default')
  const searchQuery = ref('')
  const searchInput = ref('')
  const isLoading = ref(false)

  const fetchProducts = async () => {
    isLoading.value = true
    try {
      const res = await apiRequest('/api/products')
      if (res.success) {
        products.value = res.products || []
        reviews.value = res.reviews || []
      }
    } catch (err) {
      console.warn('[productStore] 載入資料庫商品失敗：', err.message)
    } finally {
      isLoading.value = false
    }
  }

  const saveProduct = async (productData, isEdit = false) => {
    const res = await apiRequest('/api/products', {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(productData)
    })
    await fetchProducts()
    return res
  }

  const deleteProduct = async (productId) => {
    products.value = products.value.filter(p => Number(p.id) !== Number(productId))
    return apiRequest(`/api/products?id=${productId}`, { method: 'DELETE' })
  }

  const addReview = async (payload) => {
    const newRev = {
      id: 'REV-' + Date.now().toString().slice(-5),
      orderId: payload.orderId || 'ORD-VERIFIED',
      productId: Number(payload.productId || 1),
      userName: payload.userName || '認證會員',
      rating: Number(payload.rating || 5),
      content: payload.content || '',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      images: Array.isArray(payload.images) ? [...payload.images] : []
    }
    reviews.value.unshift(newRev)

    try {
      await apiRequest('/api/products', {
        method: 'POST',
        body: JSON.stringify({ action: 'add-review', ...newRev })
      })
    } catch (err) {
      console.error('評價寫入資料庫失敗:', err)
    }

    return {
      success: true,
      message: '感謝您的真實評價與穿搭分享！評價已發布至商品頁面。',
      review: newRev
    }
  }

  const getProductPrice = (prod) => {
    if (!prod) return 0
    return Number(prod.price ?? prod.basePrice ?? 0)
  }

  const publishedProducts = computed(() => {
    return products.value.filter(p => {
      const totalStock = (p.skus || []).reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
      return p.isPublished !== false && totalStock > 0
    })
  })

  const filteredProducts = computed(() => {
    let result = [...publishedProducts.value]

    if (selectedCategory.value && selectedCategory.value !== 'ALL') {
      result = result.filter(p => p.category === selectedCategory.value)
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        (p.tag && p.tag.toLowerCase().includes(q))
      )
    }

    if (sortBy.value === 'price-asc') {
      result.sort((a, b) => getProductPrice(a) - getProductPrice(b))
    } else if (sortBy.value === 'price-desc') {
      result.sort((a, b) => getProductPrice(b) - getProductPrice(a))
    } else if (sortBy.value === 'sales') {
      result.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    } else if (sortBy.value === 'newest') {
      result.sort((a, b) => b.id - a.id)
    }

    return result
  })

  const hotRankingProducts = computed(() => {
    return publishedProducts.value
      .filter(p => p.isHotRanking)
      .sort((a, b) => (a.featuredOrder || 99) - (b.featuredOrder || 99))
  })

  const seasonalNewProducts = computed(() => {
    return publishedProducts.value
      .filter(p => p.isSeasonalNew)
      .sort((a, b) => (a.featuredOrder || 99) - (b.featuredOrder || 99))
  })

  const paginatedProducts = computed(() => filteredProducts.value)

  const setCategory = (cat) => { selectedCategory.value = cat }
  const setSortBy = (sort) => { sortBy.value = sort }
  const setSearchQuery = (q) => {
    searchInput.value = q
    searchQuery.value = q
  }

  const getProductById = (id) => products.value.find(p => Number(p.id) === Number(id))
  const getProductReviews = (productId) => reviews.value.filter(r => Number(r.productId) === Number(productId))

  const getProductRatingSummary = (productId) => {
    const revs = getProductReviews(productId)
    if (revs.length === 0) return { average: 5.0, count: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
    const total = revs.reduce((sum, r) => sum + r.rating, 0)
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    revs.forEach(r => { if (breakdown[r.rating] !== undefined) breakdown[r.rating]++ })
    return {
      average: Number((total / revs.length).toFixed(1)),
      count: revs.length,
      breakdown
    }
  }

  const toggleProductFeatured = (productId, field) => {
    const prod = products.value.find(p => Number(p.id) === Number(productId))
    if (prod && (field === 'isHotRanking' || field === 'isSeasonalNew')) {
      prod[field] = !prod[field]
      apiRequest('/api/products', {
        method: 'PUT',
        body: JSON.stringify({ action: 'toggle-featured', id: prod.id, field })
      }).catch(err => console.error('切換首頁精選失敗:', err))
      return { success: true, value: prod[field] }
    }
    return { success: false }
  }

  return {
    products,
    publishedProducts,
    reviews,
    isLoading,
    fetchProducts,
    saveProduct,
    deleteProduct,
    addReview,
    categories,
    selectedCategory,
    sortBy,
    searchQuery,
    searchInput,
    filteredProducts,
    paginatedProducts,
    hotRankingProducts,
    seasonalNewProducts,
    getProductPrice,
    setCategory,
    setSortBy,
    setSearchQuery,
    getProductById,
    getProductReviews,
    getProductRatingSummary,
    toggleProductFeatured
  }
})