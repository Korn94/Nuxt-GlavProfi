<template>
  <div class="about-page">
    <div class="page-header">
      <h1>О компании</h1>
    </div>
    <div class="page-content">
      <section>
        <h2>Глав Профи</h2>
        <p>
          Работаем с <b>2014</b> года и за это время завоевали доверие сотен клиентов. Нас рекомендуют, а многие работают с нами не первый год, зная, что мы предлагаем надежное качество и четкое выполнение сроков.
        </p>
      </section>
      <section>
        <h2>С какими объектами мы работаем?</h2>
        <h3>Мы выполняем ремонт и отделку:</h3>
        <ul>
          <li>Офисов</li>
          <li>Магазинов и торговых точек</li>
          <li>Ресторанов, кафе и баров</li>
          <li>Салонов красоты, барбершопов и спа-центров</li>
          <li>Складов и производственных помещений</li>
          <li>Спортивных залов и фитнес-клубов</li>
          <li>Медицинских центров, аптек и лабораторий</li>
          <li>Учебных центров и образовательных учреждений</li>
          <li>И другие коммерческие объекты</li>
        </ul>
        <p>Готовы взяться за <b>любой коммерческий объект</b>.</p>
        <h2>Какие виды работ мы проводим? </h2>
        <h3>Мы предлагаем:</h3>
        <ul>
          <li>Косметический и капитальный ремонт</li>
          <li>Отделочные работы всех типов</li>
          <li>Монтаж инженерных коммуникаций (электрика, водоснабжение, вентиляция)</li>
          <li>Установку перегородок, дверей, стеклянных конструкций</li>
          <li>Покраску, укладку плитки, паркетных полов</li>
          <li>Сантехнические работы</li>
          <li>Декоративные работы и монтаж сложных дизайнерских решений</li>
          <li>И другие работы</li>
        </ul>
        <p><b>Полный комплекс услуг</b>: от разработки проекта до финишной отделки. Мы берем на себя все этапы работ!</p>
      </section>
      <section>
        <h2>Наши преимущества</h2>
        <h3>Почему работать с нами — это удобно? </h3>
        <ul>
          <li>Контракт с проверенными поставщиками материалов. Мы закупаем материалы для вас по оптовым ценам</li>
          <li>Помогаем с выбором, объясняем плюсы и минусы материалов и решений</li>
          <li>Все организационные моменты берем на себя — от закупок до сдачи объекта</li>
          <li>Возможность работы под ключ</li>
        </ul>
        <h3>Особые условия для клиентов</h3>
        <ul>
          <li>Бесплатный выезд и расчет на вашем объекте</li>
          <li>Консультации по всем вопросам</li>
          <li>Заключаем официальные договора — никаких рисков для вас</li>
          <li>Несколько больших бригад, каждая из которых специализируется на своей области, что позволяет нам выполнять работы качественно и точно в срок</li>
        </ul>
      </section>
      <section>
        <h2>Хотите знать больше?</h2>
        <p>
          Свяжитесь с нами для получения подробной консультации или расчета стоимости вашего проекта!
        </p>
        <button @click="openModal">Связаться с нами</button>
        <UiFormsContactForm v-if="showModal" @close="closeModal" @formSubmitted="handleFormSubmitted" />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showModal = ref(false)

// Метод для открытия модального окна
const openModal = () => {
  showModal.value = true
}

// Метод для закрытия модального окна
const closeModal = () => {
  showModal.value = false
}

// Метод для обработки отправки формы
const handleFormSubmitted = (formData) => {
  console.log("Форма отправлена:", formData)
  // Здесь можно добавить логику отправки данных на сервер
  closeModal() // Закрываем форму после отправки
}
</script>

<style lang="scss" scoped>
.about-page {
  margin-top: 5em;
  padding: 40px 20px;
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  
  @media (max-width: 768px) {
    margin-top: 2em;
  }

  .page-header {
    text-align: center;
    margin-bottom: 40px;

    h1 {
      font-size: 2rem;
      color: #18191b;
    }
  }

  .page-content {
    max-width: 1200px;
    margin: 0 auto;

    section {
      margin-bottom: 30px;

      h2 {
        font-size: 1.5rem;
        color: #00c3f5; // Цвет заголовков
        margin-bottom: 15px;
      }

      p {
        font-size: 1rem;
      }

      ul {
        margin-left: 20px;
        list-style-type: disc;

        li {
          margin-bottom: 5px;
        }
      }

      button {
        padding: 10px 20px;
        background-color: #00c3f5;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.3s ease;

        &:hover {
          background-color: #00c3f5;
        }
      }
    }
  }
}
</style>