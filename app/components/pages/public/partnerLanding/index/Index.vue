<!-- app/components/pages/public/partnerLanding/index/Index.vue -->
 <template>
  <div class="partner">
    <!-- ===================== NAV ===================== -->
    <div class="partner__nav-wrap">
      <nav class="partner__nav">
        <div class="logo">Глав<span>Профи</span></div>
        <a class="navlink" href="#how">Как это работает</a>
      </nav>
    </div>

    <!-- ===================== HERO ===================== -->
    <header class="hero">
      <div class="container">
        <div class="hero__grid">
          <div class="hero__content">
            <div class="kicker">
              <span class="dot"></span>
              Партнёрская программа для коммерческих брокеров · Рязань
            </div>
            <h1 class="hero__title">
              Зарабатывайте<br />на ремонте
              <span class="accent">ваших клиентов.</span>
            </h1>
            <p class="hero__lead">
              Вы помогаете клиенту найти коммерческое помещение. Мы помогаем превратить его
              в работающий бизнес. Вы передаёте лид — ГлавПрофи ведёт ремонт — вы получаете
              партнёрское вознаграждение.
            </p>
            <div class="hero__actions">
              <a class="btn btn--primary" href="#join">Стать партнёром</a>
              <a class="btn btn--ghost" href="#how">Посмотреть механику</a>
            </div>
            <div class="hero__note">
              Без обязательства рекомендовать нас. Решение о работе с подрядчиком всегда
              остаётся за клиентом.
            </div>
          </div>

          <div class="hero__card">
            <h3 class="hero__card-title">Один клиент.<br />Две сделки.</h3>
            <div class="hero__money">₽ + ₽</div>
            <div class="hero__money-sub">
              Доход от недвижимости + дополнительный доход от ремонта
            </div>
            <div class="hero__flow">
              <div><b>Вы</b><span>приводите клиента</span></div>
              <div><b>ГлавПрофи</b><span>продаёт и выполняет ремонт</span></div>
              <div><b>Вы</b><span>получаете вознаграждение</span></div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- ===================== WHY (dark) ===================== -->
    <section class="section section--dark">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Почему мы сделали эту программу</div>
          <h2 class="section-title">Вы знаете о ремонте раньше подрядчика.</h2>
          <p class="section-text">
            Когда клиент арендует или покупает помещение, вопрос ремонта часто появляется
            сразу после сделки. Но брокеру не хочется вмешиваться в ремонт и рисковать
            отношениями с клиентом.
          </p>
        </div>
        <div class="problem">
          <div class="problem__card problem__card--bad">
            <div class="problem__num">КАК БЫЛО</div>
            <h3>«Посоветую подрядчика — а вдруг он всё испортит?»</h3>
            <p>
              Плохой ремонт превращается в проблему не только для подрядчика. Клиент может
              связать рекомендацию с брокером.
            </p>
          </div>
          <div class="problem__card problem__card--good">
            <div class="problem__num">КАК СТАНОВИТСЯ</div>
            <h3>«Передам лид — дальше ГлавПрофи сам.»</h3>
            <p>
              Вы не отвечаете за ремонт и не продаёте услуги. Вы даёте клиенту
              дополнительную возможность, а мы берём процесс на себя.
            </p>
          </div>
        </div>
        <div class="quote">
          Главная идея: вы не рекомендуете подрядчика на свой страх и риск. Вы передаёте
          потенциального клиента в профессиональную систему и получаете деньги за результат.
        </div>
      </div>
    </section>

    <!-- ===================== HOW ===================== -->
    <section id="how" class="section">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Механика</div>
          <h2 class="section-title">Максимально просто для брокера.</h2>
          <p class="section-text">
            Не нужно продавать ремонт, объяснять смету или контролировать бригаду.
          </p>
        </div>
        <div class="steps">
          <div class="step">
            <b>01</b>
            <h4>Увидели потребность</h4>
            <p>Клиент взял помещение и говорит, что нужен ремонт.</p>
          </div>
          <div class="step">
            <b>02</b>
            <h4>Проверили номер</h4>
            <p>Система показывает, не зарегистрирован ли клиент ранее.</p>
          </div>
          <div class="step">
            <b>03</b>
            <h4>Передали лид</h4>
            <p>Имя, телефон, объект и короткое описание задачи.</p>
          </div>
          <div class="step">
            <b>04</b>
            <h4>Мы работаем</h4>
            <p>Связываемся, выезжаем, считаем, продаём и выполняем.</p>
          </div>
          <div class="step">
            <b>05</b>
            <h4>Вы получаете деньги</h4>
            <p>После выполнения условий партнёрской программы.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== OFFER ===================== -->
    <section class="section section--compact-top">
      <div class="container">
        <div class="offer">
          <div class="offer__big">
            <div class="eyebrow">Партнёрский оффер</div>
            <h3>Монетизируйте следующий этап жизни клиента.</h3>
            <p>
              Вы уже помогли клиенту решить вопрос с помещением. Теперь передайте ему
              подрядчика на следующий этап — ремонт и подготовку объекта к открытию.
            </p>
            <div class="checks">
              <div>Прозрачная регистрация лида</div>
              <div>Закрепление за партнёром</div>
              <div>Контроль статуса</div>
              <div>Вознаграждение за результат</div>
            </div>
          </div>
          <div class="offer__side">
            <div class="eyebrow">Что не требуется от вас</div>
            <h3>Вам не нужно быть продавцом ремонта.</h3>
            <p>
              Не нужно обещать клиенту стоимость. Не нужно защищать нашу смету. Не нужно
              контролировать объект. Не нужно убеждать клиента работать с нами.
            </p>
            <div class="checks">
              <div>Передали контакт</div>
              <div>Остальное делает ГлавПрофи</div>
              <div>Решение принимает клиент</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== WHEN ===================== -->
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Когда передавать лид</div>
          <h2 class="section-title">Научитесь видеть деньги в обычном разговоре.</h2>
        </div>
        <div class="grid3">
          <div class="grid3__card">
            <div class="grid3__num">01 · СИЛЬНЫЙ СИГНАЛ</div>
            <h3>«Будем открывать новый филиал»</h3>
            <p>Особенно ценно для сетей магазинов, клиник, аптек, кафе и офисов.</p>
          </div>
          <div class="grid3__card">
            <div class="grid3__num">02 · СИЛЬНЫЙ СИГНАЛ</div>
            <h3>«Помещение нужно переделать»</h3>
            <p>
              Перепланировка, демонтаж, инженерия, отделка — потенциальный комплексный
              объект.
            </p>
          </div>
          <div class="grid3__card">
            <div class="grid3__num">03 · СИЛЬНЫЙ СИГНАЛ</div>
            <h3>«Нам дают каникулы на ремонт»</h3>
            <p>Ремонт уже заложен в экономику аренды. Такой лид особенно близок к сделке.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== TRUST (dark) ===================== -->
    <section class="section section--dark">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Принцип доверия</div>
          <h2 class="section-title">Ваш клиент остаётся вашим клиентом.</h2>
          <p class="section-text">
            ГлавПрофи не должен превращать партнёра в источник разовых контактов. Поэтому
            система строится вокруг прозрачности и защиты лида.
          </p>
        </div>
        <div class="grid3">
          <div class="grid3__card">
            <div class="grid3__num">01</div>
            <h3>Проверка номера</h3>
            <p>До передачи можно проверить, не зарегистрирован ли клиент в системе ранее.</p>
          </div>
          <div class="grid3__card">
            <div class="grid3__num">02</div>
            <h3>Фиксация партнёра</h3>
            <p>
              У каждого лида есть история и источник. Споры «кто привёл клиента» решаются
              системой, а не перепиской.
            </p>
          </div>
          <div class="grid3__card">
            <div class="grid3__num">03</div>
            <h3>Статус сделки</h3>
            <p>
              Партнёр понимает, что происходит с его лидом и когда возникает право на
              вознаграждение.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== FOR WHOM ===================== -->
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Для кого</div>
          <h2 class="section-title">
            Особенно интересно брокерам, которые работают с арендаторами.
          </h2>
          <p class="section-text">
            Чем ближе вы к моменту открытия бизнеса, тем ценнее ваши рекомендации для нас —
            и тем больше потенциальных сделок в вашем портфеле.
          </p>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Ситуация клиента</th>
                <th>Потенциал</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Новый арендатор получил помещение без отделки</td>
                <td><b>Очень высокий</b></td>
              </tr>
              <tr>
                <td>Компания открывает новый филиал</td>
                <td><b>Очень высокий</b></td>
              </tr>
              <tr>
                <td>Помещение требует реконструкции / перепланировки</td>
                <td><b>Очень высокий</b></td>
              </tr>
              <tr>
                <td>Клиент купил коммерческий объект</td>
                <td>Высокий</td>
              </tr>
              <tr>
                <td>Нужен косметический ремонт офиса</td>
                <td>Средний</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ===================== CTA ===================== -->
    <section id="join" class="section">
      <div class="container">
        <div class="cta">
          <div class="cta__content">
            <div class="eyebrow">Следующий шаг</div>
            <h2 class="cta__title">Давайте проверим это на одном клиенте.</h2>
            <p class="cta__text">
              Не нужно сразу принимать решение о долгосрочном партнёрстве. Познакомимся,
              покажем механику и попробуем провести одного клиента через систему.
            </p>
          </div>
          <button class="btn btn--primary" @click="openModal">Стать партнёром</button>
        </div>
      </div>
    </section>

    <!-- ===================== FOOTER ===================== -->
    <div class="container">
      <footer class="partner__footer">
        <div>ГлавПрофи · Ремонт и отделка коммерческих помещений · Рязань</div>
        <div>Партнёрская программа</div>
      </footer>
    </div>

    <!-- ===================== MODAL ===================== -->
    <Transition name="fade">
      <div v-if="isModalOpen" class="modal" @click.self="closeModal">
        <div class="modal__box">
          <button class="modal__close" aria-label="Закрыть" @click="closeModal">×</button>

          <template v-if="!isSubmitted">
            <div class="eyebrow">Заявка партнёра</div>
            <h2 class="modal__title">Начнём с знакомства.</h2>
            <p class="modal__text">
              Оставьте контакт — обсудим условия партнёрской программы и покажем, как
              передавать лиды.
            </p>
            <form class="modal__form" @submit.prevent="submitForm">
              <input v-model="form.name" required placeholder="Ваше имя" />
              <input v-model="form.phone" required placeholder="Телефон" />
              <input v-model="form.company" placeholder="Агентство / компания" />
              <textarea
                v-model="form.comment"
                placeholder="Например: работаю с арендой коммерции"
              ></textarea>
              <button class="btn btn--primary" type="submit">Отправить заявку</button>
              <div class="modal__small">
                В демо-версии форма не отправляет данные на сервер.
              </div>
            </form>
          </template>

          <template v-else>
            <div class="eyebrow">Спасибо</div>
            <h2 class="modal__title">Заявка заполнена.</h2>
            <p class="modal__text">
              Это демонстрационная версия. Подключите форму к CRM, Telegram, email или
              вашему backend, чтобы заявки реально поступали менеджеру.
            </p>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

