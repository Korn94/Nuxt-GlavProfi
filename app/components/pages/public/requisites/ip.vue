<!-- app\components\pages\public\requisites\ip.vue -->
<template>
  <div class="requisites-page">
    <!-- Верхняя панель -->
    <div class="actions-bar no-print" :class="{ 'is-scrolled': isScrolled }">
      <div class="container">
        <div class="actions-bar__inner">
          <button class="action-button action-button--secondary" type="button" @click="copyAll">
            <Icon name="mdi:content-copy" size="18" />
            <span>Скопировать реквизиты</span>
          </button>

          <button class="action-button action-button--primary" type="button" @click="printPage">
            <Icon name="mdi:printer-outline" size="18" />
            <span>Печать / PDF</span>
          </button>
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
                <Icon name="mdi:account-tie-outline" size="54" />
              </div>

              <div class="company-hero__text">
                <div class="company-hero__eyebrow">Реквизиты ИП</div>
                <h1 class="company-hero__title">ИП Главацкий П.Е.</h1>
                <p class="company-hero__subtitle">
                  Индивидуальный предприниматель Главацкий Павел Евгеньевич
                </p>
              </div>
            </div>

            <div class="company-status">
              <span class="company-status__dot"></span>
              <span>Действующий ИП</span>
            </div>
          </div>

          <div class="company-hero__identifiers company-hero__identifiers--two">
            <button class="identifier" type="button" @click="copyText('622907683792')">
              <span class="identifier__label">ИНН</span>
              <span class="identifier__value">622907683792</span>
              <Icon name="mdi:content-copy" size="15" />
            </button>

            <button class="identifier" type="button" @click="copyText('321623400019751')">
              <span class="identifier__label">ОГРНИП</span>
              <span class="identifier__value">321623400019751</span>
              <Icon name="mdi:content-copy" size="15" />
            </button>
          </div>

          <div class="company-hero__footer">
            <div class="company-location">
              <Icon name="mdi:map-marker-outline" size="18" />
              <span>Рязанская обл., Путятинский р-н</span>
            </div>
            <div class="hero-footer__right">
              <a
                :href="egrulUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="egrul-link"
              >
                <Icon name="mdi:shield-check-outline" size="16" />
                <span>Проверить в ФНС</span>
              </a>
              <div class="freshness-indicator" :class="`freshness-indicator--${freshness.status}`">
                <Icon :name="freshness.icon" size="15" />
                <span>{{ freshness.label }}</span>
              </div>
            </div>
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

            <button class="copy-section-button copy-section-button--1c" type="button" @click="copyFor1C">
              <Icon name="mdi:content-copy" size="17" />
              <span>Для 1С</span>
            </button>

            <button class="copy-section-button" type="button" @click="copyBankDetails">
              <Icon name="mdi:content-copy" size="17" />
              <span>Скопировать</span>
            </button>
          </div>

          <div class="bank-recipient">
            <div class="bank-recipient__label">Получатель</div>
            <div class="bank-recipient__value">ИП Главацкий П.Е.</div>
          </div>

          <div class="bank-details-grid">
            <div class="bank-field bank-field--primary">
              <div class="bank-field__top">
                <span class="bank-field__label">Расчётный счёт</span>
                <span class="bank-field__badge">Основной реквизит</span>
              </div>
              <button class="bank-field__copy" type="button" @click="copyText('40802810653000018724')">
                <span class="bank-field__value bank-field__value--mono">40802 810 6 5300 0018724</span>
                <span class="bank-field__copy-icon">
                  <Icon name="mdi:content-copy" size="18" />
                </span>
              </button>
            </div>

            <div class="bank-field">
              <span class="bank-field__label">БИК</span>
              <button class="bank-field__copy" type="button" @click="copyText('045402601')">
                <span class="bank-field__value bank-field__value--mono">045402601</span>
                <span class="bank-field__copy-icon">
                  <Icon name="mdi:content-copy" size="17" />
                </span>
              </button>
            </div>

            <div class="bank-field">
              <span class="bank-field__label">Корреспондентский счёт</span>
              <button class="bank-field__copy" type="button" @click="copyText('30101810300000000601')">
                <span class="bank-field__value bank-field__value--mono">30101 810 3 0000 0000601</span>
                <span class="bank-field__copy-icon">
                  <Icon name="mdi:content-copy" size="17" />
                </span>
              </button>
            </div>

            <div class="bank-field bank-field--wide">
              <span class="bank-field__label">Банк</span>
              <button class="bank-field__copy" type="button" @click="copyText('Орловское отделение №8595 ПАО СБЕРБАНК')">
                <span class="bank-field__value">Орловское отделение №8595 ПАО Сбербанк</span>
                <span class="bank-field__copy-icon">
                  <Icon name="mdi:content-copy" size="17" />
                </span>
              </button>
            </div>
          </div>
        </section>

        <!-- ОСНОВНАЯ ИНФОРМАЦИЯ -->
        <div class="content-grid">
          <section class="info-card info-card--blue">
            <div class="info-card__header">
              <div class="info-card__icon">
                <Icon name="mdi:account-tie-outline" size="21" />
              </div>
              <div>
                <h2 class="info-card__title">Об ИП</h2>
                <p class="info-card__description">Основные сведения о предпринимателе</p>
              </div>
            </div>

            <div class="info-card__body">
              <PagesPublicRequisitesCopyRow
                label="Полное наименование"
                value="Индивидуальный предприниматель Главацкий Павел Евгеньевич"
              />
              <PagesPublicRequisitesCopyRow
                label="Сокращённое наименование"
                value="ИП Главацкий П.Е."
              />
              <PagesPublicRequisitesCopyRow
                label="ИНН"
                value="622907683792"
                mono
              />
              <PagesPublicRequisitesCopyRow
                label="ОГРНИП"
                value="321623400019751"
                mono
              />
              <PagesPublicRequisitesCopyRow
                label="КПП"
                value="—"
                display-value="Не присваивается (ИП)"
              />
              <PagesPublicRequisitesCopyRow
                label="Основной ОКВЭД"
                :value="okvedMain.code"
                :display-value="`${okvedMain.code} — ${okvedMain.name}`"
              />
              <PagesPublicRequisitesCopyRow
                label="Система налогообложения"
                value="УСН (доходы)"
                display-value="Упрощённая (доходы), без НДС"
              />
              <PagesPublicRequisitesCopyRow
                label="Налоговый орган"
                value="УФНС по Рязанской области"
              />
              <PagesPublicRequisitesCopyRow
                label="Рег. номер в СФР"
                value="1220536468"
                display-value="1220536468 (пенсионное страхование)"
                mono
              />
              <PagesPublicRequisitesCopyRow
                label="Дата регистрации"
                value="26.04.2021"
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
                <p class="info-card__description">Как связаться с предпринимателем</p>
              </div>
            </div>

            <div class="contact-person">
              <div class="contact-person__avatar">
                <Icon name="mdi:account-outline" size="22" />
              </div>
              <div class="contact-person__content">
                <div class="contact-person__name">Главацкий Павел Евгеньевич</div>
                <div class="contact-person__role">Индивидуальный предприниматель</div>
              </div>
            </div>

            <div class="info-card__body">
              <PagesPublicRequisitesCopyRow
                label="Телефон"
                value="+79657140801"
                display-value="+7 (965) 714-08-01"
                icon="mdi:phone-outline"
                link
                href="tel:+79657140801"
              />
              <PagesPublicRequisitesCopyRow
                label="Электронная почта"
                value="glavprofi@yandex.ru"
                icon="mdi:email-outline"
                link
                href="mailto:glavprofi@yandex.ru"
              />
              
              <div class="messenger-links">
                <a
                  href="https://max.ru/u/f9LHodD0cOLfbBSpAeCwHBcJ83SJtKVj9mVKY7K8OLd6OwYB0gH6g3XE_Cs"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="messenger-link"
                  aria-label="MAX"
                >
                  <img src="https://maxicons.ru/icons/Max_logo_black.svg" alt="MAX" class="messenger-link__icon" />
                  <span>MAX</span>
                </a>
                <a
                  href="tg://resolve?domain=glavprofii"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="messenger-link"
                  aria-label="Telegram"
                >
                  <Icon name="mdi:telegram" class="messenger-link__icon" size="24" />
                  <span>Telegram</span>
                </a>
              </div>
            </div>
          </section>

          <section class="info-card info-card--violet info-card--full">
            <div class="info-card__header">
              <div class="info-card__icon">
                <Icon name="mdi:map-marker-outline" size="21" />
              </div>
              <div>
                <h2 class="info-card__title">Адрес</h2>
                <p class="info-card__description">Местонахождение предпринимателя</p>
              </div>
            </div>

            <div class="address-block">
              <div class="address-block__icon">
                <Icon name="mdi:home-outline" size="20" />
              </div>
              <div class="address-block__content">
                <span class="address-block__label">Юридический адрес</span>
                <button type="button" class="address-block__value" @click="copyText(address)">
                  {{ address }}
                  <Icon name="mdi:content-copy" size="16" />
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- ВИДЫ ДЕЯТЕЛЬНОСТИ (ОКВЭД) -->
        <section class="info-card info-card--green info-card--full okved-card">
          <div class="info-card__header">
            <div class="info-card__icon">
              <Icon name="mdi:briefcase-outline" size="21" />
            </div>
            <div class="okved-card__header-content">
              <div>
                <h2 class="info-card__title">Виды деятельности</h2>
                <p class="info-card__description">
                  Основной и {{ okvedAdditional.length }} дополнительных кода ОКВЭД
                </p>
              </div>
              <div class="okved-card__main-tag">
                <span class="okved-card__main-label">Основной</span>
                <span class="okved-card__main-code">{{ okvedMain.code }}</span>
                <span class="okved-card__main-name">{{ okvedMain.name }}</span>
              </div>
            </div>
          </div>

          <div class="okved-card__grid">
            <div
              v-for="(item, index) in visibleOkved"
              :key="item.code"
              class="okved-item"
              :class="{ 'okved-item--hidden': !showAllOkved && index >= okvedPreviewCount }"
            >
              <button type="button" class="okved-item__inner" @click="copyText(`${item.code} — ${item.name}`)">
                <span class="okved-item__code">{{ item.code }}</span>
                <span class="okved-item__name">{{ item.name }}</span>
                <Icon name="mdi:content-copy" size="14" class="okved-item__copy" />
              </button>
            </div>
          </div>

          <button
            v-if="okvedAdditional.length > okvedPreviewCount"
            type="button"
            class="okved-card__toggle no-print"
            @click="showAllOkved = !showAllOkved"
          >
            <Icon :name="showAllOkved ? 'mdi:chevron-up' : 'mdi:chevron-down'" size="18" />
            <span v-if="!showAllOkved">
              Показать все {{ okvedAdditional.length }} кодов
            </span>
            <span v-else>Скрыть дополнительные коды</span>
          </button>
        </section>

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
              <img :src="qrCodeUrl" alt="QR-код реквизитов ИП Главацкий П.Е." width="160" height="160" loading="lazy" />
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
                Для импорта в 1С используйте кнопку
                <strong>«Для 1С»</strong>.
              </p>
            </div>
          </div>
        </section>

        <!-- FOOTER -->
        <footer class="page-footer">
          <div class="page-footer__copyright">© {{ currentYear }} ИП Главацкий П.Е.</div>
          <div class="page-footer__meta">
            <span><Icon name="mdi:shield-check-outline" size="15" /> Действующий ИП</span>
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

