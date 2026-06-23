<!-- app/components/pages/cabinet/settings/permissions/Users/UserOverridesList.vue -->
<template>
  <div class="user-overrides">
    <div class="overrides-title">
      <Icon name="mdi:pencil-box-multiple" size="16" />
      <span>Активные переопределения</span>
      <span class="overrides-count">{{ overrides.length }}</span>
    </div>

    <div class="overrides-list">
      <div
        v-for="override in sortedOverrides"
        :key="override.id"
        :class="['override-item', {
          'override-item--expiring': getExpirationStatus(override) === 'expiring',
          'override-item--expired': getExpirationStatus(override) === 'expired'
        }]"
      >
        <div class="override-info">
          <!-- Название страницы + бейджи статуса -->
          <div class="override-page">
            <Icon :name="getPageIcon(override.pageSlug)" size="16" />
            <span class="override-page-name">
              {{ getPageName(override.pageSlug) }}
            </span>

            <!-- Бейдж: истекает скоро -->
            <span
              v-if="getExpirationStatus(override) === 'expiring'"
              class="status-badge status-badge--expiring"
              :title="`Истекает: ${formatDate(override.expiresAt!)}`"
            >
              <Icon name="mdi:clock-alert" size="12" />
              Истекает скоро
            </span>

            <!-- Бейдж: просрочен (не должен появляться, но оставим для безопасности) -->
            <span
              v-else-if="getExpirationStatus(override) === 'expired'"
              class="status-badge status-badge--expired"
            >
              <Icon name="mdi:alert-circle" size="12" />
              Просрочен
            </span>

            <!-- Бейдж: бессрочный -->
            <span
              v-else-if="!override.expiresAt"
              class="status-badge status-badge--permanent"
            >
              <Icon name="mdi:infinity" size="12" />
              Бессрочно
            </span>
          </div>

          <!-- Теги прав (включено/выключено) -->
          <div class="override-permissions">
            <span
              v-for="perm in getPermissionsList(override)"
              :key="perm.key"
              :class="['perm-tag', `perm-${perm.value ? 'on' : 'off'}`]"
            >
              {{ perm.label }}
            </span>
          </div>

          <!-- Причина (если есть) -->
          <div v-if="override.reason" class="override-reason">
            <Icon name="mdi:comment-text-outline" size="12" />
            <span>{{ override.reason }}</span>
          </div>

          <!-- Срок действия (если есть и не в статусе "expiring") -->
          <div
            v-if="override.expiresAt && getExpirationStatus(override) !== 'expiring' && getExpirationStatus(override) !== 'expired'"
            class="override-expires"
          >
            <Icon name="mdi:clock-outline" size="12" />
            <span>Действует до {{ formatDate(override.expiresAt) }}</span>
          </div>

          <!-- Audit: кто и когда создал -->
          <div class="override-audit">
            <Icon name="mdi:account-clock" size="12" />
            <span>
              Создано {{ formatDate(override.createdAt) }}
              <template v-if="override.createdBy">
                · администратором #{{ override.createdBy }}
              </template>
            </span>
          </div>
        </div>

        <!-- Кнопка удаления -->
        <button
          class="btn-icon btn-icon-danger"
          @click="$emit('remove', override.pageSlug)"
          title="Удалить переопределение"
          :disabled="removing"
        >
          <Icon name="mdi:close" size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ============================================
// ТИПЫ
// ============================================
interface UserOverride {
  id: number
  pageSlug: string
  canView: boolean | null
  canCreate: boolean | null
  canEdit: boolean | null
  canDelete: boolean | null
  canSpecial: boolean | null
  reason: string | null
  expiresAt: string | null
  createdAt: string
  createdBy: number | null
}

interface SystemPage {
  slug: string
  name: string
  icon: string | null
  hasCreate: boolean
  hasEdit: boolean
  hasDelete: boolean
  hasSpecial: boolean
}

type ExpirationStatus = 'active' | 'expiring' | 'expired' | 'permanent'

