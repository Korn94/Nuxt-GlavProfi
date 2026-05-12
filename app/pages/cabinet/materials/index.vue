<!-- app/pages/cabinet/materials.vue -->
<template>
  <div class="materials-page">

    <!-- Заголовок -->
    <PagesCabinetUiLayoutPageTitle title="Материалы" icon="mdi:receipt-text-outline">
      <template #actions>
        <button class="crm-btn crm-btn--income" @click="openModal('incoming')">
          <Icon name="mdi:plus" size="15" />
          Приход
        </button>
        <button class="crm-btn crm-btn--expense" @click="openModal('outgoing')">
          <Icon name="mdi:minus" size="15" />
          Расход
        </button>
      </template>
    </PagesCabinetUiLayoutPageTitle>

    <div class="materials-page__content">

      <!-- Фильтры -->
      <div class="filters">
        <div class="filters__row">

          <!-- Объект -->
          <div class="filter-field">
            <label class="filter-field__label">Объект</label>
            <select class="filter-field__input" v-model="filterObjectId" @change="applyFilters">
              <option value="">Все объекты</option>
              <option v-for="obj in objects" :key="obj.id" :value="obj.id">
                {{ obj.name }}{{ obj.address ? ` (${obj.address})` : '' }}
              </option>
            </select>
          </div>

          <!-- Тип -->
          <div class="filter-field">
            <label class="filter-field__label">Тип</label>
            <select class="filter-field__input" v-model="filterType" @change="applyFilters">
              <option value="">Все</option>
              <option value="incoming">Приход</option>
              <option value="outgoing">Расход</option>
            </select>
          </div>

          <!-- Чек -->
          <div class="filter-field">
            <label class="filter-field__label">Чек</label>
            <select class="filter-field__input" v-model="filterHasReceipt" @change="applyFilters">
              <option value="">Все</option>
              <option value="true">Есть чек</option>
              <option value="false">Нет чека</option>
            </select>
          </div>

          <!-- Дата -->
          <div class="filter-field">
            <label class="filter-field__label">С</label>
            <input type="date" class="filter-field__input" v-model="startDate" :max="endDate || ''"
              @change="applyFilters" />
          </div>
          <div class="filter-field">
            <label class="filter-field__label">По</label>
            <input type="date" class="filter-field__input" v-model="endDate" :min="startDate || ''"
              @change="applyFilters" />
          </div>
          <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="clearDateFilter">
            <Icon name="mdi:close" size="13" /> Даты
          </button>

        </div>

        <div class="filters__row">
          <!-- Сумма от/до -->
          <div class="filter-field">
            <label class="filter-field__label">Сумма от</label>
            <input type="number" class="filter-field__input filter-field__input--sm" v-model.number="minAmount"
              @change="applyFilters" placeholder="0" />
          </div>
          <div class="filter-field">
            <label class="filter-field__label">Сумма до</label>
            <input type="number" class="filter-field__input filter-field__input--sm" v-model.number="maxAmount"
              @change="applyFilters" placeholder="∞" />
          </div>
          <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="clearAmountFilter">
            <Icon name="mdi:close" size="13" /> Сумма
          </button>

          <div class="filter-field">
            <label class="filter-field__label">Начинается с</label>
            <input type="text" class="filter-field__input filter-field__input--sm" v-model="amountPrefix"
              @input="applyFilters" placeholder="15..." />
          </div>
          <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="clearAmountPrefixFilter">
            <Icon name="mdi:close" size="13" /> Префикс
          </button>
        </div>
      </div>

      <!-- Таблица -->
      <div class="mat-card">

        <!-- Заголовок таблицы -->
        <div class="mat-card__header">
          <div class="mat-card__title">
            Материалы
            <span class="badge">{{ filteredMaterials.length }}</span>
            <span v-if="materialsWithoutReceipt > 0" class="badge badge--warn">
              Без чека: {{ materialsWithoutReceipt }}
            </span>
          </div>
        </div>

        <!-- Таблица -->
        <div class="mat-table-wrap">
          <table class="mat-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Объект</th>
                <th>Название</th>
                <th>Сумма</th>
                <th>Тип</th>
                <th>Чек</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="material in filteredMaterials" :key="material.id" class="mat-row"
                :class="`mat-row--${material.type}`">
                <td class="mat-td mat-td--date">{{ formatDate(material.operationDate) }}</td>
                <td class="mat-td">
                  <NuxtLink :to="`/cabinet/objects/${material.objectId}`" class="mat-link">
                    {{ getObjectById(material.objectId)?.name || '—' }}
                  </NuxtLink>
                </td>
                <td class="mat-td">{{ material.name }}</td>
                <td class="mat-td mat-td--amount"
                  :class="material.type === 'incoming' ? 'mat-td--income' : 'mat-td--expense'">
                  {{ material.type === 'incoming' ? '+' : '−' }}{{ formatAmount(material.amount) }} ₽
                </td>
                <td class="mat-td">
                  <span :class="['mat-type-badge', `mat-type-badge--${material.type}`]">
                    {{ material.type === 'incoming' ? 'Приход' : 'Расход' }}
                  </span>
                </td>
                <td class="mat-td mat-td--center">
                  <button class="receipt-btn" :class="{
                    'receipt-btn--checked': material.hasReceipt,
                    'receipt-btn--disabled': !canToggleReceipt(material)
                  }" :disabled="!canToggleReceipt(material)" @click="toggleCheck(material)"
                    :title="material.hasReceipt ? 'Чек есть' : 'Отметить чек'">
                    <Icon :name="material.hasReceipt ? 'mdi:check-circle' : 'mdi:circle-outline'" size="18" />
                  </button>
                </td>
                <td class="mat-td mat-td--actions">
                  <button class="action-btn" @click="editMaterial(material)" title="Редактировать">
                    <Icon name="mdi:pencil-outline" size="15" />
                  </button>
                  <button class="action-btn action-btn--danger" @click="deleteMaterial(material.id)" title="Удалить">
                    <Icon name="mdi:trash-can-outline" size="15" />
                  </button>
                </td>
              </tr>

              <!-- Пусто -->
              <tr v-if="!filteredMaterials.length">
                <td colspan="7" class="mat-empty">
                  <Icon name="mdi:receipt-text-outline" size="28" />
                  <span>Нет материалов за выбранный период</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Модальное окно -->
    <PagesCabinetUiModal :visible="isModalOpen" @update:visible="closeModal"
      :title="isEditing ? 'Редактировать материал' : modalType === 'incoming' ? 'Добавить приход' : 'Добавить расход'"
      size="md" closable>
      <div class="mat-form">

        <div class="field">
          <label class="field__label">Объект <span class="field__req">*</span></label>
          <select class="field__input" :class="{ 'field__input--error': formErrors.objectId }"
            v-model="currentMaterial.objectId">
            <option value="">— Выберите объект —</option>
            <option v-for="obj in objects" :key="obj.id" :value="obj.id">
              {{ obj.name }}{{ obj.address ? ` (${obj.address})` : '' }}
            </option>
          </select>
          <span v-if="formErrors.objectId" class="field__error">{{ formErrors.objectId }}</span>
        </div>

        <div class="field">
          <label class="field__label">Название <span class="field__req">*</span></label>
          <input type="text" class="field__input" :class="{ 'field__input--error': formErrors.name }"
            v-model="currentMaterial.name" placeholder="Название материала" />
          <span v-if="formErrors.name" class="field__error">{{ formErrors.name }}</span>
        </div>

        <div class="field">
          <label class="field__label">Сумма <span class="field__req">*</span></label>
          <input type="number" step="100" class="field__input" :class="{ 'field__input--error': formErrors.amount }"
            v-model.number="currentMaterial.amount" placeholder="0" />
          <span v-if="formErrors.amount" class="field__error">{{ formErrors.amount }}</span>
        </div>

        <div class="field">
          <label class="field__label">Дата операции <span class="field__req">*</span></label>
          <input type="date" class="field__input" :class="{ 'field__input--error': formErrors.operationDate }"
            v-model="currentMaterial.operationDate" />
          <span v-if="formErrors.operationDate" class="field__error">{{ formErrors.operationDate }}</span>
        </div>

        <div class="field">
          <label class="field__label">Комментарий</label>
          <textarea class="field__input field__input--textarea" v-model="currentMaterial.comment"
            placeholder="Дополнительная информация..." rows="2" />
        </div>

        <div v-if="currentMaterial.type === 'outgoing'" class="field field--checkbox">
          <label class="checkbox-label">
            <input type="checkbox" v-model="currentMaterial.hasReceipt" class="checkbox-input" />
            <span class="checkbox-text">Есть чек</span>
          </label>
        </div>

      </div>

      <template #footer>
        <button class="crm-btn crm-btn--ghost" @click="closeModal">Отмена</button>
        <button class="crm-btn crm-btn--accent" :disabled="!isFormValid" @click="saveMaterial">
          {{ isEditing ? 'Сохранить' : 'Добавить' }}
        </button>
      </template>
    </PagesCabinetUiModal>

  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'
