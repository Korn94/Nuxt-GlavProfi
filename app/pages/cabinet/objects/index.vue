<!-- app/pages/cabinet/objects/index.vue -->
<template>
  <div class="objects-page">
    <!-- Заголовок всегда (для SSR и гидратации) -->
    <PagesCabinetUiLayoutPageTitle title="Объекты" icon="mdi:office-building-outline">
      <template #actions>
        <!-- Форма добавления только ПОСЛЕ монтирования и при наличии прав -->
        <div v-if="isMounted && canCreate" class="add-form">
          <input 
            v-model="newObjectName" 
            class="add-form__input" 
            placeholder="Название объекта"
            @keyup.enter="addObject" 
          />
          <button 
            class="crm-btn crm-btn--accent" 
            @click="addObject" 
            :disabled="!newObjectName.trim() || loading"
          >
            <Icon name="mdi:plus" size="15" />
            Добавить
          </button>
        </div>
      </template>
    </PagesCabinetUiLayoutPageTitle>

    <div class="objects-page__content">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- ФАЗА 1: До монтирования (SSR + гидратация) — СОВПАДАЕТ с сервером -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <template v-if="!isMounted">
        <div class="objects-nav">
          <div class="tabs">
            <button 
              v-for="tab in tabs" 
              :key="tab.value" 
              class="tab" 
              :class="{ 'tab--active': currentTab === tab.value }"
            >
              {{ tab.label }}
              <span class="tab__count">0</span>
            </button>
          </div>
        </div>
        
        <div class="objects-card">
          <div class="objects-skeleton">
            <div v-for="i in 4" :key="i" class="skel" />
          </div>
        </div>
      </template>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- ФАЗА 2: После монтирования — реальная логика с проверкой прав -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <template v-else>
        <!-- ❌ Нет прав на просмотр -->
        <UiAccessDeniedBlock v-if="!canView" />

        <!-- ⏳ Загрузка данных -->
        <template v-else>
          <!-- Вкладки + счётчик -->
          <div class="objects-nav">
            <div class="tabs">
              <button 
                v-for="tab in tabs" 
                :key="tab.value" 
                class="tab" 
                :class="{ 'tab--active': currentTab === tab.value }"
                @click="currentTab = tab.value"
              >
                {{ tab.label }}
                <span class="tab__count">{{ counts[tab.value as TabValue] }}</span>
              </button>
            </div>

            <div class="counts-summary" title="Активные / Ожидают / Завершены / Отклонены">
              <span>{{ counts.active }}</span>
              <span class="counts-summary__sep">/</span>
              <span>{{ counts.waiting }}</span>
              <span class="counts-summary__sep">/</span>
              <span>{{ counts.completed }}</span>
              <span class="counts-summary__sep">/</span>
              <span>{{ counts.canceled }}</span>
            </div>
          </div>

          <!-- Сводка по завершённым объектам (без доп. запросов — из загруженного списка) -->
          <div
            v-if="currentTab === 'completed' && !loading && completedSummary.count"
            class="objects-summary"
          >
            <span class="objects-summary__item">
              <Icon name="mdi:office-building-outline" size="13" />
              Объектов: <strong>{{ completedSummary.count }}</strong>
            </span>
            <span class="objects-summary__item">
              <Icon name="mdi:file-document-outline" size="13" />
              Договоры: <strong>{{ formatMoney(completedSummary.contract) }}</strong>
            </span>
            <span class="objects-summary__item">
              <Icon name="mdi:cash-multiple" size="13" />
              Приход: <strong>{{ formatMoney(completedSummary.income) }}</strong>
            </span>
            <span class="objects-summary__item">
              <Icon name="mdi:chart-line" size="13" />
              Маржа:
              <strong :class="completedSummary.margin >= 0 ? 'pos' : 'neg'">
                {{ formatMoney(completedSummary.margin) }}
              </strong>
            </span>
            <span class="objects-summary__item">
              <Icon name="mdi:calendar-range" size="13" />
              Средний срок:
              <strong>
                {{ completedSummary.avgDays === null ? '—' : `${completedSummary.avgDays} ${pluralDays(completedSummary.avgDays)}` }}
              </strong>
            </span>
          </div>

          <!-- Список -->
          <div class="objects-card">
            <!-- Скелетон -->
            <div v-if="loading" class="objects-skeleton">
              <div v-for="i in 4" :key="i" class="skel" />
            </div>

            <!-- Пустое состояние -->
            <div v-else-if="!filteredObjects.length" class="objects-empty">
              <Icon name="mdi:office-building-outline" size="36" />
              <span>Нет объектов в категории «{{ currentTabLabel }}»</span>
            </div>

            <!-- Список объектов -->
            <ul v-else class="object-list">
              <li 
                v-for="(obj, idx) in filteredObjects" 
                :key="obj.id" 
                class="object-list__item"
                :class="{ 'object-list__item--alt': idx % 2 === 1 }"
              >
                <NuxtLink :to="`/cabinet/objects/${obj.id}`" class="object-item">
                  <!-- Основная информация -->
                  <div class="object-item__main">
                    <div class="object-item__name">{{ obj.name }}</div>

                    <div class="object-item__meta">
                      <span v-if="obj.address">
                        <Icon name="mdi:map-marker-outline" size="12" />
                        {{ obj.address }}
                      </span>
                      <span v-if="obj.foreman">
                        <Icon name="mdi:account-hard-hat-outline" size="12" />
                        {{ obj.foreman.name }}
                      </span>
                      <span v-if="!obj.address && !obj.foreman" class="meta-empty">Адрес не указан</span>
                    </div>

                    <div class="object-item__docs">
                      <div :class="['doc-chip', `doc-chip--${getDocumentClass(obj)}`]" :title="getDocumentTooltip(obj)">
                        <span class="doc-chip__dot" />
                        {{ getDocumentText(obj) }}
                      </div>
                      <div :class="['doc-chip', `doc-chip--${getInvoiceClass(obj)}`]" :title="getInvoiceTooltip(obj)">
                        <span class="doc-chip__dot" />
                        Счета {{ obj.invoiceStats.signed }}/{{ obj.invoiceStats.total }}
                      </div>
                      <div :class="['doc-chip', `doc-chip--${getActClass(obj)}`]" :title="getActTooltip(obj)">
                        <span class="doc-chip__dot" />
                        Акты {{ obj.actStats.signed }}/{{ obj.actStats.total }}
                      </div>
                    </div>

                    <!-- Доп. статистика завершённого объекта -->
                    <div v-if="obj.status === 'completed'" class="object-item__stats">
                      <span
                        class="stat-chip"
                        :class="{ 'stat-chip--muted': getWorkDays(obj) === null }"
                        :title="obj.startDate ? `Старт: ${formatDate(obj.startDate)}` : 'Дата начала не указана'"
                      >
                        <Icon name="mdi:calendar-range" size="12" />
                        {{ getDurationText(obj) }}
                      </span>

                      <span
                        v-if="obj.completedDate || obj.statusDate"
                        class="stat-chip"
                        :title="getPlanTooltip(obj)"
                      >
                        <Icon name="mdi:calendar-check-outline" size="12" />
                        Завершён {{ formatDate(obj.completedDate || obj.statusDate) }}
                      </span>

                      <span
                        v-if="getPlanDeltaDays(obj) !== null"
                        class="stat-chip"
                        :class="(getPlanDeltaDays(obj) || 0) > 0 ? 'stat-chip--neg' : 'stat-chip--pos'"
                        :title="getPlanTooltip(obj)"
                      >
                        <Icon name="mdi:clock-alert-outline" size="12" />
                        {{ getPlanDeltaText(obj) }}
                      </span>

                      <span v-if="obj.source" class="stat-chip" title="Источник объекта">
                        <Icon name="mdi:source-branch" size="12" />
                        {{ obj.source }}
                      </span>
                    </div>
                  </div>

                  <!-- Финансы справа -->
                  <div class="object-item__finance">
                    <!-- Активные/ожидающие: баланс -->
                    <template v-if="obj.status !== 'completed'">
                      <div class="fin-block">
                        <span class="fin-block__label">Баланс</span>
                        <span class="fin-block__value" :class="obj.totalBalance >= 0 ? 'pos' : 'neg'">
                          {{ formatNumber(obj.totalBalance) }} ₽
                        </span>
                      </div>
                      <div class="fin-detail">
                        <span>Работы: {{ formatNumber(obj.totalWorks) }} ₽</span>
                        <span>
                          Мат.:
                          <span :class="getMaterialBalance(obj) >= 0 ? 'pos' : 'neg'">
                            {{ getMaterialBalance(obj) >= 0 ? '+' : '' }}{{ formatNumber(getMaterialBalance(obj)) }} ₽
                          </span>
                        </span>
                      </div>
                    </template>

                    <!-- Завершённые: маржинальность + суммы договора и прихода -->
                    <template v-else>
                      <div class="fin-block">
                        <span class="fin-block__label">Маржа</span>
                        <span
                          v-if="getProfitability(obj)"
                          class="fin-block__value"
                          :class="getProfitabilityData(obj).isProfit ? 'pos' : 'neg'"
                        >
                          {{ getProfitabilityData(obj).text }}
                        </span>
                        <span v-else class="fin-block__value fin-block__value--muted" title="Нет прихода по объекту">—</span>
                      </div>
                      <div class="fin-detail">
                        <span title="Сумма договора — итог по смете">Договор: {{ formatMoneyOrDash(obj.contractAmount) }}</span>
                        <span>Приход: {{ formatMoney(obj.totalIncome) }}</span>
                        <span>Работы: {{ formatNumber(obj.totalWorks) }} ₽</span>
                        <span>
                          Мат.:
                          <span :class="getMaterialBalance(obj) >= 0 ? 'pos' : 'neg'">
                            {{ getMaterialBalance(obj) >= 0 ? '+' : '' }}{{ formatNumber(getMaterialBalance(obj)) }} ₽
                          </span>
                        </span>
                      </div>
                    </template>
                  </div>

                  <Icon name="mdi:chevron-right" size="16" class="object-item__arrow" />
                </NuxtLink>
              </li>
            </ul>

            <div class="objects-card__footer">
              Всего: {{ filteredObjects.length }} объект(а)
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHead } from 'nuxt/app'
import { useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { usePermissions } from '~/composables/usePermissions'
import { useNotifications } from '~/composables/useNotifications'

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

const api = useApi()
const router = useRouter()
const notifications = useNotifications()
const { can } = usePermissions()

useHead({ 
  title: 'CRM — Объекты', 
  meta: [{ name: 'robots', content: 'noindex, nofollow' }] 
})

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role']
})

