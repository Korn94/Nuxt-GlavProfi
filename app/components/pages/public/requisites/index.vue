<template>
  <div class="requisites-page">
    <!-- Верхняя панель -->
    <div
      class="actions-bar no-print"
      :class="{ 'is-scrolled': isScrolled }"
    >
      <div class="container">
        <div class="actions-bar__inner">
          <NuxtLink to="/" class="back-link">
            <span class="back-link__icon">
              <Icon name="mdi:arrow-left" size="17" />
            </span>
            <span>На главную</span>
          </NuxtLink>

          <div class="actions-bar__actions">
            <button
              class="action-button action-button--secondary"
              type="button"
              @click="copyAll"
            >
              <Icon name="mdi:content-copy" size="18" />
              <span>Скопировать реквизиты</span>
            </button>

            <button
              class="action-button action-button--primary"
              type="button"
              @click="printPage"
            >
              <Icon name="mdi:printer-outline" size="18" />
              <span>Печать / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <main class="requisites-content">
      <div class="container">

        <!-- ==========================================
             HERO
        =========================================== -->
        <header class="company-hero">
          <div class="company-hero__main">
            <div class="company-hero__identity">
              <div class="company-logo">
                <Icon name="mdi:domain" size="30" />
              </div>

              <div class="company-hero__text">
                <div class="company-hero__eyebrow">
                  Реквизиты организации
                </div>

                <h1 class="company-hero__title">
                  ООО «ГЛАВПРОФИ»
                </h1>

                <p class="company-hero__subtitle">
                  Общество с ограниченной ответственностью «ГЛАВПРОФИ»
                </p>
              </div>
            </div>

            <div class="company-status">
              <span class="company-status__dot"></span>
              <span>Действующая организация</span>
            </div>
          </div>

          <div class="company-hero__identifiers">
            <button
              class="identifier"
              type="button"
              @click="copyText('6200023528')"
            >
              <span class="identifier__label">ИНН</span>
              <span class="identifier__value">6200023528</span>
              <Icon name="mdi:content-copy" size="15" />
            </button>

            <button
              class="identifier"
              type="button"
              @click="copyText('620001001')"
            >
              <span class="identifier__label">КПП</span>
              <span class="identifier__value">620001001</span>
              <Icon name="mdi:content-copy" size="15" />
            </button>

            <button
              class="identifier"
              type="button"
              @click="copyText('1266200003167')"
            >
              <span class="identifier__label">ОГРН</span>
              <span class="identifier__value">1266200003167</span>
              <Icon name="mdi:content-copy" size="15" />
            </button>
          </div>

          <div class="company-hero__footer">
            <div class="company-location">
              <Icon name="mdi:map-marker-outline" size="18" />
              <span>г. Рязань</span>
            </div>

            <div class="company-updated">
              Данные обновлены {{ lastUpdated }}
            </div>
          </div>
        </header>

        <!-- ==========================================
             БАНКОВСКИЕ РЕКВИЗИТЫ
        =========================================== -->
        <section class="bank-card">
          <div class="section-heading">
            <div class="section-heading__icon section-heading__icon--bank">
              <Icon name="mdi:bank-outline" size="24" />
            </div>

            <div class="section-heading__content">
              <h2 class="section-heading__title">
                Банковские реквизиты
              </h2>

              <p class="section-heading__description">
                Используйте эти данные для оформления платежей и переводов
              </p>
            </div>

            <button
              class="copy-section-button"
              type="button"
              @click="copyBankDetails"
            >
              <Icon name="mdi:content-copy" size="17" />
              <span>Скопировать</span>
            </button>
          </div>

          <div class="bank-recipient">
            <div class="bank-recipient__label">
              Получатель
            </div>

            <div class="bank-recipient__value">
              ООО «ГЛАВПРОФИ»
            </div>
          </div>

          <div class="bank-details-grid">
            <!-- Расчётный счёт -->
            <div class="bank-field bank-field--primary">
              <div class="bank-field__top">
                <span class="bank-field__label">
                  Расчётный счёт
                </span>

                <span class="bank-field__badge">
                  Основной реквизит
                </span>
              </div>

              <button
                class="bank-field__copy"
                type="button"
                @click="copyText('40702810753710001908')"
              >
                <span class="bank-field__value bank-field__value--mono">
                  40702 810 7 5371 0001908
                </span>

                <span class="bank-field__copy-icon">
                  <Icon name="mdi:content-copy" size="18" />
                </span>
              </button>
            </div>

            <!-- БИК -->
            <div class="bank-field">
              <span class="bank-field__label">
                БИК
              </span>

              <button
                class="bank-field__copy"
                type="button"
                @click="copyText('046126614')"
              >
                <span class="bank-field__value bank-field__value--mono">
                  046126614
                </span>

                <span class="bank-field__copy-icon">
                  <Icon name="mdi:content-copy" size="17" />
                </span>
              </button>
            </div>

            <!-- Корр. счёт -->
            <div class="bank-field">
              <span class="bank-field__label">
                Корреспондентский счёт
              </span>

              <button
                class="bank-field__copy"
                type="button"
                @click="copyText('30101810500000000614')"
              >
                <span class="bank-field__value bank-field__value--mono">
                  30101 810 5 0000 0000614
                </span>

                <span class="bank-field__copy-icon">
                  <Icon name="mdi:content-copy" size="17" />
                </span>
              </button>
            </div>

            <!-- Банк -->
            <div class="bank-field bank-field--wide">
              <span class="bank-field__label">
                Банк
              </span>

              <button
                class="bank-field__copy"
                type="button"
                @click="copyText('РЯЗАНСКОЕ ОТДЕЛЕНИЕ № 8606 ПАО СБЕРБАНК')"
              >
                <span class="bank-field__value">
                  Рязанское отделение № 8606 ПАО Сбербанк
                </span>

                <span class="bank-field__copy-icon">
                  <Icon name="mdi:content-copy" size="17" />
                </span>
              </button>
            </div>
          </div>

          <div class="bank-extra">
            <PagesPublicRequisitesCopyRow
              label="ИНН банка"
              value="7707083893"
              mono
            />

            <PagesPublicRequisitesCopyRow
              label="КПП банка"
              value="623402001"
              mono
            />
          </div>
        </section>

        <!-- ==========================================
             ОСНОВНАЯ ИНФОРМАЦИЯ
        =========================================== -->
        <div class="content-grid">

          <!-- О компании -->
          <section class="info-card">
            <div class="info-card__header">
              <div class="info-card__icon">
                <Icon name="mdi:domain" size="21" />
              </div>

              <div>
                <h2 class="info-card__title">
                  О компании
                </h2>

                <p class="info-card__description">
                  Основные сведения об организации
                </p>
              </div>
            </div>

            <div class="info-card__body">
              <PagesPublicRequisitesCopyRow
                label="Полное наименование"
                value="ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ «ГЛАВПРОФИ»"
              />

              <PagesPublicRequisitesCopyRow
                label="Сокращённое наименование"
                value="ООО «ГЛАВПРОФИ»"
              />

              <PagesPublicRequisitesCopyRow
                label="Генеральный директор"
                value="Главацкий Павел Евгеньевич"
                icon="mdi:account-tie-outline"
              />
            </div>
          </section>

          <!-- Контакты -->
          <section class="info-card">
            <div class="info-card__header">
              <div class="info-card__icon">
                <Icon name="mdi:phone-outline" size="21" />
              </div>

              <div>
                <h2 class="info-card__title">
                  Контакты
                </h2>

                <p class="info-card__description">
                  Как связаться с организацией
                </p>
              </div>
            </div>

            <div class="contact-person">
              <div class="contact-person__avatar">
                <Icon name="mdi:account-outline" size="22" />
              </div>

              <div class="contact-person__content">
                <div class="contact-person__name">
                  Главацкий Павел Евгеньевич
                </div>

                <div class="contact-person__role">
                  Генеральный директор
                </div>
              </div>
            </div>

            <div class="info-card__body">
              <PagesPublicRequisitesCopyRow
                label="Электронная почта"
                value="glavprofi@yandex.ru"
                icon="mdi:email-outline"
                link
                href="mailto:glavprofi@yandex.ru"
              />

              <PagesPublicRequisitesCopyRow
                label="Веб-сайт"
                value="glavprofi.ru"
                icon="mdi:web"
                link
                href="https://glavprofi.ru"
              />
            </div>
          </section>

          <!-- Адрес -->
          <section class="info-card">
            <div class="info-card__header">
              <div class="info-card__icon">
                <Icon name="mdi:map-marker-outline" size="21" />
              </div>

              <div>
                <h2 class="info-card__title">
                  Адрес
                </h2>

                <p class="info-card__description">
                  Местонахождение организации
                </p>
              </div>
            </div>

            <div class="address-block">
              <div class="address-block__icon">
                <Icon name="mdi:office-building-outline" size="20" />
              </div>

              <div class="address-block__content">
                <span class="address-block__label">
                  Юридический адрес
                </span>

                <button
                  type="button"
                  class="address-block__value"
                  @click="copyText(address)"
                >
                  {{ address }}

                  <Icon name="mdi:content-copy" size="16" />
                </button>
              </div>
            </div>

            <div class="address-types">
              <PagesPublicRequisitesCopyRow
                label="Фактический адрес"
                value="390011, г. Рязань, ул. Пугачева, д. 10, кв. 466"
              />

              <PagesPublicRequisitesCopyRow
                label="Почтовый адрес"
                value="390011, г. Рязань, ул. Пугачева, д. 10, кв. 466"
              />
            </div>
          </section>

          <!-- Регистрационные данные -->
          <section class="info-card">
            <div class="info-card__header">
              <div class="info-card__icon">
                <Icon name="mdi:file-document-outline" size="21" />
              </div>

              <div>
                <h2 class="info-card__title">
                  Регистрационные данные
                </h2>

                <p class="info-card__description">
                  Государственные классификаторы
                </p>
              </div>
            </div>

            <div class="registration-grid">
              <PagesPublicRequisitesCopyRow
                label="ОГРН"
                value="1266200003167"
                mono
              />

              <PagesPublicRequisitesCopyRow
                label="ОКПО"
                value="50867784"
                mono
              />

              <PagesPublicRequisitesCopyRow
                label="ОКАТО"
                value="61401000000"
                mono
              />

              <PagesPublicRequisitesCopyRow
                label="ОКТМО"
                value="61701000001"
                mono
              />
            </div>
          </section>
        </div>

        <!-- ==========================================
             QR + ПОДСКАЗКА
        =========================================== -->
        <section class="bottom-grid no-print">

          <div class="qr-card">
            <div class="qr-card__content">
              <div class="qr-card__icon">
                <Icon name="mdi:qrcode" size="24" />
              </div>

              <div>
                <h2 class="qr-card__title">
                  Реквизиты на телефоне
                </h2>

                <p class="qr-card__description">
                  Отсканируйте QR-код, чтобы быстро открыть страницу с реквизитами.
                </p>
              </div>
            </div>

            <div class="qr-card__code">
              <img
                :src="qrCodeUrl"
                alt="QR-код реквизитов ООО «ГЛАВПРОФИ»"
                width="160"
                height="160"
                loading="lazy"
              />
            </div>
          </div>

          <div class="help-card">
            <div class="help-card__icon">
              <Icon name="mdi:lightbulb-outline" size="22" />
            </div>

            <div>
              <h2 class="help-card__title">
                Быстрое копирование
              </h2>

              <p class="help-card__text">
                Нажмите на любой реквизит, чтобы скопировать его.
                Для платежа удобнее всего использовать кнопку
                <strong>«Скопировать»</strong> в блоке банковских реквизитов.
              </p>
            </div>
          </div>

        </section>

        <!-- ==========================================
             FOOTER
        =========================================== -->
        <footer class="page-footer">
          <div class="page-footer__copyright">
            © {{ currentYear }} ООО «ГЛАВПРОФИ»
          </div>

          <div class="page-footer__meta">
            <span>
              <Icon name="mdi:shield-check-outline" size="15" />
              Действующая организация
            </span>

            <span>
              <Icon name="mdi:update" size="15" />
              Обновлено {{ lastUpdated }}
            </span>
          </div>
        </footer>

      </div>
    </main>

    <UiNotificationsContainer />
  </div>
