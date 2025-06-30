<template>
  <div class="not-found">
    <div class="content-wrapper">
      <h1 class="error-code">404</h1>
      <p class="error-message">Страница не найдена</p>
      <button class="home-button" @click="goHome">Вернуться на главную</button>
    </div>
  </div>
</template>

<script setup>
const goHome = () => {
  navigateTo('/')
}
</script>

<style lang="scss" scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f9f9f9;
  font-family: 'Inter', sans-serif;
  padding: 2rem;

  .content-wrapper {
    text-align: center;
    max-width: 500px;
    margin: auto;
  }

  .error-code {
    font-size: 5rem;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 1rem;
  }

  .error-message {
    font-size: 1.5rem;
    color: #555;
    margin-bottom: 2rem;
  }

  .home-button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    background-color: #3498db;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: #2980b9;
    }

    margin-bottom: 3rem;
  }
}
</style>