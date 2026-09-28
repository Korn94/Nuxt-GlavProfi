<!-- app/components/public/remont-pomescheniy/index/blocks/PremisesGrid.vue -->
<template>
  <section class="premises-grid">
    <!-- Декоративная сетка на фоне -->
    <div class="premises-grid__grid-pattern" aria-hidden="true"></div>
    <div class="premises-grid__glow premises-grid__glow--top" aria-hidden="true"></div>
    <div class="premises-grid__glow premises-grid__glow--bottom" aria-hidden="true"></div>

    <div class="container">
      <!-- Хедер секции -->
      <div class="premises-grid__header">
        <div class="premises-grid__header-left">
          <div class="premises-grid__badge">
            <Icon name="mdi:office-building-outline" size="14" />
            <span>Типы объектов</span>
          </div>

          <h2 class="premises-grid__title">
            Основные типы <span class="accent">помещений</span>
          </h2>
        </div>

        <p class="premises-grid__subtitle">
          С которыми мы работаем: от коммерческих и производственных
          до медицинских и МОПов. Нажмите на карточку, чтобы открыть услугу.
        </p>
      </div>

      <!-- Панель управления -->
      <div class="premises-grid__controls">
        <div class="premises-grid__tabs-wrapper">
          <div class="premises-grid__tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :class="['premises-grid__tab', { active: activeTab === tab.key }]"
              @click="setTab(tab.key)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <button
          class="premises-grid__view-toggle"
          @click="toggleView"
          :title="viewMode === 'list' ? 'Показать сеткой' : 'Показать списком'"
        >
          <Icon v-if="viewMode === 'list'" name="mdi:format-list-bulleted" size="16" />
          <Icon v-else name="mdi:view-grid-outline" size="16" />
          <span class="premises-grid__view-toggle-text">
            {{ viewMode === 'list' ? 'Список' : 'Сетка' }}
          </span>
        </button>
      </div>

      <!-- Группировка по категориям -->
      <template v-for="catKey in categoryOrder" :key="catKey">
        <div v-if="groupedItems[catKey]?.length" class="premises-grid__category">
          <h3 v-if="activeTab === 'all'" class="premises-grid__cat-title">
            {{ categoryLabels[catKey] }}
          </h3>

          <!-- ==================== РЕЖИМ СПИСКА ==================== -->
          <div v-if="viewMode === 'list'" class="premises-list">
            <template v-for="item in groupedItems[catKey]" :key="item.slug">
              <!-- Готовая карточка = NuxtLink -->
              <NuxtLink
                v-if="item.isReady"
                :to="getPageLink(item.slug)"
                :class="['premise-row', 'premise-row--clickable', {
                  'item-visible': animatedSlugs.has(item.slug),
                }]"
              >
                <div class="premise-row__content">
                  <h3 class="premise-row__title">{{ item.title }}</h3>
                  <p v-if="item.subtitle" class="premise-row__subtitle">{{ item.subtitle }}</p>
                  <p class="premise-row__desc">{{ item.description }}</p>
                </div>

                <div class="premise-row__sidebar">
                  <div class="premise-row__prices">
                    <span class="premise-row__price-main">{{ item.price }}</span>
                    <span v-if="item.priceExample" class="premise-row__price-example">{{ item.priceExample }}</span>
                  </div>
                  <span class="premise-row__link">Подробнее →</span>
                </div>

                <div class="premise-row__image">
                  <img :src="item.image" :alt="item.title" loading="lazy" class="premise-row__img">
                </div>

                <span class="premise-row__corner" aria-hidden="true"></span>
              </NuxtLink>

              <!-- Неготовая карточка = div -->
              <div
                v-else
                :class="['premise-row', 'premise-row--disabled', {
                  'item-visible': animatedSlugs.has(item.slug),
                }]"
              >
                <div class="premise-row__content">
                  <h3 class="premise-row__title">{{ item.title }}</h3>
                  <p v-if="item.subtitle" class="premise-row__subtitle">{{ item.subtitle }}</p>
                  <p class="premise-row__desc">{{ item.description }}</p>
                </div>

                <div class="premise-row__sidebar">
                  <div class="premise-row__prices">
                    <span class="premise-row__price-main">{{ item.price }}</span>
                    <span v-if="item.priceExample" class="premise-row__price-example">{{ item.priceExample }}</span>
                  </div>
                  <span class="premise-row__link premise-row__link--disabled">
                    <Icon name="mdi:link-off" size="13" />
                    Страница в разработке
                  </span>
                </div>

                <div class="premise-row__image">
                  <img :src="item.image" :alt="item.title" loading="lazy" class="premise-row__img">
                </div>
              </div>
            </template>
          </div>

          <!-- ==================== РЕЖИМ СЕТКИ ==================== -->
          <div v-else class="premises-grid__list--grid">
            <template v-for="item in groupedItems[catKey]" :key="item.slug">
              <!-- Готовая карточка = NuxtLink -->
              <NuxtLink
                v-if="item.isReady"
                :to="getPageLink(item.slug)"
                :class="['premise-card', 'premise-card--clickable', {
                  'item-visible': animatedSlugs.has(item.slug),
                }]"
              >
                <div class="premise-card__image">
                  <img :src="item.image" :alt="item.title" loading="lazy" class="premise-card__img">
                  <div class="premise-card__overlay">
                    <h3 class="premise-card__title">{{ item.title }}</h3>
                    <p v-if="item.subtitle" class="premise-card__subtitle">{{ item.subtitle }}</p>
                  </div>
                  <span class="premise-card__corner" aria-hidden="true"></span>
                </div>

                <div class="premise-card__body">
                  <p class="premise-card__desc">{{ item.description }}</p>

                  <div class="premise-card__footer">
                    <div class="premise-card__prices">
                      <span class="premise-card__price-main">{{ item.price }}</span>
                      <span v-if="item.priceExample" class="premise-card__price-example">{{ item.priceExample }}</span>
                    </div>
                    <span class="premise-card__link">Подробнее →</span>
                  </div>
                </div>
              </NuxtLink>

              <!-- Неготовая карточка = div -->
              <div
                v-else
                :class="['premise-card', 'premise-card--disabled', {
                  'item-visible': animatedSlugs.has(item.slug),
                }]"
              >
                <div class="premise-card__image">
                  <img :src="item.image" :alt="item.title" loading="lazy" class="premise-card__img">
                  <div class="premise-card__overlay">
                    <h3 class="premise-card__title">{{ item.title }}</h3>
                    <p v-if="item.subtitle" class="premise-card__subtitle">{{ item.subtitle }}</p>
                  </div>
                </div>

                <div class="premise-card__body">
                  <p class="premise-card__desc">{{ item.description }}</p>

                  <div class="premise-card__footer">
                    <div class="premise-card__prices">
                      <span class="premise-card__price-main">{{ item.price }}</span>
                      <span v-if="item.priceExample" class="premise-card__price-example">{{ item.priceExample }}</span>
                    </div>
                    <span class="premise-card__link premise-card__link--disabled">
                      <Icon name="mdi:link-off" size="13" />
                      В разработке
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <hr v-if="!isLastCategory(catKey)" class="premises-grid__divider">
        </div>
      </template>

      <!-- Кнопка "Показать ещё" -->
      <div v-if="canShowMore" class="premises-grid__footer">
        <UiButtonsPrimary text="Показать ещё" variant="outline" @click="showAllItems" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGridControls } from '../../composables/useGridControls'