import { useHead } from 'nuxt/app'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useApi } from '~/composables/useApi'

const api = useApi()

// ── Состояние ───────────────────────────────────────────────────────
const isModalOpen = ref(false)
const modalType = ref < 'incoming' | 'outgoing' > ('incoming')
const isEditing = ref(false)

const materials = ref < any[] > ([])
const objects = ref < any[] > ([])

const currentMaterial = ref({
  id: null as number | null,
  name: '',
  amount: 0,
  comment: '',
  hasReceipt: false,
  objectId: null as number | null,
  type: 'incoming' as 'incoming' | 'outgoing',
  operationDate: new Date().toISOString().split('T')[0],
})

// ── Фильтры ─────────────────────────────────────────────────────────
const filterObjectId = ref('')
const filterType = ref('')
const filterHasReceipt = ref('')
const startDate = ref('')
const endDate = ref('')
const minAmount = ref < number | null > (null)
const maxAmount = ref < number | null > (null)
const amountPrefix = ref('')

const formErrors = ref < Record < string, string>> ({})

// ── Computed ────────────────────────────────────────────────────────
const isFormValid = computed(() =>
  currentMaterial.value.name.trim() !== '' &&
  Number(currentMaterial.value.amount) > 0 &&
  !!currentMaterial.value.objectId
)

