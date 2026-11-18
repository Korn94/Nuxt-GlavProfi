<!-- app\components\pages\public\remontPomescheniy\index\Services.vue -->
<template>
  <section class="services">
    <div class="container">
      <h2 class="section-title">Выберите тип помещения — <span>покажем, как ремонт превратит его в ваше конкурентное преимущество</span></h2>
      
      <div class="services-grid">
        <!-- Готовые страницы -->
        <NuxtLink to="/remont-pomescheniy/magaziny" class="service-link">
          <PagesPublicRemontPomescheniyIndexUiServiceCard
            icon="mdi:store"
            title="Магазины"
            description="Освещение и планировка по законам нейропсихологии увеличивают продажи на 18–31%."
            cta="Посмотреть примеры"
            result="Наш вариант освещения увеличил продажи витрины на 14%."
          />
        </NuxtLink>

        <NuxtLink to="/remont-pomescheniy/kliniki-i-meditsinskie-tsentry" class="service-link">
          <PagesPublicRemontPomescheniyIndexUiServiceCard
            icon="mdi:hospital"
            title="Клиники и Медицинские центры"
            description="Антибактериальные покрытия и освещение снижают стресс и увеличивают доверие пациентов."
            cta="Посмотреть примеры"
            result="Отказы от процедур снизились на 28%."
          />
        </NuxtLink>

        <!-- Информационная карточка "в разработке" -->
        <div class="service-link disabled">
          <PagesPublicRemontPomescheniyIndexUiServiceCard
            icon="material-symbols:construction"
            title="Скоро появятся новые направления"
            :description="'Работаем над разделами: рестораны, офисы, учебные центры и другие. Скоро — больше кейсов и решений.'"
            cta=""
            result=""
            :is-placeholder="true"
          />
        </div>

        <!-- 
        Закомментированные карточки — можно раскомментировать позже
        <NuxtLink v-for="service in services" :key="service.title" :to="service.link" class="service-link">
          <PagesPublicRemontPomescheniyIndexUiServiceCard
            :icon="service.icon"
            :title="service.title"
            :description="service.description"
            :cta="service.cta"
            :result="service.result"
          />
        </NuxtLink>
        -->
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.services {
  padding: 5rem 0;

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

  @media (max-width: 768px) {
    font-size: 2rem;
  }
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

// Временные стили
.disabled {
  pointer-events: none;
  opacity: 0.7;
  transition: none;

  .service-card {
    border: 1px dashed #ccc;
    background-color: #f9f9f9;
  }
}
</style>
