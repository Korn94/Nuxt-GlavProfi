<!-- app/pages/cabinet/contractors/[type]/[id].vue -->
 <!-- Страница контрагента -->
<template>
  <div class="contractor-detail">

    <!-- Заголовок с кнопками -->
    <div class="contractor-detail__header">
      <div class="contractor-detail__back">
        <NuxtLink :to="`/cabinet/contractors`" class="crm-btn crm-btn--ghost crm-btn--sm">
          <Icon name="mdi:chevron-left" size="16" />
          Назад
        </NuxtLink>
      </div>

      <div class="contractor-detail__actions">
        <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="editMode = !editMode">
          <Icon :name="editMode ? 'mdi:close' : 'mdi:pencil'" size="15" />
          {{ editMode ? 'Отмена' : 'Редактировать' }}
        </button>
        <button class="crm-btn crm-btn--danger crm-btn--sm" @click="handleDelete" :disabled="deleting">
          <Icon :name="deleting ? 'mdi:loading' : 'mdi:trash-outline'" size="15" :class="{ spin: deleting }" />
          Удалить
        </button>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="contractor-detail__skeleton">
      <div class="skel skel--avatar" />
      <div class="skel skel--title" />
      <div class="skel skel--text" />
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="contractor-detail__error">
      <Icon name="mdi:alert-circle-outline" size="32" />
      <span>{{ error }}</span>
      <button class="crm-btn crm-btn--sm crm-btn--ghost" @click="loadContractor">
        <Icon name="mdi:refresh" size="13" />
        Повторить
      </button>
    </div>

    <!-- Контент -->
    <div v-else-if="contractor" class="contractor-detail__content">

      <!-- Основная информация -->
      <div class="contractor-detail__card">
        <div class="contractor-header">
          <div class="contractor-header__left">
            <div class="contractor-avatar-large">
              {{ getInitials(contractor.name) }}
            </div>
            <div class="contractor-header__info">
              <h1 class="contractor-header__title">{{ contractor.name }}</h1>
              <div class="contractor-header__meta">
                <span class="contractor-type-badge" :class="`contractor-type-badge--${type}`">
                  {{ typeLabel }}
                </span>
                <span class="contractor-status">
                  <Icon name="mdi:calendar-outline" size="12" />
                  {{ formatDate(contractor.createdAt) }}
                </span>
              </div>
            </div>
          </div>

          <div class="contractor-header__balance">
            <span class="contractor-balance__label">Баланс</span>
            <span :class="['contractor-balance__value', getBalanceClass(contractor.balance)]">
              {{ formatCurrency(contractor.balance) }}
            </span>
          </div>
        </div>

        <!-- Режим редактирования или просмотра -->
        <div class="contractor-detail__divider" />

        <div v-if="editMode" class="contractor-detail__form">
          <PagesCabinetContractorsContractorForm 
            ref="formRef"
            :contractor="contractor"
            :type="type"
            :show-user-select="true"
            @update:form="formData = $event"
          />
          <div class="contractor-detail__form-actions">
            <button class="crm-btn crm-btn--ghost" @click="editMode = false">
              Отмена
            </button>
            <button class="crm-btn crm-btn--accent" @click="handleSave" :disabled="saving">
              <Icon v-if="saving" name="mdi:loading" class="spin" size="14" />
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </div>

        <div v-else class="contractor-detail__info">
          <!-- Телефон -->
          <div v-if="contractor.phone" class="contractor-info-row">
            <span class="contractor-info-row__label">
              <Icon name="mdi:phone-outline" size="14" />
              Телефон
            </span>
            <a :href="`tel:${contractor.phone}`" class="contractor-info-row__value contractor-info-row__value--link">
              {{ contractor.phone }}
            </a>
          </div>

          <!-- Пользователь -->
          <div v-if="contractor.user" class="contractor-info-row">
            <span class="contractor-info-row__label">
              <Icon name="mdi:account-outline" size="14" />
              Пользователь
            </span>
            <span class="contractor-info-row__value">
              {{ contractor.user.name || contractor.user.login }}
              <span class="contractor-info-row__sub">({{ contractor.user.role }})</span>
            </span>
          </div>

          <!-- Комментарий -->
          <div v-if="contractor.comment" class="contractor-info-row">
            <span class="contractor-info-row__label">
              <Icon name="mdi:comment-outline" size="14" />
              Заметка
            </span>
            <span class="contractor-info-row__value">{{ contractor.comment }}</span>
          </div>

          <!-- Даты -->
          <div class="contractor-info-row contractor-info-row--meta">
            <span class="contractor-info-row__label">
              <Icon name="mdi:calendar-outline" size="14" />
              Дата создания
            </span>
            <span class="contractor-info-row__value">{{ formatDate(contractor.createdAt) }}</span>
          </div>

          <div class="contractor-info-row contractor-info-row--meta">
            <span class="contractor-info-row__label">
              <Icon name="mdi:pencil-outline" size="14" />
              Последнее изменение
            </span>
            <span class="contractor-info-row__value">{{ formatDate(contractor.updatedAt) }}</span>
          </div>
        </div>
      </div>

    </div>

    <PagesCabinetContractorsContractorOperations 
      :contractor-id="id"
      :contractor-type="type"
    />
  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'
