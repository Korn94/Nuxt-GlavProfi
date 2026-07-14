<!-- app/components/public/remont-pomescheniy/index/blocks/PremisesGrid.vue -->
<template>
  <section class="premises-grid" ref="sectionRef">
    <div class="container">
      <h2 class="premises-grid__title">Основные типы помещений, с которыми мы работаем</h2>

      <!-- Панель управления: табы + переключатель вида -->
      <div class="premises-grid__controls">
        <div class="premises-grid__tabs-wrapper">
          <div class="premises-grid__tabs">
            <button v-for="tab in tabs" :key="tab.key"
              :class="['premises-grid__tab', { active: activeTab === tab.key }]" @click="setTab(tab.key)">
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Кнопка переключения вида -->
        <button class="premises-grid__view-toggle" @click="toggleView"
          :title="viewMode === 'list' ? 'Показать сеткой' : 'Показать списком'">
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
          <!-- Заголовок категории -->
          <h3 v-if="activeTab === 'all'" class="premises-grid__cat-title">
            {{ categoryLabels[catKey] }}
          </h3>

          <!-- Список в режиме LIST (вертикальные блоки) -->
          <div v-if="viewMode === 'list'" class="premises-grid__list--list">
            <template v-for="item in groupedItems[catKey]" :key="item.slug">
              <!-- 🔗 SEO: готовая карточка = NuxtLink (prefetch + <a href>) -->
              <NuxtLink
                v-if="item.isReady"
                :to="getPageLink(item.slug)"
                :class="['premises-grid__item--list', { 
                  'item-visible': animatedSlugs.has(item.slug),
                  'is-clickable': true
                }]"
              >
                <!-- Контент (текст) -->
                <div class="premises-grid__item-content">
                  <h3 class="premises-grid__item-title">{{ item.title }}</h3>
                  <p v-if="item.subtitle" class="premises-grid__item-subtitle">{{ item.subtitle }}</p>
                  <p class="premises-grid__item-desc">{{ item.description }}</p>
                </div>

                <!-- Сайдбар (цены + индикатор ссылки) -->
                <div class="premises-grid__item-sidebar">
                  <div class="premises-grid__item-prices">
                    <span class="premises-grid__price-main">{{ item.price }}</span>
                    <span class="premises-grid__price-example" v-if="item.priceExample">{{ item.priceExample }}</span>
                  </div>
                  
                  <span class="premises-grid__item-link">
                    Подробнее →
                  </span>
                </div>

                <!-- Изображение -->
                <div class="premises-grid__item-image">
                  <img :src="item.image" :alt="item.title" loading="lazy" class="premises-grid__img">
                </div>
              </NuxtLink>

              <!-- 🔗 Неготовая карточка = div -->
              <div
                v-else
                :class="['premises-grid__item--list', { 
                  'item-visible': animatedSlugs.has(item.slug),
                  'is-clickable': false
                }]"
              >
                <!-- Контент (текст) -->
                <div class="premises-grid__item-content">
                  <h3 class="premises-grid__item-title">{{ item.title }}</h3>
                  <p v-if="item.subtitle" class="premises-grid__item-subtitle">{{ item.subtitle }}</p>
                  <p class="premises-grid__item-desc">{{ item.description }}</p>
                </div>

                <!-- Сайдбар (цены + индикатор разработки) -->
                <div class="premises-grid__item-sidebar">
                  <div class="premises-grid__item-prices">
                    <span class="premises-grid__price-main">{{ item.price }}</span>
                    <span class="premises-grid__price-example" v-if="item.priceExample">{{ item.priceExample }}</span>
                  </div>
                  
                  <span class="premises-grid__item-link premises-grid__item-link--disabled" title="Страница в разработке">
                    <Icon name="mdi:link-off" size="14" style="vertical-align: middle; margin-left: 4px;" />
                    Страница в разработке
                  </span>
                </div>

                <!-- Изображение -->
                <div class="premises-grid__item-image">
                  <img :src="item.image" :alt="item.title" loading="lazy" class="premises-grid__img">
                </div>
              </div>
            </template>
          </div>

          <!-- Список в режиме GRID (сетка карточек) -->
          <div v-else class="premises-grid__list--grid">
            <template v-for="item in groupedItems[catKey]" :key="item.slug">
              <!-- 🔗 SEO: готовая карточка = NuxtLink -->
              <NuxtLink
                v-if="item.isReady"
                :to="getPageLink(item.slug)"
                :class="['premises-grid__item--grid', { 
                  'item-visible': animatedSlugs.has(item.slug),
                  'is-clickable': true
                }]"
              >
                <!-- Изображение с наложенным текстом -->
                <div class="premises-grid__card-image">
                  <img :src="item.image" :alt="item.title" loading="lazy" class="premises-grid__img">
                  <div class="premises-grid__card-overlay">
                    <h3 class="premises-grid__card-title--overlay">{{ item.title }}</h3>
                    <p v-if="item.subtitle" class="premises-grid__card-subtitle--overlay">{{ item.subtitle }}</p>
                  </div>
                </div>

                <!-- Контент под изображением -->
                <div class="premises-grid__card-body">
                  <p class="premises-grid__card-desc">{{ item.description }}</p>

                  <div class="premises-grid__prices">
                    <span class="premises-grid__price-main">{{ item.price }}</span>
                    <span class="premises-grid__price-example" v-if="item.priceExample">{{ item.priceExample }}</span>
                    
                    <span class="premises-grid__card-link">
                      Подробнее →
                    </span>
                  </div>
                </div>
              </NuxtLink>

              <!-- 🔗 Неготовая карточка = div -->
              <div
                v-else
                :class="['premises-grid__item--grid', { 
                  'item-visible': animatedSlugs.has(item.slug),
                  'is-clickable': false
                }]"
              >
                <!-- Изображение с наложенным текстом -->
                <div class="premises-grid__card-image">
                  <img :src="item.image" :alt="item.title" loading="lazy" class="premises-grid__img">
                  <div class="premises-grid__card-overlay">
                    <h3 class="premises-grid__card-title--overlay">{{ item.title }}</h3>
                    <p v-if="item.subtitle" class="premises-grid__card-subtitle--overlay">{{ item.subtitle }}</p>
                  </div>
                </div>

                <!-- Контент под изображением -->
                <div class="premises-grid__card-body">
                  <p class="premises-grid__card-desc">{{ item.description }}</p>

                  <div class="premises-grid__prices">
                    <span class="premises-grid__price-main">{{ item.price }}</span>
                    <span class="premises-grid__price-example" v-if="item.priceExample">{{ item.priceExample }}</span>
                    
                    <span class="premises-grid__card-link premises-grid__card-link--disabled" title="Страница в разработке">
                      <Icon name="mdi:link-off" size="14" style="vertical-align: middle; margin-left: 4px;" />
                      Страница в разработке
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Разделитель между категориями -->
          <hr v-if="!isLastCategory(catKey)" class="premises-grid__divider">
        </div>
      </template>

      <!-- Кнопка "Показать ещё" -->
      <div v-if="canShowMore" class="premises-grid__footer">
        <UiButtonsPrimary text="Показать ещё" variant="outline" @click="showAll = true" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const sectionRef = ref(null);
