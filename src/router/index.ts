import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { pinia } from '@/stores/pinia'
import { getSafeRedirect } from '@/utils/redirect'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      titleKey: 'route.login',
      descriptionKey: 'auth.login.subtitle',
      layout: 'auth',
      guestOnly: true,
    },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/register/index.vue'),
    meta: {
      titleKey: 'route.register',
      descriptionKey: 'auth.register.subtitle',
      layout: 'auth',
      guestOnly: true,
    },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/home/index.vue'),
    meta: {
      titleKey: 'route.dashboard',
      descriptionKey: 'dashboard.focus.subtitle',
      requiresAuth: true,
    },
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('@/views/tasks/index.vue'),
    meta: {
      titleKey: 'route.tasks',
      descriptionKey: 'tasks.summary',
      requiresAuth: true,
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/settings/index.vue'),
    meta: {
      titleKey: 'route.settings',
      descriptionKey: 'settings.subtitle',
      requiresAuth: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/not-found/index.vue'),
    meta: {
      titleKey: 'route.notFound',
      descriptionKey: 'notFound.description',
      requiresAuth: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)
  if (!auth.initialized) await auth.bootstrap()

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return getSafeRedirect(to.query.redirect, '/')
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  return true
})

export default router