const sectionRef = ref(null)

const premisesTabs = [
  { key: 'all', label: 'Все' },
  { key: 'commercial', label: 'Коммерческие' },
  { key: 'industrial', label: 'Производственные' },
  { key: 'other', label: 'Прочие' }
]

const categoryOrder = ['commercial', 'industrial', 'other']
const categoryLabels: Record<string, string> = {
  commercial: 'Коммерческие помещения',
  industrial: 'Производственные помещения',
  other: 'Прочие объекты'
}

const getPageLink = (slug: string) => `/remont-pomescheniy/${slug}`

const premises = [
  { slug: 'banki', title: 'Банки', subtitle: 'отделения, операционные залы, хранилища', category: 'commercial', price: 'от 14 000 ₽ за м²', priceExample: 'за 100 м² ~1.4–2.0 млн ₽', description: 'Работаем с учетом требований безопасности: усиленные перегородки, кабель-каналы под охранно-пожарную сигнализацию, зоны для инкассации. Выполняем монтаж по спец. ТЗ, соблюдаем режим конфиденциальности на объекте.', image: 'main/remont-pomescheniy/banki.webp', isReady: true },
  { slug: 'magaziny', title: 'Магазины', subtitle: 'ТЦ, стрит-ритейл, бутики', category: 'commercial', price: 'от 13 000 ₽ за м²', priceExample: 'за 100 м² ~1.3–1.9 млн ₽', description: 'Монтируем витринные группы, торговое оборудование, напольные покрытия по вашей спецификации. Работаем в график ТЦ (ночные смены) или в свободном режиме для отдельно стоящих зданий. Сдаем объект готовым к выкладке товара.', image: 'main/remont-pomescheniy/magaziny.webp', isReady: true },
  { slug: 'ofisy', title: 'Офисы', subtitle: 'административные здания, кол-центры', category: 'commercial', price: 'от 11 000 ₽ за м²', priceExample: 'за 100 м² ~1.1–1.6 млн ₽', description: 'Выполняем отделку по вашему ТЗ или проекту. Перед стартом проверяем основание и коммуникации: если проект конфликтует с реальным объектом — сообщаем до начала работ. Собственные бригады: ГКЛ, маляры, электрики.', image: 'main/remont-pomescheniy/ofisy.webp', isReady: true },
  { slug: 'salony', title: 'Салоны красоты', subtitle: 'барбершопы, СПА', category: 'commercial', price: 'от 15 000 ₽ за м²', priceExample: 'за 100 м² ~1.5–2.2 млн ₽', description: 'Реализуем проект с «мокрыми» зонами: гидроизоляция, закладные под оборудование. Проверяем вводные мощности и сечение кабелей до начала чистовой отделки.', image: 'main/remont-pomescheniy/salony.webp', isReady: true },
  { slug: 'fitness', title: 'Фитнес-клубы', subtitle: 'спортивные залы', category: 'commercial', price: 'от 14 000 ₽ за м²', priceExample: 'за 100 м² ~1.4–2.0 млн ₽', description: 'Монтаж ударопрочных покрытий, зеркальных стен, душевых с трапами — строго по проекту. Проверяем основание под спортивные полы, герметичность мокрых зон.', image: 'main/remont-pomescheniy/fitnes.webp', isReady: true },
  { slug: 'sklady', title: 'Склады', subtitle: 'логистические центры, места хранения', category: 'industrial', price: 'от 8 500 ₽ за м²', priceExample: 'за 100 м² ~0.9–1.3 млн ₽', description: 'Устройство промышленных полов (топпинг, наливные) по вашей технологии. Проверяем геометрию основания, усадку бетона перед началом работ. Монтируем пандусы, разметку, освещение по проекту.', image: 'main/remont-pomescheniy/sklady.webp', isReady: true },
  { slug: 'proizvodstvo', title: 'Производство', subtitle: 'цеха, заводы', category: 'industrial', price: 'от 12 000 ₽ за м²', priceExample: 'за 100 м² ~1.2–2.5 млн ₽', description: 'Работаем по тех. заданию инженеров: усиленные коммуникации, спец. покрытия, безопасные зоны. Проверяем допуски под оборудование, соответствие монтажа нормам охраны труда.', image: 'main/remont-pomescheniy/ceha.webp', isReady: true },
  { slug: 'angary', title: 'Ангары', subtitle: 'модульные здания', category: 'industrial', price: 'от 9 000 ₽ за м²', priceExample: 'за 100 м² ~0.9–1.4 млн ₽', description: 'Внутренняя отделка по проекту: утепление, обшивка, ввод коммуникаций. Проверяем герметичность контура, мостики холода до начала чистовых работ. Работаем с сэндвич-панелями, профлистом.', image: 'main/remont-pomescheniy/angary.webp', isReady: true },
  { slug: 'pischevye', title: 'Пищевые производства', subtitle: '', category: 'industrial', price: 'от 16 000 ₽ за м²', priceExample: 'за 100 м² ~1.6–2.4 млн ₽', description: 'Монтаж по СанПиН: плитка, стоки, бесшовные покрытия — по вашей спецификации. Проверяем уклоны полов, герметичность стыков до сдачи. Работаем с пищевыми материалами (нержавейка, спец. смеси).', image: 'main/remont-pomescheniy/pischevye.webp', isReady: false },
  { slug: 'kliniki', title: 'Медицинские помещения', subtitle: 'клиники, стоматологии, аптеки, лаборатории', category: 'other', price: 'от 18 000 ₽ за м²', priceExample: 'за 100 м² ~0.8–1.5 млн ₽', description: 'Отделка по проекту или ТЗ: бесшовные покрытия, стены под дезинфекцию, специфические материалы. Проверяем основание под спец. полы, герметичность мокрых зон. Работаем с медицинскими материалами (линолеум, нержавейка, спец. смеси и прочие).', image: 'main/remont-pomescheniy/medicina.webp', isReady: true },
  { slug: 'mopy', title: 'МОПы', subtitle: 'подъезды, холлы ЖК', category: 'other', price: 'от 4 500 ₽ за м²', priceExample: 'за 100 м² ~0.5–0.8 млн ₽', description: 'Ремонт по регламенту УК: антивандальные материалы, износостойкая покраска. Работаем в график, не создаем шум в часы покоя.', image: 'main/remont-pomescheniy/mopy.webp', isReady: true },
  { slug: 'fasady', title: 'Фасады зданий', subtitle: '', category: 'other', price: 'от 3 500 ₽ за м²', priceExample: 'за 100 м² ~0.4–0.7 млн ₽', description: 'Монтаж фасадов: утепление, облицовка, герметизация. Проверяем основание, крепеж, точку росы до начала работ. Работаем на высоте с допуском, соблюдаем ГОСТ по теплоизоляции.', image: 'main/remont-pomescheniy/fasady.webp', isReady: true }
]

