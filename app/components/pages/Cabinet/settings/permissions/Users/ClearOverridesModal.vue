<!-- app/components/pages/cabinet/settings/permissions/Users/ClearOverridesModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="$emit('update:isOpen', false)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-overrides-title"
      >
        <div class="modal-content modal-small">
          <!-- ───────── HEADER ───────── -->
          <div class="modal-header">
            <div class="modal-title">
              <div class="icon-circle warning">
                <Icon name="mdi:broom" size="24" />
              </div>
              <div>
                <h2 id="clear-overrides-title">
                  Сбросить все переопределения?
                </h2>
                <p v-if="user" class="user-context">
                  Для пользователя:
                  <strong>{{ user.name }}</strong>
                  <span class="user-role-badge" :class="`role-${user.role}`">
                    {{ roleName }}
                  </span>
                </p>
              </div>
            </div>
            <button
              class="btn-close"
              @click="$emit('update:isOpen', false)"
              :disabled="clearing"
            >
              <Icon name="mdi:close" size="20" />
            </button>
          </div>

          <!-- ───────── BODY ───────── -->
          <div class="modal-body">
            <!-- Основное предупреждение -->
            <div class="info-block info-block--warning">
              <Icon name="mdi:alert-circle" size="20" />
              <div>
                <p>
                  Будут удалены <strong>все {{ overridesCount }}</strong>
                  {{ pluralizeOverrides(overridesCount) }} пользователя.
                </p>
                <p class="hint">
                  Пользователь вернётся к базовым правам своей роли
                  <span class="role-badge" :class="`role-${user?.role}`">
                    {{ roleName }}
                  </span>
                  для всех разделов.
                </p>
              </div>
            </div>

            <!-- 🆕 Сводка по типам переопределений -->
            <div v-if="overridesStats.total > 0" class="info-block info-block--info">
              <Icon name="mdi:chart-box-outline" size="20" />
              <div>
                <p class="info-title">Что будет удалено:</p>
                <div class="stats-grid">
                  <div class="stat-item">
                    <span class="stat-value">{{ overridesStats.permanent }}</span>
                    <span class="stat-label">Бессрочных</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ overridesStats.active }}</span>
                    <span class="stat-label">Активных</span>
                  </div>
                  <div class="stat-item stat-item--warning">
                    <span class="stat-value">{{ overridesStats.expiring }}</span>
                    <span class="stat-label">Истекающих</span>
                  </div>
                  <div v-if="overridesStats.expired > 0" class="stat-item stat-item--danger">
                    <span class="stat-value">{{ overridesStats.expired }}</span>
                    <span class="stat-label">Просроченных</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Список затронутых разделов -->
            <div v-if="user && user.overrides.length > 0" class="info-block info-block--neutral">
              <Icon name="mdi:format-list-bulleted" size="20" />
              <div>
                <p class="info-title">Затронутые разделы:</p>
                <ul class="affected-pages-list">
                  <li
                    v-for="override in sortedOverrides"
                    :key="override.id"
                    :class="['affected-page', {
                      'affected-page--expiring': getExpirationStatus(override) === 'expiring',
                      'affected-page--expired': getExpirationStatus(override) === 'expired'
                    }]"
                  >
                    <Icon :name="getPageIcon(override.pageSlug)" size="14" />
                    <span class="page-name">{{ getPageName(override.pageSlug) }}</span>

                    <!-- Бейдж статуса -->
                    <span
                      v-if="getExpirationStatus(override) === 'expiring'"
                      class="status-mini status-mini--warning"
                      title="Истекает скоро"
                    >
                      <Icon name="mdi:clock-alert" size="10" />
                    </span>
                    <span
                      v-else-if="getExpirationStatus(override) === 'expired'"
                      class="status-mini status-mini--danger"
                      title="Просрочен"
                    >
                      <Icon name="mdi:alert-circle" size="10" />
                    </span>

                    <div class="page-perms">
                      <span
                        v-for="perm in getOverridePermsSummary(override)"
                        :key="perm.key"
                        :class="['perm-tag', `perm-${perm.value ? 'on' : 'off'}`]"
                        :title="perm.label"
                      >
                        {{ perm.emoji }}
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Пустое состояние (на всякий случай) -->
            <div v-else class="info-block info-block--info">
              <Icon name="mdi:information-outline" size="20" />
              <p>У пользователя нет активных переопределений.</p>
            </div>

            <!-- 🆕 Предупреждение о критичности -->
            <div v-if="hasCriticalOverrides" class="info-block info-block--danger">
              <Icon name="mdi:alert-octagon" size="20" />
              <div>
                <p>
                  <strong>Внимание!</strong> Есть переопределения на критичные разделы
                  (dashboard, objects, works). После сброса пользователь может
                  потерять доступ к системе и будет принудительно отключён.
                </p>
              </div>
            </div>

            <!-- Подтверждение -->
            <label class="confirm-label">
              <input
                type="checkbox"
                v-model="confirmed"
                :disabled="clearing"
              />
              <span class="checkmark"></span>
              <span>
                Я понимаю, что все <strong>{{ overridesCount }}</strong>
                {{ pluralizeOverrides(overridesCount) }} будут удалены,
                а пользователь вернётся к базовым правам своей роли.
              </span>
            </label>
          </div>

          <!-- ───────── FOOTER ───────── -->
          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="$emit('update:isOpen', false)"
              :disabled="clearing"
            >
              Отмена
            </button>
            <button
              class="btn btn-danger"
              @click="$emit('confirm')"
              :disabled="clearing || overridesCount === 0 || !confirmed"
            >
              <Icon v-if="clearing" name="mdi:loading" size="16" class="spin" />
              <Icon v-else name="mdi:broom" size="16" />
              {{ clearing ? 'Сброс...' : 'Сбросить все' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

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

interface UserWithPermissions {
  id: number
  name: string
  login: string
  role: string
  overrides: UserOverride[]
}

interface SystemPage {
  slug: string
  name: string
  icon: string | null
}

type ExpirationStatus = 'active' | 'expiring' | 'expired' | 'permanent'

// ============================================
// ПРОПСЫ
// ============================================
const props = defineProps<{
  /** Флаг видимости модалки (v-model:isOpen) */
  isOpen: boolean
  /** Пользователь, у которого сбрасываются переопределения */
  user: UserWithPermissions | null
  /** Список всех страниц (для получения названий и иконок) */
  pages: SystemPage[]
  /** Флаг процесса сброса (блокирует кнопки) */
  clearing?: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================
defineEmits<{
  'update:isOpen': [value: boolean]
  'confirm': []
}>()

// ============================================
// ЛОКАЛЬНОЕ СОСТОЯНИЕ
// ============================================
const confirmed = ref(false)

// ============================================
// СБРОС ПРИ ОТКРЫТИИ
// ============================================
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      confirmed.value = false
    }
  }
)

