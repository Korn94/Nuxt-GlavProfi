// plugins/notifications.client.ts
import { defineNuxtPlugin } from 'nuxt/app'
import UiNotificationsContainer from '~/components/ui/notifications/Container.vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('UiNotificationsContainer', UiNotificationsContainer)
})