import { createError, useRoute, useRouter } from 'nuxt/app'
import { ref, computed, onMounted } from 'vue'
import { useContractors } from '~/composables/useContractors'
import type { ContractorType, ContractorDTO } from '~/types/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'

// ── Meta ───────────────────────────────────────────────────────────
definePageMeta({
  layout: 'cabinet',
  middleware: ['require-auth']
})

// ── Router ─────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()

const type = computed(() => route.params.type as ContractorType)
const id = computed(() => parseInt(route.params.id as string))

// Валидация
if (!CONTRACTOR_TYPES.includes(type.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Тип контрагента не найден' })
}

// ── State ──────────────────────────────────────────────────────────
const { getById, fetchOne, update, deleteContractor } = useContractors()
const contractor = ref<ContractorDTO | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const editMode = ref(false)
const saving = ref(false)
const deleting = ref(false)
const formData = ref<any>(null)
const formRef = ref<any>(null)

// ── Computed ───────────────────────────────────────────────────────
const currentContractor = computed(() => getById(type.value, id.value) || contractor.value)

// ── Вспомогательные функции ────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('')
    .slice(0, 2)
}

const typeLabel = computed(() => {
  const labels: Record<ContractorType, string> = {
    master: 'Мастер',
    worker: 'Рабочий',
    foreman: 'Прораб',
    office: 'Офис'
  }
  return labels[type.value] || type.value
})

function getBalanceClass(balance: string | number): string {
  const num = parseFloat(String(balance))
  if (num > 0) return 'contractor-balance__value--positive'
  if (num < 0) return 'contractor-balance__value--negative'
  return 'contractor-balance__value--neutral'
}

function formatCurrency(amount: string | number): string {
  return (parseFloat(String(amount)) || 0).toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '—'
  }
}

// ── Обработчики ───────────────────────────────────────────────────
async function loadContractor() {
  if (!id.value) return
  
  loading.value = true
  error.value = null

  try {
    const result = await fetchOne(type.value, id.value)
    contractor.value = result
  } catch (err: any) {
    error.value = err?.message || 'Ошибка загрузки контрагента'
    console.error('[ContractorDetail] Ошибка:', err)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!formRef.value || !formRef.value.validate() || !contractor.value) return

  saving.value = true
  try {
    const result = await update(type.value, contractor.value.id, formData.value)
    contractor.value = result
    editMode.value = false
  } catch (error: any) {
    console.error('[ContractorDetail] Ошибка сохранения:', error)
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!contractor.value || !confirm(`Удалить контрагента "${contractor.value.name}"?`)) return

  deleting.value = true
  try {
    await deleteContractor(type.value, contractor.value.id)
    router.push(`/cabinet/contractors/${type.value}`)
  } catch (error: any) {
    console.error('[ContractorDetail] Ошибка удаления:', error)
  } finally {
    deleting.value = false
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(() => {
  loadContractor()
})
</script>

<style lang="scss" scoped>
.contractor-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  min-height: 100vh;
}

// ── Заголовок ────────────────────────────────────────────���─────────
.contractor-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.contractor-detail__actions {
  display: flex;
  gap: 6px;
}

// ── Карточка ───────────────────────────────────────────────────────
.contractor-detail__card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;
}