</template>

<script setup>
import { useNotifications } from '~/composables/useNotifications'
import { copyToClipboard } from '~/utils/clipboard'

const notifications = useNotifications()

const isScrolled = ref(false)

const currentYear = new Date().getFullYear()
const lastUpdated = '10.09.2026'

const address = '390011, г. Рязань, ул. Пугачева, д. 10, кв. 466'

const qrData = `ООО «ГЛАВПРОФИ»
ИНН: 6200023528
КПП: 620001001
ОГРН: 1266200003167
Р/с: 40702810753710001908
БИК: 046126614
Банк: РЯЗАНСКОЕ ОТДЕЛЕНИЕ № 8606 ПАО СБЕРБАНК
К/с: 30101810500000000614`

const qrCodeUrl = computed(() => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(qrData)}`
})

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

useHead({
  title: 'Реквизиты ООО «ГЛАВПРОФИ»',
  meta: [
    {
      name: 'description',
      content: 'Юридические и банковские реквизиты ООО «ГЛАВПРОФИ»'
    },
    {
      name: 'robots',
      content: 'noindex, nofollow'
    }
  ]
})

const printPage = () => {
  window.print()
}

const copyText = async (text) => {
  const ok = await copyToClipboard(text)

  if (ok) {
    notifications.success('Скопировано', text)
  } else {
    notifications.error(
      'Не удалось скопировать',
      'Проверьте разрешения браузера'
    )
  }
}

const copyBankDetails = async () => {
  const data = `Получатель: ООО «ГЛАВПРОФИ»