const requestURL = useRequestURL()

// Дата последнего обновления вычисляется динамически
const lastUpdated = computed(() => {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  return `${day}.${month}.${year}`
})

const address = '391480, Рязанская обл., Путятинский р-н, п. Агрокультура, ул. Сасыкинская, д. 8'

// Основной ОКВЭД
const okvedMain = {
  code: '43.34',
  name: 'Производство малярных и стекольных работ'
}

// Дополнительные ОКВЭД (по выписке ЕГРИП)
const okvedAdditional = [
  { code: '41.10', name: 'Разработка строительных проектов' },
  { code: '41.20', name: 'Строительство жилых и нежилых зданий' },
  { code: '43.11', name: 'Разборка и снос зданий' },
  { code: '43.12', name: 'Подготовка строительной площадки' },
  { code: '43.13', name: 'Разведочное бурение' },
  { code: '43.21', name: 'Производство электромонтажных работ' },
  { code: '43.22', name: 'Производство санитарно-технических работ, монтаж отопительных систем и систем кондиционирования воздуха' },
  { code: '43.29', name: 'Производство прочих строительно-монтажных работ' },
  { code: '43.31', name: 'Производство штукатурных работ' },
  { code: '43.32', name: 'Работы столярные и плотничные' },
  { code: '43.33', name: 'Работы по устройству покрытий полов и облицовке стен' },
  { code: '43.39', name: 'Производство прочих отделочных и завершающих работ' },
  { code: '43.91', name: 'Производство кровельных работ' },
  { code: '43.99', name: 'Работы строительные специализированные прочие, не включенные в другие группировки' },
  { code: '47.19', name: 'Торговля розничная прочая в неспециализированных магазинах' },
  { code: '62.01', name: 'Разработка компьютерного программного обеспечения' },
  { code: '62.02', name: 'Деятельность консультативная и работы в области компьютерных технологий' },
  { code: '62.03', name: 'Деятельность по управлению компьютерным оборудованием' },
  { code: '63.11', name: 'Деятельность по обработке данных, предоставление услуг по размещению информации и связанная с этим деятельность' },
  { code: '63.12', name: 'Деятельность web-порталов' },
  { code: '63.99', name: 'Деятельность информационных служб прочая, не включенная в другие группировки' },
  { code: '70.21', name: 'Деятельность в сфере связей с общественностью' },
  { code: '73.11', name: 'Деятельность рекламных агентств' },
  { code: '74.10', name: 'Деятельность специализированная в области дизайна' }
]

