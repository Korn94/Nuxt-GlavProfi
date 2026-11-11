<!-- app/components/pages/public/offers/kp/blocks/KpQrCode.vue -->
<template>
  <aside v-if="svg" class="kp-qr">
    <!-- SVG генерируется локально из URL страницы (uqr), v-html безопасен -->
    <div class="kp-qr__code" v-html="svg" />

    <div class="kp-qr__text">
      <div class="kp-qr__title">Актуальная версия КП на сайте</div>
      <div class="kp-qr__link">{{ displayUrl }}</div>
      <div class="kp-qr__hint">Наведите камеру телефона, чтобы открыть смету в браузере.</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * QR-код со ссылкой на страницу КП — печатается в конце PDF
 * (на экране скрыт: .kp-qr { display: none } в kp.scss).
 *
 * Ссылка сохраняет выбранный вариант (?variant=...), поэтому клиент,
 * отсканировав код, попадёт на ту же версию предложения.
 */
import { renderSVG } from 'uqr'

const route = useRoute()
const config = useRuntimeConfig()

/** Локальные адреса в PDF бесполезны — берём публичный siteUrl, иначе текущий origin */
const LOCAL_ORIGIN = /^(https?:\/\/)?(0\.0\.0\.0|127\.0\.0\.1|localhost)(:|\/|$)/i

const origin = computed<string>(() => {
  const siteUrl = String(config.public.siteUrl ?? '').replace(/\/+$/, '')

  if (siteUrl && !LOCAL_ORIGIN.test(siteUrl)) return siteUrl
  if (import.meta.client) return window.location.origin

  return siteUrl
})

const url = computed<string>(() => `${origin.value}${route.fullPath}`)

/** Ссылка без протокола — так её удобно читать с бумаги */
const displayUrl = computed<string>(() => url.value.replace(/^https?:\/\//, ''))

const svg = computed<string>(() => renderSVG(url.value, {
  ecc: 'M',
  border: 1,
  blackColor: '#18191b',
  whiteColor: '#ffffff',
}))
</script>