ИНН: 6200023528
КПП: 620001001
Банк: РЯЗАНСКОЕ ОТДЕЛЕНИЕ № 8606 ПАО СБЕРБАНК
БИК: 046126614
Р/с: 40702810753710001908
К/с: 30101810500000000614`

  const ok = await copyToClipboard(data)

  if (ok) {
    notifications.success(
      'Банковские реквизиты скопированы',
      'Готово для вставки в платёжку'
    )
  } else {
    notifications.error(
      'Не удалось скопировать',
      'Проверьте разрешения браузера'
    )
  }
}

const copyAll = async () => {
  const allData = `ООО «ГЛАВПРОФИ»

Полное наименование:
ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ «ГЛАВПРОФИ»

ИНН: 6200023528
КПП: 620001001
ОГРН: 1266200003167

ОКПО: 50867784
ОКАТО: 61401000000
ОКТМО: 61701000001

Юридический адрес:
390011, г. Рязань, ул. Пугачева, д. 10, кв. 466

Фактический адрес:
390011, г. Рязань, ул. Пугачева, д. 10, кв. 466

Почтовый адрес:
390011, г. Рязань, ул. Пугачева, д. 10, кв. 466

Банк:
РЯЗАНСКОЕ ОТДЕЛЕНИЕ № 8606 ПАО СБЕРБАНК

