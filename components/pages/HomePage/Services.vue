<template>
  <div>
    <!-- <UIElementsImgBlock :tabs="tabs" title="Наши услуги - всё, что нужно" subtitle="в одном месте" /> -->
    <UIElementsImgBlock :tabs="tabs">
      <h3>Проекты и работы</h3>
      <!-- <h2>Все обещают качественно и в срок? <br> <span>Мы это делаем,</span> посмотрите объекты которые реализовали.</h2> -->
    </UIElementsImgBlock>  
  </div>
</template>

<script>
export default {
  data() {
    return {
      tabs: [
        {
          key: 'projects',
          // label: 'Проекты',
          categories: ['Все проекты', 'Склады / Ангары', 'Офисы', 'Аптеки', 'Банки', 'Кафе', 'Магазины', 'Салоны', 'Гипсокартон', 'Электромонтаж', 'Демонтаж'],
          images: [
            { src: '/portfolio/img/Склады/3.jpg', category: 'Склады / Ангары', info: 'Ремонт Складов и Ангаров под ключ' },
            { src: '/portfolio/img/Офисы/1.jpg', category: 'Офисы', info: 'Отделка Офисов' },
            { src: '/portfolio/img/Аптека1/3.jpg', category: 'Аптеки', info: 'Ремонт Аптек с лицензией' },
            { src: '/portfolio/img/Аптека2/1.jpg', category: 'Аптеки', info: 'Ремонт Аптек' },
            { src: '/portfolio/img/Банк/5.jpg', category: 'Банки', info: 'Ремонт Банковских помещений' },
            { src: '/portfolio/img/Кафе/1.jpg', category: 'Кафе', info: 'Ремонт Кафе' },
            { src: '/portfolio/img/Магазин1/1.jpg', category: 'Магазины', info: 'Ремонт Магазина' },
            { src: '/portfolio/img/Магазин2/2.jpg', category: 'Магазины', info: 'Ремонт в Магазине под ключ' },
            { src: '/portfolio/img/Салон/1.jpg', category: 'Салоны', info: 'Дизайнерский ремонт Салона красоты' },
            { src: '/portfolio/img/Гипсокартон/1.jpg', category: 'Гипсокартон', info: 'Гипсокартонные конструкции' },
            { src: '/portfolio/img/Электрика/2.jpg', category: 'Электромонтаж', info: 'Электромонтажные работы' },
            { src: '/portfolio/img/Демонтаж/1.jpg', category: 'Демонтаж', info: 'Демонтажные работы' },
          ],
        },
        // {
        //   key: 'services',
        //   label: 'Услуги',
        //   categories: ['Все услуги', 'Отделка', 'Электромонтаж', 'Сантехника'],
        //   images: [
        //     { src: '/main/3.jpg', category: 'Отделка' },
        //     { src: '/main/2.jpg', category: 'Электромонтаж' },
        //     { src: '/main/1.jpg', category: 'Отделка' },
        //     { src: '/main/3.jpg', category: 'Сантехника' },
        //   ],
        // },
      ],
    };
  },
};
</script>

<style lang="scss" scoped>
h3 {
  text-align: center;
  font-size: 2rem;
}
</style>