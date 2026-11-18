import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore'
import { useProductStore } from './productStore'
import { useCartStore } from './cartStore'

export const useAdminStore = defineStore('admin', () => {
  const authStore = useAuthStore()
  const productStore = useProductStore()
  const cartStore = useCartStore()

  const currentAdmin = ref({
    username: 'admin@md-korea.com',
    name: '系統管理者'
  })

  const maskPhone = (phone) => phone || ''
  const maskName = (name) => name || ''

  // 統一訂單資料結構：包含 id/orderId、status、subtotal、couponDiscount、pointsUsed、shippingFee、totalAmount 與帶圖片的 items
  const orders = ref([
    {
      id: 'ORD-20261106-01',
      orderId: 'ORD-20261106-01',
      customerName: '陳哲偉',
      recipientName: '陳哲偉',
      phone: '0912345678',
      email: 'user@md-korea.com',
      status: '待出貨',
      subtotal: 3280,
      couponDiscount: 100,
      pointsUsed: 80,
      shippingFee: 100,
      totalAmount: 3200, // 折抵後實際支付總金額 (3280 - 100 - 80 + 100)
      amount: 3200,
      paymentMethod: 'LINE Pay',
      paymentStatus: 'PAID',
      shippingMethod: 'CVS',
      shippingAddress: '7-11 鑫鑫門市 (台北市中正區忠孝西路一段)',
      trackingNumber: '',
      cancelReason: '',
      rewardsSettled: false,
      createdAt: '2026-11-06 14:00',
      items: [
        {
          id: 1,
          skuId: 'SKU-101',
          name: '首爾晨霧微光西裝長大衣',
          color: '晨霧燕麥',
          size: 'S',
          quantity: 1,
          price: 3280,
          image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
          reviewed: false
        }
      ]
    },
    {
      id: 'ORD-20261105-08',
      orderId: 'ORD-20261105-08',
      customerName: '陳哲偉',
      recipientName: '陳哲偉',
      phone: '0912345678',
      email: 'user@md-korea.com',
      status: '配送中',
      subtotal: 2960,
      couponDiscount: 200,
      pointsUsed: 60,
      shippingFee: 100,
      totalAmount: 2800, // 折抵後實際支付總金額 (2960 - 200 - 60 + 100)
      amount: 2800,
      paymentMethod: 'LINE Pay',
      paymentStatus: 'PAID',
      shippingMethod: 'HOME',
      shippingAddress: '台北市中正區忠孝西路一段 100 號 8 樓',
      trackingNumber: 'TCAT-90218842',
      cancelReason: '',
      rewardsSettled: false,
      createdAt: '2026-11-05 09:30',
      items: [
        {
          id: 2,
          skuId: 'SKU-201',
          name: '法式慵懶微立領雪紡襯衫',
          color: '米白',
          size: 'F',
          quantity: 1,
          price: 1380,
          image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80',
          reviewed: false
        },
        {
          id: 3,
          skuId: 'SKU-301',
          name: '高腰垂墜感西裝直筒闊腿褲',
          color: '卡其灰',
          size: 'S',
          quantity: 1,
          price: 1580,
          image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80',
          reviewed: false
        }
      ]
    },
    {
      id: 'ORD-20261102-03',
      orderId: 'ORD-20261102-03',
      customerName: '陳哲偉',
      recipientName: '陳哲偉',
      phone: '0912345678',
      email: 'user@md-korea.com',
      status: '已完成',
      subtotal: 1880,
      couponDiscount: 0,
      pointsUsed: 80,
      shippingFee: 60,
      totalAmount: 1860,
      amount: 1860,
      earnedPoints: 55,
      paymentMethod: 'LINE Pay',
      paymentStatus: 'PAID',
      shippingMethod: 'CVS',
      shippingAddress: '全家 敦南門市',
      trackingNumber: 'FAMI-77829103',
      cancelReason: '',
      rewardsSettled: true,
      createdAt: '2026-11-02 10:10',
      items: [
        {
          id: 4,
          skuId: 'SKU-401',
          name: '親膚喀什米爾針織落肩開襟衫',
          color: '燕麥白',
          size: 'F',
          quantity: 1,
          price: 1880,
          image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
          reviewed: false
        }
      ]
    }
  ])

  // 取得訂單實際支付總金額（相容各種新舊欄位，確保絕不為 0）
  const getOrderPaidAmount = (ord) => {
    if (!ord) return 0
    if (typeof ord.totalAmount === 'number' && ord.totalAmount > 0) return ord.totalAmount
    if (typeof ord.amount === 'number' && ord.amount > 0) return ord.amount
    if (typeof ord.total === 'number' && ord.total > 0) return ord.total
    const itemsSum = (ord.items || []).reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    )
    const discount = Number(ord.couponDiscount || 0) + Number(ord.pointsUsed || 0)
    const ship = Number(ord.shippingFee || 0)
    return Math.max(0, itemsSum - discount) + ship
  }

  // 顧客於前台針對「尚未出貨（待出貨）」之訂單提出取消申請
  const requestCancelOrder = (orderId, reason = '顧客改變心意申請取消') => {
    const order = orders.value.find(o => (o.orderId || o.id) === orderId)
    if (!order) return { success: false, message: '找不到該筆訂單' }

    if (!['待出貨', '處理中', '已付款', 'PENDING'].includes(order.status)) {
      return { success: false, message: '此訂單已進入出貨流程，無法直接取消！' }
    }

    order.status = '申請取消中'
    order.cancelReason = reason
    order.cancelRequestedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')

    addAuditLog(
      '顧客申請取消訂單',
      `訂單 #${orderId} 顧客提出取消申請（原因：${reason}），等待商家於後台確認`
    )
    return {
      success: true,
      message: `已送出訂單 #${orderId} 的取消申請！商家已收到系統通知，將於後台為您審核確認。`
    }
  }

  // 商家於後台「核准取消訂單」（自動回補商品 SKU 庫存與退還已折抵點數）
  const approveCancelOrder = (orderId) => {
    const order = orders.value.find(o => (o.orderId || o.id) === orderId)
    if (!order) return { success: false, message: '找不到該筆訂單' }

    order.status = '已取消'
    order.cancelledAt = new Date().toISOString().slice(0, 16).replace('T', ' ')

    // 1. 自動回補對應商品 SKU 庫存
    ;(order.items || []).forEach(item => {
      const prod = (productStore.products || []).find(
        p => Number(p.id) === Number(item.id) || p.name === item.name
      )
      if (prod && Array.isArray(prod.skus)) {
        const targetSku =
          prod.skus.find(s => s.skuId === item.skuId || (s.color === item.color && s.size === item.size)) ||
          prod.skus[0]
        if (targetSku) {
          targetSku.stock = (Number(targetSku.stock) || 0) + (Number(item.quantity) || 1)
        }
        prod.salesCount = Math.max(0, (Number(prod.salesCount) || 0) - (Number(item.quantity) || 1))
        if (prod.skus.some(s => s.stock > 0)) {
          prod.isPublished = true
        }
      }
    })

    // 2. 若下單時有折抵紅利點數，退還點數給會員
    const pointsUsed = Number(order.pointsUsed || 0)
    if (pointsUsed > 0 && authStore.user) {
      authStore.user.points = (Number(authStore.user.points) || 0) + pointsUsed
    }

    addAuditLog(
      '後台核准取消訂單',
      `管理員已核准取消訂單 #${orderId}，商品庫存與折抵點數已自動回補`
    )
    return {
      success: true,
      message: `已確認取消訂單 #${orderId}！商品庫存已自動回補${pointsUsed > 0 ? `，並退還顧客 ${pointsUsed} 點紅利點數` : ''}。`
    }
  }

  // 商家於後台「駁回取消申請」（恢復為待出貨或直接轉配送中）
  const rejectCancelOrder = (orderId) => {
    const order = orders.value.find(o => (o.orderId || o.id) === orderId)
    if (!order) return { success: false, message: '找不到該筆訂單' }

    order.status = '待出貨'
    addAuditLog('後台駁回取消申請', `訂單 #${orderId} 取消申請已駁回，恢復為待出貨狀態`)
    return { success: true, message: `已駁回訂單 #${orderId} 的取消申請，狀態恢復為「待出貨」。` }
  }

  const stockLogs = ref([
    {
      id: 'LOG-5001',
      skuId: 'SKU-101',
      productName: '首爾晨霧微光西裝長大衣 (晨霧燕麥/S)',
      changeQty: -1,
      afterStock: 12,
      reason: '顧客結帳扣除 (訂單 ORD-20261106-01)',
      operator: '系統自動',
      createdAt: '2026-11-06 14:00'
    }
  ])

  const auditLogs = ref([
    {
      id: 'AUD-9001',
      operator: '系統管理者',
      ip: '220.133.45.92',
      action: '系統初始化',
      detail: '前後台訂單、庫存與會員點數結算模組已連線',
      createdAt: '2026-11-06 14:20'
    }
  ])

  const addAuditLog = (action, detail) => {
    auditLogs.value.unshift({
      id: 'AUD-' + Date.now().toString().slice(-6),
      operator: currentAdmin.value.name,
      ip: '220.133.45.92',
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
    getOrderPaidAmount,
    requestCancelOrder,
    approveCancelOrder,
    rejectCancelOrder,
    stockLogs,
    auditLogs,
    addAuditLog
  }
})