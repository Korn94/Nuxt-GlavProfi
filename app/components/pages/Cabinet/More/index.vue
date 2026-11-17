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
      :badge="totalLinks"
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
            <NuxtLink :to="link.path" :target="link.target" class="more-link">
              <span class="more-link__icon">
                <Icon :name="link.icon" size="18" />
              </span>

              <span class="more-link__body">
                <span class="more-link__title">{{ link.title }}</span>
                <span v-if="link.description" class="more-link__desc">{{ link.description }}</span>
                <span class="more-link__path">{{ link.path }}</span>
              </span>

              <Icon
                :name="link.target === '_blank' ? 'mdi:open-in-new' : 'mdi:chevron-right'"
                size="16"
                class="more-link__arrow"
              />
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useExtraLinks } from '~/composables/useExtraLinks'

const { groups } = useExtraLinks()

/** Общее число доступных ссылок — бейдж в шапке страницы */
const totalLinks = computed(() =>
  groups.value.reduce((sum, group) => sum + group.links.length, 0)
)
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
    gap: 22px;
  }
}

// ── Группа ссылок ────────────────────────────────────────────────────
.more-section {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__icon {
    color: var(--crm-text-muted);
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: var(--crm-text-base);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    padding: 1px 6px;
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border-hover);
    border-radius: 10px;
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
  }
}

// ── Сетка карточек ───────────────────────────────────────────────────
.more-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;

  &__item {
    display: flex;
  }
}

.more-link {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  color: var(--crm-text-primary);
  text-decoration: none;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-accent-border);

    .more-link__arrow {
      color: var(--crm-accent);
      transform: translateX(2px);
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    border-radius: var(--crm-radius-md);
    color: var(--crm-accent);
    transition: var(--crm-transition);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: var(--crm-text-md);
    font-weight: 500;
    line-height: 1.35;
    color: var(--crm-text-primary);
  }

  &__desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2; // Добавлено стандартное свойство
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: var(--crm-text-xs);
    line-height: 1.45;
    color: var(--crm-text-secondary);
  }

  &__path {
    font-family: var(--crm-font-mono);
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__arrow {
    flex-shrink: 0;
    margin-top: 8px;
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
    gap: 18px;
  }

  .more-list {
    grid-template-columns: 1fr;
  }
}
</style>
