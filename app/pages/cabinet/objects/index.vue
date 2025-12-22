<!-- app/pages/cabinet/objects/index.vue -->
<template>
  <!-- Заголовок страницы с кнопкой добавления -->
  <PagesCabinetUiLayoutPageTitle title="Объекты">
    <template #actions>
      <div v-if="['admin', 'manager'].includes(user?.role)" class="add-object-form">
        <input
          v-model="newObjectName"
          placeholder="Название объекта"
          @keyup.enter="addObject"
          :class="{ error: addError }"
        />
        <button @click="addObject" :disabled="!newObjectName || loading" class="btn-primary">
          Добавить
        </button>
      </div>
    </template>
  </PagesCabinetUiLayoutPageTitle>

  <!-- Основной контент -->
  <div class="cabinet-page">
    <Card :loading="loading" elevated no-padding-body>
      <!-- Вкладки слева в заголовке карточки -->
      <template #header>
        <div class="tabs-container">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="{ active: currentTab === tab.value }"
            @click="switchTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
      </template>

      <!-- Счётчик "X / Y" справа -->
      <template #actions>
        <div class="card-tab-counter" title="Активные / Завершённые">
          {{ counts.active }} / {{ counts.completed }}
        </div>
      </template>

      <!-- Сообщение об ошибке или успехе -->
      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>
      <div v-else-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <!-- Список объектов -->
      <ul v-if="filteredObjects.length" class="object-list">
        <li v-for="object in filteredObjects" :key="object.id" class="object-item">
          <router-link :to="`/cabinet/objects/${object.id}`" class="object-name">
            <div class="info">
              <div class="flex-colomn">
                <!-- Название объекта -->
                <p><b>{{ object.name }}</b></p>

                <!-- Адрес объекта -->
                <div class="object-address">
                  <span class="balance">{{ object.address || '—' }}</span>
                </div>
              </div>

              <div v-if="object.status !== 'completed'" class="profitability-row">
                <span class="balance">Баланс: <strong>{{ formatNumber(object.totalBalance) }} ₽</strong></span>
                <div class="debug-info">
                  Работы: {{ formatNumber(object.totalWorks) }} ₽, 
                  Материалы: 
                  <span :class="getMaterialBalance(object) >= 0 ? 'positive' : 'negative'">
                    {{ getMaterialBalance(object) >= 0 ? '+' : '' }}{{ formatNumber(getMaterialBalance(object)) }} ₽
                  </span>
                </div>
              </div>

              <!-- Маржинальность (только для завершённых) -->
              <div v-if="getProfitabilityText(object)" class="profitability-row">
                <span :class="{ 'profit-positive': getProfitabilityText(object).isProfit, 'profit-negative': !getProfitabilityText(object).isProfit }">
                  Маржа: {{ getProfitabilityText(object).text }}
                </span>
                <div class="debug-info">
                  Работы: {{ formatNumber(object.totalWorks) }} ₽, 
                  Материалы: 
                  <span :class="getMaterialBalance(object) >= 0 ? 'positive' : 'negative'">
                    {{ getMaterialBalance(object) >= 0 ? '+' : '' }}{{ formatNumber(getMaterialBalance(object)) }} ₽
                  </span>
                </div>
              </div>
            </div>

            <div class="docs">
              <!-- Индикатор договора -->
              <div class="object-doc-status" :title="getDocumentTooltip(object)">
                <span :class="`doc-indicator ${getDocumentClass(object)}`"></span>
                <span class="doc-text">{{ getDocumentText(object) }}</span>
              </div>

              <!-- Индикатор счетов -->
              <div class="object-doc-status" :title="getInvoiceTooltip(object)">
                <span :class="`doc-indicator ${getInvoiceClass(object)}`"></span>
                <span class="doc-text">Счета {{ object.invoiceStats.total }}/{{ object.invoiceStats.signed }}</span>
              </div>

              <!-- Индикатор актов -->
              <div class="object-doc-status" :title="getActTooltip(object)">
                <span :class="`doc-indicator ${getActClass(object)}`"></span>
                <span class="doc-text">Акты {{ object.actStats.total }}/{{ object.actStats.signed }}</span>
              </div>
            </div>
          </router-link>
        </li>
      </ul>

      <!-- Пустое состояние -->
      <div v-else class="empty-state">
        Нет объектов в категории "{{ currentTabLabel }}"
      </div>

      <!-- Футер с общим количеством -->
      <template #footer>
        Всего: {{ filteredObjects.length }} объект(а)
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from '~/components/pages/cabinet/ui/cards/card.vue'

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})

