<!-- app/components/pages/cabinet/objects/Operations.vue -->
<template>
  <div class="ops">

    <!-- Сводка -->
    <div class="ops-summary">
      <div class="summary-card summary-card--balance">
        <div class="summary-card__icon">
          <Icon name="mdi:scale-balance" size="18" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__label">Баланс объекта</span>
          <span class="summary-card__value" :class="objectBalance >= 0 ? 'pos' : 'neg'">
            {{ formatAmount(objectBalance) }} ₽
          </span>
          <span class="summary-card__sub">Приходы − выплаченные работы</span>
        </div>
      </div>

      <div class="summary-card summary-card--pending">
        <div class="summary-card__icon">
          <Icon name="mdi:clock-outline" size="18" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__label">В работе</span>
          <span class="summary-card__value">
            {{ formatAmount(pendingWorksTotal) }} ₽
          </span>
          <span class="summary-card__sub">Непринятые работы</span>
        </div>
      </div>
    </div>

    <!-- Кнопки добавления -->
    <div class="ops-actions">
      <button class="crm-btn crm-btn--income" @click="openComingModal">
        <Icon name="mdi:plus" size="15" />
        Добавить приход
      </button>
      <button class="crm-btn crm-btn--work" @click="openWorkModal">
        <Icon name="mdi:hammer" size="15" />
        Добавить работу
      </button>
    </div>

    <!-- Приходы -->
    <div class="ops-section">
      <div class="ops-section__header">
        <div class="ops-section__title">
          <Icon name="mdi:arrow-bottom-left" size="16" class="ops-section__icon ops-section__icon--income" />
          Приходы
        </div>
        <span class="ops-section__count">{{ comings.length }}</span>
      </div>

      <div v-if="!comings.length" class="ops-empty">
        <Icon name="mdi:cash-plus" size="24" />
        <span>Нет приходов</span>
      </div>

      <div v-else class="ops-table-wrap">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Сумма</th>
              <th>Комментарий</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(c, idx) in sortByDateDesc(comings)" :key="c.id" :class="{ 'tr--alt': idx % 2 === 1 }">
              <td class="td--date">{{ formatDate(c.operationDate) }}</td>
              <td class="td--amount pos">+{{ formatAmount(c.amount) }} ₽</td>
              <td class="td--comment">{{ c.comment || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Работы -->
    <div class="ops-section">
      <div class="ops-section__header">
        <div class="ops-section__title">
          <Icon name="mdi:hammer" size="16" class="ops-section__icon ops-section__icon--work" />
          Работы
        </div>
        <span class="ops-section__count">{{ works.length }}</span>
        <button class="crm-btn crm-btn--ghost crm-btn--xs" @click="fetchOperations">
          <Icon name="mdi:refresh" size="13" />
        </button>
      </div>

      <div v-if="!works.length" class="ops-empty">
        <Icon name="mdi:briefcase-outline" size="24" />
        <span>Нет работ</span>
      </div>

      <div v-else class="ops-table-wrap">
        <table class="ops-table ops-table--works">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Контрагент</th>
              <th>Вид работы</th>
              <th>Прораб</th>
              <th>Принято</th>
              <th>Комм.</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(w, idx) in sortByDateDesc(works)" :key="w.id"
              :class="['ops-work-row', { 'tr--alt': idx % 2 === 1, 'ops-work-row--paid': w.paid }]">
              <td class="td--date">{{ formatDate(w.operationDate) }}</td>
              <td class="td--amount">
                <span :class="w.paid ? 'pos' : 'warn'">
                  {{ formatAmount(w.workerAmount || w.amount) }} ₽
                </span>
              </td>
              <td>
                <span :class="['work-status', w.paid ? 'work-status--paid' : 'work-status--pending']">
                  {{ w.paid ? 'Принято' : 'В работе' }}
                </span>
              </td>
              <td class="td--name">
                {{contractors.find(c => c.id === w.contractorId && c.type === w.contractorType)?.name || '—'}}
              </td>
              <td>{{ w.workType || '—' }}</td>
              <td class="td--name">{{foremans.find(f => f.id === w.supervisorId)?.name || '—'}}</td>
              <td class="td--center">
                <Icon :name="w.acceptedByClient ? 'mdi:check-circle' : 'mdi:close-circle'" size="16"
                  :class="w.acceptedByClient ? 'pos' : 'neg'" />
              </td>
              <td class="td--comment">{{ w.rejectionComment || '—' }}</td>
              <td class="td--actions">
                <template v-if="!w.paid && !w.acceptedByClient">
                  <button class="action-btn action-btn--accept" @click="acceptWork(w.id)" title="Принять">
                    <Icon name="mdi:check" size="13" />
                  </button>
                  <button class="action-btn action-btn--reject" @click="rejectWork(w.id)" title="Отклонить">
                    <Icon name="mdi:close" size="13" />
                  </button>
                </template>
                <button v-if="!w.paid && w.acceptedByClient" class="action-btn action-btn--pay" @click="payWork(w.id)"
                  title="Закрыть">
                  <Icon name="mdi:currency-rub" size="13" />
                </button>
                <button class="action-btn action-btn--delete" @click="deleteWork(w.id, w.paid)" title="Удалить">
                  <Icon name="mdi:trash-can-outline" size="13" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Модалка: Добавить приход -->
    <PagesCabinetUiModal :visible="isComingModalOpen" title="Добавить приход" size="md" closable
      @update:visible="closeModals" @close="closeModals">
      <div class="modal-form">
        <div class="field">
          <label class="field__label">Сумма <span class="field__req">*</span></label>
          <input type="text" class="field__input" :class="{ 'field__input--error': formErrors.coming }"
            v-model="comingDisplayAmount" placeholder="0" @blur="formatComingOnBlur" @focus="unformatComingOnFocus"
            @input="syncComingAmount" />
          <span v-if="formErrors.coming" class="field__error">{{ formErrors.coming }}</span>
        </div>

        <div class="field">
          <label class="field__label">Комментарий</label>
          <textarea class="field__input field__input--textarea" v-model="newComing.comment"
            placeholder="Дополнительная информация..." rows="2" />
        </div>
      </div>

      <template #footer>
        <button class="crm-btn crm-btn--ghost" @click="closeModals">Отмена</button>
        <button class="crm-btn crm-btn--income" :disabled="!isComingValid || loadingComing" @click="addComing">
          <Icon v-if="loadingComing" name="mdi:loading" class="spin" size="14" />
          {{ loadingComing ? 'Сохранение...' : 'Добавить приход' }}
        </button>
      </template>
    </PagesCabinetUiModal>

    <!-- Модалка: Добавить работу -->
    <PagesCabinetUiModal :visible="isWorkModalOpen" title="Добавить работу" size="lg" closable
      @update:visible="closeModals" @close="closeModals">
      <div class="modal-form">

        <div class="field-row">
          <div class="field">
            <label class="field__label">Сумма работ (мастеру) <span class="field__req">*</span></label>
            <input type="text" class="field__input" :class="{ 'field__input--error': formErrors.contractorAmount }"
              v-model="workDisplayAmount" placeholder="0" @blur="formatWorkOnBlur" @focus="unformatWorkOnFocus"
              @input="syncWorkAmount" />
            <span v-if="formErrors.contractorAmount" class="field__error">{{ formErrors.contractorAmount }}</span>
          </div>

          <div class="field">
            <label class="field__label">Дата операции</label>
            <input type="date" class="field__input" v-model="newWork.operationDate" />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field__label">Категория</label>
            <select class="field__input" v-model="selectedCategory">
              <option value="">— Выберите —</option>
              <option value="master">Мастера</option>
              <option value="worker">Рабочие</option>
            </select>
          </div>

          <div class="field">
            <label class="field__label">Контрагент <span class="field__req">*</span></label>
            <select class="field__input" v-model="newWork.contractorId" :disabled="!selectedCategory">
              <option value="">— Выберите —</option>
              <option v-for="c in filteredContractors" :key="c.id" :value="c.id">
                {{ c.name }} ({{ formatAmount(c.balance) }} ₽)
              </option>
            </select>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field__label">Вид работы <span class="field__req">*</span></label>
            <select class="field__input" v-model="newWork.workType">
              <option value="">— Выберите —</option>
              <option v-for="t in workTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>

          <div class="field">
            <label class="field__label">Прораб</label>
            <select class="field__input" v-model="newWork.supervisorId">
              <option :value="null">— Без прораба —</option>
              <option v-for="f in foremans" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label class="field__label">Комментарий</label>
          <textarea class="field__input field__input--textarea" v-model="newWork.comment"
            placeholder="Комментарий к работе..." rows="2" />
        </div>

        <div class="field field--checkbox">
          <label class="checkbox-label">
            <input type="checkbox" class="checkbox-input" v-model="newWork.immediatePayment" />
            <span class="checkbox-text">Сразу оплатить с баланса компании</span>
          </label>
        </div>

      </div>

      <template #footer>
        <button class="crm-btn crm-btn--ghost" @click="closeModals">Отмена</button>
        <button class="crm-btn crm-btn--work" :disabled="!isWorkValid || loadingWork" @click="addWork">
          <Icon v-if="loadingWork" name="mdi:loading" class="spin" size="14" />
          {{ loadingWork ? 'Сохранение...' : 'Добавить работу' }}
        </button>
      </template>
    </PagesCabinetUiModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps < {
  objectId: number
  operations: any[]
} > ()

const emit = defineEmits < {
  'add-coming': [op: any]
  'add-expense': [op: any]
  'add-work': [op: any]
  'delete-work': [id: number]
} > ()

const route = useRoute()

// ── Данные ───────────────────────────────────────────────────────────
const comings = ref < any[] > ([])
const works = ref < any[] > ([])
const contractors = ref < any[] > ([])
const foremans = ref < any[] > ([])

// ── Модалки ──────────────────────────────────────────────────────────
const isComingModalOpen = ref(false)
const isWorkModalOpen = ref(false)
const loadingComing = ref(false)
const loadingWork = ref(false)
const formErrors = ref < Record < string, string>> ({})

// ── Формы ────────────────────────────────────────────────────────────
const newComing = ref < any > ({ amount: null, comment: '', objectId: props.objectId })
const newWork = ref < any > ({
  amount: null, contractorId: null, comment: '',
  paid: false, objectId: props.objectId,
  acceptedByClient: false, rejectionComment: null,
  operationDate: new Date().toISOString().split('T')[0],
  workType: '', supervisorId: null, immediatePayment: false
})

const selectedCategory = ref('')
const localComingValue = ref('')
const localWorkValue = ref('')

const workTypes = [
  'Отделка', 'Электрика', 'Плитка', 'Сантехника', 'Перегородки ГКЛ', 'Сварка',
  'Бетонные работы', 'Кровля', 'Фасад', 'Перегородки Камень', 'Демонтаж',
  'Мусор', 'Разнорабочий', 'Смежники', 'Прочее'
]

// ── Computed ─────────────────────────────────────────────────────────
const totalComings = computed(() =>
  comings.value.reduce((s, c) => s + Number(c.amount), 0)
)

const objectBalance = computed(() => {
  const paid = works.value
    .filter(w => w.paid && w.acceptedByClient)
    .reduce((s, w) => s + Number(w.workerAmount || w.amount || 0), 0)
  return totalComings.value - paid
})

const pendingWorksTotal = computed(() =>
  works.value
    .filter(w => !w.paid && !w.acceptedByClient)
    .reduce((s, w) => s + Number(w.workerAmount || w.amount || 0), 0)
)

const filteredContractors = computed(() =>
  contractors.value.filter(c => c.type === selectedCategory.value)
)

const isComingValid = computed(() => Number(newComing.value.amount) > 0)

const isWorkValid = computed(() =>
  Number(newWork.value.amount) > 0 &&
  newWork.value.contractorId !== null &&
  newWork.value.workType !== ''
)

// ── Форматирование суммы ─────────────────────────────────────────────
function formatAmount(v: any) {
  if (v == null || isNaN(v)) return '0'
  return new Intl.NumberFormat('ru-RU').format(Number(v))
}

function formatDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  })
}