// ============================================
// СЛОВАРИ
// ============================================
const ROLE_NAMES: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий',
}

const CRITICAL_PAGES = ['dashboard', 'objects', 'works']

// ============================================
// COMPUTED
// ============================================
const roleName = computed(() =>
  ROLE_NAMES[props.user?.role || ''] || props.user?.role || ''
)

const overridesCount = computed(() => props.user?.overrides.length || 0)

/**
 * Статистика по типам переопределений
 */
const overridesStats = computed(() => {
  if (!props.user) return { total: 0, permanent: 0, active: 0, expiring: 0, expired: 0 }
  
  const stats = {
    total: props.user.overrides.length,
    permanent: 0,
    active: 0,
    expiring: 0,
    expired: 0,
  }
  
  for (const override of props.user.overrides) {
    const status = getExpirationStatus(override)
    switch (status) {
      case 'permanent': stats.permanent++; break
      case 'active': stats.active++; break
      case 'expiring': stats.expiring++; break
      case 'expired': stats.expired++; break
    }
  }
  
  return stats
})

/**
 * Есть ли критичные override'ы (дающие canView на dashboard/objects/works)
 */
const hasCriticalOverrides = computed(() => {
  if (!props.user) return false
  return props.user.overrides.some(o => 
    CRITICAL_PAGES.includes(o.pageSlug) && o.canView === true
  )
})

/**
 * Сортировка override'ов: критичные сверху, затем истекающие, потом остальные
 */
