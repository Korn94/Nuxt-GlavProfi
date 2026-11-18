// app/components/pages/Cabinet/Diagnostics/composables/useDiagnosticsApi.ts
/**
 * 🧪 API-пробы страницы «Диагностика»: ручной GET-запрос к ключевым эндпоинтам
 * с выводом статуса/времени и последнего ответа в карточке «API запросы».
 */
import { ref } from 'vue'
import type { AddLogFn } from './useDiagnosticsLog'

export interface ApiTest {
  method: string
  path: string
  status: string
  statusClass: string
}

export function useDiagnosticsApi(addLog: AddLogFn) {
  const apiTests = ref<ApiTest[]>([
    { method: 'GET', path: '/api/me', status: '—', statusClass: '' },
    { method: 'GET', path: '/api/online', status: '—', statusClass: '' },
    { method: 'GET', path: '/api/auth/check', status: '—', statusClass: '' },
    { method: 'GET', path: '/api/permissions', status: '—', statusClass: '' },
    { method: 'GET', path: '/api/users', status: '—', statusClass: '' },
  ])

  const lastApiResult = ref<string | null>(null)

  async function runApi(api: ApiTest) {
    api.status = '···'
    api.statusClass = ''
    try {
      const t0 = Date.now()
      const data = await $fetch(api.path, { method: api.method as any, credentials: 'include' })
      const ms = Date.now() - t0
      api.status = `200 (${ms}ms)`
      api.statusClass = 'api-row__status--ok'
      lastApiResult.value = JSON.stringify(data, null, 2).slice(0, 800)
      addLog('api', `${api.method} ${api.path} → 200 in ${ms}ms`, 'ok')
    } catch (e: any) {
      const code = e?.status || e?.statusCode || '?'
      api.status = `${code} ERR`
      api.statusClass = 'api-row__status--err'
      lastApiResult.value = JSON.stringify(e?.data || e?.message || e, null, 2).slice(0, 400)
      addLog('api', `${api.method} ${api.path} → ${code} ${e?.message || ''}`, 'err')
    }
  }

  return { apiTests, lastApiResult, runApi }
}