function sortByDateDesc(arr: any[]) {
  return [...arr].sort((a, b) => new Date(b.operationDate).getTime() - new Date(a.operationDate).getTime())
}

function parseNumber(str: string) {
  if (!str) return NaN
  return parseFloat(str.replace(/[^\d,.-]/g, '').replace(',', '.'))
}

// Приход
const comingDisplayAmount = computed({
  get() { return newComing.value.amount === null ? '' : new Intl.NumberFormat('ru-RU').format(newComing.value.amount) },
  set(v: string) { localComingValue.value = v }
})
function unformatComingOnFocus() { localComingValue.value = newComing.value.amount !== null ? String(newComing.value.amount) : '' }
function formatComingOnBlur() { const n = parseNumber(localComingValue.value); if (!isNaN(n) && n >= 0) newComing.value.amount = n }
function syncComingAmount() { const n = parseNumber(localComingValue.value); if (!isNaN(n)) newComing.value.amount = n; else if (!localComingValue.value) newComing.value.amount = null }

// Работа
const workDisplayAmount = computed({
  get() { return newWork.value.amount === null ? '' : new Intl.NumberFormat('ru-RU').format(newWork.value.amount) },
  set(v: string) { localWorkValue.value = v }
})
function unformatWorkOnFocus() { localWorkValue.value = newWork.value.amount !== null ? String(newWork.value.amount) : '' }
function formatWorkOnBlur() { const n = parseNumber(localWorkValue.value); if (!isNaN(n) && n >= 0) newWork.value.amount = n }
function syncWorkAmount() { const n = parseNumber(localWorkValue.value); if (!isNaN(n)) newWork.value.amount = n; else if (!localWorkValue.value) newWork.value.amount = null }

