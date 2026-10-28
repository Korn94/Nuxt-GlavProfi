<!-- app/components/pages/Cabinet/test/RgrRealtors/index.vue -->
<!--
  📞 Блок «Риэлторы Рязани» для /cabinet/testpage2 (пункт меню «Тест2»).

  Источник: Единый реестр РГР — https://reestr.rgr.ru/rieltory/ryazanskaya-oblast/ryazan-10961/
  Телефонов в листинге нет: номер лежит на персональной странице специалиста, поэтому
  он собирается сервером (server/utils/rgrRealtors.ts) «по требованию»:
  - «Показать» в строке — один номер;
  - «Показать телефоны страницы» — все карточки открытой страницы;
  - «Обновить номера» — принудительный повторный парсинг (номера подменные).

  ⚠️ Номера нигде не сохраняются (ни в БД, ни долго в кэше сервера).
-->
<template>
  <section class="rgr">
    <!-- ── Заголовок и статистика ───────────────────────────────── -->
    <header class="rgr__head">
      <div>
        <h2 class="rgr__title">📞 Риэлторы Рязани — телефоны (РГР)</h2>
        <p class="rgr__subtitle">
          Источник:
          <a :href="sourceUrl" target="_blank" rel="noopener noreferrer">{{ sourceUrl }}</a>.
          Номера <b>подменные</b> (переадресация РГР): значения могут отличаться при каждом
          парсинге, ничего не сохраняется — собираем «по требованию».
        </p>
      </div>
      <div class="rgr__stats">
        <span class="rgr__stat">
          Специалистов в городе: <b>{{ listing?.totalSpecialists ?? '—' }}</b>
        </span>
        <span class="rgr__stat">
          Номеров собрано на странице: <b>{{ collectedCount }}</b> из {{ items.length }}
        </span>
      </div>
    </header>

    <!-- ── Кнопки управления ────────────────────────────────────── -->
    <div class="rgr__actions">
      <button
        class="rgr-btn rgr-btn--primary"
        :disabled="listLoading || bulkLoading || !items.length"
        @click="loadPagePhones(false)"
      >
        <Icon :name="bulkLoading ? 'mdi:loading' : 'mdi:phone-outline'" size="16" :class="spinClass(bulkLoading)" />
        {{ bulkLoading ? 'Собираю телефоны…' : 'Показать телефоны страницы' }}
      </button>

      <button
        class="rgr-btn"
        :disabled="bulkLoading || !items.length"
        title="Номера подменные — перепарсить заново"
        @click="loadPagePhones(true)"
      >
        <Icon name="mdi:refresh" size="16" :class="spinClass(bulkLoading)" />
        Обновить номера
      </button>

      <button class="rgr-btn" :disabled="!hasAnyPhone" @click="copyAllPhones">
        <Icon name="mdi:content-copy" size="16" />
        {{ copyState }}
      </button>

      <button class="rgr-btn" :disabled="!hasAnyPhone" @click="downloadCsv">
        <Icon name="mdi:download-outline" size="16" />
        Скачать CSV
      </button>

      <button class="rgr-btn" :disabled="listLoading" @click="reloadListing">
        <Icon name="mdi:database-refresh-outline" size="16" :class="spinClass(listLoading)" />
        Обновить список
      </button>
    </div>

    <!-- ── Ошибки и метаданные парсинга ─────────────────────────── -->
    <div v-if="listError" class="rgr-alert rgr-alert--error">
      <Icon name="mdi:alert-circle-outline" size="18" />
      <span class="rgr-alert__text">{{ listError }}</span>
      <button class="rgr-btn rgr-btn--sm" @click="reloadListing">Повторить</button>
    </div>

    <div v-else-if="phoneError" class="rgr-alert rgr-alert--warn">
      <Icon name="mdi:alert-outline" size="18" />
      <span class="rgr-alert__text">{{ phoneError }}</span>
      <button class="rgr-btn rgr-btn--sm" @click="phoneError = ''">Скрыть</button>
    </div>

    <div v-if="lastPhonesAt" class="rgr__meta">
      <Icon name="mdi:clock-outline" size="13" />
      Телефоны спарсены: {{ formatDateTime(lastPhonesAt) }}
      <span class="rgr-muted">(кэш номеров на сервере — 30 секунд)</span>
    </div>

    <!-- ── Скелетон загрузки ────────────────────────────────────── -->
    <div v-if="listLoading" class="rgr-skeleton">
      <div v-for="i in 6" :key="i" class="rgr-skeleton__row" />
    </div>

    <!-- ── Пустой результат ─────────────────────────────────────── -->
    <div v-else-if="!items.length" class="rgr-state">
      <Icon name="mdi:account-search-outline" size="32" />
      <span>Специалисты не найдены</span>
    </div>

    <!-- ── Таблица специалистов ─────────────────────────────────── -->
    <div v-else class="rgr__table-wrap">
      <table class="rgr-table">
        <thead>
          <tr>
            <th class="rgr-table__num">№</th>
            <th class="rgr-table__photo-col">Фото</th>
            <th>Специалист</th>
            <th>Агентство / адрес</th>
            <th>Аттестат</th>
            <th class="rgr-table__rating-col">Рейтинг</th>
            <th class="rgr-table__phone-col">Телефон</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in items" :key="item.url">
            <td class="rgr-table__num">{{ (page - 1) * perPage + i + 1 }}</td>

            <td class="rgr-table__photo-col">
              <a :href="item.url" target="_blank" rel="noopener noreferrer" class="rgr-photo">
                <img v-if="item.photo" :src="item.photo" :alt="item.name" loading="lazy" />
                <span v-else class="rgr-photo__stub"><Icon name="mdi:account-outline" size="20" /></span>
              </a>
            </td>

            <td>
              <a :href="item.url" target="_blank" rel="noopener noreferrer" class="rgr-name">{{ item.name }}</a>
              <div v-if="item.position" class="rgr-muted">{{ item.position }}</div>
            </td>

            <td>
              <div v-if="item.agency.name" class="rgr-agency">
                <a v-if="item.agency.url" :href="item.agency.url" target="_blank" rel="noopener noreferrer">
                  {{ item.agency.name }}
                </a>
                <span v-else>{{ item.agency.name }}</span>
              </div>
              <div v-if="item.address" class="rgr-muted">{{ item.address }}</div>
            </td>

            <td>
              <div v-if="item.attestat">{{ item.attestat }}</div>
              <div v-if="item.attestatUntil" class="rgr-muted">до {{ item.attestatUntil }}</div>
            </td>

            <td class="rgr-table__rating-col">
              <span v-if="item.rating !== null" class="rgr-rating">
                <Icon name="mdi:star" size="12" />{{ formatRating(item.rating) }}
              </span>
              <span v-else class="rgr-muted">—</span>
            </td>

            <!-- Телефон: подгружается по требованию -->
            <td class="rgr-table__phone-col">
              <span v-if="phoneOf(item.url)?.phone" class="rgr-phone">
                <a :href="`tel:+${phoneOf(item.url)?.digits}`">{{ phoneOf(item.url)?.phone }}</a>
                <button class="rgr-phone__copy" title="Скопировать номер" @click="copyPhone(item)">
                  <Icon name="mdi:content-copy" size="13" />
                </button>
              </span>

              <span v-else-if="phoneOf(item.url) && !phoneOf(item.url)?.error" class="rgr-muted">
                нет телефона
              </span>

              <span v-else-if="phoneOf(item.url)?.error" class="rgr-error" :title="phoneOf(item.url)?.error || ''">
                ошибка
              </span>

              <button
                v-else
                class="rgr-btn rgr-btn--sm"
                :disabled="isPhoneLoading(item.url)"
                @click="loadOnePhone(i, item.url)"
              >
                <Icon
                  :name="isPhoneLoading(item.url) ? 'mdi:loading' : 'mdi:phone-outline'"
                  size="13"
                  :class="spinClass(isPhoneLoading(item.url))"
                />
                {{ isPhoneLoading(item.url) ? '…' : 'Показать' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Пагинация листинга ───────────────────────────────────── -->
    <div v-if="listing && listing.totalPages > 1" class="rgr__pager">
      <button class="rgr-btn rgr-btn--sm" :disabled="page <= 1 || listLoading" @click="goToPage(page - 1)">
        ← Назад
      </button>

      <button
        v-for="p in pageNumbers"
        :key="p"
        class="rgr-pager__btn"
        :class="{ 'rgr-pager__btn--active': p === page }"
        :disabled="listLoading || p === page"
        @click="goToPage(p)"
      >
        {{ p }}
      </button>

      <button
        class="rgr-btn rgr-btn--sm"
        :disabled="page >= listing.totalPages || listLoading"
        @click="goToPage(page + 1)"
      >
        Вперёд →
      </button>

      <span class="rgr__pager-info">Страница {{ page }} из {{ listing.totalPages }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 📞 Блок «Риэлторы Рязани» — телефоны из Единого реестра РГР.
 *
 * Телефоны собираются «по требованию» (сервер парсит страницы reestr.rgr.ru):
 * - «Показать» в строке — один номер;
 * - «Показать телефоны страницы» — все карточки открытой страницы;
 * - «Обновить номера» — принудительный повторный парсинг (номера подменные).
 *
 * Ничего не сохраняется: сервер держит только 30-секундный кэш от двойных кликов,
 * листинг — 5 минут (см. server/utils/rgrRealtors.ts).
 */
import { computed, onMounted, reactive, ref } from 'vue'
import type {
  RgrPhoneItem,
  RgrRealtor,
  RgrRealtorsResponse,
  RgrPhonesResponse
} from 'shared/types/rgr'

/** Страница листинга РГР отдаёт 30 карточек — нужно для сквозной нумерации строк. */
const perPage = 30
/** Публичный адрес источника (нужен до первого ответа API). */
const fallbackSourceUrl = 'https://reestr.rgr.ru/rieltory/ryazanskaya-oblast/ryazan-10961/'

// ============================================
// СОСТОЯНИЕ
// ============================================
const page = ref(1)
const listing = ref<RgrRealtorsResponse | null>(null)
const listLoading = ref(false)
const listError = ref('')
const bulkLoading = ref(false)
const phoneError = ref('')
const lastPhonesAt = ref('')
const copyState = ref('Скопировать номера')
const loadingUrls = ref<string[]>([])

/** Спарсенные номера: ключ — URL карточки специалиста. */
const phones = reactive<Record<string, RgrPhoneItem>>({})

// ============================================
// ПРОИЗВОДНЫЕ
// ============================================
const sourceUrl = computed(() => listing.value?.sourceUrl || fallbackSourceUrl)
const items = computed<RgrRealtor[]>(() => listing.value?.items ?? [])
const hasAnyPhone = computed(() => items.value.some(item => Boolean(phones[item.url]?.phone)))
const collectedCount = computed(() => items.value.filter(item => Boolean(phones[item.url]?.phone)).length)

/** Компактный набор кнопок пагинации: края + окно вокруг текущей страницы. */
const pageNumbers = computed(() => {
  const total = listing.value?.totalPages ?? 1
  const current = page.value
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const visible = new Set<number>([1, total, current - 1, current, current + 1])
  return Array.from(visible)
    .filter(value => value >= 1 && value <= total)
    .sort((a, b) => a - b)
})

// ============================================
// ХЕЛПЕРЫ
// ============================================
function phoneOf(url: string): RgrPhoneItem | undefined {
  return phones[url]
}

function isPhoneLoading(url: string): boolean {
  return loadingUrls.value.includes(url)
}

/** Класс анимации вращения для иконок загрузки. */
function spinClass(active: boolean): string {
  return active ? 'rgr-spin' : ''
}

function formatRating(rating: number): string {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(2)
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('ru-RU')
}

function errorMessage(error: unknown): string {
  const typed = error as { data?: { statusMessage?: string }; statusMessage?: string; message?: string }
  return typed?.data?.statusMessage || typed?.statusMessage || typed?.message || 'Не удалось выполнить запрос'
}

// ============================================
// ЛИСТИНГ: ЗАГРУЗКА И ПАГИНАЦИЯ
// ============================================
async function loadListing(targetPage = page.value, options: { fresh?: boolean } = {}) {
  listLoading.value = true
  listError.value = ''
  try {
    const data = await $fetch<RgrRealtorsResponse>('/api/rgr/realtors', {
      query: { page: targetPage, ...(options.fresh ? { fresh: '1' } : {}) }
    })
    listing.value = data
    page.value = data.page
  } catch (error) {
    listError.value = errorMessage(error)
  } finally {
    listLoading.value = false
  }
}

function reloadListing() {
  void loadListing(page.value, { fresh: true })
}

function goToPage(target: number) {
  if (target < 1) return
  if (listing.value && target > listing.value.totalPages) return
  void loadListing(target)
}

// ============================================
// ТЕЛЕФОНЫ: СБОР «ПО ТРЕБОВАНИЮ»
// ============================================
function applyPhones(response: RgrPhonesResponse) {
  response.items.forEach(item => {
    phones[item.url] = item
  })
  lastPhonesAt.value = response.fetchedAt
}

/** Один номер — по клику на конкретную карточку. */
async function loadOnePhone(index: number, url: string) {
  if (isPhoneLoading(url)) return
  phoneError.value = ''
  loadingUrls.value = [...loadingUrls.value, url]
  try {
    const response = await $fetch<RgrPhonesResponse>('/api/rgr/phones', {
      query: { page: String(page.value), indices: String(index) }
    })
    applyPhones(response)
  } catch (error) {
    phoneError.value = errorMessage(error)
  } finally {
    loadingUrls.value = loadingUrls.value.filter(item => item !== url)
  }
}

/** Все телефоны открытой страницы; fresh=true — перепарсить (номера подменные). */
async function loadPagePhones(fresh: boolean) {
  if (bulkLoading.value) return
  bulkLoading.value = true
  phoneError.value = ''
  try {
    const response = await $fetch<RgrPhonesResponse>('/api/rgr/phones', {
      query: { page: String(page.value), ...(fresh ? { fresh: '1' } : {}) }
    })
    applyPhones(response)
    if (response.requested > 0 && response.found === 0) {
      phoneError.value = 'Номера не найдены — возможно, изменилась верстка источника РГР'
    }
  } catch (error) {
    phoneError.value = errorMessage(error)
  } finally {
    bulkLoading.value = false
  }
}

// ============================================
// КОПИРОВАНИЕ И ЭКСПОРТ CSV
// ============================================
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // ниже — fallback для http/старых браузеров
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(area)
    return copied
  } catch {
    return false
  }
}

function flashCopyState(text: string) {
  copyState.value = text
  setTimeout(() => {
    copyState.value = 'Скопировать номера'
  }, 2500)
}

async function copyPhone(item: RgrRealtor) {
  const phone = phones[item.url]
  if (!phone?.digits) return
  const copied = await writeToClipboard(phone.digits)
  flashCopyState(copied ? `Скопирован: ${phone.phone}` : 'Не удалось скопировать')
}

/** Только собранные номера, строкой «ФИО — номер». */
function collectedPhoneLines(): string[] {
  return items.value
    .map(item => {
      const phone = phones[item.url]?.phone
      return phone ? `${item.name} — ${phone}` : ''
    })
    .filter(Boolean)
}

async function copyAllPhones() {
  const lines = collectedPhoneLines()
  if (lines.length === 0) return
  const copied = await writeToClipboard(lines.join('\n'))
  flashCopyState(copied ? `Скопировано номеров: ${lines.length}` : 'Не удалось скопировать')
}

/** CSV с разделителем «;» и BOM — открывается в Excel без «кракозябр». */
function downloadCsv() {
  const header = ['№', 'ФИО', 'Должность', 'Агентство', 'Адрес', 'Аттестат', 'Срок действия', 'Рейтинг', 'Телефон', 'Ссылка']
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`

  const rows = items.value.map((item, index) => {
    const cells = [
      String((page.value - 1) * perPage + index + 1),
      item.name,
      item.position ?? '',
      item.agency.name ?? '',
      item.address ?? '',
      item.attestat ?? '',
      item.attestatUntil ?? '',
      item.rating !== null ? formatRating(item.rating) : '',
      phones[item.url]?.phone ?? '',
      item.url
    ]
    return cells.map(escapeCell).join(';')
  })

  const csv = `\uFEFF${[header.map(escapeCell).join(';'), ...rows].join('\r\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `rieltory-ryazan-page${page.value}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

onMounted(() => {
  void loadListing(1)
})
</script>

<style scoped lang="scss">
// ─── Контейнер блока ────────────────────────────────────────────────
.rgr {
  margin-top: 32px;
  padding: 20px;
  background: $background-light;
  border: 1px solid $border-color;
  border-radius: 12px;
  color: $text-dark;
  font-size: 13px;

  &__head {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  &__title {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.3;
  }

  &__subtitle {
    max-width: 720px;
    margin: 0;
    color: $text-gray;
    line-height: 1.5;

    a {
      color: $blue;
      word-break: break-all;
    }

    b {
      color: $text-dark;
    }
  }

  &__stats {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    background: $sub-item-bg;
    border-radius: 8px;
    white-space: nowrap;
  }

  &__stat {
    color: $text-gray;

    b {
      color: $text-dark;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    color: $text-gray;
    font-size: 12px;
  }

  &__table-wrap {
    overflow-x: auto;
    border: 1px solid $border-color;
    border-radius: 8px;
  }

  &__pager {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
  }

  &__pager-info {
    margin-left: auto;
    color: $text-gray;
    font-size: 12px;
  }
}

// ─── Кнопки ─────────────────────────────────────────────────────────
.rgr-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  background: $background-light;
  color: $text-dark;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: $transition;

  &:hover:not(:disabled) {
    border-color: $blue;
    color: $blue;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &--primary {
    border-color: $blue;
    background: $blue;
    color: $text-light;

    &:hover:not(:disabled) {
      background: color.adjust($blue, $lightness: -8%);
      color: $text-light;
    }
  }

  &--sm {
    padding: 4px 8px;
    font-size: 12px;
  }
}

.rgr-pager__btn {
  min-width: 32px;
  padding: 6px 8px;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  background: $background-light;
  color: $text-dark;
  font-size: 12px;
  cursor: pointer;
  transition: $transition;

  &:hover:not(:disabled) {
    border-color: $blue;
    color: $blue;
  }

  &--active {
    border-color: $blue;
    background: $blue;
    color: $text-light;
    font-weight: 600;
  }
}

// ─── Уведомления ────────────────────────────────────────────────────
.rgr-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;

  &__text {
    flex: 1;
    line-height: 1.45;
  }

  &--error {
    border: 1px solid rgba($red, 0.25);
    background: rgba($red, 0.06);
    color: $red;
  }

  &--warn {
    border: 1px solid rgba($yellow, 0.4);
    background: rgba($yellow, 0.12);
    color: color.adjust($yellow, $lightness: -28%);
  }
}

// ─── Таблица ────────────────────────────────────────────────────────
.rgr-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid $border-color;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: $sub-item-bg;
    color: $text-gray;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  tbody tr:hover {
    background: rgba($blue, 0.04);
  }

  &__num {
    width: 48px;
    color: $text-gray;
    text-align: right;
  }

  &__photo-col {
    width: 56px;
  }

  &__rating-col {
    width: 90px;
    white-space: nowrap;
  }

  &__phone-col {
    width: 210px;
    white-space: nowrap;
  }
}

// ─── Ячейки таблицы ─────────────────────────────────────────────────
.rgr-photo {
  display: block;
  width: 44px;
  height: 56px;
  overflow: hidden;
  border-radius: 6px;
  background: $sub-item-bg;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__stub {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: $text-gray;
  }
}

.rgr-name {
  color: $text-dark;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    color: $blue;
    text-decoration: underline;
  }
}

.rgr-agency a {
  color: $blue;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.rgr-muted {
  margin-top: 2px;
  color: $text-gray;
  font-size: 12px;
  line-height: 1.4;
}

.rgr-error {
  color: $red;
  font-size: 12px;
  cursor: help;
}

.rgr-rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: $yellow;
  font-weight: 600;
}

.rgr-phone {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  a {
    color: $text-dark;
    font-weight: 600;
    white-space: nowrap;
    text-decoration: none;

    &:hover {
      color: $blue;
      text-decoration: underline;
    }
  }

  &__copy {
    display: inline-flex;
    padding: 3px;
    border: 1px solid $border-color;
    border-radius: 4px;
    background: transparent;
    color: $text-gray;
    cursor: pointer;
    transition: $transition;

    &:hover {
      border-color: $blue;
      color: $blue;
    }
  }
}

// ─── Состояния загрузки ─────────────────────────────────────────────
.rgr-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__row {
    height: 56px;
    border-radius: 8px;
    background: linear-gradient(90deg, $sub-item-bg, rgba($blue, 0.08), $sub-item-bg);
    background-size: 200% 100%;
    animation: rgr-shimmer 1.4s ease-in-out infinite;
  }
}

.rgr-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px;
  color: $text-gray;
}

.rgr-spin {
  animation: rgr-spin 0.9s linear infinite;
}

@keyframes rgr-shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@keyframes rgr-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>


