<!-- app/components/pages/cabinet/settings/permissions/Roles/RoleCard.vue -->
<template>
  <div :class="['role-card', `role-${role.role}`]">
    <!-- Шапка: бейдж + название + счётчик пользователей -->
    <div class="role-card-header">
      <div class="role-badge" :style="{ background: roleColor }">
        <Icon :name="roleIcon" size="20" />
      </div>
      <div class="role-title">
        <h3>{{ roleName }}</h3>
        <p class="role-subtitle">
          <Icon name="mdi:account" size="14" />
          {{ role.userCount }} {{ pluralizeUsers(role.userCount) }}
        </p>
      </div>
    </div>

    <!-- Описание роли -->
    <div class="role-card-description">
      {{ roleDescription }}
    </div>

    <!-- Краткая сводка прав -->
    <div class="role-permissions-summary">
      <div class="summary-row">
        <span class="summary-label">Доступно разделов:</span>
        <span class="summary-value">
          {{ viewableCount }} / {{ pages.length }}
        </span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Может создавать:</span>
        <span class="summary-value">
          {{ createCount }} {{ pluralizePages(createCount) }}
        </span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Может удалять:</span>
        <span class="summary-value">
          {{ deleteCount }} {{ pluralizePages(deleteCount) }}
        </span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Спец. операции:</span>
        <span class="summary-value">
          {{ specialCount }} {{ pluralizePages(specialCount) }}
        </span>
      </div>
    </div>

    <!-- Кнопки действий -->
    <div class="role-card-actions">
      <button class="btn btn-primary" @click="$emit('edit', role)">
        <Icon name="mdi:pencil" size="16" />
        Настроить
      </button>
      <button
        v-if="isAdmin && role.role !== 'admin'"
        class="btn btn-ghost"
        @click="$emit('reset', role)"
        title="Сбросить к дефолтным значениям"
      >
        <Icon name="mdi:restore" size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ============================================
// ТИПЫ
// ============================================
interface RoleWithPermissions {
  role: string
  userCount: number
  permissions: Record<string, {
    canView: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canSpecial: boolean
  }>
}

interface SystemPage {
  slug: string
  name: string
}

// ============================================
// ПРОПСЫ
// ============================================
const props = defineProps<{
  /** Данные роли с правами */
  role: RoleWithPermissions
  /** Список всех страниц системы (для подсчёта и контекста) */
  pages: SystemPage[]
  /** Является ли текущий пользователь админом (для кнопки сброса) */
  isAdmin: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================
defineEmits<{
  /** Открыть модалку настройки прав роли */
  (e: 'edit', role: RoleWithPermissions): void
  /** Сбросить права роли к дефолтным */
  (e: 'reset', role: RoleWithPermissions): void
}>()

// ============================================
// СЛОВАРИ РОЛЕЙ
// ============================================
const ROLE_NAMES: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий',
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Полный доступ ко всем функциям системы. Может управлять ролями и пользователями.',
  manager: 'Управление объектами, финансами и персоналом. Доступ к отчётам и аналитике.',
  foreman: 'Руководство строительными работами. Назначение задач и контроль выполнения.',
  master: 'Выполнение работ на объектах. Просмотр задач и отправка отчётов.',
  worker: 'Базовый доступ. Просмотр назначенных задач и дашборда.',
}

const ROLE_ICONS: Record<string, string> = {
  admin: 'mdi:shield-crown',
  manager: 'mdi:briefcase',
  foreman: 'mdi:hard-hat',
  master: 'mdi:wrench',
  worker: 'mdi:account-hard-hat',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'linear-gradient(135deg, #f25f5c 0%, #d63384 100%)',
  manager: 'linear-gradient(135deg, #f5a623 0%, #e67e22 100%)',
  foreman: 'linear-gradient(135deg, #3dd68c 0%, #28a745 100%)',
  master: 'linear-gradient(135deg, #00c3f5 0%, #0077b6 100%)',
  worker: 'linear-gradient(135deg, #9aa0b8 0%, #6c757d 100%)',
}

// ============================================
// COMPUTED: ДАННЫЕ РОЛИ
// ============================================
const roleName = computed(() => ROLE_NAMES[props.role.role] || props.role.role)
const roleDescription = computed(() => ROLE_DESCRIPTIONS[props.role.role] || '')
const roleIcon = computed(() => ROLE_ICONS[props.role.role] || 'mdi:account')
const roleColor = computed(() =>
  ROLE_COLORS[props.role.role] || 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'
)

// ============================================
// COMPUTED: СВОДКА ПРАВ (новая система: без canExport/canApprove)
// ============================================

/** Количество разделов с canView = true */
const viewableCount = computed(() =>
  Object.values(props.role.permissions).filter(p => p.canView).length
)

/** Количество разделов с canCreate = true */
const createCount = computed(() =>
  Object.values(props.role.permissions).filter(p => p.canCreate).length
)

/** Количество разделов с canDelete = true */
const deleteCount = computed(() =>
  Object.values(props.role.permissions).filter(p => p.canDelete).length
)

/** Количество разделов с canSpecial = true (🆕 новая система) */
const specialCount = computed(() =>
  Object.values(props.role.permissions).filter(p => p.canSpecial).length
)

// ============================================
// ХЕЛПЕРЫ: ПЛЮРАЛИЗАЦИЯ
// ============================================
function pluralizeUsers(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'пользователь'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'пользователя'
  return 'пользователей'
}

function pluralizePages(count: number): string {
  if (count === 1) return 'раздел'
  if (count >= 2 && count <= 4) return 'раздела'
  return 'разделов'
}
</script>

<style lang="scss" scoped>
.role-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  transition: all var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
    transform: translateY(-2px);
    box-shadow: var(--crm-shadow-md);
  }
}

// ── ШАПКА ───────────────────────────────────────────────
.role-card-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.role-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: white;
  border-radius: var(--crm-radius-md);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.role-title {
  flex: 1;
  min-width: 0;

  h3 {
    margin: 0;
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  .role-subtitle {
    margin: 0.25rem 0 0;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
  }
}

// ── ОПИСАНИЕ ────────────────────────────────────────────
.role-card-description {
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
  line-height: 1.5;
}

// ── СВОДКА ПРАВ ─────────────────────────────────────────
.role-permissions-summary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.875rem;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-md);
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--crm-text-sm);
}

.summary-label {
  color: var(--crm-text-secondary);
}

.summary-value {
  color: var(--crm-text-primary);
  font-weight: 500;
}

// ── ДЕЙСТВИЯ ────────────────────────────────────────────
.role-card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
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

.btn-primary {
  background: var(--crm-accent);
  color: white;
  flex: 1;

  &:hover:not(:disabled) {
    background: var(--crm-accent-hover);
  }
}

.btn-ghost {
  background: transparent;
  color: var(--crm-text-secondary);

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }
}

// ── АДАПТИВНОСТЬ ────────────────────────────────────────
@media (max-width: 640px) {
  .role-card {
    padding: 1rem;
  }

  .role-badge {
    width: 40px;
    height: 40px;
  }

  .role-title h3 {
    font-size: var(--crm-text-md);
  }
}
</style>