// ── Загрузка ─────────────────────────────────────────────────────────
async function fetchOperations() {
  try {
    const data = await $fetch < any > (`/api/objects/${props.objectId}/operations`, { credentials: 'include' })
    comings.value = (data.comings || []).map((op: any) => ({ ...op, amount: Number(op.amount) }))
    works.value = (data.works || []).map((op: any) => ({
      ...op,
      workerAmount: Number(op.workerAmount || 0),
      amount: Number(op.workerAmount || 0),
      paid: Boolean(op.paid),
      acceptedByClient: Boolean(op.accepted),
      rejectionComment: op.rejectedReason || null,
      workType: op.workTypes || '',
      supervisorId: op.foremanId || null,
      contractorType: op.contractorType,
    }))
  } catch (e) {
    console.error('[Операции] Ошибка загрузки:', e)
  }
}

// ── Загрузка контрагентов ────────────────────────────────────────────
async function fetchContractors() {
  try {
    // ✅ Исправлено: singular ключи для API
    const [mastersResponse, workersResponse] = await Promise.all([
      $fetch<any>('/api/contractors/master', { credentials: 'include' }),
      $fetch<any>('/api/contractors/worker', { credentials: 'include' }),
    ])
    
    // ✅ API возвращает { contractors: [], count: N }, обрабатываем это
    const masters = mastersResponse?.contractors || mastersResponse || []
    const workers = workersResponse?.contractors || workersResponse || []
    
    contractors.value = [
      ...masters.map((m: any) => ({ ...m, type: 'master' })),
      ...workers.map((w: any) => ({ ...w, type: 'worker' })),
    ]
  } catch (e) {
    console.error('[Операции] Ошибка загрузки контрагентов:', e)
  }
}