const okvedPreviewCount = 6
const showAllOkved = ref(false)

// ИСПРАВЛЕНО: корректная логика показа/скрытия ОКВЭДов
const visibleOkved = computed(() => {
  return showAllOkved.value 
    ? okvedAdditional 
    : okvedAdditional.slice(0, okvedPreviewCount)
})

// Ссылка на выписку из ЕГРИП (регион 62 — Рязанская обл.)
const egrulUrl = computed(() =>
  'https://egrul.nalog.ru/index.html?w=1&query=622907683792&region=62'
)

// Индикатор свежести реквизитов
const freshness = computed(() => {
  const [day, month, year] = lastUpdated.value.split('.').map(Number)
  const updated = new Date(year, month - 1, day)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  updated.setHours(0, 0, 0, 0)

  const diffMs = now.getTime() - updated.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (days <= 30) {
    return {
      days,
      status: 'fresh',
      label: days === 0 ? 'Актуально' : `Обновлено ${days} дн. назад`,
      icon: 'mdi:check-circle-outline'
    }
  }

  if (days <= 90) {
    return {
      days,
      status: 'warn',
      label: `Обновлено ${days} дн. назад`,
      icon: 'mdi:clock-alert-outline'
    }
  }

  return {
    days,
    status: 'stale',
    label: 'Проверьте актуальность',
    icon: 'mdi:alert-circle-outline'
  }
})

