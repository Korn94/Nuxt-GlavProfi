<!-- app/pages/cabinet/objects/[id].vue -->
<template>
  <div class="object-page">

    <!-- Заголовок -->
    <PagesCabinetUiLayoutPageTitle :title="object.name || 'Загрузка...'">
      <template #actions>
        <span :class="['status-badge', `status-badge--${object.status}`]">
          {{ statusText }}
        </span>
        <button v-if="isAdmin" class="crm-btn crm-btn--ghost crm-btn--sm" @click="isEditModalOpen = true">
          <Icon name="mdi:pencil-outline" size="14" />
          Редактировать
        </button>
      </template>
    </PagesCabinetUiLayoutPageTitle>

    <div class="object-page__content">

      <!-- Верхний ряд: инфо + баланс -->
      <div class="object-top">

        <!-- Информация об объекте -->
        <div class="info-card">
          <div class="info-card__header">
            <span class="info-card__title">Информация</span>
          </div>
          <div class="info-grid">
            <div class="info-row">
              <Icon name="material-symbols:location-on" size="16" class="info-row__icon" />
              <div class="info-row__body">
                <span class="info-row__label">Адрес</span>
                <span class="info-row__value">{{ object.address || '—' }}</span>
              </div>
            </div>
            <div class="info-row">
              <Icon name="solar:database-broken" size="16" class="info-row__icon" />
              <div class="info-row__body">
                <span class="info-row__label">Источник</span>
                <span class="info-row__value">{{ object.source || '—' }}</span>
              </div>
            </div>
            <div class="info-row">
              <Icon name="solar:user-rounded-outline" size="16" class="info-row__icon" />
              <div class="info-row__body">
                <span class="info-row__label">Прораб</span>
                <span class="info-row__value">{{ object.foreman && typeof object.foreman === 'object' ? object.foreman.name : 'Не назначен' }}</span>
              </div>
            </div>
            <div class="info-row">
              <Icon name="solar:calendar-add-outline" size="16" class="info-row__icon" />
              <div class="info-row__body">
                <span class="info-row__label">Дата начала</span>
                <span class="info-row__value">{{ formatDate(object.startDate) }}</span>
              </div>
            </div>
            <div class="info-row">
              <Icon name="solar:calendar-mark-bold" size="16" class="info-row__icon" />
              <div class="info-row__body">
                <span class="info-row__label">План завершения</span>
                <span class="info-row__value">{{ formatDate(object.plannedEndDate) }}</span>
              </div>
            </div>
            <div class="info-row">
              <Icon name="solar:check-read-outline" size="16" class="info-row__icon" />
              <div class="info-row__body">
                <span class="info-row__label">Фактическая дата</span>
                <span class="info-row__value">{{ formatDate(object.completedDate) }}</span>
              </div>
            </div>
            <div v-if="object.comment" class="info-row info-row--full">
              <Icon name="solar:chat-line-outline" size="16" class="info-row__icon" />
              <div class="info-row__body">
                <span class="info-row__label">Комментарий</span>
                <pre class="info-row__pre">{{ object.comment }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Баланс -->
        <div class="balance-card">
          <div class="balance-card__header">
            <span class="balance-card__title">Баланс объекта</span>
          </div>

          <!-- Итог -->
          <div class="balance-total">
            <span class="balance-total__label">Итоговый баланс</span>
            <span class="balance-total__value"
              :class="(object.finances?.totalBalance ?? 0) >= 0 ? 'text-pos' : 'text-neg'">
              {{ formatCurrency(object.finances?.totalBalance) }}
            </span>
            <span class="balance-total__desc">
              Приходы ({{ formatCurrency(object.finances?.totalIncome) }}) −
              Работы ({{ formatCurrency(object.finances?.totalWorks) }}) −
              Материалы ({{ formatCurrency(object.materialBalance) }})
            </span>
          </div>

          <!-- Метрики -->
          <div class="balance-metrics">
            <div class="bm">
              <span class="bm__label">Приходы</span>
              <span class="bm__value text-pos">{{ formatCurrency(object.finances?.totalIncome) }}</span>
            </div>
            <div class="bm">
              <span class="bm__label">Работы</span>
              <span class="bm__value text-neg">{{ formatCurrency(object.finances?.totalWorks) }}</span>
            </div>
            <div class="bm">
              <span class="bm__label">Материалы</span>
              <span class="bm__value" :class="(object.materialBalance ?? 0) >= 0 ? 'text-pos' : 'text-neg'">
                {{ formatCurrency(object.materialBalance) }}
              </span>
            </div>
          </div>

          <!-- Смета -->
          <div class="balance-budget">
            <div class="budget-row">
              <span>Смета (общая)</span>
              <strong>{{ formatCurrency(totalBudget) }}</strong>
            </div>
            <div class="budget-row">
              <span>Выполнено по смете</span>
              <strong>{{ formatCurrency(completedBudget) }}</strong>
            </div>
            <div class="budget-row">
              <span>Смета − баланс</span>
              <strong :class="budgetVsBalance >= 0 ? 'text-pos' : 'text-neg'">
                {{ formatCurrency(budgetVsBalance) }}
              </strong>
            </div>
            <div class="budget-row">
              <span>Остато по смете (Смета − приходы)</span>
              <strong :class="remainingPayment <= 0 ? 'text-pos' : 'text-neg'">
                {{ formatCurrency(budgetMinusIncome) }}
              </strong>
            </div>
            <div class="budget-row budget-row--last">
              <span>Остаток оплаты от заказчика</span>
              <strong :class="remainingPayment >= 0 ? 'text-pos' : 'text-neg'">
                {{ formatCurrency(remainingPayment) }}
              </strong>
            </div>
          </div>
        </div>

      </div>

      <!-- Вкладки -->
      <div class="tabs-card">
        <div class="tabs-nav">
          <button v-for="tab in tabs" :key="tab" :class="['tab-btn', { 'tab-btn--active': currentTab === tab }]"
            @click="currentTab = tab">
            {{ tab }}
          </button>
        </div>

        <div class="tabs-content">
          <PagesCabinetObjectsOperations v-if="currentTab === 'Операции'" :object-id="objectId" :operations="operations"
            @add-coming="handleComingAdded" @add-expense="handleExpenseAdded" @add-work="handleWorkAdded"
            @delete-work="handleWorkDeleted" />
          <PagesCabinetObjectsMaterials v-else-if="currentTab === 'Материалы'" :materials="materials"
            :object-id="objectId" @add="handleMaterialAdded" @update="handleMaterialUpdated"
            @delete="handleMaterialDeleted" />
          <PagesCabinetObjectsDocuments v-else-if="currentTab === 'Документы'" :object="object" :object-id="objectId"
            :is-admin="isAdmin" @refresh="refreshObjectData" />
        </div>
      </div>

    </div>

    <!-- Модалка редактирования -->
    <PagesCabinetObjectsEditModal v-if="isAdmin" v-model="isEditModalOpen" :object="object" @updated="handleUpdated"
      @completed="handleCompleted" @deleted="handleDeleted" />

  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'
import { useHead } from 'nuxt/app'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'

// ── Мета ─────────────────────────────────────────────────────────────
definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
  // allowedRoles: ['admin'] 
})