const sortedOverrides = computed(() => {
  if (!props.user) return []
  
  return [...props.user.overrides].sort((a, b) => {
    const aCritical = CRITICAL_PAGES.includes(a.pageSlug) && a.canView === true ? 0 : 1
    const bCritical = CRITICAL_PAGES.includes(b.pageSlug) && b.canView === true ? 0 : 1
    if (aCritical !== bCritical) return aCritical - bCritical
    
    const statusPriority: Record<ExpirationStatus, number> = {
      expired: 0,
      expiring: 1,
      active: 2,
      permanent: 3,
    }
    return statusPriority[getExpirationStatus(a)] - statusPriority[getExpirationStatus(b)]
  })
})

// ============================================
// МЕТОДЫ
// ============================================
function getPageName(slug: string): string {
  const page = props.pages.find(p => p.slug === slug)
  return page?.name || slug
}

function getPageIcon(slug: string): string {
  const page = props.pages.find(p => p.slug === slug)
  return page?.icon || 'mdi:file-outline'
}

function getExpirationStatus(override: UserOverride): ExpirationStatus {
  if (!override.expiresAt) return 'permanent'
  
  const now = Date.now()
  const expires = new Date(override.expiresAt).getTime()
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
  
  if (expires <= now) return 'expired'
  if (expires - now <= TWENTY_FOUR_HOURS) return 'expiring'
  return 'active'
}

function pluralizeOverrides(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'переопределение'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'переопределения'
  return 'переопределений'
}

function getOverridePermsSummary(
  override: UserOverride
): Array<{ key: string; label: string; value: boolean | null; emoji: string }> {
  const result: Array<{ key: string; label: string; value: boolean | null; emoji: string }> = []
  
  if (override.canView !== null) {
    result.push({ key: 'canView', label: 'Просмотр', value: override.canView, emoji: '👁' })
  }
  if (override.canCreate !== null) {
    result.push({ key: 'canCreate', label: 'Создание', value: override.canCreate, emoji: '➕' })
  }
  if (override.canEdit !== null) {
    result.push({ key: 'canEdit', label: 'Ред.', value: override.canEdit, emoji: '✏' })
  }
  if (override.canDelete !== null) {
    result.push({ key: 'canDelete', label: 'Удал.', value: override.canDelete, emoji: '🗑' })
  }
  if (override.canSpecial !== null) {
    result.push({ key: 'canSpecial', label: 'Спец.', value: override.canSpecial, emoji: '⚡' })
  }
  
  return result
}
</script>

<style lang="scss" scoped>
// ── ОВЕРЛЕЙ И КОНТЕЙНЕР ─────────────────────────────────
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-xl);
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--crm-shadow-lg);

  &.modal-small {
    max-width: 540px;
  }
}

// ── HEADER ──────────────────────────────────────────────
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--crm-border);
  flex-shrink: 0;
}

.modal-title {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  flex: 1;
  min-width: 0;

  h2 {
    margin: 0;
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  .user-context {
    margin: 0.375rem 0 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    flex-wrap: wrap;

    strong {
      color: var(--crm-text-primary);
      font-weight: 600;
    }
  }
}

.user-role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: var(--crm-text-xs);
  font-weight: 500;

  &.role-admin { background: var(--crm-danger-dim); color: var(--crm-danger); }
  &.role-manager { background: var(--crm-warning-dim); color: var(--crm-warning); }
  &.role-foreman { background: var(--crm-success-dim); color: var(--crm-success); }
  &.role-master { background: var(--crm-accent-dim); color: var(--crm-accent); }
  &.role-worker { background: var(--crm-bg-overlay); color: var(--crm-text-secondary); }
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  color: var(--crm-text-secondary);
  border: none;
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;

  &.warning {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }
}