// ============================================
// 🛡️ ЗАЩИТА ОТ HYDRATION MISMATCH
// ============================================
// Флаг монтирования. На сервере всегда false.
// После onMounted становится true — можно безопасно использовать
// реактивные данные, которые отличаются между SSR и клиентом.
const isMounted = ref(false)

// ============================================
// ПРАВА ДОСТУПА
// ============================================

const canView = computed(() => can('objects', 'view'))
const canCreate = computed(() => can('objects', 'create'))

// ============================================
// СОСТОЯНИЕ
// ============================================

const objects = ref<any[]>([])
const newObjectName = ref('')
const currentTab = ref('active')
const loading = ref(false)

const tabs = [
  { label: 'В работе', value: 'active' },
  { label: 'Ожидают', value: 'waiting' },
  { label: 'Завершённые', value: 'completed' },
  { label: 'Отклонены', value: 'canceled' },
]

type TabValue = 'active' | 'waiting' | 'completed' | 'canceled'

// ============================================
// COMPUTED
// ============================================

const currentTabLabel = computed(() =>
  tabs.find(t => t.value === currentTab.value)?.label || ''
)

const counts = computed(() => ({
  active: objects.value.filter(o => o.status === 'active').length,
  waiting: objects.value.filter(o => o.status === 'waiting').length,
  completed: objects.value.filter(o => o.status === 'completed').length,
  canceled: objects.value.filter(o => o.status === 'canceled').length,
}))

