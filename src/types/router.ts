import type { RouteLocationRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    titleKey: string
    descriptionKey?: string
    requiresAuth?: boolean
    guestOnly?: boolean
    layout?: 'default' | 'auth'
  }
}

export type AppRouteLocation = RouteLocationRaw