const qrData = computed(() => requestURL.href)

const qrCodeUrl = computed(() => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(qrData.value)}`
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
  title: 'Реквизиты ИП Главацкий П.Е.',
  meta: [
    {
      name: 'description',
      content: 'Юридические и банковские реквизиты ИП Главацкий Павел Евгеньевич'
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
  const data = `Получатель: ИП Главацкий П.Е.
ИНН: 622907683792
Банк: Орловское отделение №8595 ПАО СБЕРБАНК
БИК: 045402601
Р/с: 40802810653000018724
К/с: 30101810300000000601`

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

// Форматирование под 1С:Предприятие (строго по требованиям импорта)
const copyFor1C = async () => {
  const data = `Получатель: ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ГЛАВАЦКИЙ ПАВЕЛ ЕВГЕНЬЕВИЧ
ИНН: 622907683792
Счёт: 40802810653000018724
Банк: ОРЛОВСКОЕ ОТДЕЛЕНИЕ N8595 ПАО СБЕРБАНК г. ОРЁЛ
БИК: 045402601
Кор.счёт: 30101810300000000601`

  const ok = await copyToClipboard(data)

  if (ok) {
    notifications.success(
      'Реквизиты для 1С скопированы',
      'Формат для импорта в 1С:Предприятие'
    )
  } else {
    notifications.error(
      'Не удалось скопировать',
      'Проверьте разрешения браузера'
    )
  }
}

const copyAll = async () => {
  const okvedList = okvedAdditional.map(o => `  • ${o.code} — ${o.name}`).join('\n')
  const allData = `ИП Главацкий П.Е.

