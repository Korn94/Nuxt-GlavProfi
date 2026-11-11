<!-- app/components/pages/public/offers/kp/KpDocument.vue -->
<template>
  <div class="kp">
    <slot />

    <KpQrCode v-if="print" />

    <button
      v-if="print"
      type="button"
      class="kp-print"
      @click="printPage"
    >
      <Icon name="material-symbols:picture-as-pdf-outline" />
      Скачать PDF
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Оболочка коммерческого предложения.
 *
 * Внутри собираются любые блоки конструктора:
 *
 * <KpDocument>
 *   <KpHero :meta="offer.meta" :total="doc.grandTotal" />
 *   <KpSummary :cards="doc.summaryCards" />
 *   <KpEstimate :groups="doc.groups" :grand-total="doc.grandTotal" v-bind="offer.estimate" />
 *   ...
 * </KpDocument>
 *
 * Задачи оболочки:
 *  • серый фон и типографика КП (класс .kp);
 *  • плавающая кнопка «Скачать PDF» (window.print);
 *  • QR-код со ссылкой на страницу КП в конце печатного документа (KpQrCode);
 *  • подготовка страницы к печати — скрываем шапку сайта и прочий «хром»
 *    (глобальные правила в app/assets/styles/kp.scss, блок «ПЕЧАТЬ / PDF»).
 */
import KpQrCode from './blocks/KpQrCode.vue'

withDefaults(defineProps<{
  /** Показывать кнопку «Скачать PDF» */
  print?: boolean
}>(), {
  print: true,
})

const printPage = () => window.print()

/**
 * Помечаем «чужие» <header> (шапка сайта), чтобы скрыть их при печати.
 * Свои <header> внутри .kp (hero и заголовки таблиц) не трогаем.
 */
const markSiteChrome = () => {
  document.querySelectorAll('body header').forEach((el) => {
    if (!el.closest('.kp')) el.classList.add('kp-site-header')
  })
}

const unmarkSiteChrome = () => {
  document.querySelectorAll('.kp-site-header').forEach((el) => el.classList.remove('kp-site-header'))
}

onMounted(() => {
  document.documentElement.classList.add('kp-print-mode')
  markSiteChrome()
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('kp-print-mode')
  unmarkSiteChrome()
})
</script>