const filteredObjects = computed(() => {
  const list = objects.value.filter(o => o.status === currentTab.value)
  if (['waiting', 'completed', 'canceled'].includes(currentTab.value)) {
    return [...list].sort((a, b) => {
      if (!a.statusDate) return 1
      if (!b.statusDate) return -1
      return new Date(b.statusDate).getTime() - new Date(a.statusDate).getTime()
    })
  }
  return [...list].sort((a, b) =>
    (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
    (a.createdAt ? new Date(a.createdAt).getTime() : 0)
  )
})

/** Сводка по завершённым объектам (считается из уже загруженного массива) */
const completedSummary = computed(() => {
  const list = objects.value.filter(o => o.status === 'completed')
  const sumBy = (fn: (o: any) => number) => list.reduce((total, o) => total + fn(o), 0)
  const durations = list
    .map(getWorkDays)
    .filter((d): d is number => d !== null)

  return {
    count: list.length,
    contract: sumBy(o => Number(o.contractAmount) || 0),
    income: sumBy(o => Number(o.totalIncome) || 0),
    // Маржа — как в строке списка: приход минус реальные расходы (работы + материалы)
    margin: sumBy(o => (Number(o.totalIncome) || 0) - (Number(o.expenses) || 0)),
    avgDays: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null,
  }
})

// ============================================
// ХЕЛПЕРЫ
// ============================================

const DAY_MS = 86_400_000

function formatNumber(n: any) { 
  return (Number(n) || 0).toLocaleString('ru-RU') 
}

function formatMoney(v: any) {
  return `${formatNumber(v)} ₽`
}

/** Денежное значение или «—», если суммы нет (например, смета не заполнена) */
function formatMoneyOrDash(v: any) {
  return Number(v) ? formatMoney(v) : '—'
}

/**
 * Парсит дату из БД ("YYYY-MM-DD" или "YYYY-MM-DD HH:mm:ss") в timestamp начала дня.
 * Ручной разбор — чтобы не зависеть от нестандартного формата MySQL в Safari.
 */
function parseDay(value?: string | null): number | null {
  if (!value) return null
  const time = new Date(`${String(value).slice(0, 10)}T00:00:00`).getTime()
  return Number.isNaN(time) ? null : time
}

function formatDate(value?: string | null) {
  const time = parseDay(value)
  return time === null ? '—' : new Date(time).toLocaleDateString('ru-RU')
}

function pluralDays(days: number) {
  const mod10 = days % 10
  const mod100 = days % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
  return 'дней'
}

/** Сколько календарных дней занял объект: от старта до фактической сдачи (включительно) */
function getWorkDays(obj: any): number | null {
  const start = parseDay(obj.startDate)
  const end = parseDay(obj.completedDate || obj.statusDate)
  if (start === null || end === null || end < start) return null
  return Math.round((end - start) / DAY_MS) + 1
}

/** Плановый срок в днях (включительно) — от старта до плановой даты */
function getPlanDays(obj: any): number | null {
  const start = parseDay(obj.startDate)
  const plan = parseDay(obj.plannedEndDate)
  if (start === null || plan === null || plan < start) return null
  return Math.round((plan - start) / DAY_MS) + 1
}

/** Отклонение от плана в днях: > 0 — просрочка, < 0 — раньше плана */
function getPlanDeltaDays(obj: any): number | null {
  const fact = getWorkDays(obj)
  const plan = getPlanDays(obj)
  if (fact === null || plan === null) return null
  return fact - plan
}

function getDurationText(obj: any) {
  const days = getWorkDays(obj)
  return days === null ? 'Срок не указан' : `${days} ${pluralDays(days)}`
}

function getPlanDeltaText(obj: any) {
  const delta = getPlanDeltaDays(obj)
  if (delta === null) return '—'
  if (delta > 0) return `+${delta} ${pluralDays(delta)} к плану`
  if (delta < 0) return `${delta} ${pluralDays(Math.abs(delta))} к плану`
  return 'в срок'
}

function getPlanTooltip(obj: any) {
  const plan = getPlanDays(obj)
  const fact = getWorkDays(obj)
  if (plan === null || fact === null) return 'Недостаточно дат для сравнения с планом'
  return `План: ${plan} ${pluralDays(plan)} · Факт: ${fact} ${pluralDays(fact)}`
}

function getMaterialBalance(obj: any) { 
  return (obj.materialIncoming || 0) - (obj.materialOutgoing || 0) 
}

function getProfitability(obj: any) {
  if (obj.status !== 'completed') return null
  const income = obj.totalIncome || 0
  const expenses = obj.expenses || 0
  const profit = income - expenses
  if (income === 0) return null
  const pct = ((profit / income) * 100).toFixed(1)
  return { text: `${formatNumber(profit)} ₽ (${pct}%)`, isProfit: profit >= 0 }
}

const getProfitabilityData = (obj: any) => {
  const data = getProfitability(obj)
  return data || { text: '—', isProfit: true }
}

const contractTypeMap: Record<string, string> = {
  edo: 'ЭДО', 
  paper: 'Бумажный', 
  invoice: 'Счёт-д.', 
  none: 'Не нужен', 
  unassigned: '—',
}

function getDocumentClass(obj: any) {
  if (!obj.contract) return 'red'
  return obj.contract.status === 'signed' ? 'green' : 'yellow'
}

function getDocumentText(obj: any) {
  return obj.contract ? (contractTypeMap[obj.contract.type] || '—') : 'Нет договора'
}

function getDocumentTooltip(obj: any) {
  if (!obj.contract) return 'Договор не создан'
  const sm: Record<string, string> = {
    prepared: 'Подготовлен', 
    sent: 'Отправлен',
    awaiting: 'На подписи', 
    signed: 'Подписан', 
    cancelled: 'Отменён',
  }
  return `${contractTypeMap[obj.contract.type] || '—'} — ${sm[obj.contract.status] || '—'}`
}

function getInvoiceClass(obj: any) {
  const s = obj.invoiceStats
  if (s.total === 0) return 'red'
  return s.signed === s.total ? 'green' : 'yellow'
}

function getInvoiceTooltip(obj: any) {
  const { total, signed, amount, paidAmount } = obj.invoiceStats
  if (total === 0) return 'Нет счётов'
  const status = signed === total ? `Все ${total} оплачены` : `${signed} из ${total} оплачено`
  return `${status} · ${formatMoney(paidAmount)} из ${formatMoney(amount)}`
}

function getActClass(obj: any) {
  const s = obj.actStats
  if (s.total === 0) return 'red'
  return s.signed === s.total ? 'green' : 'yellow'
}

function getActTooltip(obj: any) {
  const { total, signed, amount, signedAmount } = obj.actStats
  if (total === 0) return 'Нет актов'
  const status = signed === total ? `Все ${total} подписаны` : `${signed} из ${total} подписано`
  return `${status} · ${formatMoney(signedAmount)} из ${formatMoney(amount)}`
}

// ============================================
// API ЗАПРОСЫ
// ============================================

async function fetchObjects() {
  loading.value = true
  try {
    objects.value = await api.get<any[]>('/api/objects') || []
  } catch (e: any) {
    console.error('[Объекты] Ошибка загрузки:', e)
    
    // Обработка 403 — права отозвали во время работы
    if (e.statusCode === 403) {
      notifications.error('У вас больше нет прав для просмотра объектов', 'Доступ запрещён')
      router.push('/cabinet')
    }
  } finally {
    loading.value = false
  }
}

async function addObject() {
  if (!newObjectName.value.trim()) return
  
  if (!canCreate.value) {
    notifications.error('У вас нет прав для создания объектов', 'Доступ запрещён')
    return
  }
  
  loading.value = true
  try {
    const c = await api.post<any>('/api/objects', {
      name: newObjectName.value.trim(),
      status: currentTab.value
    })
    objects.value.unshift({ ...c, totalBalance: 0 })
    newObjectName.value = ''
    notifications.success('Объект успешно создан')
  } catch (e: any) {
    console.error('[Объекты] Ошибка создания:', e)
    
    if (e.statusCode === 403) {
      notifications.error('У вас нет прав для создания объектов', 'Доступ запрещён')
    }
  } finally {
    loading.value = false
  }
}

// ============================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ============================================

onMounted(async () => {
  // ✅ Устанавливаем флаг ПОСЛЕ монтирования
  // Теперь можно безопасно использовать canView, canCreate и другие реактивные данные
  isMounted.value = true
  
  // Загружаем объекты только если есть права на просмотр
  if (canView.value) {
    await fetchObjects()
  }
})
</script>

<style lang="scss" scoped>
.objects-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  &__content {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
}

// ── Форма добавления ─────────────────────────────────────────────────
.add-form {
  display: flex;
  align-items: center;
  gap: 8px;

  &__input {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-primary);
    font-size: var(--crm-text-sm);
    font-family: var(--crm-font-sans);
    padding: 6px 12px;
    outline: none;
    width: 220px;
    transition: var(--crm-transition);

    @media (max-width: 767.98px) {
      width: 150px;
    }

    &::placeholder {
      color: var(--crm-text-disabled);
    }

    &:focus {
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px var(--crm-accent-dim);
    }
  }
}

