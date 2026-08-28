<!-- app/pages/vidy-rabot/shpaklevka-sten.vue -->
 <template>
  <div class="page-shpaklevka-sten-routing">
    <ShpaklevkaStenyPage />
  </div>
</template>

<script setup lang="ts">
import ShpaklevkaStenyPage from '~/components/pages/public/remontPomescheniy/workTypes/shpaklevka/steny.vue'
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-shpaklevka-sten-routing {
  background: $background-dark;
}
</style>