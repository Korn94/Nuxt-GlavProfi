<!-- components/CommercialRepairGuarantees.vue -->
<template>
  <section class="guarantees">
    <div class="container">
      <h2 class="section-title">Почему с нами не бывает "ремонтных кошмаров"</h2>
      
      <div class="guarantees-grid">
        <PagesRemontPomescheniyIndexUiGuaranteeCard
          v-for="guarantee in guarantees"
          :key="guarantee.title"
          v-bind="guarantee"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
const guarantees = [
  {
    title: "Фиксированная цена с первого дня",
    description: "никаких «неожиданностей» после начала работ"
  },
  {
    title: "Гарантия срока",
    description: "если задерживаем, платим штраф из своего кармана"
  },
  {
    title: "Проверка на каждом этапе",
    description: "не ждём финальной приёмки, чтобы найти ошибку"
  },
  {
    title: "Ремонт без вашего участия",
    description: "вы получаете готовое помещение, а не головную боль"
  }
];
</script>

<style scoped lang="scss">
.guarantees {
  padding: 5rem 0;
  background: $background-dark;

  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3.5rem;
  color: $text-light;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
}

.guarantees-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}
</style>