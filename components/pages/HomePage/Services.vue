<template>
  <div>
    <div class="box">
      <!-- <h2>Все обещают качественно и в срок?<br> Мы это делаем,<br> посмотрите <span>объекты которые реализовали.</span></h2> -->
      <!-- <h2>Слова — это одно, а дела — совсем другое.<br> Предпочитаем показывать, а не рассказывать.<br> Готовы увидеть, как мы <span>воплощаем идеи в жизнь?</span></h2> -->
      <h2>Слова — это одно, а дела — совсем другое<br> <span>Предпочитаем показывать,</span> а не <br>рассказывать</h2>
      <UIElementsArrow />
    </div>
    <!-- <UIElementsImgBlock :tabs="tabs" title="Наши услуги - всё, что нужно" subtitle="в одном месте" /> -->
    <UIElementsImgBlock :tabs="tabs">
      <h3>Примеры наших работ</h3>
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
          categories: ['Все проекты', 'Офисы', 'Склады', 'Аптеки', 'Ангары', 'Магазины'],
          images: [
            { src: '/main/1.jpg', category: 'Офисы' },
            { src: '/main/2.jpg', category: 'Офисы' },
            { src: '/main/3.jpg', category: 'Магазины' },
            { src: '/main/1.jpg', category: 'Магазины' },
            { src: '/main/3.jpg', category: 'Склады' },
            { src: '/main/1.jpg', category: 'Склады' },
            { src: '/main/3.jpg', category: 'Офисы' },
            { src: '/main/2.jpg', category: 'Склады' },
            { src: '/main/1.jpg', category: 'Ангары' },
            { src: '/main/2.jpg', category: 'Аптеки' },
            { src: '/main/3.jpg', category: 'Аптеки' },
            { src: '/main/1.jpg', category: 'Ангары' },
            { src: '/main/2.jpg', category: 'Аптеки' },
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
.box {
  background: #18191b;
  position: relative;
  clip-path: polygon(
    0% 0%,       /* Левый верхний угол */
    100% 0%,     /* Правый верхний угол */
    100% 70%,    /* Правый нижний угол (выше центра) */
    50% 100%,    /* Нижний центральный угол (ниже центра) */
    0% 70%       /* Левый нижний угол (выше центра) */
  );

  h2 {
    text-align: center;
    color: #fff;
    padding: 2em 0 1em;
    margin: 0;

    @media (max-width: 768px) {
      font-size: 1.2em;
      padding: 1.5em 0 1em;
    }
  }
}

h3 {
  text-align: center;
  font-size: 2rem;
}
</style>