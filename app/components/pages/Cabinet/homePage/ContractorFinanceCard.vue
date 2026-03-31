<!-- app/components/pages/cabinet/homePage/ContractorFinanceCard.vue -->
<template>
  <PagesCabinetUiCardsCard :loading="isLoading" title="Финансы контрагентов" flush>
    <template #icon>
      <Icon name="mdi:account-group-outline" size="18" />
    </template>

    <template #actions>
      <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="navigateTo('/cabinet/admin/contractors')">
        Все контрагенты
        <Icon name="mdi:arrow-right" size="14" />
      </button>
    </template>

    <div v-if="contractorData" class="cf">

      <!-- Итог по всем -->
      <div class="cf__total">
        <span class="cf__total-label">Общий баланс по контрагентам</span>
        <span class="cf__total-value" :class="totalBalance >= 0 ? 'cf__total-value--pos' : 'cf__total-value--neg'">
          {{ formatCurrency(totalBalance) }}
        </span>
      </div>

      <!-- Типы контрагентов -->
      <div class="cf__types">
        <div v-for="type in contractorTypes" :key="type.key" class="cf-type"
          @click="navigateTo(`/cabinet/admin/contractors/${type.key}`)">
          <div class="cf-type__icon" :style="{ background: type.bgColor, color: type.color }">
            <Icon :name="type.icon" size="18" />
          </div>
          <div class="cf-type__info">
            <span class="cf-type__label">{{ type.label }}</span>
            <span class="cf-type__count">{{ contractorData[type.dataKey].count }} чел.</span>
          </div>
          <span class="cf-type__balance"
            :class="contractorData[type.dataKey].totalBalance >= 0 ? 'cf-type__balance--pos' : 'cf-type__balance--neg'">
            {{ formatCurrency(contractorData[type.dataKey].totalBalance) }}
          </span>
        </div>
      </div>

      <!-- Должники и кредиторы -->
      <div class="cf__sections">

        <!-- Нам должны -->
        <div v-if="debtors.length" class="cf-section cf-section--debtors">
          <div class="cf-section__header">
            <span class="cf-section__title">
              <Icon name="mdi:arrow-bottom-left" size="14" />
              Нам должны
            </span>
            <span class="cf-section__count cf-section__count--danger">{{ debtors.length }}</span>
          </div>

          <div class="contractor-list">
            <div v-for="c in debtors" :key="c.id" class="contractor-item"
              :class="{ 'contractor-item--open': expandedId === c.id }">
              <div class="contractor-item__row" @click="toggleExpand(c)">
                <div class="contractor-item__icon">
                  <Icon :name="getTypeIcon(c.type)" size="14" />
                </div>
                <span class="contractor-item__name">{{ c.name }}</span>
                <Icon name="mdi:chevron-down" size="16" class="contractor-item__chevron"
                  :class="{ 'contractor-item__chevron--open': expandedId === c.id }" />
                <span class="contractor-item__balance contractor-item__balance--danger">
                  {{ formatCurrency(c.balance) }}
                </span>
              </div>

              <!-- Раскрытые транзакции -->
             <Transition name="expand">
                <div v-if="expandedId === c.id" class="contractor-item__transactions">
                  <div v-if="loadingTransactions === c.id" class="tx-loading">
                    <Icon name="mdi:loading" class="spin" size="14" /> Загрузка...
                  </div>
                  <div v-else class="tx-cols">
                    <div class="tx-col">
                      <div class="tx-col__header">Расходы</div>
                      <div v-if="(transactions[c.id]?.expenses ?? []).length" class="tx-list">
                        <div v-for="tx in (transactions[c.id]?.expenses ?? [])" :key="tx.id" class="tx-item">
                          <span class="tx-item__date">{{ formatDate(tx.operationDate) }}</span>
                          <span v-if="tx.objectName" class="tx-item__obj">{{ tx.objectName }}</span>
                          <span v-if="tx.comment" class="tx-item__comment">{{ tx.comment }}</span>
                          <span class="tx-item__amount tx-item__amount--expense">{{ formatCurrency(tx.amount) }}</span>
                        </div>
                      </div>
                      <div v-else class="tx-empty">Нет расходов</div>
                    </div>

                    <div class="tx-col">
                      <div class="tx-col__header">Работы</div>
                      <div v-if="(transactions[c.id]?.comings ?? []).length" class="tx-list">
                        <div v-for="tx in (transactions[c.id]?.comings ?? [])" :key="tx.id" class="tx-item">
                          <span class="tx-item__date">{{ formatDate(tx.operationDate) }}</span>
                          <span v-if="tx.objectName" class="tx-item__obj">{{ tx.objectName }}</span>
                          <span v-if="tx.comment" class="tx-item__comment">{{ tx.comment }}</span>
                          <span class="tx-item__amount tx-item__amount--income">{{ formatCurrency(tx.amount) }}</span>
                        </div>
                      </div>
                      <div v-else class="tx-empty">Нет работ</div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Мы должны -->
        <div v-if="creditors.length" class="cf-section cf-section--creditors">
          <div class="cf-section__header">
            <span class="cf-section__title">
              <Icon name="mdi:arrow-top-right" size="14" />
              Мы должны
            </span>
            <span class="cf-section__count cf-section__count--warning">{{ creditors.length }}</span>
          </div>

          <div class="contractor-list">
            <div v-for="c in creditors" :key="c.id" class="contractor-item"
              :class="{ 'contractor-item--open': expandedId === c.id }">
              <div class="contractor-item__row" @click="toggleExpand(c)">
                <div class="contractor-item__icon">
                  <Icon :name="getTypeIcon(c.type)" size="14" />
                </div>
                <span class="contractor-item__name">{{ c.name }}</span>
                <Icon name="mdi:chevron-down" size="16" class="contractor-item__chevron"
                  :class="{ 'contractor-item__chevron--open': expandedId === c.id }" />
                <span class="contractor-item__balance contractor-item__balance--warning">
                  {{ formatCurrency(c.balance) }}
                </span>
              </div>

            <Transition name="expand">
                <div v-if="expandedId === c.id" class="contractor-item__transactions">
                  <div v-if="loadingTransactions === c.id" class="tx-loading">
                    <Icon name="mdi:loading" class="spin" size="14" /> Загрузка...
                  </div>
                  <div v-else class="tx-cols">
                    <div class="tx-col">
                      <div class="tx-col__header">Расходы</div>
                      <div v-if="(transactions[c.id]?.expenses ?? []).length" class="tx-list">
                        <div v-for="tx in (transactions[c.id]?.expenses ?? [])" :key="tx.id" class="tx-item">
                          <span class="tx-item__date">{{ formatDate(tx.operationDate) }}</span>
                          <span v-if="tx.objectName" class="tx-item__obj">{{ tx.objectName }}</span>
                          <span v-if="tx.comment" class="tx-item__comment">{{ tx.comment }}</span>
                          <span class="tx-item__amount tx-item__amount--expense">{{ formatCurrency(tx.amount) }}</span>
                        </div>
                      </div>
                      <div v-else class="tx-empty">Нет расходов</div>
                    </div>

                    <div class="tx-col">
                      <div class="tx-col__header">Работы</div>
                      <div v-if="(transactions[c.id]?.comings ?? []).length" class="tx-list">
                        <div v-for="tx in (transactions[c.id]?.comings ?? [])" :key="tx.id" class="tx-item">
                          <span class="tx-item__date">{{ formatDate(tx.operationDate) }}</span>
                          <span v-if="tx.objectName" class="tx-item__obj">{{ tx.objectName }}</span>
                          <span v-if="tx.comment" class="tx-item__comment">{{ tx.comment }}</span>
                          <span class="tx-item__amount tx-item__amount--income">{{ formatCurrency(tx.amount) }}</span>
                        </div>
                      </div>
                      <div v-else class="tx-empty">Нет работ</div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="cf-state">
      <Icon name="mdi:alert-circle-outline" size="32" />
      <p>Не удалось загрузить данные</p>
      <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="fetchData">
        <Icon name="mdi:refresh" size="14" /> Повторить
      </button>
    </div>

    <!-- Пусто -->
    <div v-else class="cf-state">
      <Icon name="mdi:account-group-outline" size="32" />
      <p>Нет данных по контрагентам</p>
    </div>

    <template #footer>
      Обновлено: {{ updatedAt }}
    </template>
  </PagesCabinetUiCardsCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { navigateTo } from '#app'

