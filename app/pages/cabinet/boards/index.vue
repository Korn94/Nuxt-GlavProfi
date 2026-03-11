<!-- app/pages/cabinet/boards/index.vue -->
<template>
  <div class="boards-page-container">
    <BoardsIndex />
  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime';
import BoardsIndex from '~/components/pages/cabinet/Boards/index.vue'

// Мета-данные страницы
definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin', 'manager', 'foreman', 'master', 'worker'],
  title: 'Доски задач',
  description: 'Управление досками задач и папками'
})

// Импортируем компонент
</script>

<style scoped lang="scss">
.boards-page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: $background-dark;
}
</style>