// stores\price\usePriceEditStore.ts
/**
 * ✏️ Edit-стор раздела прайс-листа.
 *
 * Отвечает за:
 * - Inline-редактирование (категории, подкатегории, работы, детали, доп. работы)
 * - Формы добавления новых элементов
 * - Вычисляемое свойство hasUnsavedChanges (для предупреждения при уходе со страницы)
 * - Очистку всех состояний редактирования при размонтировании
 *
 * НЕ зависит от порядка инициализации:
 * usePriceDataStore() вызывается внутри методов (в момент клика пользователя),
 * когда все сторы уже зарегистрированы в Pinia-контейнере.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { usePriceDataStore } from './usePriceDataStore'
import type {
  PriceCategory,
  PriceSubcategory,
  PriceWorkItem,
  PriceDetailItem,
  PriceDopworkItem,
  NewCategoryForm,
  NewSubcategoryForm,
  NewWorkForm,
  NewDetailForm,
  NewDopworkForm,
} from './types'

export const usePriceEditStore = defineStore('price-edit', () => {
  // ========================================
  // 📊 INLINE-РЕДАКТИРОВАНИЕ (ID активного редактируемого элемента)
  // ========================================
  const editingCategoryId = ref<number | null>(null)
  const editingCategoryData = ref<Partial<PriceCategory>>({})

  const editingSubcategoryId = ref<number | null>(null)
  const editingSubcategoryData = ref<Partial<PriceSubcategory>>({})

  const editingItemId = ref<number | null>(null)
  const editingItemData = ref<Partial<PriceWorkItem>>({})

  const editingDetailId = ref<number | null>(null)
  const editingDetailData = ref<Partial<PriceDetailItem>>({})

  const editingDopworkId = ref<number | null>(null)
  const editingDopworkData = ref<Partial<PriceDopworkItem>>({})

  // ========================================
  // 📊 ФОРМЫ ДОБАВЛЕНИЯ (какая форма открыта)
  // ========================================
  const showAddCategoryForm = ref(false)
  const newCategory = ref<NewCategoryForm>({ name: '', pageId: null })

  // ID родителя, к которому привязана форма добавления (или null, если закрыта)
  const showAddSubcategoryForm = ref<number | null>(null)
  const newSubcategory = ref<NewSubcategoryForm>({ name: '', categoryId: 0 })

  const showAddItemForm = ref<number | null>(null)
  const newItem = ref<NewWorkForm>({
    name: '',
    unit: 'м²',
    price: '',
    subCategoryId: 0,
  })

  const showAddDetailForm = ref<number | null>(null)
  const newDetail = ref<NewDetailForm>({
    name: '',
    unit: 'м²',
    price: '',
    itemId: 0,
  })

  const showAddDopworkForm = ref<number | null>(null)
  const newDopwork = ref<NewDopworkForm>({
    label: '',
    dopwork: '',
    unit: 'м²',
    price: '',
    itemId: 0,
  })

  // ========================================
  // 🧮 HAS UNSAVED CHANGES
  // ========================================
  /**
   * Вычисляемое свойство: есть ли несохранённые изменения?
   * Используется в onBeforeRouteLeave и beforeunload для предупреждения.
   */
  const hasUnsavedChanges = computed<boolean>(() => {
    return (
      editingCategoryId.value !== null ||
      editingSubcategoryId.value !== null ||
      editingItemId.value !== null ||
      editingDetailId.value !== null ||
      editingDopworkId.value !== null ||
      showAddCategoryForm.value === true ||
      showAddSubcategoryForm.value !== null ||
      showAddItemForm.value !== null ||
      showAddDetailForm.value !== null ||
      showAddDopworkForm.value !== null
    )
  })

  // ========================================
  // 🎯 МЕТОДЫ INLINE-РЕДАКТИРОВАНИЯ
  // ========================================

  // --- Категории ---
  const startEditCategory = (category: PriceCategory) => {
    editingCategoryId.value = category.id
    editingCategoryData.value = { ...category }
  }

  const saveEditCategory = async () => {
    if (!editingCategoryId.value) return
    try {
      await usePriceDataStore().updateCategory(
        editingCategoryId.value,
        editingCategoryData.value,
      )
      cancelEditCategory()
    } catch (err) {
      console.error('Ошибка сохранения категории:', err)
    }
  }

  const cancelEditCategory = () => {
    editingCategoryId.value = null
    editingCategoryData.value = {}
  }

  // --- Подкатегории ---
  const startEditSubcategory = (subcategory: PriceSubcategory) => {
    editingSubcategoryId.value = subcategory.id
    editingSubcategoryData.value = { ...subcategory }
  }

  const saveEditSubcategory = async () => {
    if (!editingSubcategoryId.value) return
    try {
      await usePriceDataStore().updateSubcategory(
        editingSubcategoryId.value,
        editingSubcategoryData.value,
      )
      cancelEditSubcategory()
    } catch (err) {
      console.error('Ошибка сохранения подкатегории:', err)
    }
  }

  const cancelEditSubcategory = () => {
    editingSubcategoryId.value = null
    editingSubcategoryData.value = {}
  }

  // --- Работы ---
  const startEditItem = (item: PriceWorkItem) => {
    editingItemId.value = item.id
    editingItemData.value = { ...item }
  }

  const saveEditItem = async () => {
    if (!editingItemId.value) return
    try {
      await usePriceDataStore().updateItem(editingItemId.value, editingItemData.value)
      cancelEditItem()
    } catch (err) {
      console.error('Ошибка сохранения работы:', err)
    }
  }

  const cancelEditItem = () => {
    editingItemId.value = null
    editingItemData.value = {}
  }

  // --- Детали ---
  const startEditDetail = (detail: PriceDetailItem) => {
    editingDetailId.value = detail.id
    editingDetailData.value = { ...detail }
  }

  const saveEditDetail = async () => {
    if (!editingDetailId.value) return
    try {
      await usePriceDataStore().updateDetail(editingDetailId.value, editingDetailData.value)
      cancelEditDetail()
    } catch (err) {
      console.error('Ошибка сохранения детали:', err)
    }
  }

  const cancelEditDetail = () => {
    editingDetailId.value = null
    editingDetailData.value = {}
  }

  // --- Доп. работы ---
  const startEditDopwork = (dopwork: PriceDopworkItem) => {
    editingDopworkId.value = dopwork.id
    editingDopworkData.value = { ...dopwork }
  }

  const saveEditDopwork = async () => {
    if (!editingDopworkId.value) return
    try {
      await usePriceDataStore().updateDopwork(
        editingDopworkId.value,
        editingDopworkData.value,
      )
      cancelEditDopwork()
    } catch (err) {
      console.error('Ошибка сохранения доп. работы:', err)
    }
  }

  const cancelEditDopwork = () => {
    editingDopworkId.value = null
    editingDopworkData.value = {}
  }

  // ========================================
  // 🎯 МЕТОДЫ ДОБАВЛЕНИЯ
  // ========================================

  // --- Категории ---
  const showAddCategory = (pageId: number) => {
    showAddCategoryForm.value = true
    newCategory.value = { name: '', pageId }
  }

  const addCategory = async () => {
    if (!newCategory.value.name || !newCategory.value.pageId) return
    try {
      await usePriceDataStore().addCategory(newCategory.value.pageId, newCategory.value.name)
      cancelAddCategory()
    } catch (err) {
      console.error('Ошибка добавления категории:', err)
    }
  }

  const cancelAddCategory = () => {
    showAddCategoryForm.value = false
    newCategory.value = { name: '', pageId: null }
  }

  // --- Подкатегории ---
  const showAddSubcategory = (categoryId: number) => {
    showAddSubcategoryForm.value = categoryId
    newSubcategory.value = { name: '', categoryId }
  }

  const addSubcategory = async () => {
    if (!newSubcategory.value.name || !newSubcategory.value.categoryId) return
    try {
      await usePriceDataStore().addSubcategory(
        newSubcategory.value.categoryId,
        newSubcategory.value.name,
      )
      cancelAddSubcategory()
    } catch (err) {
      console.error('Ошибка добавления подкатегории:', err)
    }
  }

  const cancelAddSubcategory = () => {
    showAddSubcategoryForm.value = null
    newSubcategory.value = { name: '', categoryId: 0 }
  }

  // --- Работы ---
  const showAddItem = (subcategoryId: number) => {
    showAddItemForm.value = subcategoryId
    newItem.value = {
      name: '',
      unit: 'м²',
      price: '',
      subCategoryId: subcategoryId,
    }
  }

  const addItem = async () => {
    if (!newItem.value.name || !newItem.value.subCategoryId) return
    try {
      await usePriceDataStore().addItem(newItem.value.subCategoryId, {
        name: newItem.value.name,
        unit: newItem.value.unit,
        price: newItem.value.price,
        subCategoryId: newItem.value.subCategoryId,
      })
      cancelAddItem()
    } catch (err) {
      console.error('Ошибка добавления работы:', err)
    }
  }

  const cancelAddItem = () => {
    showAddItemForm.value = null
    newItem.value = {
      name: '',
      unit: 'м²',
      price: '',
      subCategoryId: 0,
    }
  }

  // --- Детали ---
  const showAddDetail = (itemId: number) => {
    showAddDetailForm.value = itemId
    newDetail.value = {
      name: '',
      unit: 'м²',
      price: '',
      itemId,
    }
  }

  const addDetail = async () => {
    if (!newDetail.value.name || !newDetail.value.itemId) return
    try {
      await usePriceDataStore().addDetail(newDetail.value.itemId, {
        name: newDetail.value.name,
        unit: newDetail.value.unit,
        price: newDetail.value.price,
        itemId: newDetail.value.itemId,
      })
      cancelAddDetail()
    } catch (err) {
      console.error('Ошибка добавления детали:', err)
    }
  }

  const cancelAddDetail = () => {
    showAddDetailForm.value = null
    newDetail.value = {
      name: '',
      unit: 'м²',
      price: '',
      itemId: 0,
    }
  }

  // --- Доп. работы ---
  const showAddDopwork = (itemId: number) => {
    showAddDopworkForm.value = itemId
    newDopwork.value = {
      label: '',
      dopwork: '',
      unit: 'м²',
      price: '',
      itemId,
    }
  }

  const addDopwork = async () => {
    if (!newDopwork.value.dopwork || !newDopwork.value.itemId) return
    try {
      await usePriceDataStore().addDopwork(newDopwork.value.itemId, {
        label: newDopwork.value.label,
        dopwork: newDopwork.value.dopwork,
        unit: newDopwork.value.unit,
        price: newDopwork.value.price,
        itemId: newDopwork.value.itemId,
      })
      cancelAddDopwork()
    } catch (err) {
      console.error('Ошибка добавления доп. работы:', err)
    }
  }

  const cancelAddDopwork = () => {
    showAddDopworkForm.value = null
    newDopwork.value = {
      label: '',
      dopwork: '',
      unit: 'м²',
      price: '',
      itemId: 0,
    }
  }

  // ========================================
  // 🗑️ УДАЛЕНИЕ (через DataStore с оптимистичным обновлением)
  // ========================================
  const deleteCategory = async (id: number) => {
    if (!confirm('Удалить эту категорию и все её подкатегории?')) return
    try {
      await usePriceDataStore().removeCategory(id)
    } catch (err) {
      console.error('Ошибка удаления категории:', err)
    }
  }

  const deleteSubcategory = async (id: number) => {
    if (!confirm('Удалить эту подкатегорию и все её работы?')) return
    try {
      await usePriceDataStore().removeSubcategory(id)
    } catch (err) {
      console.error('Ошибка удаления подкатегории:', err)
    }
  }

  const deleteItem = async (id: number) => {
    if (!confirm('Удалить эту работу?')) return
    try {
      await usePriceDataStore().removeItem(id)
    } catch (err) {
      console.error('Ошибка удаления работы:', err)
    }
  }

  const deleteDetail = async (id: number) => {
    if (!confirm('Удалить эту деталь?')) return
    try {
      await usePriceDataStore().removeDetail(id)
    } catch (err) {
      console.error('Ошибка удаления детали:', err)
    }
  }

  const deleteDopwork = async (id: number) => {
    if (!confirm('Удалить эту доп. работу?')) return
    try {
      await usePriceDataStore().removeDopwork(id)
    } catch (err) {
      console.error('Ошибка удаления доп. работы:', err)
    }
  }

  // ========================================
  // 🧹 ОЧИСТКА ВСЕХ СОСТОЯНИЙ
  // ========================================
  /**
   * Сбрасывает ВСЕ состояния редактирования и формы добавления.
   * Вызывается при размонтировании страницы.
   */
  const clearAllEditStates = () => {
    cancelEditCategory()
    cancelEditSubcategory()
    cancelEditItem()
    cancelEditDetail()
    cancelEditDopwork()
    cancelAddCategory()
    cancelAddSubcategory()
    cancelAddItem()
    cancelAddDetail()
    cancelAddDopwork()
  }

  // ========================================
  // 🎁 ПУБЛИЧНЫЙ API
  // ========================================
  return {
    // Inline редактирование
    editingCategoryId,
    editingCategoryData,
    editingSubcategoryId,
    editingSubcategoryData,
    editingItemId,
    editingItemData,
    editingDetailId,
    editingDetailData,
    editingDopworkId,
    editingDopworkData,

    // Формы добавления
    showAddCategoryForm,
    newCategory,
    showAddSubcategoryForm,
    newSubcategory,
    showAddItemForm,
    newItem,
    showAddDetailForm,
    newDetail,
    showAddDopworkForm,
    newDopwork,

    // Вычисляемые
    hasUnsavedChanges,

    // Inline методы
    startEditCategory,
    saveEditCategory,
    cancelEditCategory,
    startEditSubcategory,
    saveEditSubcategory,
    cancelEditSubcategory,
    startEditItem,
    saveEditItem,
    cancelEditItem,
    startEditDetail,
    saveEditDetail,
    cancelEditDetail,
    startEditDopwork,
    saveEditDopwork,
    cancelEditDopwork,

    // Методы добавления
    showAddCategory,
    addCategory,
    cancelAddCategory,
    showAddSubcategory,
    addSubcategory,
    cancelAddSubcategory,
    showAddItem,
    addItem,
    cancelAddItem,
    showAddDetail,
    addDetail,
    cancelAddDetail,
    showAddDopwork,
    addDopwork,
    cancelAddDopwork,

    // Удаление
    deleteCategory,
    deleteSubcategory,
    deleteItem,
    deleteDetail,
    deleteDopwork,

    // Общие
    clearAllEditStates,
  }
})
