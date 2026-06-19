<!-- app/components/pages/cabinet/settings/permissions/Users/UserCard.vue -->
 <template>
  <div class="user-card">
    <!-- Шапка карточки -->
    <div class="user-card-header">
      <!-- Аватар с инициалами -->
      <div class="user-avatar" :style="{ background: userColor }">
        {{ userInitials }}
      </div>

      <!-- Информация о пользователе -->
      <div class="user-info">
        <h3>{{ user.name }}</h3>
        <div class="user-meta">
          <span class="meta-item">
            <Icon name="mdi:at" size="14" />
            {{ user.login }}
          </span>
          <span class="meta-item role-badge" :class="`role-${user.role}`">
            {{ roleName }}
          </span>
          <span
            v-if="user.contractorType && user.contractorId"
            class="meta-item"
          >
            <Icon name="mdi:link-variant" size="14" />
            {{ contractorLabel }} #{{ user.contractorId }}
          </span>
        </div>
      </div>

      <!-- Бейдж с количеством переопределений -->
      <div class="user-actions-header">
        <span
          v-if="user.overrides.length > 0"
          class="overrides-badge"
        >
          <Icon name="mdi:pencil-circle" size="14" />
          {{ user.overrides.length }} {{ pluralizeOverrides(user.overrides.length) }}
        </span>
      </div>
    </div>

    <!-- Список переопределений (если есть) -->
    <PagesCabinetSettingsPermissionsUsersUserOverridesList
      v-if="user.overrides.length > 0"
      :overrides="user.overrides"
      :pages="pages"
      :removing="removing"
      @remove="handleRemoveOverride"
    />

    <!-- Footer с кнопками действий -->
    <div class="user-card-footer">
      <button class="btn btn-primary btn-sm" @click="$emit('add-override', user)">
        <Icon name="mdi:plus" size="16" />
        Добавить переопределение
      </button>
      <button
        v-if="user.overrides.length > 0"
        class="btn btn-ghost btn-sm"
        @click="$emit('clear-overrides', user)"
        :disabled="removing"
      >
        <Icon name="mdi:broom" size="16" />
        Сбросить все ({{ user.overrides.length }})
      </button>
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
}

interface UserWithPermissions {
  id: number
  name: string
  login: string
  role: string
  contractorType: string | null
  contractorId: number | null
  overrides: UserOverride[]
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

// ============================================
// ПРОПСЫ
// ============================================
const props = defineProps<{
  /** Данные пользователя с переопределениями */
  user: UserWithPermissions
  /** Список всех страниц (для UserOverridesList) */
  pages: SystemPage[]
  /** Является ли текущий пользователь админом */
  isAdmin: boolean
  /** Флаг процесса удаления (блокирует кнопки) */
  removing?: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================
const emit = defineEmits<{
  /** Открыть модалку добавления переопределения */
  (e: 'add-override', user: UserWithPermissions): void
  /** Открыть модалку сброса всех переопределений */
  (e: 'clear-overrides', user: UserWithPermissions): void
  /** Открыть модалку удаления одного переопределения */
  (e: 'remove-override', user: UserWithPermissions, pageSlug: string): void
}>()

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

const ROLE_COLORS: Record<string, string> = {
  admin: 'linear-gradient(135deg, #f25f5c 0%, #d63384 100%)',
  manager: 'linear-gradient(135deg, #f5a623 0%, #e67e22 100%)',
  foreman: 'linear-gradient(135deg, #3dd68c 0%, #28a745 100%)',
  master: 'linear-gradient(135deg, #00c3f5 0%, #0077b6 100%)',
  worker: 'linear-gradient(135deg, #9aa0b8 0%, #6c757d 100%)',
}

const CONTRACTOR_LABELS: Record<string, string> = {
  master: 'Мастер',
  worker: 'Рабочий',
  foreman: 'Прораб',
  office: 'Офис',
}

// ============================================
// COMPUTED
// ============================================
const roleName = computed(() => ROLE_NAMES[props.user.role] || props.user.role)

const userColor = computed(() =>
  ROLE_COLORS[props.user.role] || ROLE_COLORS.worker
)

const userInitials = computed(() => {
  return props.user.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const contractorLabel = computed(() => {
  if (!props.user.contractorType) return ''
  return CONTRACTOR_LABELS[props.user.contractorType] || props.user.contractorType
})

// ============================================
// МЕТОДЫ
// ============================================

/**
 * Плюрализация слова "переопределение"
 */
function pluralizeOverrides(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'переопределение'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'переопределения'
  return 'переопределений'
}

/**
 * Обработчик удаления переопределения из списка
 * Пробрасывает событие в родителя
 */
function handleRemoveOverride(pageSlug: string) {
  emit('remove-override', props.user, pageSlug)
}
</script>

<style lang="scss" scoped>
.user-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;
  transition: all var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
    box-shadow: var(--crm-shadow-sm);
  }
}

// ── ШАПКА КАРТОЧКИ ──────────────────────────────────────
.user-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: white;
  font-weight: 600;
  font-size: var(--crm-text-md);
  border-radius: var(--crm-radius-md);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-info {
  flex: 1;
  min-width: 0;

  h3 {
    margin: 0 0 0.375rem;
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-secondary);

  svg {
    color: var(--crm-text-muted);
  }

  &.role-badge {
    padding: 0.125rem 0.5rem;
    border-radius: 10px;
    font-weight: 500;
    background: var(--crm-bg-overlay);

    &.role-admin { background: var(--crm-danger-dim); color: var(--crm-danger); }
    &.role-manager { background: var(--crm-warning-dim); color: var(--crm-warning); }
    &.role-foreman { background: var(--crm-success-dim); color: var(--crm-success); }
    &.role-master { background: var(--crm-accent-dim); color: var(--crm-accent); }
    &.role-worker { background: var(--crm-bg-overlay); color: var(--crm-text-secondary); }
  }
}

.user-actions-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.overrides-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  background: var(--crm-accent-dim);
  color: var(--crm-accent);
  border: 1px solid var(--crm-accent-border);
  border-radius: 10px;
  font-size: var(--crm-text-xs);
  font-weight: 500;
  white-space: nowrap;
}

// ── FOOTER КАРТОЧКИ ─────────────────────────────────────
.user-card-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  background: var(--crm-bg-elevated);
  border-top: 1px solid var(--crm-border);
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

  &.btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: var(--crm-text-xs);
  }
}

.btn-primary {
  background: var(--crm-accent);
  color: white;

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
@media (max-width: 768px) {
  .user-card-header {
    flex-wrap: wrap;
  }

  .user-actions-header {
    width: 100%;
    justify-content: flex-end;
  }

  .user-card-footer {
    flex-wrap: wrap;
  }
}
</style>