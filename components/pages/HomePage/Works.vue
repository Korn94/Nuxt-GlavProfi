<template>
  <div class="home-page">
    <!-- Заголовок -->
    <h2>Ремонт помещений, <span>цены на работы - 2025</span></h2>

    <!-- Ключевые категории -->
    <section class="key-categories">
      <!-- <h3>Наши услуги</h3> -->
      <div class="categories-grid">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-card"
        >
          <h3>{{ category.name }}</h3>
          <button @click="navigateToCategory(category.id)">Прайс {{ category.type }}</button>
        </div>
      </div>
    </section>

    <!-- Блок "Перейти к прайс-листу" -->
    <section class="price-list">
      <h3>Узнайте стоимость ремонта</h3>
      <p>Ознакомьтесь с нашим полным прайс-листом для точного расчета.</p>
      <!-- <NuxtLink to="/prices/floor">
        <button class="gradient-button large-button">
          Перейти к прайс-листу
        </button>
      </NuxtLink> -->
      <NuxtLink to="/about">
          <UIButtonsMainButton text="Перейти" />
        </NuxtLink>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

// Данные категорий (можно загрузить из JSON)
const categories = [
  { id: "prices/floor", name: "Ремонт пола", type: "пола" },
  { id: "prices/walls", name: "Ремонт стен", type: "стен" },
  { id: "prices/ceiling", name: "Ремонт потолка", type: "потолка" },
  { id: "prices/plumbing", name: "Сантехника", type: "Сантехники" },
  { id: "prices/electricity", name: "Электрика", type: "Электрики" },
];

// Роутер для навигации
const router = useRouter();

// Переход на страницу категории
const navigateToCategory = (categoryId) => {
  router.push(`/${categoryId}`);
};
</script>

<style lang="scss" scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;

  h2 {
    text-align: center;
    font-size: 2rem;
    margin-bottom: 40px;

    span {
      color: #00c3f5;
    }
  }

  section {
    margin-bottom: 40px;
  }

  p {
    font-size: 1rem;
    color: #555;
    line-height: 1.6;
  }

  button {
    padding: 10px 20px;
    min-width: 150px;
    margin-top: 1.5em;
    background: linear-gradient(to right, #00c3f5, #00a3d3);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s ease;

    &:hover {
      background: #00a3d3;
    }
  }
}

.key-categories {
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .category-card {
    background: #f7f7f7;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 20px;
    text-align: center;
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    h3 {
      font-size: 1.2rem;
      margin-bottom: 10px;
      color: #333;
    }

    p {
      font-size: 1rem;
      color: #555;
    }
  }
}

.price-list {
  // text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f7f7f7;

  a {
    margin-top: 1em;
  }
}
</style>