const isModalOpen = ref(false)
const isSubmitted = ref(false)

const form = reactive({
  name: '',
  phone: '',
  company: '',
  comment: '',
})

function openModal() {
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  // сбрасываем «спасибо» после закрытия
  window.setTimeout(() => {
    isSubmitted.value = false
  }, 300)
}

function submitForm() {
  // TODO: подключить к backend / CRM / Telegram
  isSubmitted.value = true
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

// ========================================
// БАЗА
// ========================================

.partner {
  min-height: 100vh;
  background: $background-light;
  color: $text-dark;
  font-family: 'Rubik', sans-serif;
  line-height: 1.5;
  overflow-x: hidden;
}

.container {
  @include section-container;
}

.section {
  @include section-padding;
  position: relative;

  &--dark {
    background: $background-dark;
    color: $text-light;

    .section-title {
      color: $text-light;
    }
    .section-text {
      color: rgba($text-light, 0.72);
    }
    .eyebrow {
      color: rgba($text-light, 0.55);
    }
  }

  &--compact-top {
    padding-top: 10px;
  }
}

// ========================================
// ТИПОГРАФИКА
// ========================================

.eyebrow {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
  color: $text-gray;
  margin-bottom: 13px;
}

.section-head {
  max-width: 750px;
  margin-bottom: 42px;
}

.section-title {
  @include section-title;
}

.section-text {
  font-size: 17px;
  color: $text-gray;
  margin: 0;
  line-height: 1.6;
}

// ========================================
// NAV
// ========================================

.partner__nav-wrap {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.partner__nav {
  @include section-container;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 520px) {
    height: 68px;
  }
}

.logo {
  font-weight: 700;
  letter-spacing: -0.04em;
  font-size: 23px;
  color: $text-dark;
  white-space: nowrap;

  span {
    display: inline-block;
    background: $blue-gradient;
    padding: 2px 8px;
    border-radius: 8px;
    margin-left: 4px;
    color: $text-dark;
  }
}

.navlink {
  font-size: 14px;
  color: $text-gray;
  transition: color 0.2s ease;

  &:hover {
    color: $blue;
  }

  @media (max-width: 520px) {
    display: none;
  }
}

// ========================================
// BUTTONS
// ========================================

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 12px;
  padding: 15px 22px;
  font-weight: 700;
  cursor: pointer;
  font-size: 15px;
  font-family: inherit;
  line-height: 1;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
  white-space: nowrap;
}

