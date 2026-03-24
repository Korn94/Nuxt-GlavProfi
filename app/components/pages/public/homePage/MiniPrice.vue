<template>
  <section class="prices-section">

    <div class="top-grid">
      <!-- Промо-блок -->
      <div class="promo-block">
        <span class="promo-label">Прайс-лист 2026</span>
        <h2 class="promo-title">Ремонт и отделка коммерческих помещений под ключ</h2>
        <NuxtLink to="/prices/otdelochnye-raboty">
          <button class="promo-btn">Смотреть цены →</button>
        </NuxtLink>
      </div>

      <!-- Статистика -->
      <div class="stats-block">
        <div v-for="stat in stats" :key="stat.label" class="stat-item">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- Карточки категорий -->
    <div class="categories-grid">
      <NuxtLink v-for="cat in categories" :key="cat.id" :to="cat.href" class="category-card">
        <div class="card-icon">
          <Icon :name="cat.icon" size="24px" />
        </div>
        <h3 class="card-name">{{ cat.name }}</h3>
        <p class="card-desc">{{ cat.desc }}</p>
        <span class="card-arrow">→</span>
      </NuxtLink>
    </div>

  </section>
</template>

<script setup>
const stats = [
  { value: '2014 г.', label: 'На рынке с' },
  { value: '250+', label: 'Объектов сдано' },
  { value: 'до 20%', label: 'Экономия на материалах' },
  { value: '5', label: 'Специализированных бригад' },
]

const categories = [
  {
    id: 'finishing',
    name: 'Отделочные работы',
    desc: 'Полы, стены, потолки — любые материалы и технологии',
    icon: 'material-symbols-light:format-paint-outline',
    href: '/prices/otdelochnye-raboty',
  },
  {
    id: 'plumbing',
    name: 'Сантехника',
    desc: 'Монтаж труб, установка санфаянса, ремонт коммуникаций',
    icon: 'material-symbols-light:water-drop-outline',
    href: '/prices/plumbing',
  },
  {
    id: 'electricity',
    name: 'Электромонтаж',
    desc: 'Прокладка проводки, освещение, щитки, розетки',
    icon: 'material-symbols-light:electric-bolt-outline',
    href: '/prices/electricity',
  },
]
</script>

<style lang="scss" scoped>
.prices-section {
  max-width: 1200px;
  margin: 6em auto;
  padding: 20px;
}

/* Верхняя сетка */
.top-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

/* Промо */
.promo-block {
  background: $blue;
  border-radius: $border-radius;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.promo-label {
  font-size: 11px;
  color: $text-dark;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.promo-title {
  font-size: 18px;
  font-weight: 500;
  color: $text-light;
  line-height: 1.35;
}

.promo-btn {
  margin-top: auto;
  display: inline-block;
  padding: 9px 18px;
  background: #fff;
  color: $text-dark;
  border: none;
  border-radius: $border-radius;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  width: fit-content;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.88;
  }
}

/* Статистика */
.stats-block {
  background: #f7f7f7;
  border-radius: $border-radius;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-content: center;border: 1px solid $border-color;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-value {
  font-size: 20px;
  font-weight: 500;
  color: $text-dark;
}

.stat-label {
  font-size: 12px;
  color: $text-gray;
}

/* Сетка карточек */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

/* Карточка */
.category-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 18px;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, transform 0.15s;
  position: relative;

  &:hover {
    border-color: $blue;
    transform: translateY(-2px);

    .card-arrow {
      opacity: 1;
      transform: translateX(3px);
    }
  }
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: $border-radius;
  background: #e8f7fb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $blue;
}

.card-name {
  font-size: 15px;
  font-weight: 500;
  color: #222;
}

.card-desc {
  font-size: 13px;
  color: #777;
  line-height: 1.5;
  flex: 1;
}

.card-arrow {
  font-size: 16px;
  color: #0090c0;
  opacity: 0;
  transition: opacity 0.15s, transform 0.15s;
  align-self: flex-end;
}
</style>