// app/composables/useContractorActions.ts
import { ref } from 'vue'
import type { ContractorType, ContractorDTO } from '~/types/contractors'
import { useContractors } from '~/composables/useContractors'

export function useContractorActions(type: ContractorType) {
  const { fetchAll, getByType, create, update, deleteContractor } = useContractors()

  // ── Состояние модалок ──────────────────────────────────────────────
  const isFormModalOpen = ref(false)
  const isDeleteConfirmOpen = ref(false)
  const editingContractor = ref<ContractorDTO | null>(null)
  const targetContractor = ref<ContractorDTO | null>(null)

  // ── Внутренние логи (строго на русском) ────────────────────────────
  function logInfo(msg: string) {
    console.log(`[ContractorActions:${type}] ℹ️ ${msg}`)
  }
  function logError(msg: string, err?: any) {
    console.error(`[ContractorActions:${type}] ❌ ${msg}`, err)
  }

  // ── Управление окнами ──────────────────────────────────────────────
  function openCreateModal() {
    editingContractor.value = null
    isFormModalOpen.value = true
    logInfo('Открыта модалка создания контрагента')
  }

  function openEditModal(contractor: ContractorDTO) {
    editingContractor.value = { ...contractor }
    isFormModalOpen.value = true
    logInfo(`Открыта модалка редактирования: ${contractor.name}`)
  }

  function openDeleteConfirm(contractor: ContractorDTO) {
    targetContractor.value = contractor
    isDeleteConfirmOpen.value = true
    logInfo(`Открыто подтверждение удаления: ${contractor.name}`)
  }

  function closeAllModals() {
    isFormModalOpen.value = false
    isDeleteConfirmOpen.value = false
    editingContractor.value = null
    targetContractor.value = null
    logInfo('Все модальные окна закрыты')
  }

  // ── Сохранение (Создание / Обновление) ─────────────────────────────
  async function handleSave(formData: Partial<ContractorDTO>) {
    logInfo('Сохранение контрагента...')
    try {
      let saved: ContractorDTO

      if (editingContractor.value) {
        // Обновление
        logInfo(`Обновление контрагента ID: ${editingContractor.value.id}`)
        saved = await update(type, editingContractor.value.id, formData)
        logInfo(`Контрагент обновлен: ${saved.name}`)
      } else {
        // Создание
        logInfo('Создание нового контрагента...')
        const response = await create(type, formData as any)
        saved = response
        logInfo(`Контрагент создан: ${saved.name}`)
      }

      closeAllModals()
      return saved
    } catch (error: any) {
      const msg = error.data?.statusMessage || error.message || 'Ошибка при сохранении'
      logError(msg, error)
      throw new Error(msg)
    }
  }

  // ── Удаление ───────────────────────────────────────────────────────
  async function handleDelete() {
    if (!targetContractor.value) {
      const msg = 'Не выбран контрагент для удаления'
      logError(msg)
      throw new Error(msg)
    }

    logInfo(`Удаление контрагента: ${targetContractor.value.name} (ID: ${targetContractor.value.id})`)
    try {
      await deleteContractor(type, targetContractor.value.id)
      closeAllModals()
      logInfo(`Контрагент "${targetContractor.value.name}" успешно удален`)
    } catch (error: any) {
      const msg = error.data?.statusMessage || 'Ошибка при удалении'
      logError(msg, error)
      throw new Error(msg)
    }
  }

  // ── Загрузка списка ────────────────────────────────────────────────
  async function loadContractors() {
    try {
      await fetchAll(type)
      logInfo(`Загружено ${getByType(type).length} контрагентов`)
    } catch (err: any) {
      logError('Ошибка загрузки списка', err)
      throw err
    }
  }

  return {
    // State
    isFormModalOpen,
    isDeleteConfirmOpen,
    editingContractor,
    targetContractor,
    // Data
    contractors: getByType(type),
    // Actions
    openCreateModal,
    openEditModal,
    openDeleteConfirm,
    closeAllModals,
    handleSave,
    handleDelete,
    loadContractors
  }
}