// ── Навигация ────────────────────────────────────────────────────────
.objects-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }

  &--active {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover {
      background: var(--crm-accent-dim);
    }
  }

  &__count {
    font-size: var(--crm-text-xs);
    font-weight: 700;
    padding: 1px 6px;
    background: var(--crm-bg-overlay);
    border-radius: 10px;
    color: var(--crm-text-muted);

    .tab--active & {
      background: rgba(0, 195, 245, .2);
      color: var(--crm-accent);
    }
  }
}

.counts-summary {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--crm-font-mono);
  font-size: var(--crm-text-sm);
  font-weight: 600;
  color: var(--crm-text-secondary);
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  padding: 5px 12px;

  &__sep {
    color: var(--crm-text-disabled);
  }
}

// ── Сводка по завершённым ────────────────────────────────────────────
.objects-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);

  &__item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;

    & + & {
      padding-left: 8px;
      border-left: 1px solid var(--crm-border);
    }

    strong {
      font-family: var(--crm-font-mono);
      font-weight: 600;
      color: var(--crm-text-primary);
    }
  }
}

// ── Карточка ─────────────────────────────────────────────────────────
.objects-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;

  &__footer {
    padding: 10px 16px;
    border-top: 1px solid var(--crm-border);
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }
}

// ── Список ───────────────────────────────────────────────────────────
.object-list {
  list-style: none;
  padding: 0;
  margin: 0;

  &__item {
    &--alt {
      background: rgba(255, 255, 255, 0.022);
    }
  }
}

