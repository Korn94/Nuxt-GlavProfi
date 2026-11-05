<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/WorkTypesLinks.vue -->
<template>
  <section v-if="items.length" id="works" class="work-types-links">
    <RelatedWorkTypes
      :title="section.title"
      :subtitle="section.subtitle"
      :items="items"
      :price-data="sections"
      theme="dark"
    >
      <template #footer>
        <div class="work-types-links__footer">
          <div class="work-types-links__note">
            <h3 class="work-types-links__note-title">
              <Icon name="mdi:format-list-checks" size="20" />
              Это не весь перечень работ
            </h3>
            <p class="work-types-links__note-text">
              Выше — только самые частые виды работ для этого типа помещения.
              Выполняем полный цикл: демонтаж, стяжку и выравнивание полов, монтаж
              потолков, покраску, электрику, сантехнику, вентиляцию и слаботочные
              системы.
            </p>
          </div>

          <div class="work-types-links__actions">
            <NuxtLink
              to="/remont-pomescheniy#works-grid"
              class="work-types-links__btn work-types-links__btn--primary"
            >
              Все виды работ
              <Icon name="mdi:arrow-right" size="18" />
            </NuxtLink>
            <NuxtLink
              to="/prices/otdelochnye-raboty"
              class="work-types-links__btn work-types-links__btn--ghost"
            >
              Прайс-лист
              <Icon name="mdi:file-document-outline" size="18" />
            </NuxtLink>
          </div>
        </div>
      </template>
    </RelatedWorkTypes>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RelatedWorkTypes from '../../workTypes/ui/RelatedWorkTypes.vue'
import { usePriceFetcher } from '~/composables/calculator/usePriceFetcher'
import { getWorkTypesForCategory, getWorkTypesSection } from '../data/workTypesByCategory'

const props = defineProps<{
  /** Slug типа помещения: 'banki', 'ofisy', 'sklady' … (см. PREMISES_WORK_TYPES) */
  category: string
}>()

const items = computed(() => getWorkTypesForCategory(props.category))

const section = computed(
  () =>
    getWorkTypesSection(props.category) ?? {
      title: 'Какие работы <span>выполняем</span>',
      subtitle: '',
    },
)

// Цены «от … ₽/м²» подтягиваются из прайс-листа по priceWorkId — так же,
// как на страницах видов работ (см. workTypes/ui/RelatedWorkTypes.vue).
const { sections } = usePriceFetcher()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

// Фон, отступы секции и сетку карточек даёт RelatedWorkTypes —
// здесь только подвал под карточками: пояснение + ссылки на каталог и прайс.
.work-types-links {
  &__footer {
    margin-top: 2rem;
    padding: 1.5rem 1.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.75rem;
    background: rgba(255, 255, 255, 0.035);
    border: 1px dashed rgba(255, 255, 255, 0.16);
    border-radius: 16px;

    @media (max-width: 900px) {
      flex-direction: column;
      align-items: stretch;
      gap: 1.25rem;
      padding: 1.25rem;
    }
  }

  &__note {
    max-width: 620px;
  }

  &__note-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.5rem;
    font-family: 'Rubik', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.3;
    color: $text-light;

    :deep(.icon) {
      color: $blue;
      flex-shrink: 0;
    }
  }

  &__note-text {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba($text-light, 0.7);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    flex-shrink: 0;

    @media (max-width: 480px) {
      flex-direction: column;
    }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.85rem 1.5rem;
    font-family: 'Rubik', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.2;
    border-radius: 12px;
    text-decoration: none;
    white-space: nowrap;
    transition: transform 0.25s ease, box-shadow 0.25s ease,
      border-color 0.25s ease, color 0.25s ease;

    :deep(.icon) {
      transition: transform 0.25s ease;
    }

    &--primary {
      background: $blue-gradient;
      color: $background-dark;
      box-shadow: 0 6px 20px rgba(0, 195, 245, 0.25);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 26px rgba(0, 195, 245, 0.4);
        color: $background-dark;

        :deep(.icon) {
          transform: translateX(3px);
        }
      }
    }

    &--ghost {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: $text-light;

      &:hover {
        transform: translateY(-2px);
        border-color: $blue;
        color: $blue-light;
      }
    }

    &:active {
      transform: translateY(0);
    }
  }
}
</style>
