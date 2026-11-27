import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import ProfileView from '../views/ProfileView.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import DashboardView from '../views/admin/DashboardView.vue'
import ProductManageView from '../views/admin/ProductManageView.vue'
import OrderManageView from '../views/admin/OrderManageView.vue'
import MarketingCrmView from '../views/admin/MarketingCrmView.vue'
import CmsLayoutView from '../views/admin/CmsLayoutView.vue'
import AuditLogView from '../views/admin/AuditLogView.vue'
import OrderSuccessView from '../views/OrderSuccessView.vue'
import CategoryView from '../views/CategoryView.vue'
import { useAuthStore } from '../stores/authStore'
import CustomerServiceView from '../views/admin/CustomerServiceView.vue'
import { showToast } from '../composables/useToast'
import PolicyView from '../views/PolicyView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/category/:category?',
      name: 'Category',
      component: CategoryView
    },
    {
      path: '/product/:id',
      name: 'product-detail',
      component: ProductDetailView
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: CheckoutView
    },
    {
      path: '/order-success',
      name: 'order-success',
      component: OrderSuccessView
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAdmin: true },
      children: [
        { path: '', name: 'admin-dashboard', component: DashboardView },
        { path: 'products', name: 'admin-products', component: ProductManageView },
        { path: 'orders', name: 'admin-orders', component: OrderManageView },
        { path: 'marketing', name: 'admin-marketing', component: MarketingCrmView },
        { path: 'cms', name: 'admin-cms', component: CmsLayoutView },
        { path: 'cs', name: 'admin-cs', component: CustomerServiceView },
        { path: 'logs', name: 'admin-logs', component: AuditLogView }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    },
    {
      path: '/policy/:tab?',
      name: 'policy',
      component: PolicyView
    }
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  }
})

// 全域守衛安全防護
router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.requiresAdmin) {
    const authStore = useAuthStore()
    if (!authStore.isAdmin) {
      showToast('您目前的帳號身分非管理員，無法造訪後台系統！', 'error', '權限不足')
      return next({ path: '/' })
    }
  }
  next()
})

export default router