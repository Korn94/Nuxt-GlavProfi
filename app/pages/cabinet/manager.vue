<!-- app/pages/cabinet/manager.vue -->
<template>
  <div class="manager-dashboard">
    <PagesCabinetUiLayoutPageTitle 
      title="Панель менеджера" 
      icon="mdi:briefcase-outline" 
    />
    
    <div class="placeholder">
      <Icon name="mdi:construction" size="48" class="mb-2" />
      <p class="text-muted">Раздел в разработке</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime';

definePageMeta({
  middleware: ['auth', 'role'],
  allowedRoles: ['manager', 'admin']
})
</script>

<style lang="scss" scoped>
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--crm-text-muted);
}
</style>