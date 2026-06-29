<!-- app/components/pages/cabinet/settings/permissions/Roles/index.vue -->
<template>
  <div class="roles-view">
    <!-- ============================================
         ПАНЕЛЬ ИНСТРУМЕНТОВ
    ============================================ -->
    <div class="toolbar">
      <div class="toolbar-info">
        <Icon name="mdi:information-outline" size="18" />
        <span>
          Настройте права доступа для каждой роли.
          Изменения применяются мгновенно для всех пользователей с этой ролью.
        </span>
      </div>
      <div class="toolbar-actions">
        <div v-if="isSyncing" class="sync-indicator">
          <Icon name="mdi:sync" size="16" class="spin" />
          <span>Синхронизация...</span>
        </div>
        <button class="btn btn-secondary" @click="loadRoles" :disabled="loading">
          <Icon name="mdi:refresh" size="16" />
          Обновить
        </button>
      </div>
    </div>

    <!-- ============================================
         ЛОАДЕР
    ============================================ -->
    <div v-if="loading && roles.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка ролей...</p>
    </div>

    <!-- ============================================
         ПУСТОЕ СОСТОЯНИЕ
    ============================================ -->
    <div v-else-if="roles.length === 0" class="empty-state">
      <Icon name="mdi:account-group-outline" size="64" />
      <h3>Роли не найдены</h3>
      <p>Не удалось загрузить список ролей. Попробуйте обновить страницу.</p>
      <button class="btn btn-primary" @click="loadRoles">
        Попробовать снова
      </button>
    </div>

    <!-- ============================================
         СЕТКА РОЛЕЙ
    ============================================ -->
    <div v-else class="roles-grid">
      <PagesCabinetSettingsPermissionsRolesRoleCard
        v-for="role in roles"
        :key="role.role"
        :role="role"
        :pages="pages"
        :is-admin="isAdmin"
        @edit="openEditModal"
        @reset="openResetConfirm"
        @copy="openCopyModal"
      />
    </div>

    <!-- ============================================
         МОДАЛКА РЕДАКТИРОВАНИЯ ПРАВ РОЛИ
    ============================================ -->
    <PagesCabinetSettingsPermissionsRolesRoleEditModal
      v-model:is-open="editModal.isOpen"
      :role="editModal.role"
      :pages="pages"
      :saving="saving"
      :is-admin="isAdmin"
      @save="handleSavePermissions"
      @reset="openResetFromEditModal"
    />

    <!-- ============================================
         МОДАЛКА КОПИРОВАНИЯ ПРАВ МЕЖДУ РОЛЯМИ
    ============================================ -->
    <PagesCabinetSettingsPermissionsRolesRoleCopyModal
      v-model:is-open="copyModal.isOpen"
      :target-role="copyModal.targetRole"
      :all-roles="allRolesForCopy"
      :copying="copying"
      @copy="handleCopyPermissions"
    />

    <!-- ============================================
         МОДАЛКА ПОДТВЕРЖДЕНИЯ СБРОСА
    ============================================ -->
    <PagesCabinetSettingsPermissionsRolesRoleResetModal
      v-model:is-open="resetConfirm.isOpen"
      :role="resetConfirm.role"
      :resetting="resetting"
      @confirm="handleConfirmReset"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { SystemPage, RoleWithPermissions } from '~/composables/usePermissionsApi'
import {
  fetchPermissionsPages,
  fetchPermissionsRoles,
  updateRolePermissions,
  resetRolePermissions,
  copyRolePermissions,
} from '~/composables/usePermissionsApi'
import type { PagePermissions } from 'shared/types/permissions.ts'
import { useAuthStore } from 'stores/auth'
import { usePermissionsSocket } from '../composables/usePermissionsSocket'
import { useNotifications } from '~/composables/useNotifications'

// ============================================
// STORE И ПРАВА ДОСТУПА
// ============================================
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')

// ============================================
// СОСТОЯНИЕ
// ============================================
const loading = ref(false)
const saving = ref(false)
const resetting = ref(false)
const copying = ref(false)
const isSyncing = ref(false)
const roles = ref<RoleWithPermissions[]>([])
const pages = ref<SystemPage[]>([])

