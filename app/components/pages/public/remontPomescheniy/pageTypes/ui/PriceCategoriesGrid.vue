<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/PriceCategoriesGrid.vue -->
<template>
  <section v-if="isVisible" class="price-categories" :class="`price-categories--${theme}`">
    <div class="container">
      <header class="price-categories__header">
        <h2 class="price-categories__title" v-html="title" />
        <p v-if="subtitle" class="price-categories__subtitle">{{ subtitle }}</p>
      </header>

      <!-- Скелетон: пока список страниц прайса грузится на клиенте -->
      <div v-if="isLoading" class="price-categories__grid" aria-hidden="true">
        <div
          v-for="i in skeletonCount"
          :key="`price-skeleton-${i}`"
          class="price-category-card price-category-card--skeleton"
        >
          <span
            class="price-category-card__skeleton-line price-category-card__skeleton-line--icon"
          />
          <div class="price-category-card__skeleton-lines">
            <span
              class="price-category-card__skeleton-line price-category-card__skeleton-line--title"
            />
            <span
              class="price-category-card__skeleton-line price-category-card__skeleton-line--text"
            />
            <span
              class="price-category-card__skeleton-line price-category-card__skeleton-line--text-short"
            />
          </div>
        </div>
      </div>

      <!-- Деградация: если в БД всего одна страница прайса — один баннер с кнопкой -->
      <div v-else-if="singleItem" class="price-banner">
        <div class="price-banner__icon">
          <Icon :name="getPageIcon(singleItem.slug)" size="28" />
        </div>
        <div class="price-banner__content">
          <h3 class="price-banner__title">{{ singleItem.title }}</h3>
          <p class="price-banner__desc">{{ getDescription(singleItem) }}</p>
        </div>
        <NuxtLink :to="`/prices/${singleItem.slug}`" class="price-banner__btn">
          Смотреть цены
          <Icon name="mdi:arrow-right" size="18" />
        </NuxtLink>
      </div>

      <!-- Основной вариант: 2–4 карточки-ссылки на реальные страницы прайса -->
      <div v-else class="price-categories__grid">
        <NuxtLink
          v-for="item in visibleItems"
          :key="item.slug"
          :to="`/prices/${item.slug}`"
          class="price-category-card"
        >
          <span class="price-category-card__accent" aria-hidden="true" />
          <div class="price-category-card__icon">
            <Icon :name="getPageIcon(item.slug)" size="26" />
          </div>
          <div class="price-category-card__content">
            <h3 class="price-category-card__title">{{ item.title }}</h3>
            <p class="price-category-card__desc">{{ getDescription(item) }}</p>
          </div>
          <span class="price-category-card__action">
            Смотреть цены
            <Icon name="mdi:arrow-right" size="16" />
          </span>
        </NuxtLink>
      </div>

      <!-- Подвал: пояснение про фиксацию сметы + ссылка на полный прайс -->
      <div v-if="!isLoading" class="price-categories__footer">
        <p class="price-categories__note">
          <Icon name="mdi:file-check-outline" size="20" />
          <span>{{ footerNote }}</span>
        </p>
        <NuxtLink :to="fullPriceLink" class="price-categories__all">
          {{ fullPriceText }}
          <Icon name="mdi:file-document-outline" size="18" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** Страница прайса — ответ GET /api/price/pages (server/api/price/pages/index.get.ts) */
export interface PricePageItem {
  id?: number
  title: string
  slug: string
  metaTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string | null
}

const props = withDefaults(
  defineProps<{
    /** Заголовок секции: <span> внутри — градиентный акцент */
    title?: string
    subtitle?: string
    /** Тема оформления секции */
    theme?: 'dark' | 'light'
    /** Сколько карточек показывать (по задаче — 2–4) */
    limit?: number
    /** Готовый список страниц: если передан, сетевой запрос не выполняется */
    items?: PricePageItem[]
  }>(),
  {
    title: 'Прозрачный <span>прайс</span> без скрытых доплат',
    subtitle:
      'Фиксируем смету в договоре до начала работ: итог в акте совпадает с подписанным расчётом. Ниже — действующие прайсы по направлениям, чтобы любую позицию можно было сверить до старта.',
    theme: 'dark',
    limit: 3,
  },
)

