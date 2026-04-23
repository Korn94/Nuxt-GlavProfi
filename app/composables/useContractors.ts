// app/composables/useContractors.ts
import { ref, readonly, computed } from 'vue'
import type { ContractorType, ContractorDTO, ContractorCreateInput, ContractorUpdateInput } from '~/types/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'

/**
 * Composable для работы с контрагентами
 * 
 * Использование:
 * const { contractors, loading, error, fetchAll, fetchOne, create, update, deleteContractor } = useContractors()
 */
export const useContractors = () => {
  // ✅ Использовать Record вместо mapped type
  const contractorsData = ref<Record<ContractorType, ContractorDTO[]>>({
    master: [],
    worker: [],
    foreman: [],
    office: []
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Получить всех контрагентов определённого типа
   * ✅ ДОБАВЛЕНО: параметр activeOnly (по умолчанию true — только активные)
   */
  async function fetchAll(type: ContractorType, activeOnly = true) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        type: ContractorType
        count: number
        contractors: ContractorDTO[]
      }>(`/api/contractors/${type}?activeOnly=${activeOnly}`)
      
      contractorsData.value[type] = response.contractors
      return response.contractors
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Failed to fetch contractors'
      console.error(`Error fetching ${type} contractors:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Получить одного контрагента
   */
  async function fetchOne(type: ContractorType, id: number) {
    loading.value = true
    error.value = null

    try {
      const contractor = await $fetch<ContractorDTO>(`/api/contractors/${type}/${id}`)
      
      // Обновляем в локальном кэше
      const list = contractorsData.value[type] || []
      const idx = list.findIndex((c: ContractorDTO) => c.id === id)
      
      if (idx >= 0) {
        list[idx] = contractor
      } else {
        list.push(contractor)
      }
      
      contractorsData.value[type] = [...list]
      return contractor
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Failed to fetch contractor'
      console.error(`Error fetching contractor:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Создать нового контрагента
   */
  async function create(type: ContractorType, input: ContractorCreateInput) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        statusCode: number
        contractor: ContractorDTO
      }>(`/api/contractors/${type}`, {
        method: 'POST',
        body: input
      })

      const newContractor = response.contractor
      const list = contractorsData.value[type] || []
      contractorsData.value[type] = [...list, newContractor]

      return newContractor
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Failed to create contractor'
      console.error(`Error creating contractor:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Обновить контрагента
   */
  async function update(type: ContractorType, id: number, input: ContractorUpdateInput) {
    loading.value = true
    error.value = null

    try {
      const updated = await $fetch<ContractorDTO>(
        `/api/contractors/${type}/${id}`,
        {
          method: 'PUT',
          body: input
        }
      )

      // Обновляем кэш
      const list = contractorsData.value[type] || []
      const idx = list.findIndex((c: ContractorDTO) => c.id === id)
      
      if (idx >= 0) {
        list[idx] = updated
        contractorsData.value[type] = [...list]
      }

      return updated
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Failed to update contractor'
      console.error(`Error updating contractor:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Удалить контрагента
   */
  async function deleteContractor(type: ContractorType, id: number) {
    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/contractors/${type}/${id}`, {
        method: 'DELETE'
      })

      // Удаляем из кэша
      const list = contractorsData.value[type] || []
      contractorsData.value[type] = list.filter((c: ContractorDTO) => c.id !== id)
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Failed to delete contractor'
      console.error(`Error deleting contractor:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Получить контрагентов по типу из кэша
   */
  const getByType = (type: ContractorType): ContractorDTO[] => {
    return contractorsData.value[type] || []
  }

  /**
   * Получить контрагента по типу и ID из кэша
   */
  const getById = (type: ContractorType, id: number): ContractorDTO | undefined => {
    return contractorsData.value[type]?.find((c: ContractorDTO) => c.id === id)
  }

  /**
   * Очистить кэш определённого типа
   */
  function clearCache(type?: ContractorType) {
    if (type) {
      contractorsData.value[type] = []
    } else {
      contractorsData.value = {
        master: [],
        worker: [],
        foreman: [],
        office: []
      }
    }
  }

  return {
    // State (readonly)
    contractors: readonly(contractorsData),
    loading: readonly(loading),
    error: readonly(error),
    
    // Methods
    fetchAll,
    fetchOne,
    create,
    update,
    deleteContractor,
    getByType,
    getById,
    clearCache
  }
}