// ── Элемент объекта ──────────────────────────────────────────────────
.object-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--crm-border);
  text-decoration: none;
  transition: var(--crm-transition);

  .object-list__item:last-child & {
    border-bottom: none;
  }

  &:hover {
    background: var(--crm-bg-elevated);
  }

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  &__name {
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    span {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: var(--crm-text-xs);
      color: var(--crm-text-muted);
    }
  }

  &__docs {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  &__finance {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
    min-width: 150px;
  }

  &__arrow {
    color: var(--crm-text-disabled);
    flex-shrink: 0;
    transition: var(--crm-transition);
  }

  &:hover &__arrow {
    color: var(--crm-accent);
    transform: translateX(2px);
  }
}

.meta-empty {
  font-style: italic;
  color: var(--crm-text-disabled) !important;
}

// ── Финансовые данные ────────────────────────────────────────────────
.fin-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__value {
    font-size: var(--crm-text-lg);
    font-weight: 700;
    white-space: nowrap;

    &--muted {
      color: var(--crm-text-disabled);
      font-weight: 500;
    }
  }
}

.fin-detail {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;

  span {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
  }
}

.pos {
  color: var(--crm-success);
}

.neg {
  color: var(--crm-danger);
}

// ── Чипы документов ──────────────────────────────────────────────────
.doc-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--crm-radius-sm);
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--crm-border);
  background: var(--crm-bg-elevated);
  color: var(--crm-text-muted);
  white-space: nowrap;

  &__dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--crm-text-disabled);
    flex-shrink: 0;
  }

  &--green {
    background: var(--crm-success-dim);
    border-color: rgba(61, 214, 140, .3);
    color: var(--crm-success);

    .doc-chip__dot {
      background: var(--crm-success);
    }
  }

  &--yellow {
    background: var(--crm-warning-dim);
    border-color: rgba(245, 166, 35, .3);
    color: var(--crm-warning);

    .doc-chip__dot {
      background: var(--crm-warning);
    }
  }

  &--red {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, .3);
    color: var(--crm-danger);

    .doc-chip__dot {
      background: var(--crm-danger);
    }
  }
}

