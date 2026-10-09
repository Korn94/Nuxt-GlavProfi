<!-- app\components\pages\public\homePage\MiniProjects.vue -->
<template>
  <div class="featured-projects">
    <h2 class="visually-hidden">Наши проекты</h2>

    <!-- Скелетон: пока данные не готовы (лентяная/повторная загрузка) -->
    <div v-if="loading" class="featured-skeleton-grid" aria-hidden="true">
      <div v-for="n in 2" :key="n" class="skeleton-card">
        <div class="skeleton-card__media"></div>
        <div class="skeleton-card__overlay">
          <div class="skeleton-line skeleton-line--small"></div>
          <div class="skeleton-line skeleton-line--large"></div>
        </div>
      </div>
    </div>

    <div v-else class="featured-grid">
      <NuxtLink
        v-for="card in validFeaturedCards"
        :key="card.id"
        :to="`/projects/${card.slug}`"
        class="case-card"
      >
        <!-- Изображение -->
        <div class="case-card__image">
          <img
            :src="useImageUrl(getMainImage(card.images))"
            :alt="card.title"
            loading="lazy"
          />
        </div>

        <!-- Badge с площадью (glassmorphism) -->
        <span v-if="card.space" class="case-card__space">
          {{ card.space }} м²
        </span>

        <!-- Overlay с информацией -->
        <div class="case-card__overlay">
          <h3 class="case-card__title">{{ card.title }}</h3>
          <p v-if="card.subtitle" class="case-card__subtitle">
            {{ card.subtitle }}
          </p>
          
          <!-- Нижний ряд: категория+кнопка слева, адрес справа -->
          <div class="case-card__bottom-row">
            <div class="case-card__bottom-left">
              <div class="case-card__category" v-if="card.category">
                {{ card.category }}
              </div>
              <span class="case-card__link">
                Подробнее
                <Icon name="weui:arrow-filled" size="16" />
              </span>
            </div>
            <div v-if="card.address" class="case-card__address">
              <Icon name="mdi:map-marker-outline" size="14" class="case-card__address-icon" />
              <span class="case-card__address-text">{{ card.address }}</span>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <NuxtLink to="/projects">
      <UiButtonsPrimary class="openbtn" text="Показать еще" variant="outline-dark"></UiButtonsPrimary>
    </NuxtLink>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Загрузка данных на сервере (SSR).
// Nuxt выполняет $fetch на сервере, встраивает результат в HTML и в payload;
// на клиенте данные приходят из payload без повторного запроса, поэтому кейсы
// видны и поисковикам, и пользователям с самого первого кадра.
const { data, pending } = await useAsyncData(
  'home-featured',
  async () => {
    try {
      const data = await $fetch('/api/portfolio')
      return data?.data || []
    } catch (err) {
      // Кратковременный сбой API — не роняем SSR-рендер (200 с пустым списком)
      console.error('Ошибка при загрузке проектов:', err)
      return []
    }
  }
)

// Состояние
const allCards = computed(() => data.value || [])
const loading = computed(() => pending.value)

// Выборка нужных кейсов по slug
const featuredCards = computed(() => {
  // const slugs = ['ddx', 'fora-bank', 'klinika-alma', 'zerno']
  const slugs = ['ddx', 'fora-bank']
  return allCards.value.filter(card => slugs.includes(card.slug))
})

// ✅ НОВОЕ: Фильтруем только карточки с валидным slug для рендеринга ссылок
const validFeaturedCards = computed(() => 
  featuredCards.value.filter(card => card?.slug)
)

// Получение основного изображения
const getMainImage = (images) => {
  if (!images?.length) return '/images/placeholder.jpg'
  const mainImage = images.find(img => img.type === 'main')
  return mainImage?.url || images[0]?.url || '/images/placeholder.jpg'
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.featured-projects {
  max-width: 1200px;
  margin: 6em auto;
  padding: 0 5px;
  text-align: center;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    gap: 5px;
  }
}