const filteredMaterials = computed(() => {
  let list = [...materials.value]
  if (filterObjectId.value) list = list.filter(m => m.objectId == filterObjectId.value)
  if (filterType.value) list = list.filter(m => m.type === filterType.value)
  if (filterHasReceipt.value !== '') list = list.filter(m => m.hasReceipt === (filterHasReceipt.value === 'true'))
  if (startDate.value) list = list.filter(m => new Date(m.operationDate) >= new Date(startDate.value))
  if (endDate.value) list = list.filter(m => new Date(m.operationDate) <= new Date(endDate.value))
  if (minAmount.value !== null && minAmount.value !== 0) list = list.filter(m => m.amount >= (minAmount.value ?? 0))
  if (maxAmount.value !== null) list = list.filter(m => m.amount <= (maxAmount.value ?? Infinity))
  if (amountPrefix.value.trim()) {
    const prefix = amountPrefix.value.trim()
    list = list.filter(m => String(m.amount).startsWith(prefix))
  }
  return list.sort((a, b) => new Date(b.operationDate).getTime() - new Date(a.operationDate).getTime())
})

const materialsWithoutReceipt = computed(() =>
  filteredMaterials.value.filter(m => m.type === 'outgoing' && !m.hasReceipt).length
)

// ── Вспомогательные ─────────────────────────────────────────────────
const getObjectById = (id: number) => objects.value.find(o => o.id == id)

const formatAmount = (amount: number) => Number(amount).toLocaleString('ru-RU')

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  })
}

const canToggleReceipt = (material: any) =>
  material.type === 'outgoing' && !material.hasReceipt

// ── Загрузка ────────────────────────────────────────────────────────
async function fetchMaterials() {
  try {
    const params: Record<string, any> = {}
    if (filterObjectId.value) params.objectId = filterObjectId.value
    if (filterType.value) params.type = filterType.value
    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value
    if (minAmount.value) params.minAmount = minAmount.value
    if (maxAmount.value) params.maxAmount = maxAmount.value
    if (amountPrefix.value.trim()) params.amountPrefix = amountPrefix.value.trim()

    const data = await api.get<any[]>('/api/materials', { params })
    materials.value = (data || []).map(m => ({ ...m, amount: Number(m.amount) }))
  } catch (e) {
    console.error('[Материалы] Ошибка загрузки:', e)
  }
}