.btn--primary {
  background: $blue-gradient;
  color: $text-dark;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 195, 245, 0.4);
    color: $text-dark;
  }

  &:active {
    transform: translateY(0);
  }
}

.btn--ghost {
  background: transparent;
  border: 1px solid $border-color;
  color: $text-dark;

  &:hover {
    border-color: $blue;
    color: $blue;
  }
}

// ========================================
// HERO
// ========================================

.hero {
  padding: 54px 0 80px;

  @media (max-width: 850px) {
    padding-top: 25px;
  }
}

.hero__grid {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 44px;
  align-items: center;

  @media (max-width: 850px) {
    grid-template-columns: 1fr;
  }
}

.kicker {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  color: $text-gray;
  margin-bottom: 20px;
}

.dot {
  width: 8px;
  height: 8px;
  background: $blue;
  border-radius: 50%;
  flex-shrink: 0;
}

.hero__title {
  font-family: 'Rubik', sans-serif;
  font-size: clamp(44px, 6.5vw, 82px);
  line-height: 0.98;
  letter-spacing: -0.055em;
  margin: 0 0 26px;
  font-weight: 700;
  color: $text-dark;

  .accent {
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    padding: 0 4px;
  }

  @media (max-width: 850px) {
    font-size: 52px;
  }

  @media (max-width: 520px) {
    font-size: 38px;
  }
}