const router = useRouter()

// Текущий пользователь
const user = ref(null)

// Данные
const objects = ref([])
const newObjectName = ref('')
const currentTab = ref('active')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Вкладки
const tabs = [
  { label: 'В работе', value: 'active' },
  { label: 'Завершённые', value: 'completed' }
]

// Вычисляем активную вкладку для отображения
const currentTabLabel = computed(() => {
  return tabs.find(t => t.value === currentTab.value)?.label || 'Объекты'
})

// Подсчёты по статусам
const counts = computed(() => {
  const active = objects.value.filter(obj => obj.status === 'active').length
  const completed = objects.value.filter(obj => obj.status === 'completed').length
  return { active, completed }
})

// Отфильтрованные объекты (для текущей вкладки)
const filteredObjects = computed(() => {
  return objects.value.filter(obj => obj.status === currentTab.value)
})

// Ошибки
const addError = computed(() => !newObjectName.value.trim())

// Форматирование чисел
const formatNumber = (num) => {
  const value = Number(num) || 0
  return value.toLocaleString('ru-RU')
}

// Переключение вкладок
function switchTab(tabValue) {
  currentTab.value = tabValue
}

// Загрузка пользователя и объектов
onMounted(async () => {
  try {
    const currentUser = await $fetch('/api/me', {
      method: 'GET',
      credentials: 'include'
    })
    user.value = currentUser.user
  } catch (error) {
    console.error('Ошибка получения пользователя:', error)
    user.value = null
    errorMessage.value = 'Не удалось загрузить данные пользователя'
    setTimeout(() => (errorMessage.value = ''), 5000)
  }

  await fetchObjects()
})

// Получение объектов
async function fetchObjects() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await $fetch('/api/objects', {
      method: 'GET',
      credentials: 'include'
    })

    // ✅ ПРОСТО СОХРАНЯЕМ ДАННЫЕ КАК ЕСТЬ
    objects.value = data
  } catch (error) {
    console.error('Ошибка загрузки объектов:', error)
    errorMessage.value = 'Не удалось загрузить объекты'
  } finally {
    loading.value = false
  }
}

// Обновление балансов
async function updateBalances() {
  try {
    const updatedObjects = await Promise.all(
      objects.value.map(async (obj) => {
        const fullData = await $fetch(`/api/objects/${obj.id}/full`, {
          method: 'GET',
          credentials: 'include'
        })

        return {
          ...obj,
          totalIncome: fullData.finances.totalIncome,
          totalWorks: fullData.finances.totalWorks,
          materialsTotal: fullData.materialsTotal, // нужно добавить в full.get.ts
          expenses: fullData.finances.totalWorks + (fullData.materialsTotal || 0),
          totalBalance: fullData.finances.totalBalance
        }
      })
    )
    objects.value = updatedObjects
  } catch (error) {
    console.error('Ошибка обновления балансов:', error)
  }
}