const activeTab = ref('all');
const showAll = ref(false);
const viewMode = ref('grid');
const INITIAL_LIMIT = 3;

const tabs = [
  { key: 'all', label: 'Все' },
  { key: 'commercial', label: 'Коммерческие' },
  { key: 'industrial', label: 'Производственные' },
  { key: 'other', label: 'Прочие' }
];

const categoryOrder = ['commercial', 'industrial', 'other'];
const categoryLabels = {
  commercial: 'Коммерческие помещения',
  industrial: 'Производственные помещения',
  other: 'Прочие объекты'
};

// 🎯 Хелпер для генерации ссылок
const getPageLink = (slug) => `/remont-pomescheniy/${slug}`;

// 💡 Данные помещений — добавьте isReady: true, когда страница готова
const premises = [
  { slug: 'banki', title: 'Банки', subtitle: 'отделения, операционные залы, хранилища', category: 'commercial', price: 'от 14 000 ₽ за м²', priceExample: 'за 100 м² ~1.4–2.0 млн ₽', description: 'Работаем с учетом требований безопасности: усиленные перегородки, кабель-каналы под охранно-пожарную сигнализацию, зоны для инкассации. Выполняем монтаж по спец. ТЗ, соблюдаем режим конфиденциальности на объекте.', image: 'main/remont-pomescheniy/banki.webp', isReady: false },
  { slug: 'magaziny', title: 'Магазины', subtitle: 'ТЦ, стрит-ритейл, бутики', category: 'commercial', price: 'от 13 000 ₽ за м²', priceExample: 'за 100 м² ~1.3–1.9 млн ₽', description: 'Монтируем витринные группы, торговое оборудование, напольные покрытия по вашей спецификации. Работаем в график ТЦ (ночные смены) или в свободном режиме для отдельно стоящих зданий. Сдаем объект готовым к выкладке товара.', image: 'main/remont-pomescheniy/magaziny.webp', isReady: false },
  { slug: 'ofisy', title: 'Офисы', subtitle: 'административные здания, кол-центры', category: 'commercial', price: 'от 11 000 ₽ за м²', priceExample: 'за 100 м² ~1.1–1.6 млн ₽', description: 'Выполняем отделку по вашему ТЗ или проекту. Перед стартом проверяем основание и коммуникации: если проект конфликтует с реальным объектом — сообщаем до начала работ. Собственные бригады: ГКЛ, маляры, электрики.', image: 'main/remont-pomescheniy/ofisy.webp', isReady: true },
  { slug: 'salony', title: 'Салоны красоты', subtitle: 'барбершопы, СПА', category: 'commercial', price: 'от 15 000 ₽ за м²', priceExample: 'за 100 м² ~1.5–2.2 млн ₽', description: 'Реализуем проект с «мокрыми» зонами: гидроизоляция, закладные под оборудование. Проверяем вводные мощности и сечение кабелей до начала чистовой отделки.', image: 'main/remont-pomescheniy/salony.webp', isReady: false },
  { slug: 'fitnes', title: 'Фитнес-клубы', subtitle: 'спортивные залы', category: 'commercial', price: 'от 14 000 ₽ за м²', priceExample: 'за 100 м² ~1.4–2.0 млн ₽', description: 'Монтаж ударопрочных покрытий, зеркальных стен, душевых с трапами — строго по проекту. Проверяем основание под спортивные полы, герметичность мокрых зон.', image: 'main/remont-pomescheniy/fitnes.webp', isReady: false },
  { slug: 'sklady', title: 'Склады', subtitle: 'логистические центры, места хранения', category: 'industrial', price: 'от 8 500 ₽ за м²', priceExample: 'за 100 м² ~0.9–1.3 млн ₽', description: 'Устройство промышленных полов (топпинг, наливные) по вашей технологии. Проверяем геометрию основания, усадку бетона перед началом работ. Монтируем пандусы, разметку, освещение по проекту.', image: 'main/remont-pomescheniy/sklady.webp', isReady: false },
  { slug: 'ceha', title: 'Производство', subtitle: 'цеха, заводы', category: 'industrial', price: 'от 12 000 ₽ за м²', priceExample: 'за 100 м² ~1.2–2.5 млн ₽', description: 'Работаем по тех. заданию инженеров: усиленные коммуникации, спец. покрытия, безопасные зоны. Проверяем допуски под оборудование, соответствие монтажа нормам охраны труда.', image: 'main/remont-pomescheniy/ceha.webp', isReady: false },
  { slug: 'angary', title: 'Ангары', subtitle: 'модульные здания', category: 'industrial', price: 'от 9 000 ₽ за м²', priceExample: 'за 100 м² ~0.9–1.4 млн ₽', description: 'Внутренняя отделка по проекту: утепление, обшивка, ввод коммуникаций. Проверяем герметичность контура, мостики холода до начала чистовых работ. Работаем с сэндвич-панелями, профлистом.', image: 'main/remont-pomescheniy/angary.webp', isReady: false },
  { slug: 'pischevye', title: 'Пищевые производства', subtitle: '', category: 'industrial', price: 'от 16 000 ₽ за м²', priceExample: 'за 100 м² ~1.6–2.4 млн ₽', description: 'Монтаж по СанПиН: плитка, стоки, бесшовные покрытия — по вашей спецификации. Проверяем уклоны полов, герметичность стыков до сдачи. Работаем с пищевыми материалами (нержавейка, спец. смеси).', image: 'main/remont-pomescheniy/pischevye.webp', isReady: false },
  { slug: 'kliniki', title: 'Медицинские помещения', subtitle: 'клиники, кабинеты, лаборатории', category: 'other', price: 'от 18 000 ₽ за м²', priceExample: 'за 100 м² ~1.8–2.8 млн ₽', description: 'Отделка по проекту или ТЗ: бесшовные покрытия, стены под дезинфекцию, специфические материалы. Проверяем основание под спец. полы, герметичность мокрых зон. Работаем с медицинскими материалами (линолеум, нержавейка, спец. смеси и прочие).', image: 'main/remont-pomescheniy/medicina.webp', isReady: true },
  { slug: 'mopy', title: 'МОПы', subtitle: 'подъезды, холлы ЖК', category: 'other', price: 'от 4 500 ₽ за м²', priceExample: 'за 100 м² ~0.5–0.8 млн ₽', description: 'Ремонт по регламенту УК: антивандальные материалы, износостойкая покраска. Работаем в график, не создаем шум в часы покоя.', image: 'main/remont-pomescheniy/mopy.webp', isReady: false },
  { slug: 'fasady', title: 'Фасады зданий', subtitle: '', category: 'other', price: 'от 3 500 ₽ за м²', priceExample: 'за 100 м² ~0.4–0.7 млн ₽', description: 'Монтаж фасадов: утепление, облицовка, герметизация. Проверяем основание, крепеж, точку росы до начала работ. Работаем на высоте с допуском, соблюдаем ГОСТ по теплоизоляции.', image: 'main/remont-pomescheniy/fasady.webp', isReady: false }
];