.hero__lead {
  font-size: 21px;
  max-width: 690px;
  color: rgba($text-dark, 0.72);
  margin: 0 0 30px;
  line-height: 1.5;

  @media (max-width: 520px) {
    font-size: 17px;
  }
}

.hero__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero__note {
  font-size: 12px;
  color: $text-gray;
  margin-top: 13px;
  max-width: 560px;
  line-height: 1.5;
}

.hero__card {
  background: $background-dark;
  color: $text-light;
  border-radius: 28px;
  padding: 28px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  isolation: isolate;

  &::after {
    content: '';
    position: absolute;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: $blue;
    filter: blur(80px);
    opacity: 0.45;
    right: -90px;
    top: -90px;
    z-index: -1;
    pointer-events: none;
  }

  @media (max-width: 520px) {
    padding: 23px;
  }
}

.hero__card-title {
  font-size: 24px;
  letter-spacing: -0.03em;
  margin: 0 0 24px;
  position: relative;
  z-index: 1;
  color: $text-light;
  line-height: 1.2;
  font-weight: 700;
}

.hero__money {
  font-size: 55px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.06em;
  background: $blue-gradient;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  position: relative;
  z-index: 1;
  font-family: 'Rubik', sans-serif;

  @media (max-width: 520px) {
    font-size: 45px;
  }
}

.hero__money-sub {
  color: rgba($text-light, 0.65);
  margin: 10px 0 30px;
  position: relative;
  z-index: 1;
  font-size: 14px;
  line-height: 1.5;
}