const {
  activeTab,
  viewMode,
  showAll,
  animatedSlugs,
  filteredItems,
  visibleItems,
  canShowMore,
  setTab,
  toggleView,
  showAllItems,
  tabs
} = useGridControls(() => premises, premisesTabs)

const groupedItems = computed(() => {
  const groups: Record<string, any[]> = {
    commercial: [],
    industrial: [],
    other: []
  }
  visibleItems.value.forEach(item => {
    if (groups[item.category]) {
      groups[item.category].push(item)
    }
  })
  return groups
})

const isLastCategory = (key: string) => key === categoryOrder[categoryOrder.length - 1]
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.premises-grid {
  @include section-padding;
  background: $background-dark;
  color: $text-light;
  position: relative;
  overflow: hidden;

  // === Фоновая «сетка» из тонких линий ===
  &__grid-pattern {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse at 50% 40%, #000 20%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse at 50% 40%, #000 20%, transparent 75%);
  }

  // === Свечения ===
  // === Свечения ===
  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
    z-index: 0;

    &--top {
      top: -180px;
      right: -140px;
      width: 560px;
      height: 560px;
      background: radial-gradient(circle, rgba(0, 195, 245, 0.16), transparent 70%);
    }

    &--bottom {
      bottom: -200px;
      left: -160px;
      width: 480px;
      height: 480px;
      background: radial-gradient(circle, rgba(2, 254, 255, 0.1), transparent 70%);
    }
  }

  .container {
    @include section-container;
    position: relative;
    z-index: 1;
  }

  // ========================================
  // ХЕДЕР СЕКЦИИ
  // ========================================
  &__header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: end;
    gap: 3rem;
    margin-bottom: 3rem;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      gap: 1.2rem;
      margin-bottom: 2.2rem;
    }
  }

  &__header-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.9rem;
    background: rgba(0, 195, 245, 0.08);
    border: 1px solid rgba(0, 195, 245, 0.25);
    border-radius: 100px;
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $blue-light;

    :deep(svg) {
      color: $blue;
    }
  }

  &__title {
    @include section-title;
    color: $text-light;
    margin: 0;

    &::after {
      box-shadow: 0 0 14px $blue50;
    }

    .accent {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }
  }

  &__subtitle {
    @include section-subtitle;
    color: rgba($text-light, 0.7);
    margin: 0 0 0.4rem;
    max-width: 100%;

    @media (max-width: 900px) {
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      font-size: 0.98rem;
    }
  }

  // ========================================
  // ПАНЕЛЬ УПРАВЛЕНИЯ
  // ========================================
  &__controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
  }

  &__tabs-wrapper {
    flex: 1;
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar { display: none; }
  }

  &__tabs {
    display: flex;
    gap: 0.6rem;
    min-width: max-content;
  }

  &__tab {
    background: transparent;
    border: 1px solid rgba($text-light, 0.2);
    color: rgba($text-light, 0.7);
    padding: 0.6rem 1.4rem;
    border-radius: var(--border-radius, 6px);
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    &:hover {
      border-color: $blue;
      color: $blue-light;
    }

    &.active {
      background: $blue-gradient;
      border-color: transparent;
      color: $background-dark;
      font-weight: 600;
    }
  }

  &__view-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: 1px solid rgba($text-light, 0.2);
    color: $text-light;
    padding: 0.6rem 1.4rem;
    border-radius: var(--border-radius, 6px);
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    &:hover {
      background: rgba(0, 195, 245, 0.1);
      border-color: $blue;
      color: $blue-light;
    }

    &-text {
      @media (max-width: 480px) { display: none; }
    }
  }

  // ========================================
  // КАТЕГОРИИ
  // ========================================
  &__category {
    margin-bottom: 3rem;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  &__cat-title {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.35rem;
    font-weight: 600;
    color: $text-light;
    margin: 0 0 1.5rem;

    &::before {
      content: '';
      width: 4px;
      height: 22px;
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px $blue50;
    }
  }

  // ========================================
  // СЕТКА
  // ========================================
  &__list--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  &__divider {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
    margin: 3rem 0 0;
  }

  &__footer {
    display: flex;
    justify-content: center;
    padding-top: 2.5rem;
  }
}