Полное наименование:
Индивидуальный предприниматель Главацкий Павел Евгеньевич

Сокращённое наименование:
ИП Главацкий П.Е.

ИНН: 622907683792
ОГРНИП: 321623400019751
КПП: не присваивается

Основной ОКВЭД: ${okvedMain.code} — ${okvedMain.name}

Дополнительные ОКВЭД (${okvedAdditional.length}):
${okvedList}

Система налогообложения: УСН (доходы), без НДС
Налоговый орган: Управление ФНС по Рязанской области
Рег. номер в СФР: 1220536468
Дата регистрации: 26.04.2021

Юридический адрес:
391480, Рязанская обл., Путятинский р-н, п. Агрокультура, ул. Сасыкинская, д. 8

Банк:
Орловское отделение №8595 ПАО СБЕРБАНК

БИК: 045402601
Р/с: 40802810653000018724
К/с: 30101810300000000601

Телефон: +7 (965) 714-08-01
Email: glavprofi@yandex.ru

Индивидуальный предприниматель:
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

  --red: #dc2626;
  --red-soft: rgba(220, 38, 38, 0.10);

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

    &--two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      max-width: 640px;
    }
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

.hero-footer__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.egrul-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  color: rgba(255, 255, 255, 0.88);
  background: rgba(0, 195, 245, 0.14);
  border: 1px solid rgba(0, 195, 245, 0.35);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  backdrop-filter: blur(4px);
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;

  svg { color: #7cf0ff; }

  &:hover {
    color: #fff;
    background: rgba(0, 195, 245, 0.25);
    border-color: rgba(0, 195, 245, 0.6);
    transform: translateY(-1px);
  }
}