// === Карточка проекта ===
.case-card {
  position: relative;
  display: block;
  border-radius: 4px;
  overflow: hidden;
  height: 280px;
  max-width: 600px;
  background: $background-gray;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  text-decoration: none;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);

    .case-card__image img {
      transform: scale(1.08);
    }

    .case-card__link {
      gap: 0.7rem;
      color: $yellow;

      :deep(.icon) {
        transform: translateX(4px);
      }
    }

    .case-card__space {
      background: rgba(0, 195, 245, 0.85);
    }

    .case-card__address {
      background: rgba(0, 195, 245, 0.85);
      border-color: rgba(255, 255, 255, 0.25);

      .case-card__address-icon {
        color: #fff;
      }
    }
  }

  // Изображение
  &__image {
    position: absolute;
    inset: 0;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s ease;
    }
  }

  // Badge с площадью (верхний правый угол)
  &__space {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #fff;
    padding: 0.3rem 0.75rem;
    border-radius: 50px;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    z-index: 3;
    transition: background 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  // Overlay с информацией
  &__overlay {
    position: absolute;
    inset: 0;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    background: linear-gradient(
      to top,
      rgba(24, 25, 27, 0.95) 0%,
      rgba(24, 25, 27, 0.6) 45%,
      rgba(24, 25, 27, 0.1) 100%
    );
    color: #fff;
    z-index: 2;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0 0 0.3rem;
    color: #fff;
    line-height: 1.25;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

    @media (max-width: 768px) {
      font-size: 1.2rem;
    }
  }

  &__subtitle {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.85);
    margin: 0 0 1.2rem;
    line-height: 1.4;
  }

  // Нижний ряд
  &__bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    margin-top: auto;
  }

  // Левая колонка (категория + кнопка)
  &__bottom-left {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__category {
    align-self: flex-start;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $blue-light;
    padding: 0.2rem 0.6rem;
    background: rgba(0, 195, 245, 0.15);
    border: 1px solid rgba(0, 195, 245, 0.3);
    border-radius: 4px;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: $blue-light;
    font-size: 0.92rem;
    font-weight: 600;
    transition: all 0.3s ease;
    white-space: nowrap;

    :deep(.icon) {
      transition: transform 0.3s ease;
    }
  }

  // Адрес (правый нижний угол с переносом текста)
  &__address {
    display: inline-flex;
    align-items: flex-start;
    gap: 0.35rem;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #fff;
    padding: 0.4rem 0.8rem;
    border-radius: 12px;
    font-size: 0.82rem;
    font-weight: 500;
    line-height: 1.35;
    text-align: right;
    max-width: 65%;
    word-break: break-word;
    border: 1px solid rgba(255, 255, 255, 0.15);
    transition: all 0.3s ease;

    &-icon {
      flex-shrink: 0;
      color: $blue-light;
      margin-top: 0.1rem;
    }
  }
}

/* ====== Скелетон загрузки ====== */
.featured-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    gap: 5px;
  }
}

.skeleton-card {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  height: 280px;
  max-width: 600px;
  background: #eef0f3;

  &__media {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #e9ebef 25%, #dfe2e8 37%, #e9ebef 63%);
    background-size: 400% 100%;
    animation: miniShimmer 1.4s ease infinite;
  }

  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 20px;
    height: 160px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.skeleton-line {
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #dfe2e8 25%, #d3d7df 37%, #dfe2e8 63%);
  background-size: 400% 100%;
  animation: miniShimmer 1.4s ease infinite;

  &--small {
    width: 40%;
  }

  &--large {
    width: 70%;
  }
}

@keyframes miniShimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

// === Мобильная адаптация ===
@media (max-width: 768px) {
  .case-card {
    height: 260px;

    &__overlay {
      padding: 1.2rem;
    }

    &__space {
      top: 0.8rem;
      right: 0.8rem;
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
    }

    &__title {
      font-size: 1.15rem;
    }

    &__subtitle {
      font-size: 0.85rem;
    }

    &__link {
      font-size: 0.88rem;
    }

    &__category {
      font-size: 0.7rem;
    }

    &__bottom-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.6rem;
      width: 100%;
    }

    &__address {
      max-width: 100%;
      text-align: left;
      font-size: 0.78rem;
    }
  }
}

@media (max-width: 480px) {
  .case-card {
    height: 240px;

    &__title {
      font-size: 1.05rem;
    }
  }
}
</style>