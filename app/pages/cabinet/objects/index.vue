<!-- app/pages/cabinet/objects/index.vue -->
<template>
  <div class="objects-page">

    <!-- Заголовок -->
    <PagesCabinetUiLayoutPageTitle title="Объекты" icon="mdi:office-building-outline">
      <template #actions>
        <div v-if="['admin', 'manager'].includes(user?.role)" class="add-form">
          <input v-model="newObjectName" class="add-form__input" placeholder="Название объекта"
            @keyup.enter="addObject" />
          <button class="crm-btn crm-btn--accent" @click="addObject" :disabled="!newObjectName.trim() || loading">
            <Icon name="mdi:plus" size="15" />
            Добавить
          </button>
        </div>
      </template>
    </PagesCabinetUiLayoutPageTitle>

    <div class="objects-page__content">

      <!-- Вкладки + счётчик -->
      <div class="objects-nav">
        <div class="tabs">
          <button v-for="tab in tabs" :key="tab.value" class="tab" :class="{ 'tab--active': currentTab === tab.value }"
            @click="currentTab = tab.value">
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
          <li v-for="(obj, idx) in filteredObjects" :key="obj.id" class="object-list__item"
            :class="{ 'object-list__item--alt': idx % 2 === 1 }">
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

                <!-- Завершённые: маржинальность -->
                <template v-else-if="getProfitability(obj)">
                  <div class="fin-block">
                    <span class="fin-block__label">Маржа</span>
                   <span class="fin-block__value" :class="getProfitabilityData(obj).isProfit ? 'pos' : 'neg'">
                      {{ getProfitabilityData(obj).text }}
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

              </div>

              <Icon name="mdi:chevron-right" size="16" class="object-item__arrow" />

            </NuxtLink>
          </li>
        </ul>

        <div class="objects-card__footer">
          Всего: {{ filteredObjects.length }} объект(а)
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'
import { useHead } from 'nuxt/app'
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin'],
})

useHead({ title: 'CRM — Объекты', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const user = ref<any>(null)
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

function formatNumber(n: any) { return (Number(n) || 0).toLocaleString('ru-RU') }
function getMaterialBalance(obj: any) { return (obj.materialIncoming || 0) - (obj.materialOutgoing || 0) }

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
  edo: 'ЭДО', paper: 'Бумажный', invoice: 'Счёт-д.', none: 'Не нужен', unassigned: '—',
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
    prepared: 'Подготовлен', sent: 'Отправлен',
    awaiting: 'На подписи', signed: 'Подписан', cancelled: 'Отменён',
  }
  return `${contractTypeMap[obj.contract.type] || '—'} — ${sm[obj.contract.status] || '—'}`
}
function getInvoiceClass(obj: any) {
  const s = obj.invoiceStats
  if (s.total === 0) return 'red'
  return s.signed === s.total ? 'green' : 'yellow'
}
function getInvoiceTooltip(obj: any) {
  const { total, signed } = obj.invoiceStats
  if (total === 0) return 'Нет счётов'
  return signed === total ? `Все ${total} оплачены` : `${signed} из ${total} оплачено`
}
function getActClass(obj: any) {
  const s = obj.actStats
  if (s.total === 0) return 'red'
  return s.signed === s.total ? 'green' : 'yellow'
}
function getActTooltip(obj: any) {
  const { total, signed } = obj.actStats
  if (total === 0) return 'Нет актов'
  return signed === total ? `Все ${total} подписаны` : `${signed} из ${total} подписано`
}

async function fetchObjects() {
  loading.value = true
  try { objects.value = await $fetch<any[]>('/api/objects', { credentials: 'include' }) || [] }
  catch (e) { console.error('[Объекты]:', e) }
  finally { loading.value = false }
}

async function addObject() {
  if (!newObjectName.value.trim()) return
  loading.value = true
  try {
    const c = await $fetch<any>('/api/objects', {
      method: 'POST',
      body: { name: newObjectName.value.trim(), status: currentTab.value },
      credentials: 'include',
    })
    objects.value.unshift({ ...c, totalBalance: 0 })
    newObjectName.value = ''
  } catch (e) { console.error('[Объекты]:', e) }
  finally { loading.value = false }
}

onMounted(async () => {
  try { const me = await $fetch<any>('/api/me', { credentials: 'include' }); user.value = me.user }
  catch { user.value = null }
  await fetchObjects()
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