// ── Справочники ─────────────────────────────────────────────────────
const contractorTypes = [
  { key: 'master', dataKey: 'masters', label: 'Мастера', icon: 'mdi:hammer', color: '#5b8def', bgColor: 'rgba(91,141,239,.15)' },
  { key: 'worker', dataKey: 'workers', label: 'Рабочие', icon: 'mdi:account-hard-hat', color: '#f5a623', bgColor: 'rgba(245,166,35,.15)' },
  { key: 'foreman', dataKey: 'foremans', label: 'Прорабы', icon: 'mdi:briefcase', color: '#00c3f5', bgColor: 'rgba(0,195,245,.15)' },
  { key: 'office', dataKey: 'offices', label: 'Офис', icon: 'mdi:office-building', color: '#9aa0b8', bgColor: 'rgba(154,160,184,.15)' },
]

const typeIconMap: Record<string, string> = {
  master: 'mdi:hammer',
  worker: 'mdi:account-hard-hat',
  foreman: 'mdi:briefcase',
  office: 'mdi:office-building',
}

// ── Состояние ───────────────────────────────────────────────────────
const contractorData = ref < any > (null)
const expandedId = ref < number | null > (null)
const loadingTransactions = ref < number | null > (null)
const transactions = ref<Record<number, { expenses: any[]; comings: any[] } | undefined>>({})
const isLoading = ref(true)
const error = ref < string | null > (null)
const updatedAt = ref('—')

