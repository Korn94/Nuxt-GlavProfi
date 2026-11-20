<!-- app/components/pages/Cabinet/More/index.vue -->
<!-- Страница «Дополнительно» (/cabinet/more): служебные ссылки, которые
     раньше занимали место в боковом меню. Состав и видимость ссылок —
     в app/composables/useExtraLinks.ts (КП подхватываются автоматически). -->
<template>
  <div class="more-page">
    <PagesCabinetUiLayoutPageTitle
      title="Дополнительно"
      icon="mdi:dots-grid"
      subtitle="Служебные разделы и документы"
    />

    <div class="more-page__content">
      <!-- Пустое состояние: ни одна ссылка недоступна -->
      <div v-if="!groups.length" class="more-empty">
        <Icon name="mdi:lock-outline" size="28" />
        <p>Нет доступных разделов</p>
      </div>

      <section v-for="group in groups" :key="group.id" class="more-section">
        <header class="more-section__head">
          <Icon :name="group.icon" size="15" class="more-section__icon" />
          <h2 class="more-section__title">{{ group.title }}</h2>
          <span class="more-section__count">{{ group.links.length }}</span>
        </header>

        <ul class="more-list">
          <li v-for="link in group.links" :key="link.id" class="more-list__item">
            <NuxtLink
              :to="link.path"
              :target="link.target"
              :rel="link.target === '_blank' ? 'noopener noreferrer' : undefined"
              class="more-row"
            >
              <span class="more-row__icon">
                <Icon :name="link.icon" size="18" />
              </span>

              <span class="more-row__text">
                <span class="more-row__title">{{ link.title }}</span>
                <span v-if="link.description" class="more-row__desc">{{ link.description }}</span>
              </span>

              <Icon
                :name="link.target === '_blank' ? 'mdi:open-in-new' : 'mdi:chevron-right'"
                size="16"
                class="more-row__arrow"
              />
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useExtraLinks } from '~/composables/useExtraLinks'

// Состав групп и видимость ссылок — в app/composables/useExtraLinks.ts
const { groups } = useExtraLinks()
</script>

<style lang="scss" scoped>
.more-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  &__content {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

// ── Группа ссылок ────────────────────────────────────────────────────
.more-section {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 0 2px;
  }

  &__icon {
    color: var(--crm-text-muted);
    flex-shrink: 0;
    align-self: center;
  }

  &__title {
    margin: 0;
    font-size: var(--crm-text-base);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__count {
    font-size: var(--crm-text-xs);
    font-weight: 500;
    color: var(--crm-text-muted);
  }
}

// ── Список строк ─────────────────────────────────────────────────────
.more-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;

  &__item + &__item {
    border-top: 1px solid var(--crm-border);
  }
}

.more-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  min-height: 54px;
  color: var(--crm-text-primary);
  text-decoration: none;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-elevated);

    .more-row__arrow {
      color: var(--crm-accent);
      transform: translateX(2px);
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    border-radius: var(--crm-radius-md);
    color: var(--crm-accent);
    transition: var(--crm-transition);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: var(--crm-text-md);
    font-weight: 500;
    line-height: 1.3;
    color: var(--crm-text-primary);
  }

  &__desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2; // стандартное свойство для не-WebKit браузеров
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: var(--crm-text-xs);
    line-height: 1.4;
    color: var(--crm-text-secondary);
  }

  &__arrow {
    flex-shrink: 0;
    color: var(--crm-text-muted);
    transition: var(--crm-transition);
  }
}

// ── Пустое состояние ─────────────────────────────────────────────────
.more-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 20px;
  background: var(--crm-bg-surface);
  border: 1px dashed var(--crm-border-hover);
  border-radius: var(--crm-radius-lg);
  color: var(--crm-text-muted);

  p {
    margin: 0;
    font-size: var(--crm-text-sm);
  }
}

// ── Адаптив ──────────────────────────────────────────────────────────
@media (max-width: 767.98px) {
  .more-page__content {
    padding: 16px;
    gap: 16px;
  }

  .more-row {
    gap: 10px;
    padding: 10px 12px;
  }
}
</style>
