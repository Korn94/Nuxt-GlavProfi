<template>
  <div class="container">
    <h1>Контрагенты</h1>
    <!-- Меню навигации должно быть в родительской странице -->
    <nav>
      <router-link 
        v-for="tab in tabs" 
        :key="tab.path" 
        :to="`/cabinet/admin/contractors/${tab.path}`"
        :class="{ active: $route.path.endsWith(tab.path) }"
      >
        {{ tab.title }}
      </router-link>
    </nav>
    <!-- Дочерние компоненты будут отображаться здесь -->
    <NuxtPage />
  </div>
</template>

<script setup>
const tabs = [
  { path: 'master', title: 'Мастера' },
  { path: 'worker', title: 'Разнорабочие' },
  { path: 'foreman', title: 'Прорабы' },
  { path: 'add', title: 'Добавить' }
];
</script>

<style lang="scss" scoped>
.container {
  margin: 0 auto;
  padding: 20px;
  
  a {
    margin: 0 1em;
    padding: 5px 20px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    text-decoration: none;
    color: #333;
  }

  .active {
    background-color: #e9ecef; /* Подсветка активной вкладки */
    font-weight: bold; /* Жирный шрифт для активной вкладки */
    border-bottom: 2px solid #00c3f5;
  }
}
</style>