// ── Route ─────────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const api = useApi()
const objectId = Number(route.params.id)

if (isNaN(objectId)) {
  router.push('/cabinet/objects')
  throw new Error('Неверный ID объекта')
}

// ── Состояние ────────────────────────────────────────────────────────
const object = ref < any > ({
  id: null, name: 'Загрузка...', status: 'active',
  finances: { totalIncome: 0, totalWorks: 0, totalBalance: 0 },
  foreman: null, address: null, startDate: null,
  plannedEndDate: null, completedDate: null,
  source: null, comment: null, budget: [], invoices: []
})

const materials = ref < any[] > ([])
const operations = ref < any[] > ([])
const currentTab = ref('Операции')
const tabs = ['Операции', 'Материалы', 'Документы']
const isAdmin = ref(false)
const isEditModalOpen = ref(false)

// ── Computed ─────────────────────────────────────────────────────────
const statusText = computed(() => {
  const map: Record<string, string> = {
    active: 'Активный', completed: 'Завершён',
    waiting: 'Ожидание', canceled: 'Отклонён'
  }
  return map[object.value.status] || '—'
})

const totalBudget = computed(() =>
  (object.value.budget || []).reduce((s: number, i: any) =>
    s + (parseFloat(i.amount) || 0), 0)
)

const completedBudget = computed(() =>
  (object.value.budget || [])
    .filter((i: any) => i.workProgress === 'completed')
    .reduce((s: number, i: any) => s + (parseFloat(i.amount) || 0), 0)
)

