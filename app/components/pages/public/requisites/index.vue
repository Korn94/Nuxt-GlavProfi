<!-- app/components/pages/public/Requisites.vue -->
<template>
  <div class="requisites-page">
    <!-- Верхняя панель -->
    <div class="actions-bar no-print" :class="{ 'is-scrolled': isScrolled }">
      <div class="container">
        <div class="actions-bar__inner">
          <!-- <NuxtLink to="/" class="back-link">
            <span class="back-link__icon">
              <Icon name="mdi:arrow-left" size="17" />
            </span>
            <span>На главную</span>
          </NuxtLink> -->

          <!-- <div class="actions-bar__actions"> -->
            <button class="action-button action-button--secondary" type="button" @click="copyAll">
              <Icon name="mdi:content-copy" size="18" />
              <span>Скопировать реквизиты</span>
            </button>

            <button class="action-button action-button--primary" type="button" @click="printPage">
              <Icon name="mdi:printer-outline" size="18" />
              <span>Печать / PDF</span>
            </button>
          <!-- </div> -->
        </div>
      </div>
    </div>

    <main class="requisites-content">
      <div class="container">

        <!-- HERO -->
        <header class="company-hero">
          <div class="company-hero__glow company-hero__glow--1"></div>
          <div class="company-hero__glow company-hero__glow--2"></div>

          <div class="company-hero__main">
            <div class="company-hero__identity">
              <div class="company-logo">
                <img src="/favicon.ico" alt="Логотип ГЛАВПРОФИ" class="company-logo__img" />
              </div>

              <div class="company-hero__text">
                <div class="company-hero__eyebrow">Реквизиты организации</div>
                <h1 class="company-hero__title">ООО «ГЛАВПРОФИ»</h1>
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
            <button class="identifier" type="button" @click="copyText('6200023528')">
              <span class="identifier__label">ИНН</span>
              <span class="identifier__value">6200023528</span>
              <Icon name="mdi:content-copy" size="15" />
            </button>

            <button class="identifier" type="button" @click="copyText('620001001')">
              <span class="identifier__label">КПП</span>
              <span class="identifier__value">620001001</span>
              <Icon name="mdi:content-copy" size="15" />
            </button>

            <button class="identifier" type="button" @click="copyText('1266200003167')">
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
            <div class="company-updated">Данные обновлены {{ lastUpdated }}</div>
          </div>
        </header>

        <!-- БАНКОВСКИЕ РЕКВИЗИТЫ -->
        <section class="bank-card">
          <div class="bank-card__stripe"></div>

          <div class="section-heading">
            <div class="section-heading__icon section-heading__icon--bank">
              <Icon name="mdi:bank-outline" size="24" />
            </div>

            <div class="section-heading__content">
              <h2 class="section-heading__title">Банковские реквизиты</h2>
              <p class="section-heading__description">
                Используйте эти данные для оформления платежей и переводов
              </p>
            </div>

            <button class="copy-section-button" type="button" @click="copyBankDetails">
              <Icon name="mdi:content-copy" size="17" />
              <span>Скопировать</span>
            </button>
          </div>

          <div class="bank-recipient">
            <div class="bank-recipient__label">Получатель</div>
            <div class="bank-recipient__value">ООО «ГЛАВПРОФИ»</div>
          </div>

          <div class="bank-details-grid">
            <div class="bank-field bank-field--primary">
              <div class="bank-field__top">
                <span class="bank-field__label">Расчётный счёт</span>
                <span class="bank-field__badge">Основной реквизит</span>
              </div>
              <button class="bank-field__copy" type="button" @click="copyText('40702810753710001908')">
                <span class="bank-field__value bank-field__value--mono">40702 810 7 5371 0001908</span>
                <span class="bank-field__copy-icon">
                  <Icon name="mdi:content-copy" size="18" />
                </span>
              </button>
            </div>

            <div class="bank-field">
              <span class="bank-field__label">БИК</span>
              <button class="bank-field__copy" type="button" @click="copyText('046126614')">
                <span class="bank-field__value bank-field__value--mono">046126614</span>
                <span class="bank-field__copy-icon">
                  <Icon name="mdi:content-copy" size="17" />
                </span>
              </button>
            </div>

            <div class="bank-field">
              <span class="bank-field__label">Корреспондентский счёт</span>
              <button class="bank-field__copy" type="button" @click="copyText('30101810500000000614')">
                <span class="bank-field__value bank-field__value--mono">30101 810 5 0000 0000614</span>
                <span class="bank-field__copy-icon">
                  <Icon name="mdi:content-copy" size="17" />
                </span>
              </button>
            </div>

            <div class="bank-field bank-field--wide">
              <span class="bank-field__label">Банк</span>
              <button class="bank-field__copy" type="button" @click="copyText('РЯЗАНСКОЕ ОТДЕЛЕНИЕ № 8606 ПАО СБЕРБАНК')">
                <span class="bank-field__value">Рязанское отделение № 8606 ПАО Сбербанк</span>
                <span class="bank-field__copy-icon">
                  <Icon name="mdi:content-copy" size="17" />
                </span>
              </button>
            </div>
          </div>

          <div class="bank-extra">
            <PagesPublicRequisitesCopyRow label="ИНН банка" value="7707083893" mono />
            <PagesPublicRequisitesCopyRow label="КПП банка" value="623402001" mono />
          </div>
        </section>

        <!-- ОСНОВНАЯ ИНФОРМАЦИЯ -->
        <div class="content-grid">
          <section class="info-card info-card--blue">
            <div class="info-card__header">
              <div class="info-card__icon">
                <Icon name="mdi:domain" size="21" />
              </div>
              <div>
                <h2 class="info-card__title">О компании</h2>
                <p class="info-card__description">Основные сведения об организации</p>
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

          <section class="info-card info-card--amber">
            <div class="info-card__header">
              <div class="info-card__icon">
                <Icon name="mdi:phone-outline" size="21" />
              </div>
              <div>
                <h2 class="info-card__title">Контакты</h2>
                <p class="info-card__description">Как связаться с организацией</p>
              </div>
            </div>

            <div class="contact-person">
              <div class="contact-person__avatar">
                <Icon name="mdi:account-outline" size="22" />
              </div>
              <div class="contact-person__content">
                <div class="contact-person__name">Главацкий Павел Евгеньевич</div>
                <div class="contact-person__role">Генеральный директор</div>
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

          <section class="info-card info-card--violet">
            <div class="info-card__header">
              <div class="info-card__icon">
                <Icon name="mdi:map-marker-outline" size="21" />
              </div>
              <div>
                <h2 class="info-card__title">Адрес</h2>
                <p class="info-card__description">Местонахождение организации</p>
              </div>
            </div>

            <div class="address-block">
              <div class="address-block__icon">
                <Icon name="mdi:office-building-outline" size="20" />
              </div>
              <div class="address-block__content">
                <span class="address-block__label">Юридический адрес</span>
                <button type="button" class="address-block__value" @click="copyText(address)">
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

          <section class="info-card info-card--teal">
            <div class="info-card__header">
              <div class="info-card__icon">
                <Icon name="mdi:file-document-outline" size="21" />
              </div>
              <div>
                <h2 class="info-card__title">Регистрационные данные</h2>
                <p class="info-card__description">Государственные классификаторы</p>
              </div>
            </div>

            <div class="registration-grid">
              <PagesPublicRequisitesCopyRow label="ОГРН" value="1266200003167" mono />
              <PagesPublicRequisitesCopyRow label="ОКПО" value="50867784" mono />
              <PagesPublicRequisitesCopyRow label="ОКАТО" value="61401000000" mono />
              <PagesPublicRequisitesCopyRow label="ОКТМО" value="61701000001" mono />
            </div>
          </section>
        </div>

        <!-- QR + ПОДСКАЗКА -->
        <section class="bottom-grid no-print">
          <div class="qr-card">
            <div class="qr-card__content">
              <div class="qr-card__icon">
                <Icon name="mdi:qrcode" size="24" />
              </div>
              <div>
                <h2 class="qr-card__title">Реквизиты на телефоне</h2>
                <p class="qr-card__description">
                  Отсканируйте QR-код, чтобы быстро открыть страницу с реквизитами.
                </p>
              </div>
            </div>
            <div class="qr-card__code">
              <img :src="qrCodeUrl" alt="QR-код реквизитов ООО «ГЛАВПРОФИ»" width="160" height="160" loading="lazy" />
            </div>
          </div>

          <div class="help-card">
            <div class="help-card__icon">
              <Icon name="mdi:lightbulb-outline" size="22" />
            </div>
            <div>
              <h2 class="help-card__title">Быстрое копирование</h2>
              <p class="help-card__text">
                Нажмите на любой реквизит, чтобы скопировать его.
                Для платежа удобнее всего использовать кнопку
                <strong>«Скопировать»</strong> в блоке банковских реквизитов.
              </p>
            </div>
          </div>
        </section>

        <!-- FOOTER -->
        <footer class="page-footer">
          <div class="page-footer__copyright">© {{ currentYear }} ООО «ГЛАВПРОФИ»</div>
          <div class="page-footer__meta">
            <span><Icon name="mdi:shield-check-outline" size="15" /> Действующая организация</span>
            <span><Icon name="mdi:update" size="15" /> Обновлено {{ lastUpdated }}</span>
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

