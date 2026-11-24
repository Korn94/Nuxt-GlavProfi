<!-- app/pages/remont-pomescheniy/kliniki.vue -->
 <template>
  <div class="page-kliniki-routing">
    <!-- Сборщик страницы -->
    <KlinikiPage />
  </div>
</template>

<script setup lang="ts">
import KlinikiPage from '~/components/pages/public/remontPomescheniy/pageTypes/kliniki/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/composables/usePageSeo'
// SEO-данные страницы (title/description/FAQ) — в едином data-модуле:
// из него же сервер собирает markdown-версию (/remont-pomescheniy/kliniki.md).
import { premisesSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/data/premisesSeo'

usePageSeo(premisesSeo.kliniki)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-kliniki-routing {
  background: $background-dark;
}
</style>