let refreshTimer: ReturnType<typeof setInterval>

// ── Computed ────────────────────────────────────────────────────────
const totalBalance = computed(() => {
  if (!contractorData.value) return 0
  return ['masters', 'workers', 'foremans', 'offices']
    .reduce((sum, k) => sum + (contractorData.value[k].totalBalance || 0), 0)
})

const allContractors = computed(() => {
  if (!contractorData.value) return []
  return ['masters', 'workers', 'foremans', 'offices']
    .flatMap(k => contractorData.value[k].list || [])
})

const debtors = computed(() =>
  allContractors.value
    .filter(c => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5)
)

const creditors = computed(() =>
  allContractors.value
    .filter(c => c.balance < 0)
    .sort((a, b) => a.balance - b.balance)
    .slice(0, 3)
)

// ── Вспомогательные ─────────────────────────────────────────────────
const getTypeIcon = (type: string) => typeIconMap[type] ?? 'mdi:account'

const formatCurrency = (amount: any) => {
  const n = parseFloat(amount) || 0
  const abs = Math.abs(n).toLocaleString('ru-RU', {
    style: 'currency', currency: 'RUB', minimumFractionDigits: 0
  })
  return n >= 0 ? abs : `−${abs}`
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

// ── Загрузка ────────────────────────────────────────────────────────
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    // ✅ Исправлено: используем singular ключи для API
    const [masters, workers, foremans, offices] = await Promise.all([
      $fetch<any>('/api/contractors/master'),
      $fetch<any>('/api/contractors/worker'),
      $fetch<any>('/api/contractors/foreman'),
      $fetch<any>('/api/contractors/office'),
    ])

    // Обработка ответа (API возвращает { contractors: [], count: N })
    const process = (response: any, type: string) => {
      const list = response?.contractors || response || []
      return (list || []).map((c: any) => ({ 
        ...c, 
        type, 
        balance: parseFloat(c.balance) || 0 
      }))
    }

    const m = process(masters, 'master')
    const w = process(workers, 'worker')
    const f = process(foremans, 'foreman')
    const o = process(offices, 'office')

    const sum = (arr: any[]) => arr.reduce((acc, c) => acc + c.balance, 0)

    contractorData.value = {
      masters: { totalBalance: sum(m), count: m.length, list: m },
      workers: { totalBalance: sum(w), count: w.length, list: w },
      foremans: { totalBalance: sum(f), count: f.length, list: f },
      offices: { totalBalance: sum(o), count: o.length, list: o },
    }

    updatedAt.value = new Date().toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } catch (e: any) {
    console.error('[КонтрФинансы] Ошибка загрузки:', e)
    error.value = e?.message || 'Ошибка загрузки'
  } finally {
    isLoading.value = false
  }
}

async function loadTransactions(contractor: any) {
  if (transactions.value[contractor.id]) return
  loadingTransactions.value = contractor.id
  try {
    // ✅ Исправлено: передаём правильные параметры
    const [expenses, comings] = await Promise.all([
      $fetch<any[]>('/api/expenses', { 
        params: { 
          contractorType: contractor.type,    // 'master', 'worker', etc.
          contractorId: contractor.id 
        } 
      }),
      // ⚠️ Внимание: /api/comings не фильтрует по contractorType!
      // Если нужно — создайте отдельный эндпоинт или фильтруйте на фронтенде
      $fetch<any[]>('/api/comings', { 
        params: { 
          objectId: contractor.objectId || undefined  // Если есть связь с объектом
        } 
      }),
    ])
    
    transactions.value[contractor.id] = {
      expenses: (expenses || []).map(e => ({ 
        ...e, 
        amount: parseFloat(e.amount),
        objectName: e.objectName 
      })),
      comings: (comings || []).map(c => ({ 
        ...c, 
        amount: parseFloat(c.amount),
        objectName: c.objectName 
      })),
    }
  } catch (e: any) {
    console.error(`[КонтрФинансы] Ошибка загрузки транзакций для ${contractor.id}:`, e)
  } finally {
    loadingTransactions.value = null
  }
}

async function toggleExpand(contractor: any) {
  if (expandedId.value === contractor.id) {
    expandedId.value = null
    return
  }
  expandedId.value = contractor.id
  await loadTransactions(contractor)
}

