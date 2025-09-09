<template>
  <main class="landing">
    <!-- Главный заголовок -->
    <section class="landing__hero">
      <h1 class="landing__title">
        Ремонт медцентров в Рязани: как открыть клинику на 2 недели раньше без нарушения санитарных норм?
      </h1>
      <p class="landing__subtitle">
        Вы теряете 150 000 рублей в день, пока ваш медцентр не работает из-за затянувшегося ремонта? Мы ремонтируем медицинские учреждения в Рязани за 45 дней вместо 60, соблюдая все санитарные нормы и получая все необходимые разрешения — без задержек и скрытых платежей.
      </p>
    </section>

    <!-- Проблема -->
    <section class="landing__section">
      <h2 class="landing__subtitle">
        Почему ремонт медцентра — это не просто "побелить стены"?
      </h2>
      <p>
        Когда вы заказываете ремонт обычного офиса, можно немного сэкономить на материалах или упростить дизайн. Но с медицинским учреждением так не получится. Здесь каждая деталь регулируется строгими нормами, и одно неверное решение может обернуться:
      </p>
      <ul class="landing__list">
        <li>Штрафами от Роспотребнадзора до 500 000 рублей</li>
        <li>Задержкой открытия на 2–3 недели из-за переделок</li>
        <li>Потерей репутации у будущих пациентов</li>
      </ul>
      <p>
        Мы отремонтировали 17 медицинских объектов в Рязани за 3 года. Знаем, как вывести медцентр на открытие в срок и без проблем с проверками.
      </p>
    </section>

    <!-- Особенности -->
    <section class="landing__section">
      <h2 class="landing__subtitle">5 особенностей ремонта медцентра, о которых молчат другие</h2>
      <div v-for="(item, i) in features" :key="i" class="landing__feature">
        <h3 class="landing__feature-title">{{ item.title }}</h3>
        <p><strong>Свойство:</strong> {{ item.prop }}</p>
        <p><strong>Выгода:</strong> {{ item.benefit }}</p>
        <p><strong>Конкретика:</strong> {{ item.example }}</p>
      </div>
    </section>

    <!-- CTA -->
    <section class="landing__cta">
      <h2>Хотите открыть медцентр без задержек и штрафов?</h2>
      <p>Получите точный срок и стоимость ремонта за 24 часа — без обязательств.</p>
      <p><strong>Гарантия срока в договоре:</strong> если задержим — платим 10 000 ₽ за каждый день.</p>
      <button class="landing__btn" @click="onSubmit">Заказать бесплатный замер</button>
      <p class="landing__small">Консультация и выезд — бесплатно. Никаких обязательств.</p>
    </section>
  </main>
</template>

<script setup>
const features = [
  {
    title: '1. Санузлы: не просто кафель, а целая система',
    prop: 'Укладка керамогранита в санузлах',
    benefit: 'Система скрытого монтажа — замена деталей за 1 день без вскрытия стен.',
    example: 'В клинике "Здоровье+" ремонт санузла занял 7 дней вместо 14.'
  },
  {
    title: '2. Вентиляция: ваша лицензия на работу',
    prop: 'Монтаж приточно-вытяжной вентиляции',
    benefit: 'Проходит проверку Роспотребнадзора с первого раза.',
    example: 'Стоматология "Улыбка" открылась на 10 дней раньше.'
  },
  {
    title: '3. Электропроводка: безопасность прежде всего',
    prop: 'Прокладка электропроводки в медпомещениях',
    benefit: 'Разделение цепей и резервное питание — оборудование не выйдет из строя.',
    example: 'В "МедПрофи" — 4 независимые зоны. Центр работает даже при аварии.'
  },
  {
    title: '4. Антимикробные покрытия: невидимая защита',
    prop: 'Нанесение специальных покрытий на стены',
    benefit: 'Поверхности чище на 30% дольше — меньше уборка и расходов.',
    example: 'В "Улыбке" сэкономили 8 часов в неделю и 25% на дезинфекции.'
  },
  {
    title: '5. Планировка: +20% к потоку пациентов',
    prop: 'Проектирование потоков пациентов и персонала',
    benefit: 'Обслуживаете на 3–4 пациента в час больше без увеличения штата.',
    example: 'В "МедПрофи" — 22 пациента в час вместо 18.'
  }
]

const onSubmit = () => {
  alert('Спасибо! Наш специалист свяжется с вами в течение дня.')
}
</script>

<style lang="scss" scoped>
.landing {
  font-family: 'Segoe UI', sans-serif;
  line-height: 1.7;
  color: #222;
  max-width: 1000px;
  margin: 5em auto;
  padding: 2rem 1.5rem;
}

.landing__hero {
  text-align: center;
  margin-bottom: 3rem;
}

.landing__title {
  font-size: 1.8rem;
  font-weight: 700;
  color: $blue;
  margin-bottom: 1.2rem;
}

.landing__subtitle {
  font-size: 1.1rem;
  color: #444;
  max-width: 800px;
  margin: 0 auto;
}

.landing__section {
  background: #fff;
  padding: 1.8rem;
  border-radius: 12px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 2.5rem;
}

.landing__list {
  margin: 1.2rem 0;
  padding-left: 1.8rem;

  li {
    margin-bottom: 0.6rem;
    position: relative;

    &::before {
      content: "•";
      color: $blue;
      font-weight: bold;
      position: absolute;
      left: -1.2rem;
    }
  }
}

.landing__feature {
  margin-bottom: 1.8rem;
  padding-left: 0.8rem;
  border-left: 3px solid $blue;
}

.landing__feature-title {
  font-size: 1.3rem;
  color: $blue;
  margin-bottom: 0.8rem;
}

.landing__cta {
  text-align: center;
  padding: 2.5rem 2rem;
  border: 1px solid $blue;
  // color: white;
  border-radius: 14px;
  margin-bottom: 2rem;
}

.landing__cta h2 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.landing__btn {
  background: $background-light;
  color: $blue;
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin: 1.2rem 0;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
}

.landing__small {
  font-size: 0.95rem;
  opacity: 0.9;
  margin-top: 0.5rem;
}

/* Адаптив */
@media (max-width: 600px) {
  .landing__title { font-size: 1.6rem; }
  .landing__feature-title { font-size: 1.2rem; }
  .landing__cta h2 { font-size: 1.5rem; }
  .landing__btn { padding: 0.9rem 2rem; font-size: 1rem; }
}
</style>