/* ==========================================
   ПАЛИТРА СТРАНИЦЫ
========================================== */
.requisites-page {
  --page-bg-1: #eaf3fb;
  --page-bg-2: #f6f0ff;
  --card-bg: #ffffff;

  --text-main: #0f1a2b;
  --text-secondary: #5a6b80;
  --text-muted: #8b97a8;

  --border: #e2e9f2;

  --blue: #00c3f5;
  --blue-deep: #0072b8;
  --blue-soft: rgba(0, 195, 245, 0.10);

  --green: #00a12a;
  --green-soft: rgba(0, 161, 42, 0.10);

  --amber: #f7b500;
  --amber-soft: rgba(250, 183, 2, 0.12);

  --violet: #7c3aed;
  --violet-soft: rgba(124, 58, 237, 0.10);

  --teal: #0ea5a5;
  --teal-soft: rgba(14, 165, 165, 0.10);

  min-height: 100vh;
  color: var(--text-main);
  background:
    radial-gradient(circle at 0% 0%, rgba(0, 195, 245, 0.18), transparent 32rem),
    radial-gradient(circle at 100% 10%, rgba(124, 58, 237, 0.14), transparent 30rem),
    linear-gradient(180deg, var(--page-bg-1) 0%, var(--page-bg-2) 100%);
  background-attachment: fixed;
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
  margin-top: 3.7em;
  padding-top: 1rem;
  z-index: 100;
  // background: rgba(255, 255, 255, 0.86);
  border-bottom: 1px solid transparent;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &.is-scrolled {
    background: rgba(255, 255, 255, 0.96);
    border-bottom-color: var(--border);
    box-shadow: 0 8px 28px rgba(15, 26, 43, 0.08);
  }

  &__inner {
    min-height: 72px;
    display: flex;
    align-items: center;
    justify-content: end;
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

  &:hover { color: var(--text-main); }

  &__icon {
    width: 32px; height: 32px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: #fff;
    transition: border-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }

  &:hover &__icon {
    color: var(--blue);
    border-color: rgba(0, 195, 245, 0.45);
    box-shadow: 0 6px 16px rgba(0, 195, 245, 0.22);
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
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, color 0.2s ease;

  &--secondary {
    color: var(--blue-deep);
    background: #fff;
    border: 1px solid rgba(0, 195, 245, 0.35);

    &:hover {
      border-color: var(--blue);
      color: #008baa;
      box-shadow: 0 6px 18px rgba(0, 195, 245, 0.22);
      transform: translateY(-1px);
    }
  }

  &--primary {
    color: #fff;
    background: linear-gradient(135deg, #0f172a 0%, #1e3a52 100%);
    border: 1px solid #0f172a;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 24px rgba(15, 26, 43, 0.32);
      background: linear-gradient(135deg, #0a1220 0%, #16304a 100%);
    }
  }
}

/* ==========================================
   HERO
========================================== */
.requisites-content { padding-top: 1rem; }

.company-hero {
  position: relative;
  margin-bottom: 1.5rem;
  padding: 2.4rem 2rem 1.8rem;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(135deg, #0b1a2e 0%, #123a5c 55%, #0e2c4a 100%);
  border-radius: 22px;
  box-shadow: 0 24px 60px -20px rgba(9, 30, 66, 0.55);

  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    pointer-events: none;
    opacity: 0.55;

    &--1 {
      width: 320px; height: 320px;
      top: -100px; right: -60px;
      background: radial-gradient(circle, #00c3f5, transparent 70%);
    }

    &--2 {
      width: 280px; height: 280px;
      bottom: -120px; left: -60px;
      background: radial-gradient(circle, #7c3aed, transparent 70%);
    }
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
    gap: 1.1rem;
    min-width: 0;
  }

  &__text { min-width: 0; }

  &__eyebrow {
    margin-bottom: 0.4rem;
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  &__title {
    margin: 0;
    color: #fff;
    font-size: 2.15rem;
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.025em;
  }

  &__subtitle {
    max-width: 650px;
    margin: 0.5rem 0 0;
    color: rgba(255, 255, 255, 0.72);
    font-size: 0.88rem;
    line-height: 1.5;
  }

  &__identifiers {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.7rem;
    margin-top: 1.8rem;
  }

  &__footer {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.4rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
}

.company-logo {
  width: 100px; height: 100px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: #001b26;
  // background: linear-gradient(135deg, #00c3f5, #7cf0ff);
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(0, 195, 245, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);

  &__img {
    width: 75%;
    height: 75%;
    object-fit: contain;
  }
}

.company-status {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-shrink: 0;
  padding: 0.55rem 0.9rem;
  color: #a7f3b6;
  background: rgba(0, 161, 42, 0.18);
  border: 1px solid rgba(0, 200, 60, 0.35);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  backdrop-filter: blur(4px);

  &__dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #22e05a;
    box-shadow: 0 0 0 4px rgba(34, 224, 90, 0.25), 0 0 12px #22e05a;
  }
}

.identifier {
  min-width: 0;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.7rem;
  padding: 0.75rem 0.9rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  backdrop-filter: blur(6px);
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    background: rgba(0, 195, 245, 0.14);
    border-color: rgba(0, 195, 245, 0.55);
    transform: translateY(-2px);
    box-shadow: 0 10px 24px -8px rgba(0, 195, 245, 0.5);

    svg { color: #7cf0ff; }
  }

  &__label {
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.67rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  &__value {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 0.85rem;
    font-weight: 700;
    white-space: nowrap;
    color: #fff;
  }

  svg {
    color: rgba(255, 255, 255, 0.5);
    transition: color 0.2s ease;
  }
}

.company-location {
  display: flex; align-items: center; gap: 0.45rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.84rem;
  svg { color: #7cf0ff; }
}

.company-updated {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.78rem;
}

/* ==========================================
   BANK CARD
========================================== */
.bank-card {
  position: relative;
  margin-bottom: 1.5rem;
  padding: 1.8rem 1.6rem 1.6rem;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #f2fdf5 100%);
  border: 1px solid rgba(0, 161, 42, 0.18);
  border-radius: 20px;
  box-shadow: 0 14px 40px -18px rgba(0, 161, 42, 0.35);

  &__stripe {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, #00a12a, #00c3f5, #7c3aed);
  }
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1.4rem;

  &__icon {
    width: 48px; height: 48px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    border-radius: 13px;

    &--bank {
      color: #fff;
      background: linear-gradient(135deg, #00a12a, #22c55e);
      box-shadow: 0 10px 22px -8px rgba(0, 161, 42, 0.55);
    }
  }

  &__content { flex: 1; min-width: 0; }

  &__title {
    margin: 0;
    color: var(--text-main);
    font-size: 1.2rem;
    font-weight: 700;
  }

  &__description {
    margin: 0.2rem 0 0;
    color: var(--text-secondary);
    font-size: 0.8rem;
  }
}

.copy-section-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 0.95rem;
  color: #fff;
  background: linear-gradient(135deg, #00a12a, #22c55e);
  border: none;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 22px -10px rgba(0, 161, 42, 0.6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 26px -10px rgba(0, 161, 42, 0.7);
  }
}

.bank-recipient {
  display: grid;
  grid-template-columns: 160px 1fr;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.15rem;
  background: linear-gradient(135deg, #ecfdf3, #e6fbf0);
  border: 1px solid rgba(0, 161, 42, 0.18);
  border-radius: 12px;
  margin-bottom: 0.9rem;

  &__label {
    color: #078633;
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__value {
    color: var(--text-main);
    font-size: 1rem;
    font-weight: 700;
  }
}

.bank-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}

.bank-field {
  padding: 1.05rem 1.1rem;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: rgba(0, 195, 245, 0.45);
    box-shadow: 0 10px 24px -14px rgba(0, 195, 245, 0.65);
    transform: translateY(-1px);
  }

  &--primary {
    background: linear-gradient(135deg, #ecfeff 0%, #e0f8ff 100%);
    border-color: rgba(0, 195, 245, 0.45);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.9);
  }

  &--wide { grid-column: 1 / -1; }

  &__top {
    display: flex; align-items: center; justify-content: space-between;
    gap: 0.5rem; margin-bottom: 0.6rem;
  }

  &__label {
    display: block;
    margin-bottom: 0.6rem;
    color: var(--text-secondary);
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__badge {
    padding: 0.25rem 0.6rem;
    color: #0072b8;
    background: rgba(0, 195, 245, 0.16);
    border: 1px solid rgba(0, 195, 245, 0.35);
    border-radius: 999px;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__copy {
    width: 100%;
    display: flex; align-items: center; justify-content: space-between;
    gap: 0.8rem;
    padding: 0;
    color: var(--text-main);
    background: transparent;
    text-align: left;
    cursor: pointer;
    border: none;

    &:hover {
      .bank-field__value { color: var(--blue-deep); }
      .bank-field__copy-icon {
        color: #fff;
        background: linear-gradient(135deg, #00c3f5, #0072b8);
        box-shadow: 0 6px 14px -4px rgba(0, 195, 245, 0.55);
      }
    }
  }

  &__value {
    min-width: 0;
    color: var(--text-main);
    font-size: 0.92rem;
    font-weight: 700;
    line-height: 1.5;
    word-break: break-word;
    transition: color 0.2s ease;

    &--mono {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 0.9rem;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;
    }
  }

  &__copy-icon {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: var(--blue-deep);
    background: rgba(0, 195, 245, 0.12);
    border-radius: 9px;
    transition: color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
  }
}

.bank-extra {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  margin-top: 0.4rem;

  :deep(.copy-row) { border-bottom: none; }
}

/* ==========================================
   CONTENT GRID
========================================== */
.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-card {
  position: relative;
  padding: 1.4rem 1.4rem 1.1rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;

  // цветная полоска сверху
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: var(--accent-line, linear-gradient(90deg, #00c3f5, #0072b8));
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 40px -18px var(--accent-shadow, rgba(0, 195, 245, 0.5));
    border-color: var(--accent-border, rgba(0, 195, 245, 0.4));
  }

  // модификаторы — цветовые темы
  &--blue {
    --accent-line: linear-gradient(90deg, #00c3f5, #0072b8);
    --accent-border: rgba(0, 195, 245, 0.45);
    --accent-shadow: rgba(0, 195, 245, 0.55);
    --icon-color: #fff;
    --icon-bg: linear-gradient(135deg, #00c3f5, #0072b8);
    --icon-shadow: rgba(0, 195, 245, 0.55);
  }

  &--amber {
    --accent-line: linear-gradient(90deg, #f7b500, #ff8a00);
    --accent-border: rgba(247, 181, 0, 0.45);
    --accent-shadow: rgba(247, 181, 0, 0.55);
    --icon-color: #fff;
    --icon-bg: linear-gradient(135deg, #f7b500, #ff8a00);
    --icon-shadow: rgba(247, 181, 0, 0.55);
  }

  &--violet {
    --accent-line: linear-gradient(90deg, #7c3aed, #ec4899);
    --accent-border: rgba(124, 58, 237, 0.45);
    --accent-shadow: rgba(124, 58, 237, 0.5);
    --icon-color: #fff;
    --icon-bg: linear-gradient(135deg, #7c3aed, #ec4899);
    --icon-shadow: rgba(124, 58, 237, 0.5);
  }

  &--teal {
    --accent-line: linear-gradient(90deg, #0ea5a5, #22d3ee);
    --accent-border: rgba(14, 165, 165, 0.45);
    --accent-shadow: rgba(14, 165, 165, 0.55);
    --icon-color: #fff;
    --icon-bg: linear-gradient(135deg, #0ea5a5, #22d3ee);
    --icon-shadow: rgba(14, 165, 165, 0.55);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding-bottom: 1rem;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
  }

  &__icon {
    width: 44px; height: 44px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: var(--icon-color, #fff);
    background: var(--icon-bg, linear-gradient(135deg, #00c3f5, #0072b8));
    border-radius: 12px;
    box-shadow: 0 10px 22px -10px var(--icon-shadow, rgba(0, 195, 245, 0.5));
  }

  &__title {
    margin: 0;
    color: var(--text-main);
    font-size: 1.02rem;
    font-weight: 700;
  }

  &__description {
    margin: 0.2rem 0 0;
    color: var(--text-secondary);
    font-size: 0.77rem;
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
  gap: 0.85rem;
  padding: 0.85rem;
  margin-bottom: 0.35rem;
  background: linear-gradient(135deg, #fff8e6, #fff3d1);
  border: 1px solid rgba(247, 181, 0, 0.25);
  border-radius: 12px;

  &__avatar {
    width: 42px; height: 42px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #fff;
    background: linear-gradient(135deg, #f7b500, #ff8a00);
    border-radius: 50%;
    box-shadow: 0 8px 18px -6px rgba(247, 181, 0, 0.6);
  }

  &__name {
    color: var(--text-main);
    font-size: 0.85rem;
    font-weight: 700;
  }

  &__role {
    margin-top: 0.12rem;
    color: #b27900;
    font-size: 0.72rem;
    font-weight: 600;
  }
}

/* ==========================================
   ADDRESS
========================================== */
.address-block {
  display: flex;
  gap: 0.85rem;
  padding: 0.95rem;
  margin-bottom: 0.4rem;
  background: linear-gradient(135deg, #f5eeff, #fce7f3);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 12px;

  &__icon {
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #fff;
    background: linear-gradient(135deg, #7c3aed, #ec4899);
    border-radius: 10px;
    box-shadow: 0 8px 18px -8px rgba(124, 58, 237, 0.6);
  }

  &__content { min-width: 0; }

  &__label {
    display: block;
    margin-bottom: 0.22rem;
    color: #6d28d9;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
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
    font-weight: 600;
    line-height: 1.5;
    text-align: left;
    cursor: pointer;

    &:hover {
      color: #6d28d9;
      svg { color: #7c3aed; }
    }

    svg {
      flex-shrink: 0;
      margin-top: 2px;
      color: #a78bfa;
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
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.qr-card,
.help-card {
  border-radius: 18px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.qr-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #eef8ff 100%);
  border: 1px solid rgba(0, 195, 245, 0.25);
  box-shadow: 0 14px 36px -20px rgba(0, 195, 245, 0.55);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 44px -20px rgba(0, 195, 245, 0.7);
  }

  &__content {
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
  }

  &__icon {
    width: 44px; height: 44px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #fff;
    background: linear-gradient(135deg, #00c3f5, #0072b8);
    border-radius: 12px;
    box-shadow: 0 10px 22px -10px rgba(0, 195, 245, 0.7);
  }

  &__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
  }

  &__description {
    max-width: 390px;
    margin: 0.3rem 0 0;
    color: var(--text-secondary);
    font-size: 0.79rem;
    line-height: 1.55;
  }

  &__code {
    flex-shrink: 0;
    padding: 0.65rem;
    background: #fff;
    border: 2px solid rgba(0, 195, 245, 0.35);
    border-radius: 12px;
    box-shadow: 0 10px 22px -14px rgba(0, 195, 245, 0.8);

    img {
      display: block;
      width: 130px; height: 130px;
    }
  }
}

.help-card {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fffbe6 0%, #fff3bf 100%);
  border: 1px solid rgba(247, 181, 0, 0.35);
  box-shadow: 0 14px 36px -20px rgba(247, 181, 0, 0.75);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 44px -20px rgba(247, 181, 0, 0.85);
  }

  &__icon {
    width: 44px; height: 44px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #fff;
    background: linear-gradient(135deg, #f7b500, #ff8a00);
    border-radius: 12px;
    box-shadow: 0 10px 22px -10px rgba(247, 181, 0, 0.75);
  }

  &__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #6b4a00;
  }

  &__text {
    margin: 0.4rem 0 0;
    color: #7a5a10;
    font-size: 0.8rem;
    line-height: 1.6;

    strong {
      color: #4a3400;
      font-weight: 700;
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

      svg { color: var(--blue); }
    }
  }
}

/* ==========================================
   RESPONSIVE
========================================== */
@media (max-width: 900px) {
  .content-grid { grid-template-columns: 1fr; }
  .bottom-grid { grid-template-columns: 1fr; }

  .company-hero {
    &__main { flex-direction: column; }
    &__identifiers { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
}

@media (max-width: 700px) {
  .requisites-content { padding-top: 1rem; }
  .actions-bar__inner { min-height: 62px; }

  .back-link span:last-child { display: none; }

  .action-button {
    padding: 0.6rem 0.75rem;
    span { display: none; }
  }

  .company-hero {
    padding: 1.5rem 1.2rem 1.2rem;

    &__title { font-size: 1.6rem; }
    &__subtitle { font-size: 0.8rem; }
    &__identifiers { grid-template-columns: 1fr; }
    &__footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  .identifier { width: 100%; min-width: 0; }

  .bank-card { padding: 1.25rem 1rem 1rem; }

  .section-heading {
    align-items: flex-start;

    &__icon { width: 42px; height: 42px; }
    &__title { font-size: 1.05rem; }
    &__description { font-size: 0.74rem; }
  }

  .copy-section-button {
    width: 42px; height: 42px;
    padding: 0;
    span { display: none; }
  }

  .bank-details-grid { grid-template-columns: 1fr; }
  .bank-field--wide { grid-column: auto; }
  .bank-recipient { grid-template-columns: 1fr; gap: 0.25rem; }
  .bank-extra { grid-template-columns: 1fr; }
  .registration-grid { grid-template-columns: 1fr; }

  .qr-card {
    align-items: flex-start;
    &__code img { width: 105px; height: 105px; }
  }

  .page-footer {
    align-items: flex-start;
    flex-direction: column;
    &__meta { flex-direction: column; align-items: flex-start; gap: 0.4rem; }
  }
}

@media (max-width: 480px) {
  .company-logo { width: 52px; height: 52px; }

  .company-hero {
    &__identity { align-items: flex-start; }
    &__title { font-size: 1.4rem; }
    &__subtitle { font-size: 0.75rem; }
  }

  .company-status { font-size: 0.72rem; }

  .qr-card {
    flex-direction: column;
    &__code { align-self: center; }
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

  .requisites-content { padding-top: 0; }

  .company-hero,
  .bank-card,
  .info-card,
  .qr-card,
  .help-card {
    box-shadow: none !important;
    transform: none !important;
  }

  .company-hero {
    color: #111 !important;
    background: #fff !important;
    border: 1px solid #d8d8d8 !important;

    &__glow { display: none !important; }
    &__title { color: #111 !important; }
    &__subtitle,
    &__eyebrow,
    .company-updated { color: #555 !important; }
    &__footer { border-top-color: #ddd !important; }
  }

  .company-logo {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;

    &__img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
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

  .identifier {
    color: #111 !important;
    background: #f7f7f7 !important;
    border-color: #ccc !important;

    &__label,
    &__value { color: #111 !important; }
    svg { display: none; }
  }

  .company-location {
    color: #333 !important;
    svg { color: #333 !important; }
  }

  .bank-card {
    border-color: #ccc !important;
    background: #fff !important;

    &__stripe { background: #333 !important; }
  }

  .bank-field--primary {
    background: #f7f7f7 !important;
    border-color: #bbb !important;
  }

  .bank-field__copy-icon,
  .copy-section-button,
  .bank-field__badge { display: none !important; }

  .info-card {
    break-inside: avoid;
    page-break-inside: avoid;

    &::before { background: #333 !important; }
  }

  .info-card__icon {
    background: #333 !important;
    color: #fff !important;
    box-shadow: none !important;
  }

  .contact-person,
  .address-block,
  .help-card,
  .qr-card {
    background: #f7f7f7 !important;
    border-color: #ddd !important;
  }

  .bottom-grid { display: none !important; }

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