<!-- app/pages/cabinet/daily-work/index.vue -->
<template>
    <DailyWork
      :auto-load="true"
      @save="onSave"
      @delete="onDelete"
      @error="onError"
    />
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'
import DailyWork from '~/components/pages/cabinet/DailyWork/index.vue'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin', 'foreman']
})

const onSave = (data: any) => {
  console.log('Сохранено:', data)
  // Дополнительная логика после сохранения
}

const onDelete = (data: any) => {
  console.log('Удалено:', data)
  // Дополнительная логика после удаления
}

const onError = (error: string) => {
  console.error('Ошибка:', error)
  // Показать уведомление пользователю
}
</script>