async function fetchObjects() {
  try {
    objects.value = await api.get<any[]>('/api/objects') || []
  } catch (e) {
    console.error('[Материалы] Ошибка загрузки объектов:', e)
  }
}

// ── CRUD ────────────────────────────────────────────────────────────
async function saveMaterial() {
  formErrors.value = {}
  if (!currentMaterial.value.name.trim()) formErrors.value.name = 'Название обязательно'
  if (Number(currentMaterial.value.amount) <= 0) formErrors.value.amount = 'Сумма должна быть больше нуля'
  if (!currentMaterial.value.operationDate) formErrors.value.operationDate = 'Дата обязательна'
  if (!currentMaterial.value.objectId) formErrors.value.objectId = 'Объект обязателен'
  if (Object.keys(formErrors.value).length) return

  try {
    if (isEditing.value) {
      await api.put(`/api/materials/${currentMaterial.value.id}`, currentMaterial.value)
    } else {
      const created = await api.post<any>('/api/materials', currentMaterial.value)
      materials.value.push(created)
    }
    closeModal()
    fetchMaterials()
  } catch (e) {
    console.error('[Материалы] Ошибка сохранения:', e)
  }
}

function editMaterial(material: any) {
  const date = new Date(material.operationDate)
  currentMaterial.value = {
    ...material,
    operationDate: isNaN(date.getTime())
      ? new Date().toISOString().split('T')[0]
      : date.toISOString().split('T')[0],
  }
  isEditing.value = true
  openModal(material.type)
}

async function deleteMaterial(id: number) {
  if (!confirm('Удалить этот материал?')) return
  try {
    await api.delete(`/api/materials/${id}`)
    materials.value = materials.value.filter(m => m.id !== id)
  } catch (e) {
    console.error('[Материалы] Ошибка удаления:', e)
  }
}

async function toggleCheck(material: any) {
  if (material.hasReceipt) return
  try {
    await api.patch(`/api/materials/${material.id}/toggle-check`, { hasReceipt: true })
    const idx = materials.value.findIndex(m => m.id === material.id)
    if (idx !== -1) materials.value[idx].hasReceipt = true
  } catch (e) {
    console.error('[Материалы] Ошибка переключения чека:', e)
  }
}

// ── Фильтры ─────────────────────────────────────────────────────────
function applyFilters() { fetchMaterials() }

function clearDateFilter() {
  startDate.value = ''
  endDate.value = ''
  fetchMaterials()
}

function clearAmountFilter() {
  minAmount.value = null
  maxAmount.value = null
  fetchMaterials()
}

function clearAmountPrefixFilter() {
  amountPrefix.value = ''
  fetchMaterials()
}

// ── Модалка ─────────────────────────────────────────────────────────
function openModal(type: 'incoming' | 'outgoing') {
  modalType.value = type
  if (!isEditing.value) resetForm()
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  nextTick(resetForm)
}

function resetForm() {
  currentMaterial.value = {
    id: null, name: '', amount: 0, comment: '',
    hasReceipt: false, objectId: null,
    type: modalType.value,
    operationDate: new Date().toISOString().split('T')[0],
  }
  isEditing.value = false
  formErrors.value = {}
}

// ── Lifecycle ────────────────────────────────────────────────────────
onMounted(() => Promise.all([fetchMaterials(), fetchObjects()]))

// ── Мета ─────────────────────────────────────────────────────────────
definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})

useHead({ title: 'CRM — Материалы', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>

<style lang="scss" scoped>
.materials-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  &__content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px 24px;
  }
}

// ── Фильтры ─────────────────────────────────────────────────────────
.filters {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__row {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 10px;
  }
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
  }

  &__input {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-primary);
    font-size: var(--crm-text-sm);
    font-family: var(--crm-font-sans);
    padding: 6px 10px;
    outline: none;
    transition: var(--crm-transition);
    color-scheme: dark;

    &:focus {
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px var(--crm-accent-dim);
    }

    &--sm {
      width: 110px;
    }

    option {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }
}

