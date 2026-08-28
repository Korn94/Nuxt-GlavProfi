<!-- app/pages/vidy-rabot/shtukaturka-sten.vue -->
 <template>
  <div class="page-shtukaturka-sten-routing">
    <ShtukaturkaStenyPage />
  </div>
</template>

<script setup lang="ts">
import ShtukaturkaStenyPage from '~/components/pages/public/remontPomescheniy/workTypes/shtukaturka/steny.vue'
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-shtukaturka-sten-routing {
  background: $background-dark;
}
</style>