<!-- app/pages/cabinet/boards/index.vue -->
 <template>
  <div class="boards-page-container">
    <BoardsIndex />
  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime';
import BoardsIndex from '~/components/pages/cabinet/Boards/index.vue'

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})
</script>

<style scoped lang="scss">
.boards-page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>