// ── Чипы статистики завершённого объекта ─────────────────────────────
.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--crm-radius-sm);
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--crm-border);
  background: var(--crm-bg-elevated);
  color: var(--crm-text-secondary);
  white-space: nowrap;

  &--muted {
    color: var(--crm-text-disabled);
    font-style: italic;
  }

  &--pos {
    background: var(--crm-success-dim);
    border-color: rgba(61, 214, 140, .3);
    color: var(--crm-success);
  }

  &--neg {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, .3);
    color: var(--crm-danger);
  }
}

// ── Скелетон / пустое ────────────────────────────────────────────────
.objects-skeleton {
  display: flex;
  flex-direction: column;
}

.skel {
  height: 76px;
  border-bottom: 1px solid var(--crm-border);
  background: linear-gradient(90deg, var(--crm-bg-elevated) 25%, var(--crm-bg-overlay) 50%, var(--crm-bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;

  &:last-child {
    border-bottom: none;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.objects-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 20px;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-sm);
}

// ── Кнопки ───────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);

  &--accent {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover:not(:disabled) {
      background: rgba(0, 195, 245, .25);
    }

    &:disabled {
      opacity: .45;
      cursor: not-allowed;
    }
  }
}

@media (max-width: 767.98px) {
  .objects-page__content {
    padding: 16px;
  }

  .object-item {
    flex-wrap: wrap;

    &__finance {
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
      min-width: unset;
      border-top: 1px solid var(--crm-border);
      padding-top: 8px;
      margin-top: 2px;
    }
  }
}
</style>