// Добавление объекта
async function addObject() {
  if (!newObjectName.value.trim()) return

  loading.value = true
  errorMessage.value = ''
  try {
    const created = await $fetch('/api/objects', {
      method: 'POST',
      body: { name: newObjectName.value.trim(), status: currentTab.value },
      credentials: 'include'
    })

    objects.value.unshift({
      ...created,
      totalBalance: 0
    })

    newObjectName.value = ''
    successMessage.value = 'Объект успешно создан!'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (error) {
    console.error('Ошибка создания объекта:', error)
    errorMessage.value = 'Не удалось создать объект'
  } finally {
    loading.value = false
  }
}

// --- Вспомогательная функция: баланс материалов ---
function getMaterialBalance(object) {
  const incoming = object.materialIncoming || 0
  const outgoing = object.materialOutgoing || 0
  return incoming - outgoing
}

// --- ДОКУМЕНТЫ: статус договора ---

// Карта типов договоров
const contractTypeMap = {
  edo: 'ЭДО',
  paper: 'Бумажный',
  invoice: 'Счёт-договор',
  none: 'Не нужен',
  unassigned: '—'
}

// Карта статусов (для подсказки)
const contractStatusMap = {
  prepared: 'Подготовлен',
  sent: 'Отправлен',
  awaiting: 'На подписи',
  signed: 'Подписан',
  cancelled: 'Отменён'
}

// Получить класс для индикатора
function getDocumentClass(object) {
  if (!object.contract) return 'doc-red'
  if (object.contract.status === 'signed') return 'doc-green'
  if (['sent', 'awaiting'].includes(object.contract.status)) return 'doc-yellow'
  return 'doc-yellow'
}

// Получить текстовое описание
function getDocumentText(object) {
  if (!object.contract) return '—'
  return contractTypeMap[object.contract.type] || '—'
}

// Получить подсказку при наведении
function getDocumentTooltip(object) {
  if (!object.contract) return 'Договор не создан'

  const typeTip = {
    edo: 'Электронный документооборот',
    paper: 'Бумажный договор',
    invoice: 'Счёт-договор',
    none: 'Договор не требуется',
    unassigned: 'Тип договора не выбран'
  }[object.contract.type] || '—'

  const statusTip = contractStatusMap[object.contract.status] || '—'

  return `${typeTip} — ${statusTip}`
}

// --- ИНДИКАТОРЫ ДЛЯ СЧЁТОВ ---

function getInvoiceClass(object) {
  const stats = object.invoiceStats
  if (stats.total === 0) return 'doc-red'
  if (stats.signed === stats.total) return 'doc-green'
  return 'doc-yellow'
}

function getInvoiceTooltip(object) {
  const { total, signed } = object.invoiceStats
  if (total === 0) return 'Нет счётов'
  if (signed === total) return `Все ${total} счётов оплачены`
  return `${signed} из ${total} счётов оплачено`
}

// --- ИНДИКАТОРЫ ДЛЯ АКТОВ ---

function getActClass(object) {
  const stats = object.actStats
  if (stats.total === 0) return 'doc-red'
  if (stats.signed === stats.total) return 'doc-green'
  return 'doc-yellow'
}

function getActTooltip(object) {
  const { total, signed } = object.actStats
  if (total === 0) return 'Нет актов'
  if (signed === total) return `Все ${total} актов подписаны`
  return `${signed} из ${total} актов подписано`
}

// --- МАРЖИНАЛЬНОСТЬ ДЛЯ ЗАВЕРШЁННЫХ ОБЪЕКТОВ ---
function getProfitabilityText(object) {
  if (object.status !== 'completed') return null

  const income = object.totalIncome || 0
  const expenses = object.expenses || 0
  const profit = income - expenses

  if (income === 0) return 'Приход: 0 ₽'

  const marginPercent = ((profit / income) * 100).toFixed(1)

  return {
    text: `${formatNumber(profit)} ₽ (${marginPercent}%)`,
    isProfit: profit >= 0
  }
}

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM — Объекты'
})
</script>

<style lang="scss" scoped>
.cabinet-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.tabs-container {
  display: flex;
  gap: 0.5rem;

  button {
    padding: 0.6rem 1rem;
    border: none;
    background: $background-light;
    border-radius: $border-radius;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;
    font-weight: 500;
    white-space: nowrap;

    &.active {
      background: $blue;
      color: white;
    }

    &:hover:not(.active) {
      background: $blue;
    }
  }
}

// Счётчик в правой части заголовка карточки
.card-tab-counter {
  font-size: 0.95rem;
  color: $color-muted;
  font-weight: 600;
  padding: 0.5rem 1rem;
  background: rgba($blue, 0.05);
  border-radius: $border-radius;
  min-width: 80px;
  text-align: end;
  font-family: 'Courier', monospace; // улучшает выравнивание цифр
  border-left: 1px solid $border-color;
}