.freshness-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  backdrop-filter: blur(4px);

  &--fresh {
    color: #a7f3b6;
    background: rgba(0, 161, 42, 0.18);
    border: 1px solid rgba(34, 224, 90, 0.45);

    svg { color: #22e05a; }
  }

  &--warn {
    color: #fde68a;
    background: rgba(247, 181, 0, 0.2);
    border: 1px solid rgba(247, 181, 0, 0.45);

    svg { color: #fbbf24; }
  }

  &--stale {
    color: #fecaca;
    background: rgba(220, 38, 38, 0.18);
    border: 1px solid rgba(239, 68, 68, 0.45);

    svg { color: #ef4444; }
  }
}

.company-logo {
  width: 100px; height: 100px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: #fff;
  background: linear-gradient(135deg, #00c3f5, #0072b8);
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(0, 195, 245, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
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
  gap: 0.7rem;
  margin-bottom: 1.4rem;
  flex-wrap: wrap;

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

  &--1c {
    background: linear-gradient(135deg, #f7b500, #ff8a00);
    box-shadow: 0 10px 22px -10px rgba(247, 181, 0, 0.6);
    color: #3d2800;

    &:hover {
      box-shadow: 0 14px 26px -10px rgba(247, 181, 0, 0.7);
    }
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

  &--green {
    --accent-line: linear-gradient(90deg, #00a12a, #0ea5a5);
    --accent-border: rgba(0, 161, 42, 0.45);
    --accent-shadow: rgba(0, 161, 42, 0.5);
    --icon-color: #fff;
    --icon-bg: linear-gradient(135deg, #00a12a, #0ea5a5);
    --icon-shadow: rgba(0, 161, 42, 0.5);
  }

  &--full {
    grid-column: 1 / -1;
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
   OKVED CARD
========================================== */
.okved-card {
  &__header-content {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__main-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.9rem;
    color: #078633;
    background: linear-gradient(135deg, #ecfdf3, #e6fbf0);
    border: 1px solid rgba(0, 161, 42, 0.3);
    border-radius: 10px;
    flex-shrink: 0;
  }

  &__main-label {
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(7, 134, 51, 0.7);
  }

  &__main-code {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 0.85rem;
    font-weight: 700;
    color: #078633;
  }

  &__main-name {
    font-size: 0.78rem;
    color: #078633;
    font-weight: 500;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.6rem;
    margin-top: 0.6rem;
  }

  &__toggle {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.85rem 1rem;
    margin-top: 1rem;
    color: #078633;
    background: linear-gradient(135deg, #ecfdf3, #e6fbf0);
    border: 1px solid rgba(0, 161, 42, 0.3);
    border-radius: 10px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #d4f8e0, #d1f5df);
      border-color: rgba(0, 161, 42, 0.5);
      transform: translateY(-1px);
    }

    svg {
      color: #00a12a;
    }
  }
}

.okved-item {
  &__inner {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.7rem 0.85rem;
    background: #f8fbf9;
    border: 1px solid rgba(0, 161, 42, 0.15);
    border-radius: 9px;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

    &:hover {
      background: #edf7f0;
      border-color: rgba(0, 161, 42, 0.4);
      transform: translateY(-1px);

      .okved-item__copy {
        color: #078633;
        opacity: 1;
      }
    }
  }

  &__code {
    flex-shrink: 0;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 0.78rem;
    font-weight: 700;
    color: #078633;
    background: rgba(0, 161, 42, 0.1);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    margin-top: 1px;
  }

  &__name {
    flex: 1;
    font-size: 0.78rem;
    line-height: 1.4;
    color: var(--text-main);
    font-weight: 500;
  }

  &__copy {
    flex-shrink: 0;
    color: var(--text-muted);
    opacity: 0.5;
    transition: opacity 0.2s ease, color 0.2s ease;
    margin-top: 2px;
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

.messenger-links {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.messenger-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  color: var(--text-main);
  background: linear-gradient(135deg, #fff8e6, #fff3d1);
  border: 1px solid rgba(247, 181, 0, 0.25);
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px -4px rgba(247, 181, 0, 0.4);
  }

  &__icon {
    width: 20px;
    height: 20px;
    color: $blue;
  }

  img.messenger-link__icon {
    width: 20px;
    height: 20px;
  }
}

/* ==========================================
   ADDRESS
========================================== */
.address-block {
  display: flex;
  gap: 0.85rem;
  padding: 0.95rem;
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

  .info-card--full { grid-column: auto; }

  .company-hero {
    &__main { flex-direction: column; }
    &__identifiers { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    &__identifiers--two { max-width: 100%; }
    &__footer { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  }

  .hero-footer__right {
    width: 100%;
    justify-content: flex-start;
  }

  .okved-card {
    &__header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    &__main-tag {
      flex-wrap: wrap;
    }

    &__grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
  }
}

@media (max-width: 700px) {
  .requisites-content { padding-top: 1rem; }
  .actions-bar__inner { min-height: 62px; }

  .action-button {
    padding: 0.6rem 0.75rem;
    span { display: none; }
  }

  .company-hero {
    padding: 1.5rem 1.2rem 1.2rem;

    &__title { font-size: 1.6rem; }
    &__subtitle { font-size: 0.8rem; }
    &__identifiers,
    &__identifiers--two { grid-template-columns: 1fr; }
    &__footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  .identifier { width: 100%; min-width: 0; }

  .bank-card { padding: 1.25rem 1rem 1rem; }

  .section-heading {
    align-items: flex-start;
    gap: 0.6rem;

    &__icon { width: 42px; height: 42px; }
    &__title { font-size: 1.05rem; }
    &__description { font-size: 0.74rem; }
  }

  .copy-section-button {
    padding: 0.55rem 0.8rem;
    font-size: 0.75rem;
  }

  .bank-details-grid { grid-template-columns: 1fr; }
  .bank-field--wide { grid-column: auto; }
  .bank-recipient { grid-template-columns: 1fr; gap: 0.25rem; }

  .okved-card__grid { grid-template-columns: 1fr; }

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

  .hero-footer__right {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .copy-section-button {
    width: 100%;
    justify-content: center;
  }

  .okved-card__main-tag {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }
}

/* ==========================================
   PRINT / PDF — A4 (одна страница)
========================================== */
@media print {
  // === СКРЫВАЕМ ГЛОБАЛЬНЫЕ ЭЛЕМЕНТЫ САЙТА ===
  :global(header),
  :global(nav),
  :global([data-header]),
  :global([data-nav]),
  :global(footer:not(.page-footer)),
  :global(.site-header),
  :global(.site-nav),
  :global(.site-footer),
  :global(.layout-header),
  :global(.layout-footer),
  :global([class*="Header"]),
  :global([class*="Nav"]),
  :global([class*="Menu"]),
  :global([class*="menu"]) {
    display: none !important;
  }

  // === НАСТРОЙКИ СТРАНИЦЫ ===
  @page {
    size: A4 portrait;
    margin: 1cm 1.2cm;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  .requisites-page {
    min-height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
    background: #fff !important;
    font-size: 10px !important;
  }

  .container {
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  // === СКРЫВАЕМ НЕВАЖНОЕ ДЛЯ ПЕЧАТИ ===
  .actions-bar,
  .bottom-grid,
  .no-print,
  .egrul-link,
  .freshness-indicator,
  .identifier svg,
  .company-hero__glow,
  .okved-card,  // СКРЫВАЕМ ОКВЭДЫ ПОЛНОСТЬЮ
  .okved-card__toggle,
  .copy-section-button,
  .bank-field__copy-icon,
  .address-block__value svg,
  .okved-item__copy,
  .bank-field__badge,
  .company-hero__footer .hero-footer__right {
    display: none !important;
  }

  .requisites-content {
    padding-top: 0 !important;
  }

  // === HERO — компактный заголовок ===
  .company-hero {
    padding: 0.8rem 1rem !important;
    margin-bottom: 0.6rem !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #f5f8fb !important;
    color: #111 !important;
    border: 1px solid #d8d8d8 !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .company-hero__main {
    gap: 0.8rem !important;
  }

  .company-hero__identity {
    gap: 0.6rem !important;
  }

  .company-logo {
    width: 44px !important;
    height: 44px !important;
    background: #e8e8e8 !important;
    color: #333 !important;
    box-shadow: none !important;
    border-radius: 8px !important;

    svg { width: 26px !important; height: 26px !important; }
  }

  .company-hero__eyebrow {
    color: #666 !important;
    font-size: 0.65rem !important;
    margin-bottom: 0.15rem !important;
  }

  .company-hero__title {
    color: #111 !important;
    font-size: 1.4rem !important;
    line-height: 1.1 !important;
    margin: 0 !important;
  }

  .company-hero__subtitle {
    color: #555 !important;
    font-size: 0.72rem !important;
    margin: 0.15rem 0 0 !important;
  }

  .company-status {
    padding: 0.25rem 0.6rem !important;
    background: #fff !important;
    color: #0a7a25 !important;
    border: 1px solid #0a7a25 !important;
    font-size: 0.65rem !important;

    &__dot {
      background: #0a7a25 !important;
      box-shadow: none !important;
      width: 6px !important; height: 6px !important;
    }
  }

  .company-hero__identifiers {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.4rem !important;
    margin-top: 0.5rem !important;
    max-width: 100% !important;
  }

  .identifier {
    padding: 0.4rem 0.6rem !important;
    background: #fff !important;
    color: #111 !important;
    border: 1px solid #ccc !important;
    border-radius: 6px !important;
    gap: 0.4rem !important;

    &__label {
      color: #666 !important;
      font-size: 0.58rem !important;
    }

    &__value {
      color: #111 !important;
      font-size: 0.75rem !important;
    }
  }

  .company-hero__footer {
    margin-top: 0.4rem !important;
    padding-top: 0.4rem !important;
    border-top: 1px solid #ddd !important;
  }

  .company-location {
    color: #333 !important;
    font-size: 0.72rem !important;

    svg {
      color: #333 !important;
      width: 14px !important; height: 14px !important;
    }
  }

  // === БАНКОВСКИЕ РЕКВИЗИТЫ ===
  .bank-card {
    padding: 0.7rem 0.8rem !important;
    margin-bottom: 0.5rem !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    border: 1px solid #ccc !important;
    break-inside: avoid;
    page-break-inside: avoid;

    &__stripe { background: #333 !important; height: 3px !important; }
  }

  .section-heading {
    margin-bottom: 0.5rem !important;
    gap: 0.5rem !important;

    &__icon {
      width: 28px !important; height: 28px !important;
      background: #333 !important;
      border-radius: 6px !important;

      svg { width: 16px !important; height: 16px !important; }
    }

    &__title {
      font-size: 0.95rem !important;
      margin: 0 !important;
    }

    &__description {
      font-size: 0.65rem !important;
      margin: 0 !important;
    }

    &__content { flex: 1; }
  }

  .bank-recipient {
    padding: 0.5rem 0.7rem !important;
    margin-bottom: 0.4rem !important;
    background: #f5f5f5 !important;
    border: 1px solid #ddd !important;
    border-radius: 4px !important;
    grid-template-columns: 110px 1fr !important;
    gap: 0.5rem !important;

    &__label {
      font-size: 0.65rem !important;
      color: #333 !important;
    }

    &__value {
      font-size: 0.82rem !important;
    }
  }

  .bank-details-grid {
    grid-template-columns: 1fr 1fr !important;
    gap: 0.35rem !important;
  }

  .bank-field {
    padding: 0.4rem 0.6rem !important;
    background: #fff !important;
    border: 1px solid #ddd !important;
    border-radius: 4px !important;

    &--primary {
      background: #f5f9fc !important;
      grid-column: 1 / -1 !important;
    }

    &--wide { grid-column: 1 / -1 !important; }

    &__label {
      margin-bottom: 0.15rem !important;
      font-size: 0.62rem !important;
      color: #666 !important;
    }

    &__value {
      font-size: 0.78rem !important;
      color: #111 !important;

      &--mono {
        font-size: 0.78rem !important;
        font-weight: 700 !important;
      }
    }
  }

  // === ИНФО-КАРТОЧКИ ===
  .content-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 0.5rem !important;
    margin-bottom: 0 !important;
  }

  .info-card {
    padding: 0.5rem 0.6rem !important;
    border-radius: 4px !important;
    box-shadow: none !important;
    break-inside: avoid;
    page-break-inside: avoid;
    border: 1px solid #ddd !important;

    &::before {
      background: #333 !important;
      height: 3px !important;
    }

    &--full {
      grid-column: 1 / -1 !important;
    }

    &__header {
      padding-bottom: 0.35rem !important;
      margin-bottom: 0.35rem !important;
      gap: 0.4rem !important;
      border-bottom: 1px solid #eee !important;
    }

    &__icon {
      width: 24px !important; height: 24px !important;
      border-radius: 5px !important;
      background: #333 !important;
      box-shadow: none !important;

      svg { width: 14px !important; height: 14px !important; }
    }

    &__title {
      font-size: 0.8rem !important;
      margin: 0 !important;
    }

    &__description {
      font-size: 0.58rem !important;
      margin: 0 !important;
    }
  }

  // === КОНТАКТЫ ===
  .contact-person {
    padding: 0.4rem !important;
    margin-bottom: 0.3rem !important;
    background: #fff8e6 !important;
    border: 1px solid #f0d98a !important;
    border-radius: 4px !important;
    gap: 0.5rem !important;

    &__avatar {
      width: 28px !important; height: 28px !important;
      background: #f7b500 !important;

      svg { width: 16px !important; height: 16px !important; }
    }

    &__name { font-size: 0.75rem !important; }
    &__role { font-size: 0.62rem !important; }
  }

  // === АДРЕС ===
  .address-block {
    padding: 0.5rem !important;
    background: #f5f0ff !important;
    border: 1px solid #d4c3f5 !important;
    border-radius: 4px !important;
    gap: 0.5rem !important;

    &__icon {
      width: 24px !important; height: 24px !important;
      background: #7c3aed !important;
      border-radius: 5px !important;

      svg { width: 14px !important; height: 14px !important; }
    }

    &__label {
      font-size: 0.6rem !important;
      margin-bottom: 0.1rem !important;
      color: #6d28d9 !important;
    }

    &__value {
      font-size: 0.72rem !important;
      line-height: 1.3 !important;
    }
  }

  // === FOOTER ===
  .page-footer {
    padding: 0.4rem 0 0 !important;
    margin-top: 0.4rem !important;
    border-top: 1px solid #ddd !important;
    font-size: 0.65rem !important;

    &__meta { gap: 0.8rem !important; }
    svg { width: 11px !important; height: 11px !important; }
  }
}
</style>