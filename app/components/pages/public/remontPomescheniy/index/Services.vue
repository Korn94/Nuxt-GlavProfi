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
            icon="ic:round-construction"
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

<script setup>
// Опционально: можно оставить массив services закомментированным или удалить
/*
const services = [
  {
    icon: "fluent:food-24-regular",
    title: "Рестораны и кафе",
    description: "Проектируем зоны так, чтобы официанты экономили время, а интерьер увеличивал средний чек.",
    cta: "Посмотреть примеры",
    result: "Спрятали вентиляцию так, что её можно чинить без закрытия заведения.",
    link: "/remont-pomescheniy/restorany-i-cafe"
  },
  {
    icon: "mdi:office-building",
    title: "Офисы",
    description: "Зонирование, акустика и 'тихие комнаты' снижают текучку и повышают продуктивность.",
    cta: "Посмотреть примеры",
    result: "Текучка снизилась на 35%, продуктивность выросла на 22%.",
    link: "/remont-pomescheniy/ofisy"
  },
  {
    icon: "mdi:school",
    title: "Учебные центры",
    description: "Цвета, акустика и модульные пространства повышают концентрацию и усвоение на 33%.",
    cta: "Посмотреть примеры",
    result: "Класс трансформируется под разные форматы занятий.",
    link: "/remont-pomescheniy/uchebnye-centry"
  }
]
*/
</script>

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



<!-- Основной блок
<template>
  <section class="services">
    <div class="container">
      <h2 class="section-title">Выберите тип помещения — <span>покажем, как ремонт превратит его в ваше конкурентное преимущество</span></h2>
      
      <div class="services-grid">
        <NuxtLink
          v-for="service in services"
          :key="service.title"
          :to="service.link"
          class="service-link"
        >
          <PagesRemontPomescheniyIndexUiServiceCard
            :icon="service.icon"
            :title="service.title"
            :description="service.description"
            :cta="service.cta"
            :result="service.result"
          />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
const services = [
  {
    icon: "fluent:food-24-regular",
    title: "Рестораны и кафе",
    description: "Проектируем зоны так, чтобы официанты экономили время, а интерьер увеличивал средний чек.",
    cta: "Посмотреть примеры",
    result: "Спрятали вентиляцию так, что её можно чинить без закрытия заведения.",
    link: "/remont-pomescheniy/restorany-i-cafe"
  },
  {
    icon: "mdi:store",
    title: "Магазины",
    description: "Освещение и планировка по законам нейропсихологии увеличивают продажи на 18–31%.",
    cta: "Посмотреть примеры",
    result: "Наш вариант освещения увеличил продажи витрины на 14%.",
    link: "/remont-pomescheniy/magaziny"
  },
  {
    icon: "mdi:office-building",
    title: "Офисы",
    description: "Зонирование, акустика и 'тихие комнаты' снижают текучку и повышают продуктивность.",
    cta: "Посмотреть примеры",
    result: "Текучка снизилась на 35%, продуктивность выросла на 22%.",
    link: "/remont-pomescheniy/ofisy"
  },
  {
    icon: "mdi:hospital",
    title: "Клиники и Медицинские центры",
    description: "Антибактериальные покрытия и освещение снижают стресс и увеличивают доверие пациентов.",
    cta: "Посмотреть примеры",
    result: "Отказы от процедур снизились на 28%.",
    link: "/remont-pomescheniy/kliniki-i-meditsinskie-tsentry"
  },
  {
    icon: "mdi:school",
    title: "Учебные центры",
    description: "Цвета, акустика и модульные пространства повышают концентрацию и усвоение на 33%.",
    cta: "Посмотреть примеры",
    result: "Класс трансформируется под разные форматы занятий.",
    link: "/remont-pomescheniy/uchebnye-centry"
  }
]
</script>

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
</style> -->