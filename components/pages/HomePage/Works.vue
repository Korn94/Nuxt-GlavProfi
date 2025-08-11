<template>
  <div class="home-page">
    <!-- Заголовок -->
    <h2>Ремонт помещений, <span>цены на работы - 2025</span></h2>

    <!-- Ключевые категории -->
    <section class="key-categories">
      <!-- <h3>Наши услуги</h3> -->
      <div class="categories-grid">
        <div v-for="category in categories" :key="category.id" class="category-card">
          <Icon :name="category.icon" size="24px" />
          <h3>{{ category.name }}</h3>
          <div class="line"></div>
          <p>{{ category.text }}</p>
          <!-- <div class="btn"><button @click="navigateToCategory(category.id)">Перейти к ценам</button></div> -->
          <div class="btn"><button @click="navigateToCategory(category.id)">Цены на {{ category.type }}</button></div>
        </div>
      </div>
    </section>

    <!-- Блок "Перейти к прайс-листу" -->
    <section class="price-list">
      <h3>Узнайте стоимость ремонта</h3>
      <p>Ознакомьтесь с нашим полным прайс-листом для точного расчета.</p>
      <NuxtLink to="/prices/floor">
          <UIButtonsMainButton text="Перейти" />
        </NuxtLink>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

// Данные категорий (можно загрузить из JSON)
const categories = [
  { id: "prices/floor", name: "Отделка полов", type: "Пол", text: "Укладка ламината, паркета, линолеума, заливка стяжки, шлифовка, плитка...", icon: "icon-park-outline:floor-tile" },
  { id: "prices/walls", name: "Отделка стен", type: "Стены", text: "Шпаклевка, покраска, оклейка обоями, монтаж панелей и гипсокартона...", icon: "tabler:window" },
  { id: "prices/ceiling", name: "Отделка потолка", type: "Потолок", text: "Монтаж гипсокартона, покраска, оклейка обоями...", icon: "mdi:ceiling-light-outline" },
  { id: "prices/plumbing", name: "Сантехника", type: "Сантехнику", text: "Монтаж труб, установка санфаянса, ремонт коммуникаций...", icon: "material-symbols:plumbing" },
  { id: "prices/electricity", name: "Электрика", type: "Электрику", text: "Прокладка проводки, замена розеток, светильников, щитков...", icon: "mdi:electricity" },
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
    grid-template-columns: repeat(auto-fit, minmax(300px, 2fr));
    gap: 20px;
  }

  .category-card {
    background: #f7f7f7;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 20px;
    // text-align: center;
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    .line {
      display: flex;
      width: 15%;
      margin: 5px 0;
      border-bottom: 1px solid #777;
    }

    .btn {
      text-align: center;
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