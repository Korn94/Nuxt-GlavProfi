// app/components/pages/cabinet/MasterDashboard/ComingSoonWidget.vue
<template>
  <div class="coming-soon-widget">
    <div class="coming-soon-widget__icon">
      <Icon :name="icon" size="48" />
    </div>
    <div class="coming-soon-widget__title">{{ title }}</div>
    <div class="coming-soon-widget__message">{{ message }}</div>
    <div class="coming-soon-widget__badge">
      <Icon name="mdi:clock-outline" size="14" />
      <span>Скоро</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  icon: string
  message: string
}>()
</script>

<style lang="scss" scoped>
.coming-soon-widget {
  background: var(--crm-bg-surface);
  border: 1px dashed var(--crm-border-hover);
  border-radius: var(--crm-radius-lg);
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  height: 100%;
  min-height: 200px;
  position: relative;
}

.coming-soon-widget__icon {
  color: var(--crm-text-disabled);
  opacity: 0.4;
}

.coming-soon-widget__title {
  font-size: var(--crm-text-lg);
  font-weight: 600;
  color: var(--crm-text-primary);
}

.coming-soon-widget__message {
  font-size: var(--crm-text-sm);
  color: var(--crm-text-muted);
  max-width: 240px;
  line-height: 1.5;
}

.coming-soon-widget__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--crm-accent-dim);
  border: 1px solid var(--crm-accent-border);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-xs);
  font-weight: 600;
  color: var(--crm-accent);
  margin-top: 8px;
}
</style>