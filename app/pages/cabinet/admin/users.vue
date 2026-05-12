<!-- app/pages/cabinet/admin/users.vue -->
<template>
  <div class="users-page">
    <!-- ═══════════════════════════ HEADER ═══════════════════════════ -->
    <PageTitle title="Пользователи" icon="mdi:account-group" :badge="filteredUsers.length">
      <template #actions>
        <!-- ✅ Кнопка возврата к контрагентам -->
        <NuxtLink 
          to="/cabinet/contractors" 
          class="btn btn--ghost btn--sm"
        >
          <Icon name="mdi:chevron-left" size="14" />
          Контрагенты
        </NuxtLink>

        <!-- Кнопка добавления пользователя -->
        <button class="btn btn--primary btn--sm" @click="actions.openCreateModal">
          <Icon name="mdi:plus" size="14" />
          Добавить
        </button>
      </template>
    </PageTitle>

    <!-- ═══════════════════════════ FILTERS ══════════════════════════ -->
    <div class="users-controls">
      <div class="search-box">
        <Icon name="mdi:magnify" size="16" class="search-icon" />
        <input v-model="searchQuery" type="text" placeholder="Поиск по имени или логину..." class="input search-input"
          autocomplete="off" />
      </div>
      <div class="filter-chips">
        <button v-for="role in availableRoles" :key="role" :class="['chip', { 'chip--active': selectedRole === role }]"
          @click="selectedRole = selectedRole === role ? null : role">
          {{ roleLabels[role] }}
        </button>
        <button v-if="selectedRole" class="chip chip--clear" @click="selectedRole = null">✕</button>
      </div>
    </div>

    <!-- ═══════════════════════════ LIST ═════════════════════════════ -->
    <div class="users-list">
      <div v-if="usersStore.loading" class="state-block">
        <span class="spinner" /> Загрузка списка...
      </div>

      <div v-else-if="filteredUsers.length === 0" class="state-block">
        <Icon name="mdi:account-off" size="32" />
        <span>Пользователи не найдены</span>
      </div>

      <div v-else class="list-container">
        <UserItem v-for="user in filteredUsers" :key="user.id" :user="user" @edit="actions.openEditModal"
          @change-password="actions.openPasswordModal" @delete="actions.openDeleteConfirm" />
      </div>
    </div>

    <!-- ═══════════════════════════ MODALS ═══════════════════════════ -->
    <!-- Форма создания/редактирования -->
    <Modal :visible="actions.isFormModalOpen.value" :title="formModalTitle" size="md"
      @update:visible="actions.closeAllModals">
      <UserFormModal :user="editingUserValue" @save="handleSaveForm" @close="actions.closeAllModals" />
    </Modal>

    <!-- Смена пароля -->
    <Modal :visible="actions.isPasswordModalOpen.value" title="Смена пароля" size="sm"
      @update:visible="actions.closeAllModals">
      <UserPasswordModal :user="targetUserValue" @save="handleSavePassword" @close="actions.closeAllModals" />
    </Modal>

    <!-- Подтверждение удаления -->
    <Modal :visible="actions.isDeleteConfirmOpen.value" title="Подтверждение удаления" size="sm"
      @update:visible="actions.closeAllModals">
      <div class="delete-confirm">
        <p>Вы действительно хотите удалить пользователя <strong>{{ deleteConfirmName }}</strong>?</p>
        <p class="delete-warning">⚠️ Это действие нельзя отменить. Все активные сессии будут сброшены.</p>
        <div class="confirm-actions">
          <button class="btn btn--sm" @click="actions.closeAllModals">Отмена</button>
          <button class="btn btn--sm btn--danger" @click="handleDelete" :disabled="isDeleting">
            {{ isDeleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageTitle from '~/components/pages/cabinet/ui/layout/PageTitle.vue'
import Modal from '~/components/pages/cabinet/ui/Modal.vue'
import UserItem from '~/components/pages/cabinet/Admin/Users/UserItem.vue'
import UserFormModal from '~/components/pages/cabinet/Admin/Users/Modals/UserFormModal.vue'
import UserPasswordModal from '~/components/pages/cabinet/Admin/Users/Modals/UserPasswordModal.vue'

import { useUsersStore } from 'stores/users'
import { useUserActions } from '~/composables/useUserActions'
import type { User } from 'stores/users'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'

// 🛡️ Middleware: доступ только авторизованным админам
definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role']
})

