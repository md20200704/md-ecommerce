import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProductStore } from './productStore'
import { apiRequest, getAuthToken } from '../services/apiClient'

export const useCartStore = defineStore('cartStore', () => {
  const productStore = useProductStore()

  const items = ref([])
  const isOpen = ref(false)

  const openDrawer = () => { isOpen.value = true }
  const closeDrawer = () => { isOpen.value = false }

  const fetchCart = async () => {
    if (!getAuthToken()) return
    try {
      const res = await apiRequest('/api/cart')
      if (res.success && Array.isArray(res.items)) {
        items.value = res.items
      }
    } catch (err) {
      console.warn('[cartStore] 同步購物袋失敗：', err.message)
    }
  }

  const getLiveUnitPrice = (item) => {
    const liveProd = (productStore.products || []).find(p => Number(p.id) === Number(item.id))
    if (liveProd) return Number(liveProd.price ?? liveProd.basePrice ?? item.price ?? 0)
    return Number(item.price || 0)
  }

  const addItem = (product, selectedColor, selectedSize, qty = 1) => {
    const color = typeof selectedColor === 'object' ? selectedColor.color : selectedColor
    const size = typeof selectedColor === 'object' ? selectedColor.size : selectedSize
    const count = typeof selectedColor === 'object' ? (Number(selectedSize) || 1) : (Number(qty) || 1)
    const skuObj = (product.skus || []).find(s => s.color === color && s.size === size)

    const cartItemId = `${product.id}-${color}-${size}`
    const livePrice = Number(product.price ?? product.basePrice ?? 0)
    const existing = items.value.find(i => i.cartItemId === cartItemId)

    if (existing) {
      existing.quantity += count
      existing.price = livePrice
      existing.name = product.name
      existing.selected = true
    } else {
      items.value.push({
        id: product.id,
        cartItemId,
        skuId: skuObj?.skuId || null,
        name: product.name,
        price: livePrice,
        color,
        size,
        quantity: count,
        image: product.image || (product.images && product.images[0]),
        selected: true
      })
    }

    if (getAuthToken()) {
      apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          skuId: skuObj?.skuId || null,
          color,
          size,
          quantity: count
        })
      }).catch(err => console.error('加入購物袋同步失敗:', err))
    }

    openDrawer()
    return { success: true, message: '已加入購物袋' }
  }

  const addToCart = (product, skuOrColor, qtyOrSize, maybeQty) => addItem(product, skuOrColor, qtyOrSize, maybeQty)

  const removeItem = (cartItemId) => {
    const idx = items.value.findIndex(i => i.cartItemId === cartItemId)
    if (idx > -1) items.value.splice(idx, 1)
    if (getAuthToken()) {
      apiRequest(`/api/cart?cartItemId=${encodeURIComponent(cartItemId)}`, { method: 'DELETE' })
        .catch(err => console.error('移除購物袋同步失敗:', err))
    }
  }

  const toggleItemSelect = (cartItemId) => {
    const item = items.value.find(i => i.cartItemId === cartItemId)
    if (item) {
      item.selected = !item.selected
      if (getAuthToken()) {
        apiRequest('/api/cart', {
          method: 'PUT',
          body: JSON.stringify({ cartItemId, selected: item.selected })
        }).catch(() => {})
      }
    }
  }

  const toggleSelectAll = (status) => {
    items.value.forEach(i => { i.selected = status })
    if (getAuthToken()) {
      apiRequest('/api/cart', {
        method: 'PUT',
        body: JSON.stringify({ selectAll: status })
      }).catch(() => {})
    }
  }

  // 依結帳快照還原各商品的勾選狀態，維持原本選定的結帳商品
  const applySelectedSnapshot = (selectedIds = []) => {
    if (!Array.isArray(selectedIds)) return
    const selectedSet = new Set(selectedIds)
    items.value.forEach(item => {
      const nextSelected = selectedSet.has(item.cartItemId)
      if (item.selected !== nextSelected) {
        item.selected = nextSelected
        if (getAuthToken()) {
          apiRequest('/api/cart', {
            method: 'PUT',
            body: JSON.stringify({ cartItemId: item.cartItemId, selected: nextSelected })
          }).catch(() => {})
        }
      }
    })
  }

  const isAllSelected = computed(() => items.value.length > 0 && items.value.every(i => i.selected))
  const totalCount = computed(() => items.value.filter(i => i.selected).reduce((sum, i) => sum + i.quantity, 0))
  const totalPrice = computed(() => items.value.filter(i => i.selected).reduce((sum, i) => sum + getLiveUnitPrice(i) * i.quantity, 0))
  const selectedItems = computed(() =>
    items.value.filter(i => i.selected).map(i => {
      const liveProd = (productStore.products || []).find(p => Number(p.id) === Number(i.id))
      if (liveProd) {
        i.price = Number(liveProd.price ?? liveProd.basePrice ?? i.price ?? 0)
        i.name = liveProd.name || i.name
      }
      return i
    })
  )

  return {
    items,
    isOpen,
    openDrawer,
    closeDrawer,
    fetchCart,
    getLiveUnitPrice,
    addItem,
    addToCart,
    removeItem,
    toggleItemSelect,
    toggleSelectAll,
    applySelectedSnapshot,
    isAllSelected,
    totalCount,
    totalPrice,
    selectedItems
  }
})