/** Полный прайс — основная категория (сама страница отдаёт 200, /prices — 301 сюда же) */
const fullPriceLink = '/prices/otdelochnye-raboty'
const fullPriceText = 'Полный прайс-лист'
const footerNote =
  'Смета фиксируется в договоре: цена в акте совпадает с подписанным расчётом. Изменения — только через дополнительное соглашение.'

/**
 * Оформление карточек: иконки по slug. Это НЕ список страниц прайса —
 * источник данных только /api/price/pages; новая страница в БД появится
 * с иконкой по умолчанию без правок кода.
 */
const PAGE_ICONS: Record<string, string> = {
  'otdelochnye-raboty': 'mdi:format-paint',
  'plumbing': 'mdi:water-pump',
  'electricity': 'mdi:flash-outline',
}
const DEFAULT_PAGE_ICON = 'mdi:file-document-outline'

/**
 * Список страниц прайса берём из БД. Ключ 'price-pages' уже используется в
 * usePriceStores.ts, но на /prices/[category] этот блок не рендерится —
 * коллизий нет, данные только читаем (без мутаций).
 */
const { data: pagesData, pending, error } = useAsyncData<PricePageItem[]>(
  'price-pages',
  async () => {
    try {
      return await $fetch<PricePageItem[]>('/api/price/pages')
    } catch (err) {
      // Кратковременный сбой API не должен ронять страницу услуги — просто прячем блок
      console.error('[PriceCategoriesGrid] Не удалось загрузить страницы прайса:', err)
      return []
    }
  },
  {
    // Если родитель передал готовый список — запрос не нужен
    immediate: !props.items?.length,
    default: () => [],
  },
)

const loadedItems = computed<PricePageItem[]>(() => pagesData.value ?? [])
const sourceItems = computed<PricePageItem[]>(() => props.items ?? loadedItems.value)

/** Скелетон — только при собственной загрузке (не при items из props) */
const isLoading = computed(() => !props.items && pending.value)

/** Ошибка API и пустой список — секцию не рендерим вовсе (страница остаётся рабочей) */
const isVisible = computed(() => {
  if (props.items) return props.items.length > 0
  if (isLoading.value) return true
  if (error.value) return false
  return loadedItems.value.length > 0
})

const visibleItems = computed<PricePageItem[]>(() =>
  sourceItems.value.slice(0, Math.max(0, props.limit)),
)

/** Всего одна страница прайса в БД — блок деградирует в баннер с одной кнопкой */
const singleItem = computed<PricePageItem | null>(() =>
  visibleItems.value.length === 1 ? visibleItems.value[0] ?? null : null,
)

const skeletonCount = computed(() => Math.min(Math.max(props.limit, 2), 4))

/** Иконка карточки по slug страницы прайса */
const getPageIcon = (slug: string): string => PAGE_ICONS[slug] ?? DEFAULT_PAGE_ICON

/**
 * Короткое описание карточки: metaDescription из БД (редактируется в CRM),
 * нормализуем пробелы и обрезаем по границе слова.
 */