.hero__flow {
  border-top: 1px solid rgba($text-light, 0.15);
  padding-top: 18px;
  display: grid;
  gap: 13px;
  position: relative;
  z-index: 1;

  > div {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    gap: 12px;
  }

  b {
    color: $text-light;
    font-weight: 600;
    flex-shrink: 0;
  }

  span {
    color: rgba($text-light, 0.55);
    text-align: right;
  }
}

// ========================================
// PROBLEM
// ========================================

.problem {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;

  @media (max-width: 850px) {
    grid-template-columns: 1fr;
  }
}

.problem__card {
  padding: 27px;
  border-radius: 22px;
  min-height: 220px;
  display: flex;
  flex-direction: column;

  h3 {
    font-size: 22px;
    letter-spacing: -0.03em;
    margin: 0 0 9px;
    line-height: 1.25;
  }

  p {
    color: rgba($text-light, 0.6);
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
  }
}

.problem__num {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.11em;
  margin-bottom: auto;
  color: rgba($text-light, 0.4);
  text-transform: uppercase;
}

.problem__card--bad {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);

  h3 {
    color: rgba($text-light, 0.75);
  }
}

.problem__card--good {
  background: rgba(0, 195, 245, 0.08);
  border: 1px solid rgba(0, 195, 245, 0.35);

  .problem__num {
    color: $blue;
  }

  h3 {
    color: $text-light;
  }

  p {
    color: rgba($text-light, 0.78);
  }
}

.quote {
  margin-top: 28px;
  border-left: 4px solid $blue;
  padding: 5px 0 5px 20px;
  font-size: 20px;
  font-weight: 600;
  max-width: 850px;
  color: $text-light;
  line-height: 1.5;

  @media (max-width: 520px) {
    font-size: 17px;
  }
}

// ========================================
// STEPS
// ========================================

.steps {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 850px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
}

.step {
  @include light-card;
  padding: 20px;
  min-height: 180px;
  display: flex;
  flex-direction: column;

  b {
    display: block;
    font-size: 13px;
    color: $text-gray;
    margin-bottom: 25px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  h4 {
    margin: 0 0 8px;
    font-size: 18px;
    letter-spacing: -0.02em;
    color: $text-dark;
    line-height: 1.25;
  }

  p {
    margin: 0;
    color: $text-gray;
    font-size: 14px;
    line-height: 1.5;
  }
}

// ========================================
// OFFER
// ========================================

.offer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;

  @media (max-width: 850px) {
    grid-template-columns: 1fr;
  }
}

.offer__big {
  background: rgba(0, 195, 245, 0.08);
  border: 1px solid rgba(0, 195, 245, 0.25);
  border-radius: 28px;
  padding: 36px;

  h3 {
    font-size: 32px;
    line-height: 1.15;
    margin: 0 0 18px;
    letter-spacing: -0.04em;
    color: $text-dark;
    font-weight: 700;
  }

  p {
    font-size: 17px;
    color: rgba($text-dark, 0.78);
    line-height: 1.6;
    margin: 0;
  }

  @media (max-width: 520px) {
    padding: 24px;

    h3 {
      font-size: 26px;
    }
  }
}

.offer__side {
  @include light-card;
  padding: 36px;

  h3 {
    font-size: 26px;
    line-height: 1.2;
    margin: 0 0 15px;
    letter-spacing: -0.03em;
    color: $text-dark;
  }

  p {
    color: $text-gray;
    line-height: 1.6;
    margin: 0;
    font-size: 15px;
  }

  @media (max-width: 520px) {
    padding: 24px;
  }
}

.checks {
  display: grid;
  gap: 11px;
  margin-top: 25px;

  > div {
    font-size: 15px;
    line-height: 1.5;
    position: relative;
    padding-left: 26px;
    color: $text-dark;

    &::before {
      content: '✓';
      position: absolute;
      left: 0;
      top: 0;
      font-weight: 700;
      color: $blue;
    }
  }
}

// ========================================
// GRID3
// ========================================

.grid3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 850px) {
    grid-template-columns: 1fr;
  }
}

.grid3__card {
  @include light-card;
  padding: 27px;

  h3 {
    font-size: 21px;
    letter-spacing: -0.03em;
    margin: 0 0 9px;
    color: $text-dark;
    line-height: 1.25;
    font-weight: 700;
  }

  p {
    color: $text-gray;
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
  }
}

