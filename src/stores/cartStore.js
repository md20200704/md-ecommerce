import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProductStore } from './productStore'

export const useCartStore = defineStore('cartStore', () => {
  const productStore = useProductStore()

  // 預設購物袋初始商品直接對應後台第 1 件商品（首爾晨霧微光西裝長大衣 NT$ 3,280）
  const items = ref([
    {
      id: 1,
      cartItemId: '1-晨霧燕麥-S',
      name: '首爾晨霧微光西裝長大衣',
      price: 3280,
      color: '晨霧燕麥',
      size: 'S',
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
      selected: true
    }
  ])

  const isOpen = ref(false)

  const openDrawer = () => { isOpen.value = true }
  const closeDrawer = () => { isOpen.value = false }

  // 取得該商品在後台的最新即時價格與名稱（若後台改價，購物車與結帳頁自動同步最新價格）
  const getLiveUnitPrice = (item) => {
    const liveProd = (productStore.products || []).find(p => Number(p.id) === Number(item.id))
    if (liveProd) {
      return Number(liveProd.price ?? liveProd.basePrice ?? item.price ?? 0)
    }
    return Number(item.price || 0)
  }

  // 加入購物車（預設勾選）
  const addItem = (product, selectedColor, selectedSize, qty = 1) => {
    const color = typeof selectedColor === 'object' ? selectedColor.color : selectedColor
    const size = typeof selectedColor === 'object' ? selectedColor.size : selectedSize
    const count = typeof selectedColor === 'object' ? (Number(selectedSize) || 1) : (Number(qty) || 1)

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
        name: product.name,
        price: livePrice,
        color,
        size,
        quantity: count,
        image: product.image || (product.images && product.images[0]),
        selected: true
      })
    }
    openDrawer()
    return { success: true, message: '已加入購物袋' }
  }

  // 相容舊版呼叫名稱 addToCart(product, skuObj, quantity)
  const addToCart = (product, skuOrColor, qtyOrSize, maybeQty) => {
    return addItem(product, skuOrColor, qtyOrSize, maybeQty)
  }

  const removeItem = (cartItemId) => {
    const idx = items.value.findIndex(i => i.cartItemId === cartItemId)
    if (idx > -1) items.value.splice(idx, 1)
  }

  const toggleItemSelect = (cartItemId) => {
    const item = items.value.find(i => i.cartItemId === cartItemId)
    if (item) item.selected = !item.selected
  }

  const toggleSelectAll = (status) => {
    items.value.forEach(i => { i.selected = status })
  }

  const isAllSelected = computed(() => {
    if (items.value.length === 0) return false
    return items.value.every(i => i.selected)
  })

  // 僅計算「有被勾選」的商品總件數
  const totalCount = computed(() => {
    return items.value
      .filter(i => i.selected)
      .reduce((sum, i) => sum + i.quantity, 0)
  })

  // 僅計算「有被勾選」的商品總金額（即時同步後台最新售價）
  const totalPrice = computed(() => {
    return items.value
      .filter(i => i.selected)
      .reduce((sum, i) => sum + (getLiveUnitPrice(i) * i.quantity), 0)
  })

  // 取得準備結帳的商品清單（自動帶入後台最新售價）
  const selectedItems = computed(() => {
    return items.value
      .filter(i => i.selected)
      .map(i => {
        const liveProd = (productStore.products || []).find(p => Number(p.id) === Number(i.id))
        if (liveProd) {
          i.price = Number(liveProd.price ?? liveProd.basePrice ?? i.price ?? 0)
          i.name = liveProd.name || i.name
        }
        return i
      })
  })

  return {
    items,
    isOpen,
    openDrawer,
    closeDrawer,
    getLiveUnitPrice,
    addItem,
    addToCart,
    removeItem,
    toggleItemSelect,
    toggleSelectAll,
    isAllSelected,
    totalCount,
    totalPrice,
    selectedItems
  }
})