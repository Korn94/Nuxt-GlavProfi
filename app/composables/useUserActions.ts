// app/composables/useUserActions.ts
import { ref } from 'vue'
import type { User } from 'stores/users'
import { useUsersStore } from 'stores/users'

export function useUserActions() {
  const usersStore = useUsersStore()

  // ── Состояние модалок ──────────────────────────────────────────────
  const isFormModalOpen = ref(false)
  const isPasswordModalOpen = ref(false)
  const isDeleteConfirmOpen = ref(false)
  const editingUser = ref<User | null>(null)
  const targetUser = ref<User | null>(null)

  // ── Внутренние логи (строго на русском) ─────────────────────────────
  function logInfo(msg: string) {
    console.log(`[UserActions] ℹ️ ${msg}`)
  }
  function logError(msg: string, err?: any) {
    console.error(`[UserActions] ❌ ${msg}`, err)
  }

  // ── Управление окнами ──────────────────────────────────────────────
  function openCreateModal() {
    editingUser.value = null
    isFormModalOpen.value = true
    logInfo('Открыта модалка создания пользователя')
  }

  function openEditModal(user: User) {
    editingUser.value = { ...user }
    isFormModalOpen.value = true
    logInfo(`Открыта модалка редактирования: ${user.login}`)
  }

  function openPasswordModal(user: User) {
    targetUser.value = user
    isPasswordModalOpen.value = true
    logInfo(`Открыта модалка смены пароля: ${user.login}`)
  }

  function openDeleteConfirm(user: User) {
    targetUser.value = user
    isDeleteConfirmOpen.value = true
    logInfo(`Открыто подтверждение удаления: ${user.login}`)
  }

  function closeAllModals() {
    isFormModalOpen.value = false
    isPasswordModalOpen.value = false
    isDeleteConfirmOpen.value = false
    editingUser.value = null
    targetUser.value = null
    logInfo('Все модальные окна закрыты')
  }

  // ── Сохранение (Создание / Обновление) ─────────────────────────────
  async function handleSave(formData: Partial<User> & { password?: string }) {
    logInfo('Сохранение пользователя...')
    try {
      let savedUser: User

      if (editingUser.value) {
        // Обновление существующего
        logInfo(`Обновление пользователя ID: ${editingUser.value.id}`)
        savedUser = await $fetch<User>(`/api/users/${editingUser.value.id}`, {
          method: 'PUT',
          body: formData
        })
        logInfo(`Пользователь обновлен: ${savedUser.login}`)
      } else {
        // Создание нового
        logInfo('Создание нового пользователя...')
        savedUser = await $fetch<User>('/api/users', {
          method: 'POST',
          body: formData
        })
        logInfo(`Пользователь создан: ${savedUser.login}`)
      }

      // Обновляем кэш стора
      usersStore.updateUserInCache(savedUser)
      closeAllModals()
      return savedUser
    } catch (error: any) {
      const msg = error.data?.message || error.statusMessage || 'Ошибка при сохранении пользователя'
      logError(msg, error)
      throw new Error(msg)
    }
  }

  // ── Смена пароля ───────────────────────────────────────────────────
  async function handlePasswordChange(newPassword: string) {
    if (!targetUser.value) {
      const msg = 'Не выбран пользователь для смены пароля'
      logError(msg)
      throw new Error(msg)
    }

    logInfo(`Смена пароля для ID: ${targetUser.value.id}`)
    try {
      const updatedUser = await $fetch<User>(`/api/users/${targetUser.value.id}`, {
        method: 'PUT',
        body: { password: newPassword }
      })

      usersStore.updateUserInCache(updatedUser)
      closeAllModals()
      logInfo('Пароль успешно изменен')
      return updatedUser
    } catch (error: any) {
      const msg = error.data?.message || 'Ошибка при смене пароля'
      logError(msg, error)
      throw new Error(msg)
    }
  }

  // ── Удаление ───────────────────────────────────────────────────────
  async function handleDelete() {
    if (!targetUser.value) {
      const msg = 'Не выбран пользователь для удаления'
      logError(msg)
      throw new Error(msg)
    }

    logInfo(`Удаление пользователя ID: ${targetUser.value.id} (${targetUser.value.login})`)
    try {
      await $fetch(`/api/users/${targetUser.value.id}`, {
        method: 'DELETE'
      })

      // Принудительно обновляем список в сторе для синхронизации
      await usersStore.fetchUsers(true)

      closeAllModals()
      logInfo(`Пользователь ${targetUser.value.login} успешно удален`)
    } catch (error: any) {
      const msg = error.data?.message || 'Ошибка при удалении пользователя'
      logError(msg, error)
      throw new Error(msg)
    }
  }

  return {
    // State
    isFormModalOpen,
    isPasswordModalOpen,
    isDeleteConfirmOpen,
    editingUser,
    targetUser,
    // Actions
    openCreateModal,
    openEditModal,
    openPasswordModal,
    openDeleteConfirm,
    closeAllModals,
    handleSave,
    handlePasswordChange,
    handleDelete
  }
}