const getDescription = (item: PricePageItem): string => {
  const text = (item.metaDescription ?? '').replace(/\s+/g, ' ').trim()
  if (!text) {
    return 'Актуальные цены на работы с единицами измерения — без скрытых доплат и сюрпризов в смете.'
  }
  if (text.length <= 160) return text

  const cut = text.slice(0, 160)
  const lastSpace = cut.lastIndexOf(' ')
  const short = lastSpace > 80 ? cut.slice(0, lastSpace) : cut
  return `${short.trimEnd()}…`
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.price-categories {
  @include section-padding;
  position: relative;
  overflow: hidden;

  // ========================================
  // ТЕМА: DARK (по умолчанию)
  // ========================================
  &--dark {
    --pc-bg: #{$background-dark};
    --pc-text: #{$text-light};
    --pc-text-secondary: rgba(255, 255, 255, 0.72);
    --pc-card-bg: rgba(255, 255, 255, 0.035);
    --pc-card-border: rgba(255, 255, 255, 0.08);
    --pc-card-hover-bg: rgba(255, 255, 255, 0.055);
    --pc-card-hover-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
    --pc-card-desc: rgba(255, 255, 255, 0.68);
    --pc-icon-bg: rgba(0, 195, 245, 0.1);
    --pc-icon-border: rgba(0, 195, 245, 0.2);
    --pc-icon-color: #{$blue};
    --pc-note-bg: rgba(255, 255, 255, 0.035);
    --pc-note-border: rgba(255, 255, 255, 0.16);
    --pc-note-color: rgba(255, 255, 255, 0.7);
    --pc-skeleton: rgba(255, 255, 255, 0.06);
    --pc-skeleton-strong: rgba(255, 255, 255, 0.1);
    --pc-glow: rgba(0, 195, 245, 0.07);
  }

  // ========================================
  // ТЕМА: LIGHT
  // ========================================
  &--light {
    --pc-bg: #{$background-light};
    --pc-text: #{$text-dark};
    --pc-text-secondary: #{$text-gray};
    --pc-card-bg: #fff;
    --pc-card-border: #{$border-color};
    --pc-card-hover-bg: #fff;
    --pc-card-hover-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
    --pc-card-desc: #{$text-gray};
    --pc-icon-bg: rgba(0, 195, 245, 0.08);
    --pc-icon-border: rgba(0, 195, 245, 0.2);
    --pc-icon-color: #{$blue};
    --pc-note-bg: rgba(0, 195, 245, 0.04);
    --pc-note-border: rgba(0, 195, 245, 0.22);
    --pc-note-color: #{$text-gray};
    --pc-skeleton: rgba(0, 0, 0, 0.05);
    --pc-skeleton-strong: rgba(0, 0, 0, 0.08);
    --pc-glow: rgba(0, 195, 245, 0.05);
  }

  background: var(--pc-bg);
  color: var(--pc-text);

  // Декоративное свечение — как в RelatedWorkTypes / RelatedServicesGrid
  &::before {
    content: '';
    position: absolute;
    top: -10%;
    right: -5%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, var(--pc-glow) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    @include section-container;
  }

  // === Заголовок ===
  &__header {
    margin-bottom: 2.75rem;
    max-width: 760px;
  }

  &__title {
    @include section-title;
  }

  &__subtitle {
    @include section-subtitle;
    margin-bottom: 0;
    color: var(--pc-text-secondary);
  }

  // === Сетка карточек ===
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1.1rem;
    }
  }
}

// ========================================
// КАРТОЧКА СТРАНИЦЫ ПРАЙСА
// ========================================
.price-category-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.75rem 1.6rem;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: var(--pc-card-bg);
  border: 1px solid var(--pc-card-border);
  border-radius: 16px;
  transition:
    transform 0.35s ease,
    background 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.35s ease;

  // Верхняя градиентная полоска (акцент на hover)
  &__accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $blue-gradient;
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 2;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    flex-shrink: 0;
    border-radius: 12px;
    background: var(--pc-icon-bg);
    border: 1px solid var(--pc-icon-border);
    color: var(--pc-icon-color);
    transition:
      background 0.35s ease,
      border-color 0.35s ease,
      color 0.35s ease,
      box-shadow 0.35s ease;
  }

  &__content {
    flex: 1;
  }

  &__title {
    margin: 0 0 0.5rem;
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--pc-text);
    transition: color 0.25s ease;
  }

  &__desc {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    font-size: 0.92rem;
    line-height: 1.55;
    color: var(--pc-card-desc);
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding-top: 1rem;
    border-top: 1px solid var(--pc-card-border);
    font-family: 'Rubik', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: $blue-light;
    transition:
      gap 0.3s ease,
      color 0.25s ease;

    .price-categories--light & {
      color: $blue;
    }
  }

  &:hover {
    transform: translateY(-6px);
    background: var(--pc-card-hover-bg);
    border-color: rgba(0, 195, 245, 0.45);
    box-shadow: var(--pc-card-hover-shadow);

    .price-category-card__accent {
      transform: scaleX(1);
    }

    .price-category-card__icon {
      background: $blue-gradient;
      border-color: transparent;
      color: $background-dark;
      box-shadow: 0 0 24px rgba(0, 195, 245, 0.35);
    }

    .price-category-card__title {
      color: $blue-light;

      .price-categories--light & {
        color: $blue;
      }
    }

    .price-category-card__action {
      gap: 0.65rem;
    }
  }

  // === Скелетон загрузки ===
  &--skeleton {
    pointer-events: none;

    &:hover {
      transform: none;
      background: var(--pc-card-bg);
      border-color: var(--pc-card-border);
      box-shadow: none;
    }
  }

  &__skeleton-lines {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  &__skeleton-line {
    display: block;
    height: 12px;
    border-radius: 8px;
    background: var(--pc-skeleton);
    animation: price-categories-pulse 1.4s ease-in-out infinite;

    &--icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: var(--pc-skeleton-strong);
      animation-delay: 0.15s;
    }

    &--title {
      width: 55%;
      height: 18px;
    }

    &--text {
      width: 100%;
    }

    &--text-short {
      width: 70%;
    }
  }
}