// Модалка редактирования прав роли
const editModal = ref<{
  isOpen: boolean
  role: RoleWithPermissions | null
}>({
  isOpen: false,
  role: null,
})

// Модалка копирования прав между ролями
const copyModal = ref<{
  isOpen: boolean
  targetRole: RoleWithPermissions | null
}>({
  isOpen: false,
  targetRole: null,
})

// Модалка сброса прав к дефолтным
const resetConfirm = ref<{
  isOpen: boolean
  role: { role: string; userCount: number } | null
}>({
  isOpen: false,
  role: null,
})

// Уведомления (глобальные, через store)
const notifications = useNotifications()

// ============================================
// СЛОВАРИ ДЛЯ ИМЕН РОЛЕЙ (для toast-сообщений)
// ============================================
const ROLE_NAMES: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий',
}

// ============================================
// COMPUTED: РОЛИ ДЛЯ КОПИРОВАНИЯ
// ============================================
/**
 * Все роли с дополнительной информацией для RoleCopyModal
 * Преобразуем формат RoleWithPermissions в формат ожидаемый модалкой
 */
const allRolesForCopy = computed(() =>
  roles.value.map(r => ({
    role: r.role,
    label: ROLE_NAMES[r.role] || r.role,
    color: ROLE_COLORS[r.role] || 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
    level: 0, // уровень не используется в модалке
    userCount: r.userCount,
    permissions: r.permissions,
  }))
)

const ROLE_COLORS: Record<string, string> = {
  admin: 'linear-gradient(135deg, #f25f5c 0%, #d63384 100%)',
  manager: 'linear-gradient(135deg, #f5a623 0%, #e67e22 100%)',
  foreman: 'linear-gradient(135deg, #3dd68c 0%, #28a745 100%)',
  master: 'linear-gradient(135deg, #00c3f5 0%, #0077b6 100%)',
  worker: 'linear-gradient(135deg, #9aa0b8 0%, #6c757d 100%)',
}

// ============================================
// REAL-TIME СИНХРОНИЗАЦИЯ ЧЕРЕЗ СОКЕТЫ
// ============================================
/**
 * Тихая перезагрузка списка (без сброса состояния модалок)
 * Используется при получении сокет-событий от других админов
 */
async function silentReload() {
  isSyncing.value = true
  try {
    const [rolesData, pagesData] = await Promise.all([
      fetchPermissionsRoles(),
      fetchPermissionsPages(),
    ])
    roles.value = rolesData
    pages.value = pagesData
  } catch (error: any) {
    console.error('[Roles] Ошибка тихой перезагрузки:', error)
  } finally {
    isSyncing.value = false
  }
}

usePermissionsSocket({
  onPermissionsChanged: async (data: any) => {
    console.log('[Roles] 📥 Права изменены другим админом:', data?.reason)
    showToast(`Права обновлены: ${data?.reason || 'изменения применены'}`, 'info')
    await silentReload()
  },
})

// ============================================
// ЗАГРУЗКА ДАННЫХ
// ============================================
async function loadRoles() {
  loading.value = true
  try {
    const [rolesData, pagesData] = await Promise.all([
      fetchPermissionsRoles(),
      fetchPermissionsPages(),
    ])
    roles.value = rolesData
    pages.value = pagesData
  } catch (error: any) {
    showToast(error.message || 'Не удалось загрузить данные', 'error')
  } finally {
    loading.value = false
  }
}

// ============================================
// РЕДАКТИРОВАНИЕ ПРАВ РОЛИ
// ============================================
function openEditModal(role: RoleWithPermissions) {
  editModal.value = {
    isOpen: true,
    role,
  }
}

/**
 * Сохранение прав роли
 * Принимает полный объект прав из RoleEditModal
 */
