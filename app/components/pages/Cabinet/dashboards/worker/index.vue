<!-- app\components\pages\cabinet\dashboards\worker\index.vue -->
 <template>
  <div class="worker-dashboard">
    <PagesCabinetUiLayoutPageTitle 
      title="Панель рабочего" 
      icon="mdi:account-hard-hat" 
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
.worker-dashboard {
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