<!-- app/components/pages/cabinet/ui/layout/PageTitle.vue -->
<template>
  <div class="page-title">
    <div class="page-title__left">
      <!-- Иконка (опционально) -->
      <div v-if="icon" class="page-title__icon">
        <Icon :name="icon" size="18" />
      </div>

      <!-- Блок заголовка и подзаголовка -->
      <div class="page-title__text">
        <h1 class="page-title__heading">
          <slot>{{ title }}</slot>
        </h1>

        <!-- Подзаголовок (слот или пропс) -->
        <div v-if="$slots.subtitle || subtitle" class="page-title__subtitle">
          <slot name="subtitle">{{ subtitle }}</slot>
        </div>
      </div>

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
defineProps<{
  title?: string
  subtitle?: string
  icon?: string
  badge?: string | number
}>()
</script>

<style lang="scss" scoped>
.page-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 24px;
  min-height: 52px;
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
    flex: 1;
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

  &__text {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
    flex-wrap: wrap;

    @media (max-width: 500px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
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

  &__subtitle {
    display: flex;
    align-items: center;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
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