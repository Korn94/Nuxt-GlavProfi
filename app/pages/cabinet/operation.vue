<!-- app/pages/cabinet/operation.vue -->
<template>
  <PagesCabinetOperation v-if="canAccess" />
</template>

<script setup>
import { computed } from 'vue'
import { usePermissions } from '~/composables/usePermissions'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role']
  // allowedRoles убран — проверка через права страницы
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'CRM — Операции'
})

const { can, isReady } = usePermissions()

// Проверка доступа: страница видима если есть хотя бы одно право
const canAccess = computed(() => {
  if (!isReady.value) return true // Во время загрузки показываем компонент (там свой loading)
  return can('operations', 'view')
})
</script>