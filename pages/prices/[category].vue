<template>
  <div>
    <PagesPrices />

    <UIElementsOffer 
      title="Делимся своими оптовыми скидками на материал"
      description="Наши клиенты получают лучшие цены на строительные материалы для своего объекта. Так же помогаем в организации закупок и логистики"
      buttonText="Связаться"
    />

    <PagesHomePageCall />
    <PagesHomePageCalc />
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { useHead, computed } from "#imports";

const route = useRoute();

// Данные категорий
const categories = [
  { 
    id: "floor", 
    name: "Пол", 
    title: "Цены на ремонт пола",
    metaTitle: "Цены на ремонт пола 2025",
    metaDescription: "Профессиональный ремонт пола под ключ в 2025 году. Укладка ламината, паркета, плитки. Выравнивание основания и монтаж плинтусов. Гарантия качества!",
    metaKeywords: "ремонт пола, укладка ламината, укладка паркета, укладка плитки, выравнивание пола, стяжка пола, монтаж плинтусов, ремонт полов под ключ"
  },
  { 
    id: "walls", 
    name: "Стены", 
    title: "Цены на ремонт стен",
    metaTitle: "Цены на ремонт стен - 2025",
    metaDescription: "Качественный ремонт стен под покраску или обои. Шпатлевка, грунтовка, выравнивание. Используем современные материалы и технологии. Закажите расчет!",
    metaKeywords: "ремонт стен, шпатлевка стен, грунтовка стен, выравнивание стен, оклейка обоев, покраска стен, отделка стен, ремонт стен под ключ"
  },
  { 
    id: "ceiling", 
    name: "Потолок", 
    title: "Цены на ремонт потолка",
    metaTitle: "Цены на ремонт потолка - 2025",
    metaDescription: "Ремонт потолков любой сложности: покраска, натяжные потолки, гипсокартон. Профессиональный подход и доступные цены. Сделаем ваш потолок идеальным!",
    metaKeywords: "ремонт потолка, натяжные потолки, потолки из гипсокартона, покраска потолка, отделка потолка, монтаж подвесных потолков, ремонт потолков под ключ"
  },
  { 
    id: "plumbing", 
    name: "Сантехника", 
    title: "Цены на ремонт сантехники",
    metaTitle: "Цены на ремонт сантехники - 2025",
    metaDescription: "Установка и ремонт сантехники: трубы, смесители, унитазы. Устранение протечек и засоров. Работаем быстро и качественно. Гарантия на все работы!",
    metaKeywords: "ремонт сантехники, установка труб, замена смесителей, ремонт унитазов, устранение протечек, прочистка труб, сантехнические работы, сантехник на дом"
  },
  { 
    id: "electricity", 
    name: "Электрика", 
    title: "Цены на ремонт электрики",
    metaTitle: "Цены на ремонт электрики - 2025",
    metaDescription: "Монтаж и ремонт электропроводки. Установка розеток, выключателей, освещения. Безопасность и надежность. Опытные электрики выполнят работу точно в срок!",
    metaKeywords: "ремонт электрики, монтаж электропроводки, установка розеток, замена выключателей, электромонтажные работы, электрик на дом, электробезопасность, электрика под ключ"
  },
  { 
    id: "other", 
    name: "Дополнительные услуги", 
    title: "Цены на дополнительные услуги",
    metaTitle: "Цены на дополнительные услуги - 2025",
    metaDescription: "Широкий спектр дополнительных услуг по ремонту помещений: установка дверей, окон, мебели. Индивидуальный подход к каждому клиенту. Звоните!",
    metaKeywords: "дополнительные услуги, установка дверей, монтаж окон, сборка мебели, установка шкафов, монтаж кондиционеров, навеска полок, комплексные ремонтные работы"
  },
];

// Текущая категория
const currentCategory = computed(() => {
  return categories.find(cat => cat.id === route.params.category) || {};
});

// Установка мета-тегов
useHead({
  title: currentCategory.value.metaTitle,
  meta: [
    { name: "description", content: currentCategory.value.metaDescription },
    { property: "og:title", content: currentCategory.value.metaTitle },
    { property: "og:description", content: currentCategory.value.metaDescription },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `https://yourdomain.com/prices/${route.params.category}` },
    { property: "og:image", content: "https://yourdomain.com/images/preview.jpg" }, // Укажите URL изображения для Open Graph
  ],
});
</script>

<style lang="scss" scoped>
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
</style>