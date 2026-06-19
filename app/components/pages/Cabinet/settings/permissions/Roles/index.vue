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
      <button class="btn btn-secondary" @click="loadRoles" :disabled="loading">
        <Icon name="mdi:refresh" size="16" />
        Обновить
      </button>
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
         МОДАЛКА ПОДТВЕРЖДЕНИЯ СБРОСА
    ============================================ -->
    <PagesCabinetSettingsPermissionsRolesRoleResetModal
      v-model:is-open="resetConfirm.isOpen"
      :role="resetConfirm.role"
      :resetting="resetting"
      @confirm="handleConfirmReset"
    />

    <!-- ============================================
         ОБЩИЙ TOAST
    ============================================ -->
    <PagesCabinetSettingsPermissionsSharedToast
      v-model:show="toast.show"
      :type="toast.type"
      :message="toast.message"
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
} from '~/composables/usePermissionsApi'
import type { PagePermissions } from 'server/utils/permissions/types'
import { useAuthStore } from 'stores/auth'

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

// Модалка сброса прав к дефолтным
const resetConfirm = ref<{
  isOpen: boolean
  role: { role: string; userCount: number } | null
}>({
  isOpen: false,
  role: null,
})

// Toast уведомления
const toast = ref<{
  show: boolean
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}>({
  show: false,
  type: 'success',
  message: '',
})

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
  toast.value = { show: true, type, message }
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

  .roles-grid {
    grid-template-columns: 1fr;
  }
}
</style>