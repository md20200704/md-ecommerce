import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore'
import { useProductStore } from './productStore'
import { apiRequest, getAuthToken } from '../services/apiClient'

export const useAdminStore = defineStore('admin', () => {
  const authStore = useAuthStore()
  const productStore = useProductStore()

  const currentAdmin = ref({
    username: 'user@md-korea.com',
    name: '系統管理者'
  })

  const maskPhone = (phone) => phone || ''
  const maskName = (name) => name || ''

  const orders = ref([])
  const stockLogs = ref([])
  const auditLogs = ref([])

  const fetchOrders = async () => {
    if (!getAuthToken()) return
    try {
      const res = await apiRequest('/api/orders')
      if (res.success) orders.value = res.orders || []
    } catch (err) {
      console.warn('[adminStore] 載入訂單失敗:', err.message)
    }
  }

  const fetchLogs = async () => {
    if (!getAuthToken() || !authStore.isAdmin) return
    try {
      const res = await apiRequest('/api/orders?action=logs')
      if (res.success) {
        auditLogs.value = res.auditLogs || []
        stockLogs.value = res.stockLogs || []
      }
    } catch (err) {
      console.warn('[adminStore] 載入稽核與庫存日誌失敗:', err.message)
    }
  }

  const getOrderPaidAmount = (ord) => {
    if (!ord) return 0
    if (typeof ord.totalAmount === 'number' && ord.totalAmount > 0) return ord.totalAmount
    if (typeof ord.amount === 'number' && ord.amount > 0) return ord.amount
    const itemsSum = (ord.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
    const discount = Number(ord.couponDiscount || 0) + Number(ord.pointsUsed || 0)
    const ship = Number(ord.shippingFee || 0)
    return Math.max(0, itemsSum - discount) + ship
  }

  const requestCancelOrder = async (orderId, reason = '顧客改變心意申請取消') => {
    try {
      const res = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ action: 'request-cancel', orderId, reason })
      })
      await fetchOrders()
      return res
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  const approveCancelOrder = async (orderId) => {
    try {
      const res = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ action: 'approve-cancel', orderId })
      })
      await Promise.all([fetchOrders(), productStore.fetchProducts(), authStore.initSession(), fetchLogs()])
      return res
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  const rejectCancelOrder = async (orderId) => {
    try {
      const res = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ action: 'reject-cancel', orderId })
      })
      await fetchOrders()
      return res
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  const updateOrderStatus = async (orderId, status, trackingNumber = '') => {
    if (status === '配送中') {
      await apiRequest('/api/orders', {
        method: 'PUT',
        body: JSON.stringify({ action: 'ship', orderId, trackingNumber })
      })
      await fetchOrders()
    } else if (status === '已完成') {
      await completeOrder(orderId)
    }
  }

  const completeOrder = async (orderId) => {
    const res = await apiRequest('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ action: 'complete', orderId })
    })
    await Promise.all([fetchOrders(), authStore.initSession()])
    return res
  }

  const submitReturnRequest = async (orderId, { reasonType, detailReason, images = [] }) => {
    const res = await apiRequest('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ action: 'request-return', orderId, reasonType, detailReason, images })
    })
    await fetchOrders()
    return res
  }

  const addAuditLog = (action, detail) => {
    auditLogs.value.unshift({
      id: 'AUD-' + Date.now().toString().slice(-6),
      operator: authStore.user?.name || currentAdmin.value.name,
      ip: 'client',
      action,
      detail,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    })
  }

  return {
    currentAdmin,
    maskPhone,
    maskName,
    orders,
    stockLogs,
    auditLogs,
    fetchOrders,
    fetchLogs,
    getOrderPaidAmount,
    requestCancelOrder,
    approveCancelOrder,
    rejectCancelOrder,
    updateOrderStatus,
    completeOrder,
    submitReturnRequest,
    addAuditLog
  }
})