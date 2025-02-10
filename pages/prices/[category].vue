<template>
  <div>
    <PagesPrices />
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
    metaDescription: "Профессиональный ремонт пола под ключ в 2025 году. Укладка ламината, паркета, плитки. Выравнивание основания и монтаж плинтусов. Гарантия качества!"
  },
  { 
    id: "walls", 
    name: "Стены", 
    title: "Цены на ремонт стен",
    metaTitle: "Цены на ремонт стен - 2025",
    metaDescription: "Качественный ремонт стен под покраску или обои. Шпатлевка, грунтовка, выравнивание. Используем современные материалы и технологии. Закажите расчет!"
  },
  { 
    id: "ceiling", 
    name: "Потолок", 
    title: "Цены на ремонт потолка",
    metaTitle: "Цены на ремонт потолка - 2025",
    metaDescription: "Ремонт потолков любой сложности: покраска, натяжные потолки, гипсокартон. Профессиональный подход и доступные цены. Сделаем ваш потолок идеальным!"
  },
  { 
    id: "plumbing", 
    name: "Сантехника", 
    title: "Цены на ремонт сантехники",
    metaTitle: "Цены на ремонт сантехники - 2025",
    metaDescription: "Установка и ремонт сантехники: трубы, смесители, унитазы. Устранение протечек и засоров. Работаем быстро и качественно. Гарантия на все работы!"
  },
  { 
    id: "electricity", 
    name: "Электрика", 
    title: "Цены на ремонт электрики",
    metaTitle: "Цены на ремонт электрики - 2025",
    metaDescription: "Монтаж и ремонт электропроводки. Установка розеток, выключателей, освещения. Безопасность и надежность. Опытные электрики выполнят работу точно в срок!"
  },
  { 
    id: "other", 
    name: "Дополнительные услуги", 
    title: "Цены на дополнительные услуги",
    metaTitle: "Цены на дополнительные услуги - 2025",
    metaDescription: "Широкий спектр дополнительных услуг по ремонту помещений: установка дверей, окон, мебели. Индивидуальный подход к каждому клиенту. Звоните!"
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