// ========================================
// РЕЖИМ СПИСКА: ROW-КАРТОЧКА
// ========================================
.premises-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.premise-row {
  position: relative;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  isolation: isolate;

  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.045) 0%,
    rgba(255, 255, 255, 0.015) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  opacity: 0;
  transform: translateY(20px);

  &.item-visible {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(
      circle at 0% 0%,
      rgba(0, 195, 245, 0.12),
      transparent 60%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  &--clickable {
    cursor: pointer;

    &:hover {
      border-color: rgba(0, 195, 245, 0.4);
      box-shadow:
        0 20px 40px -15px rgba(0, 0, 0, 0.55),
        0 0 0 1px rgba(0, 195, 245, 0.15) inset;

      &::before { opacity: 1; }

      .premise-row__img {
        transform: scale(1.06);
      }

      .premise-row__link {
        color: $blue-light;
      }

      .premise-row__corner {
        opacity: 1;
        transform: scale(1);
      }
    }
  }

  &--disabled {
    opacity: 0.55;
    cursor: default;

    &.item-visible {
      opacity: 0.55;
    }

    .premise-row__img {
      filter: grayscale(0.35);
    }
  }

  // === Контент ===
  &__content {
    flex: 1;
    min-width: 0;
    padding: 1.75rem 1rem 1.75rem 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    @media (max-width: 900px) {
      padding: 1.5rem;
    }
  }

  &__title {
    font-size: 1.2rem;
    font-weight: 600;
    color: $text-light;
    margin: 0;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  &__subtitle {
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $blue;
    margin: 0;
  }

  &__desc {
    font-size: 0.92rem;
    line-height: 1.6;
    color: rgba($text-light, 0.68);
    margin: 0.6rem 0 0;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  // === Сайдбар ===
  &__sidebar {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 1rem;
    flex-shrink: 0;
    min-width: 210px;
    padding: 1.75rem 1.25rem 1.75rem 0;

    @media (max-width: 900px) {
      align-items: flex-start;
      width: 100%;
      min-width: auto;
      flex-direction: row;
      justify-content: space-between;
      padding: 0 1.5rem 1.25rem;
    }

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      padding: 0 1.5rem 1.25rem;
    }
  }

  &__prices {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__price-main {
    font-size: 1.2rem;
    font-weight: 700;
    color: $blue-light;
    line-height: 1.2;
  }

  &__price-example {
    font-size: 0.8rem;
    color: rgba($text-light, 0.5);
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: $blue;
    font-weight: 500;
    font-size: 0.92rem;
    white-space: nowrap;
    transition: color 0.3s ease;

    &--disabled {
      color: rgba($text-light, 0.4);
      font-weight: 400;

      .premise-row--clickable:hover & {
        color: rgba($text-light, 0.4);
      }
    }
  }

  // === Изображение ===
  &__image {
    flex-shrink: 0;
    width: 240px;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.2);

    @media (max-width: 900px) {
      width: 100%;
      aspect-ratio: 21 / 9;
      order: 3;
    }

    @media (max-width: 768px) {
      aspect-ratio: 16 / 9;
    }
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s ease;
  }

  // === Угловой акцент ===
  &__corner {
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 60px;
    opacity: 0;
    transform: scale(0.6);
    transition: all 0.4s ease;
    pointer-events: none;
    background: linear-gradient(
      225deg,
      rgba(0, 195, 245, 0.55) 0%,
      transparent 60%
    );
    border-top-right-radius: 16px;
    mask-image: linear-gradient(225deg, #000 0%, transparent 70%);
    -webkit-mask-image: linear-gradient(225deg, #000 0%, transparent 70%);
    z-index: 1;
  }
}

// ========================================
// РЕЖИМ СЕТКИ: CARD-КАРТОЧКА
// ========================================
.premise-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  isolation: isolate;

  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.045) 0%,
    rgba(255, 255, 255, 0.015) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  opacity: 0;
  transform: translateY(20px);

  &.item-visible {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(
      circle at 50% 0%,
      rgba(0, 195, 245, 0.14),
      transparent 60%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  &--clickable {
    cursor: pointer;

    &:hover {
      transform: translateY(-6px);
      border-color: rgba(0, 195, 245, 0.4);
      box-shadow:
        0 20px 40px -15px rgba(0, 0, 0, 0.55),
        0 0 0 1px rgba(0, 195, 245, 0.15) inset;

      &::before { opacity: 1; }

      .premise-card__img {
        transform: scale(1.06);
      }

      .premise-card__link {
        color: $blue-light;
      }

      .premise-card__corner {
        opacity: 1;
        transform: scale(1);
      }
    }
  }

  &--disabled {
    opacity: 0.55;
    cursor: default;

    &.item-visible {
      opacity: 0.55;
    }

    .premise-card__img {
      filter: grayscale(0.35);
    }
  }

  // === Изображение ===
  &__image {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.2);
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  &__overlay {
    position: absolute;
    inset: auto 0 0 0;
    padding: 1.1rem 1.25rem;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.78) 0%,
      rgba(0, 0, 0, 0.35) 60%,
      transparent 100%
    );
    z-index: 1;
  }

  &__title {
    font-size: 1.15rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 0.2rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  &__subtitle {
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }

  // === Тело ===
  &__body {
    padding: 1.25rem 1.35rem 1.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    flex: 1;
  }

  &__desc {
    font-size: 0.9rem;
    line-height: 1.55;
    color: rgba($text-light, 0.68);
    margin: 0;
    flex: 1;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    padding-top: 0.9rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    flex-wrap: wrap;
  }

  &__prices {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  &__price-main {
    font-size: 1.1rem;
    font-weight: 700;
    color: $blue-light;
    line-height: 1.2;
  }

  &__price-example {
    font-size: 0.78rem;
    color: rgba($text-light, 0.5);
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: $blue;
    font-weight: 500;
    font-size: 0.9rem;
    white-space: nowrap;
    transition: color 0.3s ease;

    &--disabled {
      color: rgba($text-light, 0.4);
      font-weight: 400;

      .premise-card--clickable:hover & {
        color: rgba($text-light, 0.4);
      }
    }
  }

  // === Угловой акцент ===
  &__corner {
    position: absolute;
    top: 0;
    right: 0;
    width: 70px;
    height: 70px;
    opacity: 0;
    transform: scale(0.6);
    transition: all 0.4s ease;
    pointer-events: none;
    background: linear-gradient(
      225deg,
      rgba(0, 195, 245, 0.55) 0%,
      transparent 60%
    );
    border-top-right-radius: 16px;
    mask-image: linear-gradient(225deg, #000 0%, transparent 70%);
    -webkit-mask-image: linear-gradient(225deg, #000 0%, transparent 70%);
    z-index: 2;
  }
}

// ========================================
// АДАПТИВ
// ========================================
@media (max-width: 768px) {
  .premises-grid {
    padding-top: 4rem;
    padding-bottom: 4rem;

    &__glow {
      &--top { width: 360px; height: 360px; }
      &--bottom { width: 320px; height: 320px; }
    }

    &__controls {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    &__view-toggle {
      justify-content: center;
    }

    &__cat-title {
      font-size: 1.15rem;
    }
  }

  .premise-row {
    flex-direction: column;

    &__content {
      padding: 1.4rem;
    }

    &__sidebar {
      padding: 0 1.4rem 1.25rem;
    }
  }

  .premise-card {
    &__body {
      padding: 1.1rem 1.2rem 1.2rem;
    }
  }
}
</style>