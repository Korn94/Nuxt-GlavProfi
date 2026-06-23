<!-- app/pages/cabinet/daily-work/index.vue -->
<template>
  <DailyWork
    v-if="canAccess"
    :auto-load="true"
    @save="onSave"
    @delete="onDelete"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from 'nuxt/app'
import DailyWork from '~/components/pages/cabinet/DailyWork/index.vue'
import { usePermissions } from '~/composables/usePermissions'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role']
  // allowedRoles убран — проверка через права страницы
})

useHead({ 
  title: 'CRM — Подневка', 
  meta: [{ name: 'robots', content: 'noindex, nofollow' }] 
})

const { can, isReady } = usePermissions()

// Проверка доступа: страница видима если есть хотя бы одно право
const canAccess = computed(() => {
  if (!isReady.value) return true // Во время загрузки показываем компонент (там будет свой loading)
  return can('daily-work', 'view')
})

const onSave = (data: any) => {
  console.log('Сохранено:', data)
}

const onDelete = (data: any) => {
  console.log('Удалено:', data)
}

const onError = (error: string) => {
  console.error('Ошибка:', error)
}
</script>