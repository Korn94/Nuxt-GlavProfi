<!-- app\components\pages\cabinet\Contractors\ContractorCard.vue -->
<!-- Карточка контрагента -->
<template>
  <div :class="['contractor-card', `contractor-card--${type}`]">

    <!-- Основная информация -->
    <div class="contractor-card__head">
      <div class="contractor-card__left">
        <!-- Аватар с инициалами -->
        <div class="contractor-avatar">
          {{ getInitials(contractor.name) }}
        </div>

        <!-- Имя и роль -->
        <div class="contractor-info">
          <div class="contractor-info__name">{{ contractor.name }}</div>
          <div class="contractor-info__type">{{ getTypeLabel(type) }}</div>
        </div>
      </div>

      <!-- Действия -->
      <div class="contractor-card__right">
        <div class="contractor-card__actions">
          <NuxtLink :to="`/cabinet/contractors/${type}/${contractor.id}`" class="crm-btn crm-btn--sm crm-btn--ghost"
            title="Открыть">
            <Icon name="mdi:open-in-new" size="14" />
          </NuxtLink>
          <button class="crm-btn crm-btn--sm crm-btn--danger" @click="handleDelete" :disabled="deleting"
            title="Удалить">
            <Icon :name="deleting ? 'mdi:loading' : 'mdi:trash-outline'" size="14"
              :class="{ 'spin': deleting }" />
          </button>
        </div>
      </div>
    </div>

    <!-- Разделитель -->
    <div class="contractor-card__divider" />

    <!-- Деталли -->
    <div class="contractor-card__body">
      <!-- Баланс -->
      <div class="contractor-stat">
        <span class="contractor-stat__label">Баланс</span>
        <span :class="['contractor-stat__value', getBalanceClass(contractor.balance)]">
          {{ formatCurrency(contractor.balance) }}
        </span>
      </div>

      <!-- Телефон -->
      <div v-if="contractor.phone" class="contractor-stat">
        <span class="contractor-stat__label">Т��лефон</span>
        <a :href="`tel:${contractor.phone}`" class="contractor-stat__link">
          <Icon name="mdi:phone-outline" size="12" />
          {{ contractor.phone }}
        </a>
      </div>

      <!-- Комментарий -->
      <div v-if="contractor.comment" class="contractor-stat">
        <span class="contractor-stat__label">Заметка</span>
        <span class="contractor-stat__comment">{{ contractor.comment }}</span>
      </div>

      <!-- Пользователь -->
      <div v-if="contractor.user" class="contractor-stat">
        <span class="contractor-stat__label">Пользователь</span>
        <span class="contractor-stat__user">
          <Icon name="mdi:account-outline" size="12" />
          {{ contractor.user.name || contractor.user.login }}
        </span>
      </div>

      <!-- Дата создания -->
      <div class="contractor-stat contractor-stat--meta">
        <span class="contractor-stat__label">Создан</span>
        <span class="contractor-stat__date">{{ formatDate(contractor.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useContractors } from '~/composables/useContractors';
import type { ContractorType, ContractorDTO } from '~/types/contractors'

const props = defineProps<{
  contractor: ContractorDTO
  type: ContractorType
}>()

const emit = defineEmits<{
  'contractor-deleted': [id: number]
}>()

const { deleteContractor } = useContractors()
const deleting = ref(false)

// ── Вспомогательные функции ─────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('')
    .slice(0, 2)
}

function getTypeLabel(type: ContractorType): string {
  const labels: Record<ContractorType, string> = {
    master: 'Мастер',
    worker: 'Рабочий',
    foreman: 'Прораб',
    office: 'Офис'
  }
  return labels[type] || type
}

function getBalanceClass(balance: string | number): string {
  const num = parseFloat(String(balance))
  if (num > 0) return 'contractor-stat__value--positive'
  if (num < 0) return 'contractor-stat__value--negative'
  return 'contractor-stat__value--neutral'
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
      year: '2-digit'
    })
  } catch {
    return '—'
  }
}

// ── Обработчики событий ────────────────────────────────────────────
async function handleDelete() {
  if (!confirm(`Удалить контрагента "${props.contractor.name}"?`)) return
  
  deleting.value = true
  try {
    await deleteContractor(props.type, props.contractor.id)
    emit('contractor-deleted', props.contractor.id)
  } catch (error: any) {
    console.error('Ошибка удаления контрагента:', error)
    // Здесь можно добавить уведомление об ошибке
  } finally {
    deleting.value = false
  }
}
</script>

<style lang="scss" scoped>
.contractor-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;
  transition: var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
    background: var(--crm-bg-elevated);
  }

  // Цветовые акценты по типу
  &--master {
    border-left: 4px solid #f5a623;
  }

  &--worker {
    border-left: 4px solid #3dd68c;
  }

  &--foreman {
    border-left: 4px solid #5b8def;
  }

  &--office {
    border-left: 4px solid #00c3f5;
  }
}

// ── Заголовок ───────────────���───────────────────────────────────────
.contractor-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  gap: 12px;
}

.contractor-card__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.contractor-card__right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.contractor-card__actions {
  display: flex;
  gap: 6px;
}

// ── Аватар ──────────────────────────────────────────────────────────
.contractor-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8def 0%, #00c3f5 100%);
  color: #fff;
  font-size: var(--crm-text-md);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ── Информация ──────────────────────────────────────────────────────
.contractor-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  &__name {
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__type {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }
}

// ── Разделитель ─────────────────────────────────────────────────────
.contractor-card__divider {
  height: 1px;
  background: var(--crm-border);
}

// ── Тело карточки ───────────────────────────────────────────────────
.contractor-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
}

// ── Строка статистики ───────────────────────────────────────────────
.contractor-stat {
  display: flex;
  align-items: baseline;
  gap: 8px;

  &--meta {
    opacity: 0.7;
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    flex-shrink: 0;
    min-width: 60px;
  }

  &__value {
    font-size: var(--crm-text-md);
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

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--crm-text-sm);
    color: var(--crm-accent);
    text-decoration: none;
    transition: var(--crm-transition);

    &:hover {
      color: var(--crm-accent-hover);
      text-decoration: underline;
    }
  }

  &__comment {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    font-style: italic;
    word-break: break-word;
  }

  &__user {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    background: var(--crm-bg-elevated);
    padding: 2px 6px;
    border-radius: var(--crm-radius-sm);
  }

  &__date {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
    font-family: var(--crm-font-mono);
  }
}

// ── Кнопки ──────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  border: 1px solid transparent;

  &--sm {
    padding: 5px 9px;
    font-size: var(--crm-text-xs);
  }

  &--ghost {
    background: transparent;
    border: 1px solid var(--crm-border);
    color: var(--crm-text-secondary);

    &:hover:not(:disabled) {
      background: var(--crm-bg-elevated);
      border-color: var(--crm-border-hover);
      color: var(--crm-text-primary);
    }
  }

  &--danger {
    background: transparent;
    border: 1px solid rgba(242, 95, 92, 0.3);
    color: var(--crm-danger);

    &:hover:not(:disabled) {
      background: var(--crm-danger-dim);
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

// ── Responsive ──────────────────────────────────────────────────────
@media (max-width: 600px) {
  .contractor-card__head {
    padding: 12px 14px;
  }

  .contractor-info__name {
    font-size: var(--crm-text-sm);
  }

  .contractor-card__body {
    padding: 10px 14px;
    gap: 8px;
  }
}
</style>