const filteredItems = computed(() => {
  if (activeTab.value === 'all') return premises;
  return premises.filter(p => p.category === activeTab.value);
});

const visibleItems = computed(() => {
  if (activeTab.value === 'all' && !showAll.value) {
    return filteredItems.value.slice(0, INITIAL_LIMIT);
  }
  return filteredItems.value;
});

const groupedItems = computed(() => {
  const groups = { commercial: [], industrial: [], other: [] };
  visibleItems.value.forEach(item => {
    if (groups[item.category]) groups[item.category].push(item);
  });
  return groups;
});

const canShowMore = computed(() => activeTab.value === 'all' && !showAll.value);
const isLastCategory = (key) => key === categoryOrder[categoryOrder.length - 1];

const setTab = (key) => {
  if (activeTab.value === key) {
    animatedSlugs.value = new Set();
    visibleItems.value.forEach((item, index) => {
      setTimeout(() => { animatedSlugs.value.add(item.slug); }, index * 50);
    });
    return;
  }
  activeTab.value = key;
  showAll.value = false;
  animatedSlugs.value = new Set();
};

const toggleView = () => {
  viewMode.value = viewMode.value === 'list' ? 'grid' : 'list';
};

const animatedSlugs = ref(new Set());

watch(visibleItems, async (items) => {
  await nextTick();
  items.forEach((item, index) => {
    setTimeout(() => { animatedSlugs.value.add(item.slug); }, index * 50);
  });
}, { immediate: true });
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;
$services-text-secondary: $text-gray;

