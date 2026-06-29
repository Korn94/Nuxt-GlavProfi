<!-- app\pages\cabinet\dashboard.vue -->
 <template>
  <div class="cabinet-dashboard">
    <component :is="currentDashboard" v-if="currentDashboard && !isLoading" />

    <div v-if="isLoading" class="cabinet-dashboard__loading">
      <Icon name="mdi:loading" class="animate-spin" size="24" />
      <span class="ml-2">Загрузка...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, onMounted } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useHead } from 'nuxt/app'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'

const authStore = useAuthStore()
const isLoading = ref(true)

// Ленивая загрузка — грузится только нужный дашборд
const dashboards: Record<string, any> = {
  admin: defineAsyncComponent(() =>
    import('~/components/pages/cabinet/dashboards/admin/index.vue')
  ),
  manager: defineAsyncComponent(() =>
    import('~/components/pages/cabinet/dashboards/manager/index.vue')
  ),
  foreman: defineAsyncComponent(() =>
    import('~/components/pages/cabinet/dashboards/foreman/index.vue')
  ),
  master: defineAsyncComponent(() =>
    import('~/components/pages/cabinet/dashboards/master/index.vue')
  ),
  worker: defineAsyncComponent(() =>
    import('~/components/pages/cabinet/dashboards/worker/index.vue')
  ),
}

const role = computed(() => authStore.user?.role || 'worker')
const currentDashboard = computed(() => dashboards[role.value] || dashboards.worker)

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
})

onMounted(async () => {
  if (authStore.isChecking) {
    await authStore.init().catch(() => {})
  }
  isLoading.value = false
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'CRM — Главная',
})
</script>

<style lang="scss" scoped>
.cabinet-dashboard__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-md);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>