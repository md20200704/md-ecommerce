import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cartStore', () => {
  // 購物車商品列表（預設每項商品帶有 selected: true 預設全選）
  const items = ref([
    {
      id: 1,
      cartItemId: 'item-1',
      name: '首爾氣質羊絨針織開襟衫',
      price: 1480,
      color: '燕麥白',
      size: 'F',
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      selected: true
    }
  ])

  const isOpen = ref(false)

  const openDrawer = () => { isOpen.value = true }
  const closeDrawer = () => { isOpen.value = false }

  // 加入購物車（預設勾選）
  const addItem = (product, selectedColor, selectedSize, qty = 1) => {
    const cartItemId = `${product.id}-${selectedColor}-${selectedSize}`
    const existing = items.value.find(i => i.cartItemId === cartItemId)

    if (existing) {
      existing.quantity += qty
    } else {
      items.value.push({
        id: product.id,
        cartItemId,
        name: product.name,
        price: product.price,
        color: selectedColor,
        size: selectedSize,
        quantity: qty,
        image: product.image || (product.images && product.images[0]),
        selected: true
      })
    }
    openDrawer()
  }

  const removeItem = (cartItemId) => {
    const idx = items.value.findIndex(i => i.cartItemId === cartItemId)
    if (idx > -1) items.value.splice(idx, 1)
  }

  // 切換單一商品勾選狀態
  const toggleItemSelect = (cartItemId) => {
    const item = items.value.find(i => i.cartItemId === cartItemId)
    if (item) item.selected = !item.selected
  }

  // 全選 / 全取消
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

  // 僅計算「有被勾選」的商品總金額
  const totalPrice = computed(() => {
    return items.value
      .filter(i => i.selected)
      .reduce((sum, i) => sum + (i.price * i.quantity), 0)
  })

  // 取得準備結帳的商品清單
  const selectedItems = computed(() => {
    return items.value.filter(i => i.selected)
  })

  return {
    items,
    isOpen,
    openDrawer,
    closeDrawer,
    addItem,
    removeItem,
    toggleItemSelect,
    toggleSelectAll,
    isAllSelected,
    totalCount,
    totalPrice,
    selectedItems
  }
})