.add-object-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;

  input {
    flex: 1;
    max-width: 300px;
    padding: 0.6rem 0.8rem;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    font-size: 0.95rem;
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: $blue;
    }

    // &.error {
    //   border-color: $color-danger;
    //   background: #ffebee;
    // }
  }

  .btn-primary {
    padding: 0.6rem 1.2rem;
    background: $color-success;
    color: white;
    border: none;
    border-radius: $border-radius;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: background 0.2s ease;

    &:disabled {
      background: $color-muted;
      cursor: not-allowed;
      opacity: 0.7;
    }

    &:not(:disabled):hover {
      background: $color-success;
    }
  }
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: $border-radius;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;

  &-error {
    background: #ffeaea;
    color: $color-danger;
    border-color: #f1948a;
  }

  &-success {
    background: #ecfde4;
    color: $color-success;
    border-color: #a3e635;
  }
}

.object-list {
  list-style: none;
  padding: 0;
  margin: 0;

  .object-item {
    // display: flex;
    // flex-direction: column;
    // justify-content: space-between;
    // align-items: center;
    padding: 1rem;
    border-bottom: 1px solid $border-color;
    transition: background 0.2s ease, transform 0.1s ease;
    gap: 1rem;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: rgba($blue, 0.02);
    }

    .info {
      justify-content: space-between;
    }

    .docs {
      gap: 1em;
      margin-top: .5em;
    }

    .info, .docs {
      // border: 1px solid red;
      display: flex;
      align-items: start;

      .profitability-row {
        font-size: 0.85rem;
        margin-top: 0.25rem;
        text-align: end;

        span {
          padding: 0.25rem 0.5rem;
          border-radius: $border-radius;
          font-weight: 600;
          font-size: 0.9rem;

          &.profit-positive {
            color: #2e7d32;
            background: #e8f5e9;
          }

          &.profit-negative {
            color: #c62828;
            background: #ffebee;
          }
        }

        .debug-info, span {
          font-size: 0.8rem;
          color: $color-muted;
          margin-top: 0.25rem;
          padding: unset;
        }
      }
    }
  }

  .object-name {
    flex: 1;
    font-size: 1rem;
    color: $text-dark;
    text-decoration: none;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover {
      color: $blue;
    }
  }

  .balance {
    color: $color-muted;
    font-size: 0.95rem;
    
    strong {
      color: $text-dark;
      font-weight: 600;
      font-size: 1.2em;
    }
  }
}

// --- Статус договора ---
.object-doc-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: $text-dark;
  flex-shrink: 0;
  min-width: 160px;
  padding: 0.25rem 0.5rem;
  border-radius: $border-radius;
  background: rgba($border-color, 0.05);
  border: 1px solid rgba($border-color, 1);
  transition: all 0.2s ease;
}

.doc-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;

  &.doc-green {
    background: #4caf50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }

  &.doc-yellow {
    background: #ff9800;
    box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
  }

  &.doc-red {
    background: #f44336;
    box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
  }
}

.doc-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  font-size: 0.85rem;
  font-weight: 500;
  color: $text-dark;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: $color-muted;
  font-style: italic;
  font-size: 1rem;
  border-top: 1px solid $border-color;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: $border-radius;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s ease;

  &.btn-success {
    background: $color-success;
    color: white;

    &:hover {
      background: $color-success;
    }
  }

  &.btn-warning {
    background: $yellow;
    color: white;

    &:hover {
      background: $yellow;
    }
  }

  &.btn-danger {
    background: $color-danger;
    color: white;

    &:hover {
      background: $color-danger;
    }
  }
}

// --- Адаптивность ---
@media (max-width: 1024px) {
  .cabinet-page {
    padding: 1rem;
  }

  .add-object-form input {
    max-width: 200px;
    font-size: 0.9rem;
  }

  .card-tab-counter {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }

  .object-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .object-doc-status {
    align-self: flex-end;
    margin-top: 0.5rem;
  }

  .doc-text {
    max-width: 100px;
    font-size: 0.8rem;
  }
}
</style>