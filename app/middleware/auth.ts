// app/middleware/auth.ts
import { defineNuxtRouteMiddleware } from '#app'
import type { RouteLocationNormalized } from 'vue-router'
import { runAuthGuard } from '~/utils/runAuthGuard'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => runAuthGuard(to))