async function fetchForemans() {
  try {
    // ✅ Исправлено: singular ключ
    const response = await $fetch<any>('/api/contractors/foreman', { credentials: 'include' })
    // ✅ Обрабатываем ответ { contractors: [] } или прямой массив
    foremans.value = response?.contractors || response || []
  } catch (e) {
    console.error('[Операции] Ошибка загрузки прорабов:', e)
  }
}

// ── Добавление ───────────────────────────────────────────────────────
function openComingModal() { formErrors.value = {}; isComingModalOpen.value = true }
function openWorkModal() { formErrors.value = {}; isWorkModalOpen.value = true }

function closeModals() {
  isComingModalOpen.value = false
  isWorkModalOpen.value = false
  resetForm()
}

function resetForm() {
  newComing.value = { amount: null, comment: '', objectId: props.objectId }
  newWork.value = {
    amount: null, contractorId: null, comment: '',
    paid: false, objectId: props.objectId,
    acceptedByClient: false, rejectionComment: null,
    operationDate: new Date().toISOString().split('T')[0],
    workType: '', supervisorId: null, immediatePayment: false
  }
  selectedCategory.value = ''
  localComingValue.value = ''
  localWorkValue.value = ''
}

async function addComing() {
  formErrors.value = {}
  if (!isComingValid.value) { formErrors.value.coming = 'Сумма должна быть больше нуля'; return }

  loadingComing.value = true
  try {
    const created = await $fetch < any > ('/api/comings', {
      method: 'POST', body: { ...newComing.value, objectId: props.objectId }, credentials: 'include'
    })
    emit('add-coming', created)
    comings.value.push({ ...created, amount: Number(created.amount) })
    closeModals()
  } catch (e) {
    console.error('[Операции] Ошибка добавления прихода:', e)
  } finally {
    loadingComing.value = false
  }
}