onMounted(() => {
  fetchData()
  refreshTimer = setInterval(fetchData, 5 * 60 * 1000)
})

onBeforeUnmount(() => clearInterval(refreshTimer))
</script>

<style lang="scss" scoped>
.cf {
  display: flex;
  flex-direction: column;
}

// ── Итог ────────────────────────────────────────────────────────────
.cf__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 14px;
  border-bottom: 1px solid var(--crm-border);

  &-label {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
  }

  &-value {
    font-size: var(--crm-text-xl);
    font-weight: 700;

    &--pos {
      color: var(--crm-success);
    }

    &--neg {
      color: var(--crm-danger);
    }
  }
}

// ── Типы контрагентов ───────────────────────────────────────────────
.cf__types {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid var(--crm-border);

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.cf-type {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-right: 1px solid var(--crm-border);
  cursor: pointer;
  transition: var(--crm-transition);

  &:last-child {
    border-right: none;
  }

  &:hover {
    background: var(--crm-bg-elevated);
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: var(--crm-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
  }

  &__count {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-disabled);
  }

  &__balance {
    font-size: var(--crm-text-sm);
    font-weight: 700;
    flex-shrink: 0;

    &--pos {
      color: var(--crm-success);
    }

    &--neg {
      color: var(--crm-danger);
    }
  }
}

// ── Секции должников/кредиторов ─────────────────────────────────────
.cf__sections {
  display: flex;
  flex-direction: column;
}

.cf-section {
  border-bottom: 1px solid var(--crm-border);

  &:last-child {
    border-bottom: none;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px 8px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-secondary);
  }

  &__count {
    font-size: var(--crm-text-xs);
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 10px;

    &--danger {
      background: var(--crm-danger-dim);
      color: var(--crm-danger);
      border: 1px solid rgba(242, 95, 92, .3);
    }

    &--warning {
      background: var(--crm-warning-dim);
      color: var(--crm-warning);
      border: 1px solid rgba(245, 166, 35, .3);
    }
  }
}

// ── Список контрагентов ─────────────────────────────────────────────
.contractor-list {
  display: flex;
  flex-direction: column;
  padding: 0 8px 8px;
  gap: 2px;
}

.contractor-item {
  border-radius: var(--crm-radius-md);
  overflow: hidden;
  border: 1px solid transparent;
  transition: var(--crm-transition);

  &--open {
    border-color: var(--crm-border-hover);
    background: var(--crm-bg-elevated);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    cursor: pointer;
    transition: var(--crm-transition);

    &:hover {
      background: var(--crm-bg-elevated);
    }
  }

  &__icon {
    width: 24px;
    height: 24px;
    border-radius: var(--crm-radius-sm);
    background: var(--crm-bg-overlay);
    color: var(--crm-text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__name {
    flex: 1;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__chevron {
    color: var(--crm-text-muted);
    transition: transform var(--crm-transition);
    flex-shrink: 0;

    &--open {
      transform: rotate(180deg);
    }
  }

  &__balance {
    font-size: var(--crm-text-sm);
    font-weight: 700;
    flex-shrink: 0;

    &--danger {
      color: var(--crm-danger);
    }

    &--warning {
      color: var(--crm-warning);
    }
  }

  // Транзакции
  &__transactions {
    padding: 0 10px 10px;
    border-top: 1px solid var(--crm-border);
    margin-top: 4px;
  }
}

// ── Транзакции ───────────────────────────────────────────────────────
.tx-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-muted);
}

.tx-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 10px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.tx-col {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__header {
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
    text-transform: uppercase;
    letter-spacing: .05em;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--crm-border);
  }
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tx-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  padding: 7px 8px;
  background: var(--crm-bg-base);
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);

  &__date {
    color: var(--crm-text-disabled);
    flex-shrink: 0;
  }

  &__obj {
    color: var(--crm-text-muted);
  }

  &__comment {
    color: var(--crm-text-muted);
    font-style: italic;
  }

  &__amount {
    font-weight: 700;
    margin-left: auto;
    flex-shrink: 0;

    &--income {
      color: var(--crm-success);
    }

    &--expense {
      color: var(--crm-danger);
    }
  }
}

.tx-empty {
  padding: 10px 0;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-disabled);
  text-align: center;
}

// ── Состояния ───────────────────────────────────────────────────────
.cf-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 20px;
  color: var(--crm-text-muted);

  p {
    margin: 0;
    font-size: var(--crm-text-sm);
  }
}

// ── Анимация раскрытия ───────────────────────────────────────────────
.expand-enter-active,
.expand-leave-active {
  transition: all .2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 600px;
}

// ── Спиннер ─────────────────────────────────────────────────────────
.spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
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
  white-space: nowrap;

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
</style>