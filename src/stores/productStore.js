import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProductStore = defineStore('product', () => {
  const products = ref([
    {
      id: 1,
      name: '首爾晨霧微光西裝長大衣',
      isPublished: true,
      category: 'Outer 外套',
      subcategory: '西裝外套',
      price: 3280,
      cost: 1480,
      salesCount: 128,
      tag: 'MD PICK',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80'
      ],
      description: '經典雙排扣廓形版型，特選羊毛面料親膚保暖，修飾肩頸與身形輪廓。',
      isHotRanking: true,
      isSeasonalNew: true,
      featuredOrder: 1,
      skus: [
        { skuId: 'SKU-101', color: '晨霧燕麥', size: 'S', stock: 12 },
        { skuId: 'SKU-102', color: '晨霧燕麥', size: 'M', stock: 8 },
        { skuId: 'SKU-103', color: '曜石炭黑', size: 'S', stock: 4 },
        { skuId: 'SKU-104', color: '曜石炭黑', size: 'M', stock: 15 }
      ]
    },
    {
      id: 2,
      name: '法式慵懶微立領雪紡襯衫',
      isPublished: true,
      category: 'Top 上衣',
      subcategory: '襯衫/雪紡',
      price: 1380,
      cost: 580,
      salesCount: 245,
      tag: 'BESTSELLER',
      image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80'
      ],
      description: '輕柔垂墜雪紡面料，微立領剪裁修飾頸線，散發知性優雅氣息。',
      isHotRanking: true,
      isSeasonalNew: false,
      featuredOrder: 2,
      skus: [
        { skuId: 'SKU-201', color: '米白', size: 'F', stock: 22 },
        { skuId: 'SKU-202', color: '杏色', size: 'F', stock: 18 }
      ]
    },
    {
      id: 3,
      name: '高腰垂墜感西裝直筒闊腿褲',
      isPublished: true,
      category: 'Bottom 下身',
      subcategory: '西裝長褲',
      price: 1580,
      cost: 690,
      salesCount: 198,
      tag: 'NEW ARRIVAL',
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80'
      ],
      description: '立體壓褶修身顯瘦，彈性腰頭設計舒適不勒身，兼顧俐落與鬆弛感。',
      isHotRanking: false,
      isSeasonalNew: true,
      featuredOrder: 3,
      skus: [
        { skuId: 'SKU-301', color: '卡其灰', size: 'S', stock: 6 },
        { skuId: 'SKU-302', color: '卡其灰', size: 'M', stock: 14 },
        { skuId: 'SKU-303', color: '深墨黑', size: 'S', stock: 9 }
      ]
    },
    {
      id: 4,
      name: '親膚喀什米爾針織落肩開襟衫',
      isPublished: true,
      category: 'Top 上衣',
      subcategory: '針織毛衣',
      price: 1880,
      cost: 820,
      salesCount: 167,
      tag: 'WINTER SPEC',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80'
      ],
      description: '軟糯親膚羊絨混紡針織，開襟設計百搭實穿，冬日微涼的理想層次疊穿單品。',
      isHotRanking: true,
      isSeasonalNew: true,
      featuredOrder: 4,
      skus: [
        { skuId: 'SKU-401', color: '燕麥白', size: 'F', stock: 10 },
        { skuId: 'SKU-402', color: '可可咖', size: 'F', stock: 3 }
      ]
    }
  ])

  const reviews = ref([
    {
      id: 'REV-01',
      orderId: 'ORD-20261105-08',
      productId: 1,
      userName: '林詩涵',
      rating: 5,
      content: '外套實品質感比照片更好！羊毛很細緻完全不刺癢，落肩版型非常修飾身形。',
      createdAt: '2026-11-06 18:20',
      images: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80']
    }
  ])

  // 新增評價（由會員中心完成訂單後或商品詳情頁呼叫）
  const addReview = (payload) => {
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
    return {
      success: true,
      message: '感謝您的真實評價與穿搭分享！評價已發布至商品頁面。',
      review: newRev
    }
  }

  const categories = ref(['ALL', 'Top 上衣', 'Outer 外套', 'Bottom 下身'])
  const selectedCategory = ref('ALL')
  const sortBy = ref('default')
  const searchQuery = ref('')
  const searchInput = ref('')

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

  const getProductById = (id) => {
    return products.value.find(p => p.id === Number(id))
  }

  const getProductReviews = (productId) => {
    return reviews.value.filter(r => r.productId === Number(productId))
  }

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
    const prod = products.value.find(p => p.id === Number(productId))
    if (prod && (field === 'isHotRanking' || field === 'isSeasonalNew')) {
      prod[field] = !prod[field]
      return { success: true, value: prod[field] }
    }
    return { success: false }
  }

  return {
    products,
    publishedProducts,
    reviews,
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