async function handleSavePermissions(
  permissions: Record<string, PagePermissions>
) {
  const role = editModal.value.role
  if (!role) return
  saving.value = true
  try {
    await updateRolePermissions(role.role, permissions)
    const roleName = ROLE_NAMES[role.role] || role.role
    showToast(
      `Права роли «${roleName}» успешно сохранены`,
      'success'
    )
    editModal.value.isOpen = false
    await loadRoles()
  } catch (error: any) {
    showToast(error.message || 'Не удалось сохранить права', 'error')
  } finally {
    saving.value = false
  }
}

// ============================================
// КОПИРОВАНИЕ ПРАВ МЕЖДУ РОЛЯМИ
// ============================================
function openCopyModal(role: RoleWithPermissions) {
  copyModal.value = {
    isOpen: true,
    targetRole: role,
  }
}

/**
 * Обработчик копирования прав из одной роли в другую
 */
async function handleCopyPermissions(data: { from: string; to: string }) {
  copying.value = true
  try {
    const result = await copyRolePermissions(data.from, data.to)
    showToast(result.message, 'success')
    copyModal.value.isOpen = false
    await loadRoles()
  } catch (error: any) {
    showToast(error.message || 'Не удалось скопировать права', 'error')
  } finally {
    copying.value = false
  }
}

// ============================================
// СБРОС ПРАВ К ДЕФОЛТНЫМ
// ============================================
/**
 * Открыть модалку сброса из карточки роли
 */
function openResetConfirm(role: RoleWithPermissions) {
  resetConfirm.value = {
    isOpen: true,
    role: { role: role.role, userCount: role.userCount },
  }
}

/**
 * Открыть модалку сброса из модалки редактирования
 * (кнопка "Сбросить к дефолтным" внутри RoleEditModal)
 */
function openResetFromEditModal() {
  const currentRole = editModal.value.role
  if (!currentRole) return
  resetConfirm.value = {
    isOpen: true,
    role: { role: currentRole.role, userCount: currentRole.userCount },
  }
}

/**
 * Подтверждение сброса прав к дефолтным значениям
 */
async function handleConfirmReset() {
  const roleInfo = resetConfirm.value.role
  if (!roleInfo) return
  resetting.value = true
  try {
    const result = await resetRolePermissions(roleInfo.role)
    showToast(result.message, 'success')
    // Закрываем обе модалки (сброс + редактирование, если оно было открыто)
    resetConfirm.value.isOpen = false
    editModal.value.isOpen = false
    await loadRoles()
  } catch (error: any) {
    showToast(error.message || 'Не удалось сбросить права', 'error')
  } finally {
    resetting.value = false
  }
}

// ============================================
// TOAST УВЕДОМЛЕНИЯ
// ============================================
function showToast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'success'
) {
  notifications[type](message)
}

// ============================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ============================================
onMounted(() => {
  loadRoles()
})
</script>

<style lang="scss" scoped>
span {
  color: unset;
}

.roles-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

// ── ПАНЕЛЬ ИНСТРУМЕНТОВ ───────────────────────────────────
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  flex-wrap: wrap;
}

.toolbar-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-sm);
  flex: 1;
  min-width: 200px;

  svg {
    color: var(--crm-info);
    flex-shrink: 0;
  }
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sync-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--crm-accent-dim);
  color: var(--crm-accent);
  border: 1px solid var(--crm-accent-border);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-xs);
  font-weight: 500;

  svg {
    animation: spin 0.8s linear infinite;
  }
}

// ── СОСТОЯНИЯ ─────────────────────────────────────────────
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--crm-text-secondary);

  svg {
    color: var(--crm-text-muted);
  }

  h3 {
    margin: 0;
    color: var(--crm-text-primary);
    font-size: var(--crm-text-lg);
  }

  p {
    margin: 0;
    max-width: 400px;
    font-size: var(--crm-text-sm);
  }
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--crm-border);
  border-top-color: var(--crm-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ── СЕТКА РОЛЕЙ ───────────────────────────────────────────
.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

// ── КНОПКИ ────────────────────────────────────────────────
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

  &:hover:not(:disabled) {
    background: var(--crm-accent-hover);
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

// ── АДАПТИВНОСТЬ ──────────────────────────────────────────
@media (max-width: 640px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-actions {
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .roles-grid {
    grid-template-columns: 1fr;
  }
}
</style>