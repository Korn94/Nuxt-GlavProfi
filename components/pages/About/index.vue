<template>
  <div class="about-page">
    <div class="page-header">
      <h1>О компании</h1>
    </div>
    <div class="page-content">
      <section>
        <h2>Глав Профи</h2>
        <p>
          Компания <strong>ГлавПрофи</strong> имеет опыт работы с <b>2008</b> года. За это время успешно реализовали сотни проектов и заслужили доверие множества клиентов, которые продолжают сотрудничать с нами годами.
        </p>
      </section>
      <section>
        <h2>Сфера нашей деятельности</h2>
        <h3>Типы объектов</h3>
        <ul>
          <li>Офисные пространства</li>
          <li>Торговые площади (магазины, бутики)</li>
          <li>Заведения общественного питания (рестораны, кафе, бары)</li>
          <li>Бьюти-сфера (салоны красоты, спа-центры, барбершопы)</li>
          <li>Промышленные помещения (склады, производства)</li>
          <li>Фитнес-индустрия (спортивные залы, фитнес-клубы)</li>
          <li>Медицинские учреждения (клиники, аптеки, лаборатории)</li>
          <li>Образовательные центры</li>
          <li>И другие коммерческие объекты</li>
        </ul>
        <h3>Спектр услуг</h3>
        <ul>
          <li>Косметический и капитальный ремонт</li>
          <li>Отделочные работы всех типов</li>
          <li>Инженерные коммуникации</li>
          <li>Строительно-монтажные работы</li>
          <li>Дизайнерская отделка</li>
          <li>Все виды сантехнических работ</li>
        </ul>
      </section>
      <section>
        <h2>Наши преимущества</h2>
        <h3>Что делает работу с нами удобной?</h3>
        <ul>
          <li>Прямые договоренности с поставщиками материалов</li>
          <li>Экспертная консультация по выбору материалов</li>
          <li>Полное сопровождение проекта от начала до сдачи</li>
          <li>Работа под ключ</li>
        </ul>
        <h3>Особые условия для клиентов</h3>
        <ul>
          <li>Бесплатный выезд специалиста</li>
          <li>Профессиональные консультации</li>
          <li>Официальное оформление договора</li>
          <li>Гарантия качества и сроков</li>
          <li>Команды специалистов узкого профиля</li>
        </ul>
      </section>
      <section>
        <h2>Хотите узнать больше?</h2>
        <p>
          Свяжитесь с нами для получения подробной консультации или расчета стоимости вашего проекта!
        </p>
        <button @click="openModal">Связаться с нами</button>
        <UIFormsContactForm v-if="showModal" @close="closeModal" @formSubmitted="handleFormSubmitted" />
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

useHead({
  title: 'О компании',
  meta: [
    { name: 'description', content: 'Информация о нашей компании и услугах' }
  ]
})
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
        color: #555;
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
          background-color: #00c3f5,;
        }
      }
    }
  }
}
</style>