async function addWork() {
  formErrors.value = {}
  if (!isWorkValid.value) {
    formErrors.value.contractorAmount = 'Заполните все обязательные поля'
    return
  }

  loadingWork.value = true
  try {
    const operationDate = newWork.value.operationDate
      ? new Date(newWork.value.operationDate).toISOString()
      : new Date().toISOString()

    let result: any

    if (newWork.value.immediatePayment) {
      result = await $fetch < any > ('/api/works/create-and-pay', {
        method: 'POST',
        body: {
          workerAmount: Number(newWork.value.amount),
          contractorId: newWork.value.contractorId,
          contractorType: selectedCategory.value,
          workTypes: newWork.value.workType,
          foremanId: newWork.value.supervisorId || null,
          comment: newWork.value.comment || '',
          objectId: props.objectId,
          operationDate,
        },
        credentials: 'include',
      })
    } else {
      result = await $fetch < any > ('/api/works', {
        method: 'POST',
        body: {
          workerAmount: Number(newWork.value.amount),
          contractorId: newWork.value.contractorId,
          workTypes: newWork.value.workType,
          foremanId: newWork.value.supervisorId || null,
          comment: newWork.value.comment || '',
          paid: false,
          paymentDate: null,
          operationDate,
          objectId: props.objectId,
          contractorType: selectedCategory.value,
        },
        credentials: 'include',
      })
    }

    const workItem = {
      ...result,
      paid: result.paid,
      acceptedByClient: result.accepted,
      workerAmount: Number(result.workerAmount || 0),
      amount: Number(result.workerAmount || 0),
      workType: result.workTypes || '',
      supervisorId: result.foremanId || null,
      operationDate: result.operationDate || new Date().toISOString(),
    }

    emit('add-work', workItem)
    works.value.push(workItem)
    closeModals()
  } catch (e) {
    console.error('[Операции] Ошибка добавления работы:', e)
  } finally {
    loadingWork.value = false
  }
}

// ── Управление работами ───────────────────────────────────────────────
async function payWork(id: number) {
  try {
    const result = await $fetch < any > (`/api/works/pay-work/${id}`, { method: 'POST', credentials: 'include' })
    const w = works.value.find(x => x.id === id)
    if (w) { w.paid = true; w.paymentDate = result.paymentDate }
  } catch (e) { console.error('[Операции] Ошибка оплаты:', e) }
}

async function acceptWork(id: number) {
  try {
    await $fetch(`/api/works/accept/${id}`, { method: 'POST', credentials: 'include' })
    const w = works.value.find(x => x.id === id)
    if (w) { w.acceptedByClient = true; w.rejectionComment = null }
  } catch (e) { console.error('[Операции] Ошибка принятия:', e) }
}

async function rejectWork(id: number) {
  const comment = prompt('Введите причину отклонения:')
  if (!comment) return
  try {
    await $fetch(`/api/works/reject/${id}`, {
      method: 'POST', body: { comment }, credentials: 'include'
    })
    const w = works.value.find(x => x.id === id)
    if (w) { w.rejectionComment = comment; w.acceptedByClient = false }
  } catch (e) { console.error('[Операции] Ошибка отклонения:', e) }
}

async function deleteWork(id: number, isPaid: boolean) {
  const msg = isPaid
    ? 'Удалить оплаченную работу? Это вернёт средства контрагенту.'
    : 'Удалить работу?'
  if (!confirm(msg)) return
  try {
    await $fetch(`/api/works/${id}`, { method: 'DELETE', credentials: 'include' })
    works.value = works.value.filter(w => w.id !== id)
    emit('delete-work', id)
  } catch (e) { console.error('[Операции] Ошибка удаления:', e) }
}

// ── Lifecycle ─────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchOperations()
  await Promise.all([fetchContractors(), fetchForemans()])
})
</script>

<style lang="scss" scoped>
.ops {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ── Сводка ───────────────────────────────────────────────────────────
.ops-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);

  &__icon {
    width: 38px;
    height: 38px;
    border-radius: var(--crm-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
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
    font-size: var(--crm-text-xl);
    font-weight: 700;
    color: var(--crm-text-primary);
  }

  &__sub {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-disabled);
  }

  &--balance .summary-card__icon {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }

  &--pending .summary-card__icon {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }
}