// === Пульсация скелетона ===
@keyframes price-categories-pulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

// ========================================
// БАННЕР: в БД всего одна страница прайса
// ========================================
.price-banner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.75rem 1.85rem;
  background: var(--pc-note-bg);
  border: 1px dashed var(--pc-note-border);
  border-radius: 16px;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1.25rem;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: var(--pc-icon-bg);
    border: 1px solid var(--pc-icon-border);
    color: var(--pc-icon-color);
  }

  &__content {
    flex: 1;
  }

  &__title {
    margin: 0 0 0.45rem;
    font-family: 'Rubik', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--pc-text);
  }

  &__desc {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--pc-card-desc);
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-shrink: 0;
    padding: 0.95rem 1.75rem;
    border-radius: 12px;
    background: $blue-gradient;
    color: $background-dark;
    font-family: 'Rubik', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    box-shadow: 0 6px 20px rgba(0, 195, 245, 0.25);
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease;

    &:hover {
      transform: translateY(-2px);
      color: $background-dark;
      box-shadow: 0 10px 28px rgba(0, 195, 245, 0.4);
    }

    @media (max-width: 480px) {
      width: 100%;
    }
  }
}

// ========================================
// ПОДВАЛ: пояснение + полный прайс
// ========================================
.price-categories {
  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.75rem;
    margin-top: 2rem;
    padding: 1.35rem 1.6rem;
    background: var(--pc-note-bg);
    border: 1px dashed var(--pc-note-border);
    border-radius: 16px;

    @media (max-width: 900px) {
      flex-direction: column;
      align-items: stretch;
      gap: 1.1rem;
      padding: 1.2rem;
    }
  }

  &__note {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    max-width: 640px;
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--pc-note-color);

    :deep(.icon) {
      flex-shrink: 0;
      color: $blue;
    }
  }

  &__all {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-shrink: 0;
    padding: 0.85rem 1.5rem;
    border: 1px solid rgba(0, 195, 245, 0.35);
    border-radius: 12px;
    font-family: 'Rubik', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: $blue-light;
    text-decoration: none;
    white-space: nowrap;
    transition:
      transform 0.25s ease,
      border-color 0.25s ease,
      background 0.25s ease,
      color 0.25s ease;

    .price-categories--light & {
      color: $blue;
    }

    &:hover {
      transform: translateY(-2px);
      border-color: $blue;
      background: rgba(0, 195, 245, 0.08);
    }

    @media (max-width: 480px) {
      width: 100%;
    }
  }
}

// === Мобильный адаптив ===
@media (max-width: 768px) {
  .price-categories {
    &__header {
      margin-bottom: 2rem;
    }
  }

  .price-category-card {
    padding: 1.45rem 1.35rem;

    &__title {
      font-size: 1.05rem;
    }
  }
}
</style>
