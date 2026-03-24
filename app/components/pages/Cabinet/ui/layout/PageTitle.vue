<!-- app/components/layout/PageTitle.vue -->
<template>
  <div class="page-title">
    <div class="page-title__left">
      <!-- Иконка (опционально) -->
      <div v-if="icon" class="page-title__icon">
        <Icon :name="icon" size="18" />
      </div>

      <!-- Заголовок -->
      <h1 class="page-title__heading">
        <slot>{{ title }}</slot>
      </h1>

      <!-- Бейдж (опционально, например счётчик) -->
      <span v-if="badge !== undefined" class="page-title__badge">{{ badge }}</span>
    </div>

    <!-- Правая часть — слот для кнопок/действий -->
    <div v-if="$slots.actions" class="page-title__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps < {
  title?: string
  icon?: string
  badge?: string | number
} > ()
</script>

<style lang="scss" scoped>
.page-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 24px;
  height: 52px;
  background: var(--crm-bg-surface);
  border-bottom: 1px solid var(--crm-border);
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__icon {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    border-radius: var(--crm-radius-md);
    color: var(--crm-accent);
    flex-shrink: 0;
  }

  &__heading {
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px 7px;
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border-hover);
    border-radius: 10px;
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
    flex-shrink: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
}

// На мобиле учитываем высоту мобильной шапки
@media (max-width: 767.98px) {
  .page-title {
    top: 52px;
    padding: 0 16px;
  }
}
</style>