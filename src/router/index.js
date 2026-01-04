/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'
import { useAppStore } from '@/stores/app'

const ROUTE_META_BY_PATH = {
  '/home': { requiresAuth: true },
  '/form': { requiresAuth: true, requiresPermission: 'housing:create' },
  '/housing-data': { requiresAuth: true, requiresPermission: 'housing:read' },
  '/infrastructure-form': { requiresAuth: true, requiresPermission: 'facility:create' },
  '/infrastructure-data': { requiresAuth: true, requiresPermission: 'facility:read' },
  '/housing-development-form': { requiresAuth: true, requiresPermission: 'housing_development:create' },
  '/housing-development-data': { requiresAuth: true, requiresPermission: 'housing_development:read' },
  '/users': { requiresAuth: true, requiresPermission: 'manage_users' },
  '/analytics': { requiresAuth: true },
  '/settings': { requiresAuth: true },
  '/profile': { requiresAuth: true },
  '/forbidden': { requiresAuth: false },
}

const applyRouteMeta = (route) => {
  const metaOverride = ROUTE_META_BY_PATH[route.path] || {}
  const children = route.children?.map(applyRouteMeta)
  return {
    ...route,
    meta: {
      ...(route.meta || {}),
      ...metaOverride,
    },
    ...(children ? { children } : {}),
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes.map(applyRouteMeta)),
})

// Authentication guard
router.beforeEach(async (to, from, next) => {
  const appStore = useAppStore()

  const isAuthRoute = to.path.startsWith('/auth')
  const requiresPermission = to.meta?.requiresPermission
  const requiresAuth = to.meta?.requiresAuth || !!requiresPermission
  const editParam = to.query?.edit
  const isEditFlow = Boolean(editParam)
  const editPermissionMap = {
    '/form': ['housing:update', 'housing:verify', 'housing:approve'],
    '/infrastructure-form': ['facility:update', 'facility:verify', 'facility:approve'],
    '/housing-development-form': ['housing_development:update', 'housing_development:verify', 'housing_development:approve']
  }

  if (requiresAuth && !appStore.isAuthenticated) {
    next('/auth/signin')
    return
  }

  if (appStore.isAdminKabupaten) {
    const blockedRoutes = new Set(['/form', '/infrastructure-form'])
    if (blockedRoutes.has(to.path)) {
      next({ path: '/forbidden', query: { from: to.fullPath } })
      return
    }
  }

  if (appStore.isAdminDesa) {
    const blockedRoutes = new Set([
      '/infrastructure-data',
      '/housing-development-form',
      '/housing-development-data',
      '/users'
    ])
    if (blockedRoutes.has(to.path)) {
      next({ path: '/forbidden', query: { from: to.fullPath } })
      return
    }
  }

  if (appStore.isMasyarakat) {
    const blockedRoutes = new Set([
      '/housing-data',
      '/infrastructure-data',
      '/housing-development-form',
      '/housing-development-data',
      '/users'
    ])
    if (blockedRoutes.has(to.path)) {
      next({ path: '/forbidden', query: { from: to.fullPath } })
      return
    }
  }

  if (requiresPermission) {
    let permissions = Array.isArray(requiresPermission)
      ? requiresPermission
      : [requiresPermission]

    if (isEditFlow && editPermissionMap[to.path]) {
      permissions = editPermissionMap[to.path]
    }

    if (appStore.isVerifikator && permissions.some((permission) => String(permission).includes(':create'))) {
      next({ path: '/forbidden', query: { from: to.fullPath } })
      return
    }
    if (!appStore.isSuperAdmin && !appStore.hasAnyPermission(permissions)) {
      next({ path: '/forbidden', query: { from: to.fullPath } })
      return
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute) {
    if (appStore.isAuthenticated) {
      next('/home')
      return
    }
  }
  
  next()
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
