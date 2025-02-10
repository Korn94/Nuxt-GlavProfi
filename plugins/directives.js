// Форматирование номера телефона

import { defineNuxtPlugin } from '#app'
import phoneFormat from '~/directives/phoneFormat.js'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.directive('phone-format', phoneFormat)
})
