<!-- app\components\pages\cabinet\dashboards\foreman\index.vue -->
 <template>
  <div class="foreman-dashboard">
    <PagesCabinetUiLayoutPageTitle 
      title="Ежедневные работы" 
      icon="mdi:clipboard-text-clock-outline" 
    />
    
    <DailyWork
      :auto-load="true"
      @save="onSave"
      @delete="onDelete"
      @error="onError"
    />
  </div>
</template>

<script setup lang="ts">
import { useHead } from 'nuxt/app'
import DailyWork from '~/components/pages/cabinet/DailyWork/index.vue'

const onSave = (data: any) => {
  console.log('[ForemanDashboard] Сохранено:', data)
  // Дополнительная логика после сохранения
}

const onDelete = (data: any) => {
  console.log('[ForemanDashboard] Удалено:', data)
  // Дополнительная логика после удаления
}

const onError = (error: string) => {
  console.error('[ForemanDashboard] Ошибка:', error)
  // Показать уведомление пользователю
}

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM — Главная прораба'
})
</script>

<style lang="scss" scoped>
.foreman-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}
</style>