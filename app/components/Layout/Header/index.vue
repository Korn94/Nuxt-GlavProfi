<!-- app/components/Layout/Header/index.vue -->
<!--
  ⚡ Шапка рендерится НА СЕРВЕРЕ.
  Раньше здесь был `shallowRef(null)` + выбор компонента в onMounted: в SSR-HTML
  оставался пустой <div>, шапка появлялась только после гидрации и загрузки
  async-чанка → сдвиг вёрстки (CLS) и полное отсутствие навигации в HTML.

  Теперь обе версии рендерятся сразу, а нужную показывает CSS по тому же
  брейкпоинту 840px, что и раньше. Никаких замеров ширины до гидрации.
-->
<template>
  <div class="header-container">
    <div class="header-container__desktop">
      <LayoutHeaderDesktop />
    </div>
    <div class="header-container__mobile">
      <LayoutHeaderMobile />
    </div>
  </div>
</template>

<script setup>
import LayoutHeaderDesktop from './desktop/index.vue'
import LayoutHeaderMobile from './mobile/index.vue'
</script>

<style scoped>
/* Тот же брейкпоинт, что использовался в JS (window.innerWidth <= 840) */
.header-container__desktop {
  display: block;
}

.header-container__mobile {
  display: none;
}

@media (max-width: 840px) {
  .header-container__desktop {
    display: none;
  }

  .header-container__mobile {
    display: block;
  }
}
</style>