const usersStore = useUsersStore()
const actions = useUserActions()

// Инициализация данных при загрузке страницы
await usersStore.init()

// ── Фильтры ────────────────────────────────────────────────────────
const searchQuery = ref('')
const selectedRole = ref<string | null>(null)
const isDeleting = ref(false)

const availableRoles = ['admin', 'manager', 'foreman', 'master', 'worker'] as const
const roleLabels: Record<string, string> = {
  admin: 'Админ',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий'
}

// Клиентская фильтрация (оптимально для <50 записей)
const filteredUsers = computed(() => {
  let list = usersStore.allUsers
  if (selectedRole.value) {
    list = list.filter(u => u.role === selectedRole.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(u =>
      u.name.toLowerCase().includes(q) || u.login.toLowerCase().includes(q)
    )
  }
  return list
})

// ── COMPUTED для безопасной передачи в пропсы (распаковка Ref) ─────
// Заголовок модалки формы
const formModalTitle = computed(() =>
  actions.editingUser.value ? 'Редактирование пользователя' : 'Новый пользователь'
)

// Значение editingUser для пропса (User | null)
const editingUserValue = computed(() => actions.editingUser.value)

// Значение targetUser для пропса (User | null)
const targetUserValue = computed(() => actions.targetUser.value)

// Имя для подтверждения удаления (безопасный доступ)
const deleteConfirmName = computed(() => {
  const user = actions.targetUser.value
  return user ? (user.name || user.login) : '...'
})

// ── Обработчики событий форм ───────────────────────────────────────
async function handleSaveForm(formData: Partial<User> & { password?: string }) {
  try {
    await actions.handleSave(formData)
  } catch (error: any) {
    console.error('Ошибка сохранения формы:', error.message)
  }
}

async function handleSavePassword(newPassword: string) {
  try {
    await actions.handlePasswordChange(newPassword)
  } catch (error: any) {
    console.error('Ошибка смены пароля:', error.message)
  }
}

async function handleDelete() {
  isDeleting.value = true
  try {
    await actions.handleDelete()
  } catch (error: any) {
    console.error('Ошибка удаления:', error.message)
  } finally {
    isDeleting.value = false
  }
}
</script>

<style lang="scss" scoped>
.users-page {
  min-height: 100vh;
  background: var(--crm-bg-base);
  color: var(--crm-text-primary);
  padding-bottom: 40px;
}

// ── Controls ───────────────────────────────────────────────────────
.users-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px;
  background: var(--crm-bg-surface);
  border-bottom: 1px solid var(--crm-border);
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--crm-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 38px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-sm);
  transition: var(--crm-transition);

  &:focus {
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
    outline: none;
  }
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 6px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: 20px;
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-xs);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
    color: var(--crm-text-primary);
  }

  &--active {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);
    font-weight: 600;
  }

  &--clear {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);
    color: var(--crm-danger);
  }
}

.btn--ghost {
  background: transparent;
  border-color: var(--crm-border-hover);
  color: var(--crm-text-secondary);
  
  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
    border-color: var(--crm-border-hover);
  }
}

// ── List & States ──────────────────────────────────────────────────
.users-list {
  padding: 16px 24px;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.state-block {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 0;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-md);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--crm-border-hover);
  border-top-color: var(--crm-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ── Delete Modal ───────────────────────────────────────────────────
.delete-confirm {
  text-align: center;

  p {
    margin: 0 0 8px;
  }

  .delete-warning {
    color: var(--crm-warning);
    font-size: var(--crm-text-xs);
    margin-bottom: 16px;
  }

  .confirm-actions {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    justify-content: center;
  }
}

// ── Buttons ────────────────────────────────────────────────────────
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border-hover);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  cursor: pointer;
  font-size: var(--crm-text-sm);
  font-weight: 500;
  transition: var(--crm-transition);

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    border-color: var(--crm-border-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover:not(:disabled) {
      background: rgba(0, 195, 245, 0.25);
    }
  }

  &--danger {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);
    color: var(--crm-danger);

    &:hover:not(:disabled) {
      background: rgba(242, 95, 92, 0.25);
    }
  }

  &--sm {
    padding: 5px 10px;
    font-size: var(--crm-text-xs);
  }
}

@media (max-width: 767.98px) {
  .users-controls {
    padding: 12px 16px;
  }

  .users-list {
    padding: 12px 16px;
  }
}
</style>