.grid3__num {
  font-size: 12px;
  font-weight: 700;
  color: $text-gray;
  margin-bottom: 35px;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.section--dark {
  .grid3__card {
    @include dark-card;
    padding: 27px;

    h3 {
      color: $text-light;
    }
    p {
      color: rgba($text-light, 0.62);
    }
  }

  .grid3__num {
    color: rgba($text-light, 0.45);
  }
}

// ========================================
// TABLE
// ========================================

.table-wrap {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid $border-color;
  background: $background-light;
}

.table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    text-align: left;
    padding: 17px;
    border-bottom: 1px solid $border-color;
    font-size: 14px;
    line-height: 1.5;
  }

  th {
    background: $sub-item-bg;
    font-weight: 700;
    color: $text-dark;
    letter-spacing: 0.02em;
  }

  td {
    color: $text-dark;
  }

  tr:last-child td {
    border-bottom: 0;
  }

  b {
    color: $blue;
    font-weight: 700;
  }
}

// ========================================
// CTA
// ========================================

.cta {
  background: $background-dark;
  color: $text-light;
  border-radius: 30px;
  padding: 45px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 25px;
  align-items: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: $blue;
    opacity: 0.15;
    filter: blur(100px);
    right: -100px;
    top: -100px;
    pointer-events: none;
  }

  @media (max-width: 850px) {
    grid-template-columns: 1fr;
    padding: 32px;
  }
}

.cta__content {
  position: relative;
  z-index: 1;

  .eyebrow {
    color: rgba($text-light, 0.55);
  }
}

.cta__title {
  font-size: 44px;
  line-height: 1.05;
  letter-spacing: -0.04em;
  margin: 0 0 16px;
  color: $text-light;
  font-weight: 700;

  @media (max-width: 850px) {
    font-size: 36px;
  }

  @media (max-width: 520px) {
    font-size: 28px;
  }
}

.cta__text {
  margin: 0;
  color: rgba($text-light, 0.72);
  font-size: 16px;
  line-height: 1.6;
  max-width: 600px;
}

.cta .btn {
  position: relative;
  z-index: 1;
  justify-self: end;

  @media (max-width: 850px) {
    justify-self: start;
  }
}

// ========================================
// FOOTER
// ========================================

.partner__footer {
  padding: 35px 0;
  color: $text-gray;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 40px;

  @media (max-width: 520px) {
    flex-direction: column;
    gap: 8px;
  }
}

// ========================================
// MODAL
// ========================================

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 50;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

.modal__box {
  background: $background-light;
  max-width: 520px;
  width: 100%;
  border-radius: 22px;
  padding: 32px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  @media (max-width: 520px) {
    padding: 24px;
  }
}

.modal__close {
  position: absolute;
  right: 16px;
  top: 12px;
  border: 0;
  background: none;
  font-size: 26px;
  cursor: pointer;
  color: $text-gray;
  line-height: 1;
  padding: 4px 10px;
  transition: color 0.2s ease;

  &:hover {
    color: $text-dark;
  }
}

.modal__title {
  font-size: 32px;
  letter-spacing: -0.03em;
  margin: 0 0 12px;
  color: $text-dark;
  font-weight: 700;
  line-height: 1.15;

  @media (max-width: 520px) {
    font-size: 26px;
  }
}

.modal__text {
  color: $text-gray;
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
}

.modal__form {
  display: grid;
  gap: 12px;
  margin-top: 22px;

  input,
  textarea {
    width: 100%;
    border: 1px solid $border-color;
    border-radius: 10px;
    padding: 14px;
    font: inherit;
    background: transparent;
    color: inherit;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
    font-family: inherit;
    font-size: 15px;

    &::placeholder {
      color: $text-gray;
    }

    &:focus {
      outline: none;
      border-color: $blue;
      box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.15);
    }
  }

  textarea {
    min-height: 90px;
    resize: vertical;
  }

  .btn {
    margin-top: 4px;
  }
}

.modal__small {
  font-size: 12px;
  color: $text-gray;
  line-height: 1.5;
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// ========================================
// ANCHORS (отступ под sticky-навигацию)
// ========================================

#how,
#join {
  scroll-margin-top: 90px;
}
</style>