// ── Карточка таблицы ────────────────────────────────────────────────
.mat-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--crm-border);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
  }
}

// ── Бейджи ──────────────────────────────────────────────────────────
.badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border-hover);
  border-radius: 10px;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  color: var(--crm-text-muted);

  &--warn {
    background: var(--crm-warning-dim);
    border-color: rgba(245, 166, 35, 0.3);
    color: var(--crm-warning);
  }
}

// ── Таблица ─────────────────────────────────────────────────────────
.mat-table-wrap {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--crm-bg-overlay) transparent;
}

.mat-table {
  width: 100%;
  border-collapse: collapse;

  th {
    padding: 10px 14px;
    background: var(--crm-bg-elevated);
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
    text-transform: uppercase;
    letter-spacing: .05em;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--crm-border);
  }
}

.mat-row {
  transition: var(--crm-transition);
  border-bottom: 1px solid var(--crm-border);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--crm-bg-elevated);
  }

  // Левая полоска по типу
  &--incoming td:first-child {
    border-left: 3px solid var(--crm-success);
  }

  &--outgoing td:first-child {
    border-left: 3px solid var(--crm-danger);
  }
}

.mat-td {
  padding: 10px 14px;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
  white-space: nowrap;

  &--date {
    color: var(--crm-text-muted);
    font-size: var(--crm-text-xs);
  }

  &--amount {
    font-weight: 700;
  }

  &--income {
    color: var(--crm-success);
  }

  &--expense {
    color: var(--crm-danger);
  }

  &--center {
    text-align: center;
  }

  &--actions {
    display: flex;
    gap: 6px;
    align-items: center;
  }
}

.mat-link {
  color: var(--crm-accent);
  text-decoration: none;
  font-size: var(--crm-text-sm);
  transition: var(--crm-transition);

  &:hover {
    text-decoration: underline;
  }
}

// ── Тип-бейдж ───────────────────────────────────────────────────────
.mat-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  font-weight: 600;

  &--incoming {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--outgoing {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }
}

// ── Кнопка чека ─────────────────────────────────────────────────────
.receipt-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--crm-text-muted);
  transition: var(--crm-transition);
  padding: 2px;

  &--checked {
    color: var(--crm-success);
  }

  &--disabled {
    cursor: not-allowed;
    opacity: .5;
  }

  &:not(.receipt-btn--checked):not(.receipt-btn--disabled):hover {
    color: var(--crm-success);
  }
}

// ── Кнопки действий ─────────────────────────────────────────────────
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-muted);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
    border-color: var(--crm-border-hover);
    color: var(--crm-text-primary);
  }

  &--danger:hover {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);
    color: var(--crm-danger);
  }
}

// ── Пустое состояние ─────────────────────────────────────────────────
.mat-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

// ── Форма модалки ────────────────────────────────────────────────────
.mat-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

      &:focus {
        box-shadow: 0 0 0 3px var(--crm-danger-dim);
      }
    }

    &--textarea {
      resize: vertical;
      min-height: 64px;
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

// ── Кнопки ──────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--crm-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  white-space: nowrap;

  &--sm {
    padding: 5px 10px;
    font-size: var(--crm-text-sm);
  }

  padding: 7px 14px;
  font-size: var(--crm-text-sm);

  &--income {
    background: var(--crm-success-dim);
    border: 1px solid rgba(61, 214, 140, 0.35);
    color: var(--crm-success);

    &:hover {
      background: rgba(61, 214, 140, 0.25);
    }
  }

  &--expense {
    background: var(--crm-danger-dim);
    border: 1px solid rgba(242, 95, 92, 0.35);
    color: var(--crm-danger);

    &:hover {
      background: rgba(242, 95, 92, 0.25);
    }
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

  &--accent {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover:not(:disabled) {
      background: rgba(0, 195, 245, 0.25);
    }

    &:disabled {
      opacity: .45;
      cursor: not-allowed;
    }
  }
}

@media (max-width: 767.98px) {
  .materials-page__content {
    padding: 16px;
  }
}
</style>