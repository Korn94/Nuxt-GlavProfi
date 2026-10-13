<!-- app/components/ui/AccessDeniedBlock/index.vue -->
<template>
  <div class="access-denied">
    <div class="access-denied__icon">
      <Icon name="mdi:lock-outline" size="64" />
    </div>
    <h2 class="access-denied__title">Доступ запрещён</h2>
    <p class="access-denied__message">
      У вас нет прав для просмотра этого раздела.<br>
      Обратитесь к администратору для получения доступа.
    </p>
    <NuxtLink to="/cabinet" class="access-denied__back">
      <Icon name="mdi:arrow-left" />
      Вернуться на главную
    </NuxtLink>
  </div>
</template>

<style lang="scss" scoped>
.access-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 40px 20px;

  &__icon {
    color: var(--crm-text-muted);
    margin-bottom: 24px;
  }

  &__title {
    font-size: 24px;
    font-weight: 600;
    color: var(--crm-text-primary);
    margin: 0 0 12px;
  }

  &__message {
    font-size: 16px;
    color: var(--crm-text-secondary);
    margin: 0 0 32px;
    line-height: 1.6;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: var(--crm-accent);
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: var(--crm-transition);

    &:hover {
      background: var(--crm-accent-hover);
    }
  }
}
</style>