// ── Кнопки добавления ────────────────────────────────────────────────
.ops-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

// ── Секция таблицы ───────────────────────────────────────────────────
.ops-section {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--crm-border);
    background: var(--crm-bg-elevated);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
    flex: 1;
  }

  &__icon {
    &--income {
      color: var(--crm-success);
    }

    &--work {
      color: var(--crm-warning);
    }
  }

  &__count {
    font-size: var(--crm-text-xs);
    font-weight: 700;
    padding: 2px 8px;
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border-hover);
    border-radius: 10px;
    color: var(--crm-text-muted);
  }
}

.ops-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-sm);
}

// ── Таблица ──────────────────────────────────────────────────────────
.ops-table-wrap {
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--crm-bg-overlay) transparent;
}

.ops-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--crm-text-sm);

  th {
    padding: 9px 12px;
    background: var(--crm-bg-elevated);
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
    text-transform: uppercase;
    letter-spacing: .05em;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--crm-border);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  td {
    padding: 9px 12px;
    border-bottom: 1px solid var(--crm-border);
    color: var(--crm-text-secondary);
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr.tr--alt td {
    background: rgba(255, 255, 255, 0.02);
  }

  tr:hover td {
    background: var(--crm-bg-elevated);
  }
}

.td--date {
  white-space: nowrap;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-xs);
}

.td--amount {
  font-weight: 700;
  white-space: nowrap;
}

.td--name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td--comment {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--crm-text-muted);
}

.td--center {
  text-align: center;
}

.td--actions {
  white-space: nowrap;
}

// ── Статус работы ─────────────────────────────────────────────────────
.work-status {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  font-weight: 600;

  &--paid {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--pending {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }
}

.ops-work-row--paid td {
  opacity: .75;
}

// ── Кнопки действий ──────────────────────────────────────────────────
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--crm-radius-sm);
  cursor: pointer;
  transition: var(--crm-transition);
  color: var(--crm-text-muted);

  &--accept:hover {
    background: var(--crm-success-dim);
    border-color: rgba(61, 214, 140, .3);
    color: var(--crm-success);
  }

  &--reject:hover {
    background: var(--crm-warning-dim);
    border-color: rgba(245, 166, 35, .3);
    color: var(--crm-warning);
  }

  &--pay:hover {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);
  }

  &--delete:hover {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, .3);
    color: var(--crm-danger);
  }
}

// ── Цвета ─────────────────────────────────────────────────────────────
.pos {
  color: var(--crm-success);
}

.neg {
  color: var(--crm-danger);
}

.warn {
  color: var(--crm-warning);
}

// ── Форма в модалке ───────────────────────────────────────────────────
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  &__label {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-secondary);
  }

  &__req {
    color: var(--crm-danger);
  }

  &__input {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-primary);
    font-size: var(--crm-text-md);
    font-family: var(--crm-font-sans);
    padding: 8px 12px;
    outline: none;
    transition: var(--crm-transition);
    width: 100%;
    color-scheme: dark;

    &::placeholder {
      color: var(--crm-text-disabled);
    }

    &:focus {
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px var(--crm-accent-dim);
    }

    &--error {
      border-color: var(--crm-danger);
    }

    &--textarea {
      resize: vertical;
      min-height: 60px;
    }

    option {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }

  &__error {
    font-size: var(--crm-text-xs);
    color: var(--crm-danger);
  }

  &--checkbox {
    flex-direction: row;
    align-items: center;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--crm-accent);
  cursor: pointer;
}

.checkbox-text {
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
}

// ── CRM кнопки ────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--crm-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  white-space: nowrap;

  padding: 8px 14px;
  font-size: var(--crm-text-sm);

  &--xs {
    padding: 5px 8px;
    font-size: var(--crm-text-xs);
  }

  &:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  &--income {
    background: var(--crm-success-dim);
    border: 1px solid rgba(61, 214, 140, .35);
    color: var(--crm-success);

    &:hover:not(:disabled) {
      background: rgba(61, 214, 140, .25);
    }
  }

  &--work {
    background: var(--crm-warning-dim);
    border: 1px solid rgba(245, 166, 35, .35);
    color: var(--crm-warning);

    &:hover:not(:disabled) {
      background: rgba(245, 166, 35, .25);
    }
  }

  &--ghost {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-primary);
    }
  }
}

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
</style>