const budgetVsBalance = computed(() =>
  totalBudget.value - (object.value.finances?.totalBalance || 0)
)

const budgetMinusIncome = computed(() =>
  totalBudget.value - (object.value.finances?.totalIncome || 0)
)

const remainingPayment = computed(() =>
  totalBudget.value - (object.value.materialBalance || 0) - (object.value.finances?.totalIncome || 0)
)

// ── Форматирование ────────────────────────────────────────────────────
const formatDate = (d: string) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU')
}

const formatCurrency = (v: any) =>
  new Intl.NumberFormat('ru-RU').format(v || 0) + ' ₽'

// ── API ───────────────────────────────────────────────────────────────
async function fetchFullObject() {
  try {
    const data = await api.get<any>(`/api/objects/${objectId}/full`)
    object.value = {
      ...data,
      finances: {
        totalIncome: Number(data.finances?.totalIncome) || 0,
        totalWorks: Number(data.finances?.totalWorks) || 0,
        totalBalance: Number(data.finances?.totalBalance) || 0,
      }
    }
  } catch (e) {
    console.error('[Объект] Ошибка загрузки:', e)
    router.push('/cabinet/objects')
  }
}

async function fetchMaterials() {
  try {
    const data = await api.get<any[]>('/api/materials', { params: { objectId } })
    materials.value = (data || []).map(m => ({ ...m, amount: Number(m.amount || 0) }))
  } catch (e) {
    console.error('[Объект] Ошибка загрузки материалов:', e)
  }
}

async function fetchOperations() {
  try {
    const data = await api.get<any>(`/api/objects/${objectId}/operations`)
    operations.value = [
      ...(data.comings || []).map((op: any) => ({ ...op, type: 'coming', amount: Number(op.amount) })),
      ...(data.works || []).map((op: any) => ({ ...op, type: 'work', amount: Number(op.amount) })),
    ]
  } catch (e) {
    console.error('[Объект] Ошибка загрузки операций:', e)
  }
}

async function refreshObjectData() {
  await Promise.all([fetchFullObject(), fetchMaterials(), fetchOperations()])
}

// ── Обработчики ──────────────────────────────────────────────────────
function handleUpdated(u: any) { object.value = u }
function handleCompleted(u: any) { object.value = u }
function handleDeleted() { }

function handleMaterialAdded(m: any) { materials.value.push({ ...m, amount: Number(m.amount) }) }
function handleMaterialUpdated(m: any) {
  const idx = materials.value.findIndex(x => x.id === m.id)
  if (idx !== -1) materials.value.splice(idx, 1, { ...m, amount: Number(m.amount) })
}
function handleMaterialDeleted(id: number) {
  materials.value = materials.value.filter(m => m.id !== id)
}

function handleComingAdded(c: any) { operations.value.push({ ...c, type: 'coming', amount: Number(c.amount) }); refreshObjectData() }
function handleExpenseAdded(e: any) { operations.value.push({ ...e, type: 'expense', amount: Number(e.amount) }); refreshObjectData() }
function handleWorkAdded(w: any) { operations.value.push({ ...w, type: 'work', amount: Number(w.amount) }); refreshObjectData() }
function handleWorkDeleted(id: number) {
  operations.value = operations.value.filter(o => o.id !== id)
  refreshObjectData()
}