// ============================================
// ПРОПСЫ
// ============================================
const props = defineProps<{
  /** Массив переопределений пользователя */
  overrides: UserOverride[]
  /** Список всех страниц (для получения названий и иконок) */
  pages: SystemPage[]
  /** Флаг процесса удаления (блокирует кнопки) */
  removing?: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================
defineEmits<{
  /** Удалить переопределение для конкретной страницы */
  (e: 'remove', pageSlug: string): void
}>()

// ============================================
// COMPUTED: СОРТИРОВКА OVERRIDE'ОВ
// ============================================
/**
 * Сортируем переопределения по приоритету:
 * 1. Истекающие скоро (в ближайшие 24 часа) — сверху
 * 2. Просроченные
 * 3. Бессрочные и активные
 *
 * Внутри группы — по алфавиту названия страницы
 */
const sortedOverrides = computed(() => {
  return [...props.overrides].sort((a, b) => {
    const statusA = getExpirationStatus(a)
    const statusB = getExpirationStatus(b)

    const priority: Record<ExpirationStatus, number> = {
      expired: 0,
      expiring: 1,
      active: 2,
      permanent: 3
    }

    if (priority[statusA] !== priority[statusB]) {
      return priority[statusA] - priority[statusB]
    }

    // Внутри одной группы — по названию страницы
    return getPageName(a.pageSlug).localeCompare(getPageName(b.pageSlug))
  })
})

// ============================================
// МЕТОДЫ
// ============================================
/**
 * Получить название страницы по slug
 */
function getPageName(slug: string): string {
  const page = props.pages.find(p => p.slug === slug)
  return page?.name || slug
}

/**
 * Получить иконку страницы по slug
 */
function getPageIcon(slug: string): string {
  const page = props.pages.find(p => p.slug === slug)
  return page?.icon || 'mdi:file-outline'
}

/**
 * Определить статус срока действия переопределения
 */
function getExpirationStatus(override: UserOverride): ExpirationStatus {
  if (!override.expiresAt) return 'permanent'

  const now = Date.now()
  const expires = new Date(override.expiresAt).getTime()
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

  if (expires <= now) return 'expired'
  if (expires - now <= TWENTY_FOUR_HOURS) return 'expiring'
  return 'active'
}

/**
 * Сформировать список тегов прав для отображения
 * Показываем только те права, которые были переопределены (не null)
 */
function getPermissionsList(override: UserOverride): Array<{
  key: string
  label: string
  value: boolean | null
}> {
  const result: Array<{ key: string; label: string; value: boolean | null }> = []

  if (override.canView !== null) {
    result.push({ key: 'canView', label: 'Просмотр', value: override.canView })
  }
  if (override.canCreate !== null) {
    result.push({ key: 'canCreate', label: 'Создание', value: override.canCreate })
  }
  if (override.canEdit !== null) {
    result.push({ key: 'canEdit', label: 'Ред.', value: override.canEdit })
  }
  if (override.canDelete !== null) {
    result.push({ key: 'canDelete', label: 'Удал.', value: override.canDelete })
  }
  if (override.canSpecial !== null) {
    result.push({ key: 'canSpecial', label: 'Спец.', value: override.canSpecial })
  }

  return result
}

/**
 * Форматирование даты для отображения
 */
function formatDate(dateStr: string): string {
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
.user-overrides {
  padding: 0 1.25rem 1.25rem;
}

.overrides-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: var(--crm-text-sm);
  font-weight: 500;
  color: var(--crm-text-secondary);

  svg {
    color: var(--crm-accent);
  }
}

.overrides-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--crm-accent-dim);
  color: var(--crm-accent);
  font-size: var(--crm-text-xs);
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid var(--crm-accent-border);
}

.overrides-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

// ── КАРТОЧКА ПЕРЕОПРЕДЕЛЕНИЯ ────────────────────────────
.override-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  transition: all var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
  }

  // Истекающий override — жёлтая подсветка
  &--expiring {
    border-color: rgba(245, 166, 35, 0.4);
    background: var(--crm-warning-dim);
    animation: pulse-warning 3s ease-in-out infinite;
  }

  // Просроченный override — красная подсветка
  &--expired {
    border-color: rgba(242, 95, 92, 0.4);
    background: var(--crm-danger-dim);
    opacity: 0.85;
  }
}

@keyframes pulse-warning {
  0%, 100% { border-color: rgba(245, 166, 35, 0.4); }
  50% { border-color: rgba(245, 166, 35, 0.7); }
}

.override-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

// ── НАЗВАНИЕ СТРАНИЦЫ + БЕЙДЖИ ──────────────────────────
.override-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-weight: 500;
  color: var(--crm-text-primary);

  > svg {
    color: var(--crm-accent);
    flex-shrink: 0;
  }

  .override-page-name {
    white-space: nowrap;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  font-size: var(--crm-text-xs);
  font-weight: 500;
  border-radius: 10px;
  white-space: nowrap;
  border: 1px solid;

  &--expiring {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
    border-color: rgba(245, 166, 35, 0.3);
  }

  &--expired {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
    border-color: rgba(242, 95, 92, 0.3);
  }

  &--permanent {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-muted);
    border-color: var(--crm-border);
  }
}

// ── ТЕГИ ПРАВ ───────────────────────────────────────────
.override-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.perm-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  font-size: var(--crm-text-xs);
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;

  &.perm-on {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &.perm-off {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
    text-decoration: line-through;
  }
}

// ── ПРИЧИНА И СРОК ДЕЙСТВИЯ ─────────────────────────────
.override-reason,
.override-expires,
.override-audit {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);

  > svg {
    flex-shrink: 0;
  }
}

.override-reason {
  font-style: italic;

  > span {
    color: var(--crm-text-secondary);
  }
}

.override-audit {
  margin-top: 0.25rem;
  padding-top: 0.375rem;
  border-top: 1px dashed var(--crm-border);
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
}

// ── КНОПКА УДАЛЕНИЯ ─────────────────────────────────────
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  color: var(--crm-text-secondary);
  border: 1px solid transparent;
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }

  &.btn-icon-danger:hover:not(:disabled) {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// ── АДАПТИВНОСТЬ ────────────────────────────────────────
@media (max-width: 480px) {
  .override-item {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-icon {
    align-self: flex-end;
  }
}
</style>