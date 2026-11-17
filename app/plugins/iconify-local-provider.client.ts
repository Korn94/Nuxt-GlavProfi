// app/plugins/iconify-local-provider.client.ts
//
// ⚠️ Воркэраунд для бага @nuxt/icon: https://github.com/nuxt/icon/issues/571
//
// Суть: applyIconifyConfig() внутри @nuxt/icon@2.6.2 регистрирует локальный
// провайдер (/api/_nuxt_icon) на клиенте только тогда, когда список дефолтных
// хостов @iconify/vue выглядит нетронутым, а сравнивает он его с жёстко
// зашитым ["https://api.iconify.design"]. В @iconify/vue@5.0.5 дефолт стал
// ["https://api.iconify.design", "https://api2.iconify.design"], проверка
// не проходит — и иконки, которых нет в SSR-разметке (меню по правам,
// списки, отрисованные после $fetch), начинают запрашиваться напрямую
// с api.iconify.design / api2.iconify.design. Внешний API недоступен →
// "[Icon] failed to load icon" и пустые места вместо иконок.
//
// Здесь мы регистрируем локальный эндпоинт сами, тем же способом, что и модуль.
// Живёт ровно до выхода @nuxt/icon с фиксом (PR #574): флаг
// `runtimeConfig.public.iconProviderWorkaround` считается в nuxt.config.ts по
// реальному коду установленного @nuxt/icon. Как только фикс появится — плагин
// станет пустышкой, а сборка выведет напоминание удалить этот файл.
import { defineNuxtPlugin, useAppConfig, useRuntimeConfig } from 'nuxt/app'
import { addAPIProvider } from '@iconify/vue'

interface IconRuntimeOptions {
  localApiEndpoint?: string
  iconifyApiEndpoint?: string
}

export default defineNuxtPlugin({
  name: 'iconify-local-provider',
  // @nuxt/icon регистрируется как обычный плагин → 'post' гарантирует, что
  // мы выставим провайдера последними и модуль его уже не перезапишет.
  enforce: 'post',
  setup() {
    const { public: publicConfig, app } = useRuntimeConfig()

    if (publicConfig.iconProviderWorkaround !== true) {
      return
    }

    // Локальная аннотация: не зависим от сгенерированных .nuxt-типов app.config.
    const options = (useAppConfig() as { icon?: IconRuntimeOptions }).icon
    const baseURL = (app?.baseURL || '/').replace(/\/$/, '')
    const localApiEndpoint = baseURL + (options?.localApiEndpoint || '/api/_nuxt_icon')
    const resources = [localApiEndpoint, options?.iconifyApiEndpoint].filter(Boolean) as string[]

    // Первым идёт свой эндпоинт (same-origin, отдаёт Nitro из локального бандла
    // коллекций), внешний Iconify остаётся аварийным fallback-ом.
    addAPIProvider('', { resources })

    if (import.meta.dev) {
      console.info('[Icon] ✅ Локальный Iconify-провайдер зарегистрирован:', resources)
    }
  },
})
