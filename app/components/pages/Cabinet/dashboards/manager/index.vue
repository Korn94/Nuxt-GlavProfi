<!-- app\components\pages\cabinet\dashboards\manager\index.vue -->
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
</script>

<style lang="scss" scoped>
.manager-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

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