// ── Lifecycle ─────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const me = await api.get<any>('/api/me')
    isAdmin.value = me?.user?.role === 'admin'
  } catch { isAdmin.value = false }
  await refreshObjectData()
})

useHead(() => ({
  title: object.value.name !== 'Загрузка...' ? `CRM — ${object.value.name}` : 'CRM',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
}))
</script>

<style lang="scss" scoped>
.object-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  &__content {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

// ── Статус-бейдж ─────────────────────────────────────────────────────
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: var(--crm-text-xs);
  font-weight: 700;
  letter-spacing: .04em;

  &--active {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);
  }

  &--completed {
    background: var(--crm-success-dim);
    border: 1px solid rgba(61, 214, 140, .3);
    color: var(--crm-success);
  }

  &--waiting {
    background: var(--crm-warning-dim);
    border: 1px solid rgba(245, 166, 35, .3);
    color: var(--crm-warning);
  }

  &--canceled {
    background: var(--crm-danger-dim);
    border: 1px solid rgba(242, 95, 92, .3);
    color: var(--crm-danger);
  }
}

// ── Верхний ряд ──────────────────────────────────────────────────────
.object-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// ── Карточка инфо ────────────────────────────────────────────────────
.info-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;

  &__header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--crm-border);
  }

  &__title {
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-muted);
    text-transform: uppercase;
    letter-spacing: .06em;
  }
}

.info-grid {
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  &--full {
    grid-column: 1 / -1;
  }

  &__icon {
    color: var(--crm-accent);
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__value {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-primary);
  }

  &__pre {
    font-family: var(--crm-font-sans);
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

// ── Карточка баланса ─────────────────────────────────────────────────
.balance-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--crm-border);
  }

  &__title {
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-muted);
    text-transform: uppercase;
    letter-spacing: .06em;
  }
}

.balance-total {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-bottom: 1px solid var(--crm-border);

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }

  &__desc {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-disabled);
    margin-top: 2px;
  }
}

.balance-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid var(--crm-border);
}

.bm {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 14px;
  border-right: 1px solid var(--crm-border);

  &:last-child {
    border-right: none;
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__value {
    font-size: var(--crm-text-md);
    font-weight: 700;
    color: var(--crm-text-primary);
  }
}

.balance-budget {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.budget-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
  padding: 4px 0;
  border-bottom: 1px solid var(--crm-border);

  &:last-child {
    border-bottom: none;
  }

  &--last {
    border-top: 1px solid var(--crm-border-hover);
    margin-top: 4px;
    padding-top: 10px;
    color: var(--crm-text-primary);
    font-weight: 500;
  }

  strong {
    font-weight: 700;
    color: var(--crm-text-primary);
  }
}

// ── Вкладки ─────────────────────────────────────────────────────────
.tabs-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;
}

.tabs-nav {
  display: flex;
  gap: 4px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--crm-border);
  background: var(--crm-bg-elevated);
  overflow-x: auto;
  scrollbar-width: none;
}

.tab-btn {
  padding: 6px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-sm);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }

  &--active {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);
  }
}

.tabs-content {
  padding: 16px;
}

// ── Цвета ───────────────────────────────────────────────────────────
.text-pos {
  color: var(--crm-success) !important;
}

.text-neg {
  color: var(--crm-danger) !important;
}

// ── Кнопки ──────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--crm-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);

  &--sm {
    padding: 6px 12px;
    font-size: var(--crm-text-sm);
  }

  &--ghost {
    background: transparent;
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }
}

@media (max-width: 767.98px) {
  .object-page__content {
    padding: 16px;
  }

  .balance-metrics {
    grid-template-columns: 1fr;
  }

  .bm {
    border-right: none;
    border-bottom: 1px solid var(--crm-border);

    &:last-child {
      border-bottom: none;
    }
  }
}
</style>