.contractor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  gap: 20px;

  @media (max-width: 700px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.contractor-header__left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.contractor-avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8def 0%, #00c3f5 100%);
  color: #fff;
  font-size: var(--crm-text-xl);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contractor-header__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.contractor-header__title {
  font-size: var(--crm-text-lg);
  font-weight: 700;
  color: var(--crm-text-primary);
  margin: 0;
  word-break: break-word;
}

.contractor-header__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.contractor-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-xs);
  font-weight: 600;

  &--master {
    background: rgba(245, 166, 35, .15);
    color: #f5a623;
  }

  &--worker {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--foreman {
    background: var(--crm-info-dim);
    color: var(--crm-info);
  }

  &--office {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }
}

.contractor-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
}

.contractor-header__balance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  text-align: right;

  @media (max-width: 700px) {
    align-items: flex-start;
    text-align: left;
  }
}

.contractor-balance__label {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
}

.contractor-balance__value {
  font-size: var(--crm-text-xl);
  font-weight: 700;
  font-family: var(--crm-font-mono);

  &--positive {
    color: var(--crm-success);
  }

  &--negative {
    color: var(--crm-danger);
  }

  &--neutral {
    color: var(--crm-text-primary);
  }
}

// ── Разделитель ────────────────────────────────────────────────────
.contractor-detail__divider {
  height: 1px;
  background: var(--crm-border);
}

// ── Форма редактирования ───────────────────────────────────────────
.contractor-detail__form {
  padding: 20px;
}

.contractor-detail__form-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--crm-border);
  margin-top: 16px;
}

// ── Информация ────────────────────────────────���────────────────────
.contractor-detail__info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
}

.contractor-info-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--crm-border);

  &:last-child {
    border-bottom: none;
  }

  &--meta {
    opacity: 0.7;
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
    flex-shrink: 0;
    min-width: 140px;
  }

  &__value {
    font-size: var(--crm-text-md);
    color: var(--crm-text-primary);
    word-break: break-word;

    &--link {
      color: var(--crm-accent);
      text-decoration: none;
      transition: var(--crm-transition);

      &:hover {
        text-decoration: underline;
      }
    }
  }

  &__sub {
    display: block;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    margin-top: 2px;
  }
}

// ── Ошибка ────────────────────────────────────────────────────────
.contractor-detail__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  color: var(--crm-danger);
  text-align: center;
}

// ── Скелетон ───────────────────────────────────────────────────────
.contractor-detail__skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
}

.skel {
  border-radius: var(--crm-radius-md);
  background: linear-gradient(90deg,
      var(--crm-bg-elevated) 25%,
      var(--crm-bg-overlay) 50%,
      var(--crm-bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;

  &--avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
  }

  &--title {
    height: 28px;
    width: 40%;
  }

  &--text {
    height: 16px;
    width: 60%;
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

// ── Кнопки ───────────��────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--crm-transition);
  border: none;
  white-space: nowrap;

  &--sm {
    padding: 6px 12px;
    font-size: var(--crm-text-xs);
  }

  &--ghost {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover:not(:disabled) {
      background: var(--crm-bg-overlay);
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
  }

  &--danger {
    background: var(--crm-danger-dim);
    border: 1px solid rgba(242, 95, 92, 0.35);
    color: var(--crm-danger);

    &:hover:not(:disabled) {
      background: rgba(242, 95, 92, 0.25);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 700px) {
  .contractor-detail {
    padding: 16px;
  }

  .contractor-header {
    padding: 16px;
  }

  .contractor-detail__info {
    padding: 16px;
  }
}
</style>