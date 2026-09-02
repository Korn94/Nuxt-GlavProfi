<!-- app\components\pages\public\homePage\WorksPreview.vue -->
<template>
  <section class="works-preview">
    <div class="container">
      <h2 class="works-preview__title">Виды отделочных работ</h2>
      <p class="works-preview__subtitle">
        Все виды отделочных работ: от перегородок и стяжки до финишной отделки. Дополнительно выполняем <span class="blue">электрику</span> и <span class="blue">сантехнику</span> под ключ.
      </p>

      <div class="works-preview__grid">
        <template v-for="work in previewItems" :key="work.slug">
          <NuxtLink
            :to="firstReadyUrl(work)"
            custom
            v-slot="{ navigate }"
          >
            <div
              class="works-preview__card"
              @click="navigate"
              @keyup.enter="navigate"
              role="link"
              tabindex="0"
            >
              <div class="works-preview__card-image">
                <img :src="work.image" :alt="work.title" loading="lazy" class="works-preview__img">
                <div class="works-preview__card-overlay">
                  <h3 class="works-preview__card-title">{{ work.title }}</h3>
                  <span class="works-preview__card-count">{{ work.links.length }} услуг</span>
                </div>
              </div>

              <div class="works-preview__card-body">
                <p class="works-preview__card-desc">{{ work.description }}</p>

                <div class="works-preview__card-links">
                  <template v-for="link in work.links.slice(0, 3)" :key="link.url">
                    <NuxtLink
                      v-if="link.isReady"
                      :to="link.url"
                      class="works-preview__card-link"
                      :title="link.title"
                    >
                      {{ link.title }}
                    </NuxtLink>
                    <span
                      v-else
                      class="works-preview__card-link works-preview__card-link--disabled"
                      :title="`${link.title} — в разработке`"
                    >
                      <Icon name="mdi:link-off" size="13" />
                      {{ link.title }}
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </NuxtLink>
        </template>
      </div>

      <div class="works-preview__footer">
        <NuxtLink to="/remont-pomescheniy" class="works-preview__btn">
          Все виды работ
          <Icon name="mdi:arrow-right" size="16" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const previewItems = [
  {
    slug: 'peregorodki',
    title: 'Перегородки',
    category: 'walls',
    description: 'Монтаж межкомнатных перегородок из ГКЛ, кирпича, блоков, ПГП',
    image: '/main/remont-pomescheniy/medicina.webp',
    links: [
      { title: 'ГКЛ', url: '/vidy-rabot/peregorodki-gkl', isReady: true },
      { title: 'Кирпич', url: '/vidy-rabot/peregorodki-kirpich', isReady: false },
      { title: 'ПГП', url: '/vidy-rabot/peregorodki-pgp', isReady: false },
      { title: 'Блоки', url: '/peregorodki-bloki', isReady: false },
      { title: 'Звукоизоляция', url: '/vidy-rabot/zvukoizolyatsiya-peregorodok', isReady: false },
    ],
  },
  {
    slug: 'oblitsovka',
    title: 'Облицовка стен',
    category: 'walls',
    description: 'Обшивка стен ГКЛ, стеновые панели, зеркала, короба',
    image: '/main/remont-pomescheniy/banki.webp',
    links: [
      { title: 'ГКЛ', url: '/vidy-rabot/oblitsovka-gkl', isReady: true },
      { title: 'Панели', url: '/vidy-rabot/stenovye-paneli', isReady: false },
      { title: 'Зеркала', url: '/vidy-rabot/zerkalnye-paneli', isReady: false },
      { title: 'Короба', url: '/vidy-rabot/koroba-gkl', isReady: false },
      { title: 'Декоративные', url: '/vidy-rabot/dekorativnye-paneli', isReady: false },
      { title: 'Ламинат', url: '/vidy-rabot/oblitsovka-laminatom', isReady: false },
    ],
  },
  {
    slug: 'shtukaturka',
    title: 'Штукатурные работы',
    category: 'walls',
    description: 'Штукатурка стен, потолков, откосов, декоративная штукатурка',
    image: '/main/remont-pomescheniy/salony.webp',
    links: [
      { title: 'Стены', url: '/vidy-rabot/shtukaturka-sten', isReady: true },
      { title: 'Потолки', url: '/vidy-rabot/shtukaturka-potolkov', isReady: false },
      { title: 'Откосы', url: '/vidy-rabot/shtukaturka-otkosov', isReady: false },
      { title: 'Декоративная', url: '/vidy-rabot/dekorativnaya-shtukaturka', isReady: false },
      { title: 'Армирование', url: '/vidy-rabot/armirovanie-shtukaturki', isReady: false },
    ],
  }
]

const firstReadyUrl = (work: any): string => {
  const first = work.links.find((l: any) => l.isReady)
  return first?.url ?? '/remont-pomescheniy'
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.works-preview {
  padding: 4rem 0;
  background: $background-light;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  &__title {
    @include section-title;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 3px;
      background: $blue-gradient;
      border-radius: 2px;
    }
  }

  &__subtitle {
    color: $text-secondary;
    font-size: 1rem;
    margin-bottom: 2rem;
    max-width: 600px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  &__card {
    background: #fff;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: all 0.35s ease;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
      border-color: $blue;
    }

    &:hover &__img {
      transform: scale(1.05);
    }
  }

  &__card-image {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #f5f5f5;
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
    padding: 1rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  }

  &__card-title {
    font-size: 1.15rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 0.2rem;
    line-height: 1.3;
  }

  &__card-count {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.85);
  }

  &__card-body {
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    flex: 1;
  }

  &__card-desc {
    font-size: 0.9rem;
    line-height: 1.5;
    color: $text-secondary;
    margin: 0;
  }

  &__card-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.8rem;
    border-top: 1px solid $border-color;
  }

  &__card-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.4rem 0.8rem;
    background: rgba(0, 195, 245, 0.05);
    border: 1px solid rgba(0, 195, 245, 0.2);
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
    color: $blue;
    text-decoration: none;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      background: $blue;
      border-color: $blue;
      color: #fff;
    }

    &--disabled {
      background: transparent;
      border-color: rgba($text-secondary, 0.25);
      color: rgba($text-secondary, 0.55);
      cursor: default;
      pointer-events: none;
      font-weight: 400;

      &:hover {
        background: transparent;
        border-color: rgba($text-secondary, 0.25);
        color: rgba($text-secondary, 0.55);
      }
    }
  }

  &__footer {
    display: flex;
    justify-content: center;
    padding-top: 2rem;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.85rem 2rem;
    background: transparent;
    border: 1px solid $border-color;
    color: $text-secondary;
    border-radius: var(--border-radius, 6px);
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;

    &:hover {
      background: rgba(0, 195, 245, 0.05);
      border-color: $blue;
      color: $blue;
    }
  }
}

@media (max-width: 768px) {
  .works-preview {
    padding: 3rem 0;

    &__title { font-size: 1.6rem; }
    &__grid { grid-template-columns: 1fr; }
  }
}
</style>