БИК: 046126614
ИНН банка: 7707083893
КПП банка: 623402001

Р/с: 40702810753710001908
К/с: 30101810500000000614

Email: glavprofi@yandex.ru
Сайт: glavprofi.ru

Генеральный директор:
Главацкий Павел Евгеньевич`

  const ok = await copyToClipboard(allData)

  if (ok) {
    notifications.success(
      'Все реквизиты скопированы',
      'Готово для вставки'
    )
  } else {
    notifications.error(
      'Не удалось скопировать',
      'Проверьте разрешения браузера'
    )
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.requisites-page {
  --page-bg: #f5f7fa;
  --card-bg: #ffffff;
  --text-main: #20252b;
  --text-secondary: #707984;
  --text-muted: #9aa2ab;
  --border: #e7ebef;
  --blue: #00c3f5;
  --blue-soft: rgba(0, 195, 245, 0.08);
  --green: #00a12a;
  --green-soft: rgba(0, 161, 42, 0.08);

  min-height: 100vh;
  background:
    radial-gradient(
      circle at 0% 0%,
      rgba(0, 195, 245, 0.045),
      transparent 28rem
    ),
    var(--page-bg);
  color: var(--text-main);
  padding-bottom: 3rem;
}

.container {
  @include container;

  max-width: 1180px;
}

/* ==========================================
   ACTION BAR
========================================== */

.actions-bar {
  // position: sticky;
  margin-top: 4em;
  z-index: 100;

  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid transparent;

  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &.is-scrolled {
    background: rgba(255, 255, 255, 0.96);
    border-bottom-color: var(--border);
    box-shadow: 0 5px 25px rgba(20, 30, 40, 0.06);
  }

  &__inner {
    min-height: 72px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 1rem;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;

  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;

  transition: color 0.2s ease;

  &:hover {
    color: var(--text-main);
  }

  &__icon {
    width: 32px;
    height: 32px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    border: 1px solid var(--border);
    border-radius: 9px;

    background: #fff;

    transition:
      border-color 0.2s ease,
      color 0.2s ease,
      transform 0.2s ease;
  }

  &:hover &__icon {
    color: var(--blue);
    border-color: rgba(0, 195, 245, 0.35);
    transform: translateX(-2px);
  }
}

.action-button {
  min-height: 40px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  padding: 0.6rem 1rem;

  border-radius: 9px;

  font-size: 0.85rem;
  font-weight: 600;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;

  &--secondary {
    color: var(--text-main);
    background: #fff;
    border: 1px solid var(--border);

    &:hover {
      border-color: rgba(0, 195, 245, 0.35);
      color: #008eaf;
    }
  }

  &--primary {
    color: #fff;
    background: #20252b;
    border: 1px solid #20252b;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 7px 18px rgba(20, 25, 30, 0.18);
      background: #15191d;
    }
  }
}

/* ==========================================
   CONTENT
========================================== */

.requisites-content {
  padding-top: 2rem;
}

/* ==========================================
   HERO
========================================== */

.company-hero {
  position: relative;

  margin-bottom: 1.25rem;
  padding: 2rem;

  overflow: hidden;

  background: var(--card-bg);

  border: 1px solid var(--border);
  border-radius: 18px;

  box-shadow: 0 8px 35px rgba(25, 35, 45, 0.055);

  &::before {
    content: '';

    position: absolute;
    top: 0;
    right: 0;

    width: 340px;
    height: 340px;

    background: radial-gradient(
      circle,
      rgba(0, 195, 245, 0.075),
      transparent 68%
    );

    pointer-events: none;
  }

  &__main {
    position: relative;
    z-index: 1;

    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    gap: 1.5rem;
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: 1rem;

    min-width: 0;
  }

  &__text {
    min-width: 0;
  }

  &__eyebrow {
    margin-bottom: 0.35rem;

    color: var(--text-muted);

    font-size: 0.72rem;
    font-weight: 600;

    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  &__title {
    margin: 0;

    color: var(--text-main);

    font-size: 2rem;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.025em;
  }

  &__subtitle {
    max-width: 650px;

    margin: 0.45rem 0 0;

    color: var(--text-secondary);

    font-size: 0.88rem;
    line-height: 1.5;
  }

  &__identifiers {
    position: relative;
    z-index: 1;

    display: grid;
    grid-template-columns: repeat(3, auto);

    gap: 0.6rem;

    margin-top: 1.7rem;
  }

  &__footer {
    position: relative;
    z-index: 1;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 1rem;

    margin-top: 1.25rem;
    padding-top: 1.15rem;

    border-top: 1px solid var(--border);
  }
}

.company-logo {
  width: 58px;
  height: 58px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  color: #fff;

  background: $blue-gradient;

  border-radius: 15px;

  box-shadow: 0 8px 20px rgba(0, 195, 245, 0.22);
}

.company-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  flex-shrink: 0;

  padding: 0.5rem 0.8rem;

  color: #087b27;

  background: var(--green-soft);

  border: 1px solid rgba(0, 161, 42, 0.15);
  border-radius: 999px;

  font-size: 0.78rem;
  font-weight: 600;

  &__dot {
    width: 7px;
    height: 7px;

    border-radius: 50%;

    background: $green;

    box-shadow: 0 0 0 4px rgba(0, 161, 42, 0.09);
  }
}

.identifier {
  min-width: 175px;

  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.65rem;

  padding: 0.65rem 0.75rem;

  color: var(--text-main);

  background: #fafbfc;

  border: 1px solid var(--border);
  border-radius: 10px;

  cursor: pointer;
  text-align: left;

  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    background: #fff;
    border-color: rgba(0, 195, 245, 0.35);
    transform: translateY(-1px);

    svg {
      color: var(--blue);
    }
  }

  &__label {
    color: var(--text-muted);

    font-size: 0.67rem;
    font-weight: 700;

    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  &__value {
    font-family: 'JetBrains Mono', 'Courier New', monospace;

    font-size: 0.82rem;
    font-weight: 600;

    white-space: nowrap;
  }

  svg {
    color: var(--text-muted);

    transition: color 0.2s ease;
  }
}

.company-location {
  display: flex;
  align-items: center;
  gap: 0.4rem;

  color: var(--text-secondary);

  font-size: 0.83rem;

  svg {
    color: var(--blue);
  }
}

.company-updated {
  color: var(--text-muted);

  font-size: 0.78rem;
}

/* ==========================================
   BANK CARD
========================================== */

.bank-card {
  margin-bottom: 1.25rem;
  padding: 1.6rem;

  background:
    linear-gradient(
      135deg,
      #ffffff 0%,
      #fbfdfe 100%
    );

  border: 1px solid rgba(0, 161, 42, 0.16);
  border-radius: 18px;

  box-shadow: 0 8px 35px rgba(25, 35, 45, 0.055);
}

.section-heading {
  display: flex;
  align-items: center;

  gap: 0.85rem;

  margin-bottom: 1.3rem;

  &__icon {
    width: 46px;
    height: 46px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    border-radius: 12px;

    &--bank {
      color: #087b27;
      background: var(--green-soft);
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    margin: 0;

    color: var(--text-main);

    font-size: 1.15rem;
    font-weight: 650;
  }

  &__description {
    margin: 0.18rem 0 0;

    color: var(--text-secondary);

    font-size: 0.8rem;
  }
}

.copy-section-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;

  padding: 0.6rem 0.85rem;

  color: #087b27;

  background: var(--green-soft);

  border: 1px solid rgba(0, 161, 42, 0.15);
  border-radius: 9px;

  font-size: 0.8rem;
  font-weight: 600;

  cursor: pointer;

  transition:
    background-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    background: rgba(0, 161, 42, 0.13);
    transform: translateY(-1px);
  }
}

.bank-recipient {
  display: grid;
  grid-template-columns: 160px 1fr;

  align-items: center;

  gap: 1rem;

  padding: 0.9rem 1rem;

  background: #f7faf8;

  border: 1px solid rgba(0, 161, 42, 0.1);
  border-radius: 10px;

  margin-bottom: 0.75rem;

  &__label {
    color: var(--text-secondary);
    font-size: 0.8rem;
  }

  &__value {
    color: var(--text-main);

    font-size: 0.92rem;
    font-weight: 600;
  }
}

.bank-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);

  gap: 0.75rem;
}

.bank-field {
  padding: 1rem;

  background: #fff;

  border: 1px solid var(--border);
  border-radius: 11px;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: rgba(0, 195, 245, 0.25);
  }

  &--primary {
    border-color: rgba(0, 195, 245, 0.24);
    background: rgba(0, 195, 245, 0.035);
  }

  &--wide {
    grid-column: 1 / -1;
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 0.5rem;

    margin-bottom: 0.55rem;
  }

  &__label {
    display: block;

    margin-bottom: 0.55rem;

    color: var(--text-secondary);

    font-size: 0.75rem;
    font-weight: 500;
  }

  &__badge {
    padding: 0.22rem 0.5rem;

    color: #008baa;

    background: rgba(0, 195, 245, 0.08);

    border-radius: 999px;

    font-size: 0.64rem;
    font-weight: 600;
  }

  &__copy {
    width: 100%;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 0.8rem;

    padding: 0;

    color: var(--text-main);

    background: transparent;

    text-align: left;

    cursor: pointer;

    border: none;

    &:hover {
      .bank-field__value {
        color: #008baa;
      }

      .bank-field__copy-icon {
        color: var(--blue);
        background: rgba(0, 195, 245, 0.08);
      }
    }
  }

  &__value {
    min-width: 0;

    color: var(--text-main);

    font-size: 0.91rem;
    font-weight: 600;
    line-height: 1.5;

    word-break: break-word;

    transition: color 0.2s ease;

    &--mono {
      font-family: 'JetBrains Mono', 'Courier New', monospace;

      font-size: 0.88rem;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.015em;
    }
  }

  &__copy-icon {
    width: 30px;
    height: 30px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    color: var(--text-muted);

    border-radius: 8px;

    transition:
      color 0.2s ease,
      background-color 0.2s ease;
  }
}

.bank-extra {
  display: grid;
  grid-template-columns: repeat(2, 1fr);

  margin-top: 0.35rem;

  :deep(.copy-row) {
    border-bottom: none;
  }
}

/* ==========================================
   CONTENT GRID
========================================== */

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 1.25rem;

  margin-bottom: 1.25rem;
}

.info-card {
  padding: 1.35rem;

  background: var(--card-bg);

  border: 1px solid var(--border);
  border-radius: 16px;

  box-shadow: 0 5px 25px rgba(25, 35, 45, 0.04);

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: rgba(0, 195, 245, 0.18);
    box-shadow: 0 9px 30px rgba(25, 35, 45, 0.06);
    transform: translateY(-1px);
  }

  &__header {
    display: flex;
    align-items: center;

    gap: 0.8rem;

    padding-bottom: 1rem;

    margin-bottom: 0.45rem;

    border-bottom: 1px solid var(--border);
  }

  &__icon {
    width: 42px;
    height: 42px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    color: #008baa;

    background: rgba(0, 195, 245, 0.08);

    border-radius: 11px;
  }

  &__title {
    margin: 0;

    color: var(--text-main);

    font-size: 1rem;
    font-weight: 650;
  }

  &__description {
    margin: 0.15rem 0 0;

    color: var(--text-secondary);

    font-size: 0.76rem;
  }

  &__body {
    display: flex;
    flex-direction: column;
  }
}

/* ==========================================
   CONTACT
========================================== */

.contact-person {
  display: flex;
  align-items: center;

  gap: 0.75rem;

  padding: 0.75rem;

  margin-bottom: 0.25rem;

  background: #f8fafb;

  border-radius: 10px;

  &__avatar {
    width: 40px;
    height: 40px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    color: #008baa;

    background: rgba(0, 195, 245, 0.09);

    border-radius: 50%;
  }

  &__name {
    color: var(--text-main);

    font-size: 0.84rem;
    font-weight: 600;
  }

  &__role {
    margin-top: 0.1rem;

    color: var(--text-secondary);

    font-size: 0.72rem;
  }
}

/* ==========================================
   ADDRESS
========================================== */

.address-block {
  display: flex;

  gap: 0.75rem;

  padding: 0.9rem;

  margin-bottom: 0.35rem;

  background: #f8fafb;

  border-radius: 10px;

  &__icon {
    width: 36px;
    height: 36px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    color: #008baa;

    background: rgba(0, 195, 245, 0.08);

    border-radius: 9px;
  }

  &__content {
    min-width: 0;
  }

  &__label {
    display: block;

    margin-bottom: 0.2rem;

    color: var(--text-secondary);

    font-size: 0.7rem;
  }

  &__value {
    display: flex;
    align-items: flex-start;

    gap: 0.5rem;

    padding: 0;

    color: var(--text-main);

    background: transparent;

    border: none;

    font-size: 0.84rem;
    font-weight: 500;
    line-height: 1.45;

    text-align: left;

    cursor: pointer;

    &:hover {
      color: #008baa;

      svg {
        color: var(--blue);
      }
    }

    svg {
      flex-shrink: 0;

      margin-top: 2px;

      color: var(--text-muted);
    }
  }
}

.address-types {
  display: flex;
  flex-direction: column;
}

/* ==========================================
   REGISTRATION
========================================== */

.registration-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);

  :deep(.copy-row) {
    min-height: 64px;

    border-bottom: 1px solid var(--border);
  }
}

/* ==========================================
   BOTTOM
========================================== */

.bottom-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;

  gap: 1.25rem;

  margin-bottom: 1.25rem;
}

.qr-card,
.help-card {
  background: var(--card-bg);

  border: 1px solid var(--border);
  border-radius: 16px;

  box-shadow: 0 5px 25px rgba(25, 35, 45, 0.04);
}

.qr-card {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 1.5rem;

  padding: 1.4rem;

  &__content {
    display: flex;
    align-items: flex-start;

    gap: 0.8rem;
  }

  &__icon {
    width: 42px;
    height: 42px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    color: #008baa;

    background: rgba(0, 195, 245, 0.08);

    border-radius: 11px;
  }

  &__title {
    margin: 0;

    font-size: 0.98rem;
    font-weight: 650;
  }

  &__description {
    max-width: 390px;

    margin: 0.25rem 0 0;

    color: var(--text-secondary);

    font-size: 0.78rem;
    line-height: 1.5;
  }

  &__code {
    flex-shrink: 0;

    padding: 0.6rem;

    background: #fff;

    border: 1px solid var(--border);
    border-radius: 10px;

    img {
      display: block;

      width: 130px;
      height: 130px;
    }
  }
}

.help-card {
  display: flex;
  align-items: flex-start;

  gap: 0.8rem;

  padding: 1.4rem;

  background: #fffdf6;

  border-color: rgba(250, 183, 2, 0.18);

  &__icon {
    width: 42px;
    height: 42px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    color: #ad7d00;

    background: rgba(250, 183, 2, 0.1);

    border-radius: 11px;
  }

  &__title {
    margin: 0;

    font-size: 0.98rem;
    font-weight: 650;
  }

  &__text {
    margin: 0.35rem 0 0;

    color: var(--text-secondary);

    font-size: 0.79rem;
    line-height: 1.6;

    strong {
      color: var(--text-main);
      font-weight: 600;
    }
  }
}

/* ==========================================
   FOOTER
========================================== */

.page-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 1rem;

  padding: 1rem 0.25rem;

  color: var(--text-muted);

  font-size: 0.75rem;

  &__meta {
    display: flex;
    align-items: center;

    gap: 1rem;

    span {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }
  }
}

/* ==========================================
   RESPONSIVE
========================================== */

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .company-hero {
    &__main {
      flex-direction: column;
    }

    &__identifiers {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}

@media (max-width: 700px) {
  .requisites-content {
    padding-top: 1rem;
  }

  .actions-bar {
    &__inner {
      min-height: 62px;
    }
  }

  .back-link {
    span:last-child {
      display: none;
    }
  }

  .action-button {
    padding: 0.6rem 0.75rem;

    span {
      display: none;
    }
  }

  .company-hero {
    padding: 1.25rem;

    &__title {
      font-size: 1.55rem;
    }

    &__subtitle {
      font-size: 0.8rem;
    }

    &__identifiers {
      grid-template-columns: 1fr;
    }

    &__footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  .identifier {
    width: 100%;
    min-width: 0;
  }

  .bank-card {
    padding: 1.15rem;
  }

  .section-heading {
    align-items: flex-start;

    &__icon {
      width: 40px;
      height: 40px;
    }

    &__title {
      font-size: 1rem;
    }

    &__description {
      font-size: 0.74rem;
    }
  }

  .copy-section-button {
    width: 40px;
    height: 40px;

    padding: 0;

    span {
      display: none;
    }
  }

  .bank-details-grid {
    grid-template-columns: 1fr;
  }

  .bank-field--wide {
    grid-column: auto;
  }

  .bank-recipient {
    grid-template-columns: 1fr;

    gap: 0.2rem;
  }

  .bank-extra {
    grid-template-columns: 1fr;
  }

  .registration-grid {
    grid-template-columns: 1fr;
  }

  .qr-card {
    align-items: flex-start;

    &__code {
      img {
        width: 105px;
        height: 105px;
      }
    }
  }

  .page-footer {
    align-items: flex-start;
    flex-direction: column;

    &__meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.4rem;
    }
  }
}

@media (max-width: 480px) {
  .company-logo {
    width: 50px;
    height: 50px;
  }

  .company-hero {
    &__identity {
      align-items: flex-start;
    }

    &__title {
      font-size: 1.35rem;
    }

    &__subtitle {
      font-size: 0.75rem;
    }
  }

  .company-status {
    font-size: 0.72rem;
  }

  .qr-card {
    flex-direction: column;

    &__code {
      align-self: center;
    }
  }
}

/* ==========================================
   PRINT
========================================== */

@media print {
  .requisites-page {
    min-height: auto;

    padding: 0;

    background: #fff !important;
  }

  .requisites-content {
    padding-top: 0;
  }

  .company-hero,
  .bank-card,
  .info-card {
    box-shadow: none !important;
  }

  .company-hero {
    border: 1px solid #d8d8d8 !important;
  }

  .company-logo {
    background: #333 !important;
    box-shadow: none !important;
  }

  .company-status {
    color: #333 !important;
    background: #f5f5f5 !important;
    border-color: #ccc !important;
  }

  .company-status__dot {
    background: #333 !important;
    box-shadow: none !important;
  }

  .bank-card {
    border-color: #ccc !important;
  }

  .bank-field--primary {
    background: #f7f7f7 !important;
    border-color: #bbb !important;
  }

  .info-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .bank-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .bottom-grid {
    display: none !important;
  }

  .page-footer {
    border-top: 1px solid #ddd;
    margin-top: 1rem;
  }

  @page {
    size: A4;
    margin: 1.2cm;
  }
}
</style>