<template>
  <div class="home-page">
    <!-- Заголовок -->
    <section class="price-list">
      <h2>Ремонт помещений, <span>цены на работы - 2025</span></h2>
      <p>Ознакомьтесь с нашим полным прайс-листом для точного расчета</p>
      <NuxtLink to="/prices/floor">
          <UiButtonsPrimary text="Перейти к ценам" />
      </NuxtLink>
    </section>

    <!-- Ключевые категории -->
    <section class="key-categories">
      <div class="categories-grid">
        <NuxtLink v-for="category in categories" :key="category.id" :to="`/${category.id}`" class="category-card">
          <div class="ico">
            <div></div>
            <Icon :name="category.icon" size="24px" />
            <Icon name="weui:arrow-filled" class="arrow-icon" size="24px" />
          </div>
          <h3>{{ category.name }}</h3>
          <div class="line"></div>
          <p>{{ category.text }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
// Данные категорий (можно загрузить из JSON)
const categories = [
  { id: "prices/floor", name: "Отделка полов", type: "Пол", text: "Укладка ламината, паркета, линолеума, заливка стяжки, шлифовка, плитка...", icon: "material-symbols-light:footprint-outline" },
  { id: "prices/walls", name: "Отделка стен", type: "Стены", text: "Шпаклевка, покраска, оклейка обоями, монтаж панелей и гипсокартона...", icon: "material-symbols-light:wall-art-outline" },
  { id: "prices/ceiling", name: "Отделка потолка", type: "Потолок", text: "Монтаж гипсокартона, покраска, оклейка обоями...", icon: "material-symbols-light:arrow-shape-up-stack-outline" },
  { id: "prices/plumbing", name: "Сантехника", type: "Сантехнику", text: "Монтаж труб, установка санфаянса, ремонт коммуникаций...", icon: "material-symbols-light:water-drop-outline" },
  { id: "prices/electricity", name: "Электрика", type: "Электрику", text: "Прокладка проводки, замена розеток, светильников, щитков...", icon: "material-symbols-light:electric-bolt-outline" },
];
</script>

<style lang="scss" scoped>
.home-page {
  max-width: 1200px;
  margin: 6em auto;
  padding: 20px;

  h3 {
    text-align: center;
    font-size: 2rem;
    margin-bottom: 40px;

    span {
      color: #00c3f5;
    }
  }

  section {
    margin-bottom: 20px;
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
    text-align: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;

    .arrow-icon {
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .ico {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
    }

    .line {
      display: flex;
      width: 15%;
      margin: 0 auto 10px;
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
      font-size: 0.95rem;
      color: #555;
    }
  }
}

.price-list {
  // text-align: center;
  // max-width: 800px;
  margin: auto;
  padding: 30px;
  border: 1px solid #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f7f7f7;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  h2 {
    margin-bottom: 10px;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 20px;
  }
}
</style>