<!-- app/components/pages/cabinet/settings/permissions/shared/AuditInfo.vue -->
<template>
  <div :class="['audit-info', `audit-info--${variant}`]">
    <!-- Иконка слева -->
    <Icon :name="iconName" size="14" class="audit-icon" />

    <!-- Основной контент -->
    <div class="audit-content">
      <!-- Строка создания -->
      <div class="audit-row">
        <span class="audit-label">Создано</span>
        <span class="audit-value">
          {{ formatDate(createdAt) }}
          <template v-if="createdByName">
            · <span class="audit-actor">{{ createdByName }}</span>
          </template>
          <template v-else-if="createdById">
            · <span class="audit-actor">администратор #{{ createdById }}</span>
          </template>
        </span>
      </div>

      <!-- Строка обновления (если отличается от создания) -->
      <div
        v-if="updatedAt && updatedAt !== createdAt"
        class="audit-row audit-row--updated"
      >
        <span class="audit-label">Обновлено</span>
        <span class="audit-value">
          {{ formatDate(updatedAt) }}
          <template v-if="updatedByName">
            · <span class="audit-actor">{{ updatedByName }}</span>
          </template>
          <template v-else-if="updatedById">
            · <span class="audit-actor">администратор #{{ updatedById }}</span>
          </template>
        </span>
      </div>

      <!-- Время до истечения (если есть expiresAt) -->
      <div
        v-if="expiresAt"
        :class="['audit-row', 'audit-row--expires', `audit-row--${expiresStatus}`]"
      >
        <span class="audit-label">Истекает</span>
        <span class="audit-value">
          <Icon :name="expiresIcon" size="12" />
          {{ expiresLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ============================================
// ПРОПСЫ
// ============================================
const props = withDefaults(defineProps<{
  /** Дата создания (ISO string) */
  createdAt?: string | null
  /** Дата обновления (ISO string) */
  updatedAt?: string | null
  /** ID создателя */
  createdById?: number | null
  /** Имя создателя (если известно) */
  createdByName?: string | null
  /** ID последнего обновившего */
  updatedById?: number | null
  /** Имя последнего обновившего (если известно) */
  updatedByName?: string | null
  /** Дата истечения (для override'ов) */
  expiresAt?: string | null
  /** Визуальный вариант: 'default' | 'compact' | 'inline' */
  variant?: 'default' | 'compact' | 'inline'
  /** Кастомная иконка (иначе подбирается автоматически) */
  icon?: string | null
}>(), {
  variant: 'default',
})

// ============================================
// COMPUTED: ИКОНКА
// ============================================
const iconName = computed(() => {
  if (props.icon) return props.icon
  if (props.expiresAt) return 'mdi:clock-outline'
  if (props.updatedAt && props.updatedAt !== props.createdAt) return 'mdi:history'
  return 'mdi:account-clock-outline'
})

// ============================================
// COMPUTED: СРОК ДЕЙСТВИЯ
// ============================================
type ExpiresStatus = 'expired' | 'expiring' | 'active' | 'permanent'

const expiresStatus = computed<ExpiresStatus>(() => {
  if (!props.expiresAt) return 'permanent'
  const now = Date.now()
  const expires = new Date(props.expiresAt).getTime()
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

  if (expires <= now) return 'expired'
  if (expires - now <= TWENTY_FOUR_HOURS) return 'expiring'
  return 'active'
})

const expiresIcon = computed(() => {
  switch (expiresStatus.value) {
    case 'expired': return 'mdi:alert-circle'
    case 'expiring': return 'mdi:clock-alert'
    case 'active': return 'mdi:clock-outline'
    default: return 'mdi:infinity'
  }
})

const expiresLabel = computed(() => {
  if (!props.expiresAt) return 'бессрочно'
  const formatted = formatDate(props.expiresAt)
  switch (expiresStatus.value) {
    case 'expired': return `просрочено (${formatted})`
    case 'expiring': return `скоро (${formatted})`
    case 'active': return formatted
    default: return 'бессрочно'
  }
})

// ============================================
// МЕТОДЫ
// ============================================
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style lang="scss" scoped>
.audit-info {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: var(--crm-bg-elevated);
  border: 1px dashed var(--crm-border);
  border-radius: var(--crm-radius-sm);

  &--compact {
    padding: 0.375rem 0.625rem;
    gap: 0.375rem;

    .audit-row {
      font-size: 0.6875rem;
    }
  }

  &--inline {
    padding: 0;
    background: transparent;
    border: none;
    gap: 0.375rem;

    .audit-icon {
      margin-top: 1px;
    }

    .audit-content {
      gap: 0.125rem;
    }
  }
}

.audit-icon {
  color: var(--crm-text-muted);
  flex-shrink: 0;
  margin-top: 2px;
}

.audit-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.audit-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--crm-text-xs);
  line-height: 1.4;
  flex-wrap: wrap;

  &--updated {
    .audit-label {
      color: var(--crm-info);
    }
  }

  &--expires {
    margin-top: 0.125rem;
    padding-top: 0.25rem;
    border-top: 1px dashed var(--crm-border);

    .audit-value {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    &.audit-row--expired .audit-value {
      color: var(--crm-danger);
    }

    &.audit-row--expiring .audit-value {
      color: var(--crm-warning);
    }

    &.audit-row--active .audit-value {
      color: var(--crm-info);
    }
  }
}

.audit-label {
  color: var(--crm-text-muted);
  font-weight: 500;
  white-space: nowrap;
}

.audit-value {
  color: var(--crm-text-secondary);

  svg {
    flex-shrink: 0;
  }
}

.audit-actor {
  color: var(--crm-text-primary);
  font-weight: 500;
  white-space: nowrap;
}
</style>