.premises-grid {
  padding: 4rem 0;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: $text-light;
    margin-bottom: 2rem;
    position: relative;
    padding-bottom: 0.8rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 3px;
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px $blue50;
    }
  }

  // === Панель управления ===
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
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar { display: none; }
  }

  &__tabs {
    display: flex;
    gap: 0.75rem;
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

  // === Категории ===
  &__category { margin-bottom: 3rem; }
  &__cat-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: $text-light;
    margin: 0 0 1.5rem;
    padding-left: 1rem;
    position: relative;
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 22px;
      background: $blue-gradient;
      border-radius: 2px;
    }
  }

  // === РЕЖИМ СПИСКА ===
  &__list--list {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  &__item--list {
    padding: 0;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: $border-radius;
    display: flex;
    gap: 0;
    align-items: stretch;
    transition: all 0.35s ease;
    opacity: 0;
    transform: translateX(-20px);
    text-decoration: none;
    color: inherit;

    &.item-visible {
      opacity: 1;
      transform: translateX(0);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }

    &.is-clickable:hover {
      border-color: $blue;
      background: rgba(0, 195, 245, 0.06);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      cursor: pointer;
    }

    &.is-clickable:hover &__item-image img {
      transform: scale(1.05);
    }

    @media (max-width: 900px) {
      flex-wrap: wrap;
      gap: 0;
    }
    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  &__item-content {
    flex: 1;
    min-width: 0;
    padding: 1.8rem 1rem 1.8rem 1.8rem;

    @media (max-width: 900px) { padding: 1.4rem; }
    @media (max-width: 768px) { padding: 1.4rem; }
  }

  &__item-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: $text-light;
    margin: 0 0 0.3rem;
    line-height: 1.3;
  }

  &__item-subtitle {
    font-size: 0.9rem;
    color: $blue;
    margin: 0 0 0.8rem;
    opacity: 0.9;
  }

  &__item-desc {
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba($text-light, 0.85);
    margin-top: 1em;
    padding-top: 1em;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__item-sidebar {
    display: flex;
    flex-direction: column;
    justify-content: end;
    gap: 1rem;
    flex-shrink: 0;
    min-width: 200px;
    padding: 1.8rem 1rem 1.8rem 0;

    @media (max-width: 900px) {
      align-items: flex-start;
      width: 100%;
      min-width: auto;
      flex-direction: row;
      justify-content: space-between;
      padding: 0 1rem 1rem 1.4rem;
    }
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      padding: 0 1.4rem 1rem;
    }
  }

  &__item-prices {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    @media (max-width: 900px) { align-items: flex-start; }
    @media (max-width: 768px) { align-items: flex-start; }
  }

  &__price-main {
    font-size: 1.25rem;
    font-weight: 700;
    color: $blue-light;
  }

  &__price-example {
    font-size: 0.85rem;
    color: rgba($text-light, 0.5);
  }

  &__item-link {
    color: $blue;
    font-weight: 500;
    font-size: 0.95rem;
    transition: color 0.3s ease;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;

    .is-clickable:hover & {
      color: $blue-light;
    }

    &--disabled {
      color: rgba($text-light, 0.4);
      font-weight: 400;
      
      .is-clickable:hover & {
        color: rgba($text-light, 0.4);
      }
    }
  }

  &__item-image {
    flex-shrink: 0;
    width: 220px;
    height: auto;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.2);
    border-top-right-radius: $border-radius;
    border-bottom-right-radius: $border-radius;

    @media (max-width: 900px) {
      width: 100%;
      aspect-ratio: 21 / 9;
      border-radius: 0;
      order: 3;
    }
    @media (max-width: 768px) {
      aspect-ratio: 16 / 9;
      border-bottom-left-radius: $border-radius;
      border-bottom-right-radius: $border-radius;
    }
  }

  &__item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }

  // === РЕЖИМ СЕТКИ ===
  &__list--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  &__item--grid {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: $border-radius;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: all 0.35s ease;
    opacity: 0;
    transform: translateY(20px);
    will-change: opacity, transform;
    text-decoration: none;
    color: inherit;

    &.item-visible {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }

    &.is-clickable:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 25px rgba(0, 0, 0, 0.3);
      border-color: $blue;
      background: rgba(0, 195, 245, 0.06);
      cursor: pointer;
    }

    &.is-clickable:hover &__img {
      transform: scale(1.05);
    }
  }

  &__card-image {
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
    transition: transform 0.4s ease;
  }

  &__card-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem 1.2rem;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
    z-index: 1;
  }

  &__card-title--overlay {
    font-size: 1.15rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 0.2rem;
    line-height: 1.3;
    text-shadow: 0 1px 3px rgba(0,0,0,0.4);
  }

  &__card-subtitle--overlay {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.9);
    margin: 0;
  }

  &__card-body {
    padding: 1.2rem 1.4rem 1.4rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 0.8rem;
    flex: 1;
  }

  &__card-desc {
    font-size: 0.95rem;
    line-height: 1.55;
    color: rgba($text-light, 0.85);
    margin: 0;
  }

  &__prices {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding-top: 0.6rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__card-link {
    color: $blue;
    font-weight: 500;
    font-size: 0.95rem;
    transition: color 0.3s ease;
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    margin-top: 1em;
    
    .is-clickable:hover & {
      color: $blue-light; 
    }

    &--disabled {
      color: rgba($text-light, 0.4);
      font-weight: 400;
      
      .is-clickable:hover & {
        color: rgba($text-light, 0.4);
      }
    }
  }

  &__divider {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    margin: 3rem 0 0;
  }

  &__footer {
    display: flex;
    justify-content: center;
    padding-top: 1rem;
  }
}

@media (max-width: 768px) {
  .premises-grid {
    padding: 3rem 0;
    &__controls { flex-direction: column; align-items: stretch; }
    &__title { font-size: 1.6rem; }
    &__list--grid { grid-template-columns: 1fr; }
    &__item--grid { padding: 0; }
    &__cat-title { font-size: 1.25rem; }
    &__item--list { padding: 1.4rem; }
  }
}
</style>