// ── BODY ────────────────────────────────────────────────
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.info-block {
  display: flex;
  gap: 0.875rem;
  padding: 1rem;
  border-radius: var(--crm-radius-md);
  border: 1px solid;

  > svg {
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    margin: 0;
    font-size: var(--crm-text-sm);
    line-height: 1.5;
    color: var(--crm-text-primary);

    strong {
      font-weight: 600;
    }

    &.hint {
      margin-top: 0.375rem;
      font-size: var(--crm-text-xs);
      color: var(--crm-text-secondary);
    }

    &.info-title {
      font-size: var(--crm-text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--crm-text-secondary);
      margin-bottom: 0.5rem;
    }
  }

  .role-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.0625rem 0.5rem;
    border-radius: 10px;
    font-size: var(--crm-text-xs);
    font-weight: 500;

    &.role-admin { background: var(--crm-danger-dim); color: var(--crm-danger); }
    &.role-manager { background: var(--crm-warning-dim); color: var(--crm-warning); }
    &.role-foreman { background: var(--crm-success-dim); color: var(--crm-success); }
    &.role-master { background: var(--crm-accent-dim); color: var(--crm-accent); }
    &.role-worker { background: var(--crm-bg-overlay); color: var(--crm-text-secondary); }
  }

  &--warning {
    background: var(--crm-warning-dim);
    border-color: rgba(245, 166, 35, 0.3);

    > svg {
      color: var(--crm-warning);
    }
  }

  &--info {
    background: var(--crm-info-dim, rgba(0, 195, 245, 0.1));
    border-color: rgba(0, 195, 245, 0.2);

    > svg {
      color: var(--crm-info);
    }
  }

  &--neutral {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-border);

    > svg {
      color: var(--crm-text-muted);
    }
  }

  &--danger {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);

    > svg {
      color: var(--crm-danger);
    }
  }
}

// ── СТАТИСТИКА ──────────────────────────────────────────
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);

  .stat-value {
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  .stat-label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &--warning .stat-value { color: var(--crm-warning); }
  &--danger .stat-value { color: var(--crm-danger); }
}

// ── СПИСОК ЗАТРОНУТЫХ РАЗДЕЛОВ ──────────────────────────
.affected-pages-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-height: 200px;
  overflow-y: auto;
}

.affected-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  flex-wrap: wrap;
  transition: all var(--crm-transition);

  > svg:first-child {
    color: var(--crm-accent);
    flex-shrink: 0;
  }

  &--expiring {
    border-color: rgba(245, 166, 35, 0.4);
    background: var(--crm-warning-dim);
  }

  &--expired {
    border-color: rgba(242, 95, 92, 0.4);
    background: var(--crm-danger-dim);
    opacity: 0.75;
  }
}

.page-name {
  color: var(--crm-text-primary);
  font-weight: 500;
  margin-right: auto;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;

  &--warning {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }

  &--danger {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }
}

.page-perms {
  display: flex;
  gap: 0.125rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.perm-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 0.25rem;
  font-size: 0.625rem;
  border-radius: 3px;
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

// ── ЧЕКБОКС ПОДТВЕРЖДЕНИЯ ──────────────────────────────
.confirm-label {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.875rem;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  user-select: none;
  transition: all var(--crm-transition);
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
  line-height: 1.5;

  &:hover:not(:has(input:disabled)) {
    border-color: var(--crm-border-hover);
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    width: 0;
    height: 0;

    &:checked ~ .checkmark {
      background: var(--crm-accent);
      border-color: var(--crm-accent);

      &::after {
        opacity: 1;
      }
    }

    &:disabled ~ .checkmark {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &:disabled ~ * {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .checkmark {
    position: relative;
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--crm-border-hover);
    border-radius: 4px;
    transition: all var(--crm-transition);
    flex-shrink: 0;
    margin-top: 2px;

    &::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 2px;
      width: 5px;
      height: 9px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      opacity: 0;
      transition: opacity var(--crm-transition);
    }
  }

  strong {
    color: var(--crm-text-primary);
    font-weight: 600;
  }
}

// ── FOOTER ──────────────────────────────────────────────
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--crm-border);
  background: var(--crm-bg-elevated);
  flex-shrink: 0;
}

// ── КНОПКИ ──────────────────────────────────────────────
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: var(--crm-text-sm);
  font-weight: 500;
  font-family: var(--crm-font-sans);
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  border: 1px solid transparent;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: var(--crm-bg-overlay);
  color: var(--crm-text-primary);
  border-color: var(--crm-border);

  &:hover:not(:disabled) {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-border-hover);
  }
}

.btn-danger {
  background: var(--crm-danger);
  color: white;

  &:hover:not(:disabled) {
    background: #d63a37;
  }
}

// ── АНИМАЦИИ ────────────────────────────────────────────
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal-content {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-content {
    transform: scale(0.95);
  }
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ── АДАПТИВНОСТЬ ────────────────────────────────────────
@media (max-width: 768px) {
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal-footer {
    flex-direction: column-reverse;

    .btn {
      width: 100%;
    }
  }
}
</style>