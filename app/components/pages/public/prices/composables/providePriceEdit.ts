// app/components/pages/public/prices/composables/providePriceEdit.ts
/**
 * Провайдер состояния редактирования прайс-листа.
 * 
 * Отвечает за:
 * - Inline-редактирование (категории, подкатегории, работы, детали, доп. работы)
 * - Формы добавления новых элементов
 * - Вычисляемое свойство hasUnsavedChanges (для предупреждения при навигации)
 * - Очистку состояний редактирования
 * 
 * НЕ зависит от порядка вызова providePriceData() —
 * usePriceData() инжектится только в обработчиках событий (в момент клика пользователя).
 */

import { ref, computed, provide, inject, type ComputedRef } from 'vue'
import { usePriceData } from './providePriceData'
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
  NewDopworkForm
} from './types'
import type { Ref } from 'vue'

// ========================================
// 🔑 КЛЮЧ ДЛЯ PROVIDE/INJECT
// ========================================

export const PRICE_EDIT_KEY = Symbol('priceEdit')

// ========================================
// 📋 ТИП КОНТЕКСТА
// ========================================

export interface PriceEditContext {
  // === Inline редактирование ===
  editingCategoryId: Ref<number | null>
  editingCategoryData: Ref<Partial<PriceCategory>>
  
  editingSubcategoryId: Ref<number | null>
  editingSubcategoryData: Ref<Partial<PriceSubcategory>>
  
  editingItemId: Ref<number | null>
  editingItemData: Ref<Partial<PriceWorkItem>>
  
  editingDetailId: Ref<number | null>
  editingDetailData: Ref<Partial<PriceDetailItem>>
  
  editingDopworkId: Ref<number | null>
  editingDopworkData: Ref<Partial<PriceDopworkItem>>
  
  // === Формы добавления ===
  showAddCategoryForm: Ref<boolean>
  newCategory: Ref<NewCategoryForm>
  
  showAddSubcategoryForm: Ref<number | null>
  newSubcategory: Ref<NewSubcategoryForm>
  
  showAddItemForm: Ref<number | null>
  newItem: Ref<NewWorkForm>
  
  showAddDetailForm: Ref<number | null>
  newDetail: Ref<NewDetailForm>
  
  showAddDopworkForm: Ref<number | null>
  newDopwork: Ref<NewDopworkForm>
  
  // === Вычисляемые свойства ===
  hasUnsavedChanges: ComputedRef<boolean>
  
  // === Методы inline-редактирования ===
  startEditCategory: (category: PriceCategory) => void
  saveEditCategory: () => Promise<void>
  cancelEditCategory: () => void
  
  startEditSubcategory: (subcategory: PriceSubcategory) => void
  saveEditSubcategory: () => Promise<void>
  cancelEditSubcategory: () => void
  
  startEditItem: (item: PriceWorkItem) => void
  saveEditItem: () => Promise<void>
  cancelEditItem: () => void
  
  startEditDetail: (detail: PriceDetailItem) => void
  saveEditDetail: () => Promise<void>
  cancelEditDetail: () => void
  
  startEditDopwork: (dopwork: PriceDopworkItem) => void
  saveEditDopwork: () => Promise<void>
  cancelEditDopwork: () => void
  
  // === Методы добавления ===
  showAddCategory: (pageId: number) => void
  addCategory: () => Promise<void>
  cancelAddCategory: () => void
  
  showAddSubcategory: (categoryId: number) => void
  addSubcategory: () => Promise<void>
  cancelAddSubcategory: () => void
  
  showAddItem: (subcategoryId: number) => void
  addItem: () => Promise<void>
  cancelAddItem: () => void
  
  showAddDetail: (itemId: number) => void
  addDetail: () => Promise<void>
  cancelAddDetail: () => void
  
  showAddDopwork: (itemId: number) => void
  addDopwork: () => Promise<void>
  cancelAddDopwork: () => void
  
  // === Удаление ===
  deleteCategory: (id: number) => Promise<void>
  deleteSubcategory: (id: number) => Promise<void>
  deleteItem: (id: number) => Promise<void>
  deleteDetail: (id: number) => Promise<void>
  deleteDopwork: (id: number) => Promise<void>
  
  // === Общие методы ===
  clearAllEditStates: () => void
}

// ========================================
// 🏗️ ПРОВЕЙДЕР
// ========================================

export function providePriceEdit(): PriceEditContext {
  // ❌ НЕ инжектим PriceDataContext здесь!
  // usePriceData() будет вызываться внутри методов (в момент клика пользователя),
  // когда оба провайдера уже зарегистрированы.
  // Это убирает зависимость от порядка вызова provide.
  
  // ========================================
  // 📊 INLINE-РЕДАКТИРОВАНИЕ
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
  // 📊 ФОРМЫ ДОБАВЛЕНИЯ
  // ========================================
  
  const showAddCategoryForm = ref(false)
  const newCategory = ref<NewCategoryForm>({ name: '', pageId: null })
  
  const showAddSubcategoryForm = ref<number | null>(null)
  const newSubcategory = ref<NewSubcategoryForm>({ name: '', categoryId: 0 })
  
  const showAddItemForm = ref<number | null>(null)
  const newItem = ref<NewWorkForm>({
    name: '',
    unit: 'м²',
    price: '',
    subCategoryId: 0
  })
  
  const showAddDetailForm = ref<number | null>(null)
  const newDetail = ref<NewDetailForm>({
    name: '',
    unit: 'м²',
    price: '',
    itemId: 0
  })
  
  const showAddDopworkForm = ref<number | null>(null)
  const newDopwork = ref<NewDopworkForm>({
    label: '',
    dopwork: '',
    unit: 'м²',
    price: '',
    itemId: 0
  })
  
  // ========================================
  // 🧮 HAS UNSAVED CHANGES
  // ========================================
  
  const hasUnsavedChanges = computed(() => {
    return (
      editingCategoryId.value !== null ||
      editingSubcategoryId.value !== null ||
      editingItemId.value !== null ||
      editingDetailId.value !== null ||
      editingDopworkId.value !== null ||
      showAddCategoryForm.value ||
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
      await usePriceData().updateCategory(editingCategoryId.value, editingCategoryData.value)
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
      await usePriceData().updateSubcategory(editingSubcategoryId.value, editingSubcategoryData.value)
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
      await usePriceData().updateItem(editingItemId.value, editingItemData.value)
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
      await usePriceData().updateDetail(editingDetailId.value, editingDetailData.value)
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
      await usePriceData().updateDopwork(editingDopworkId.value, editingDopworkData.value)
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
      await usePriceData().addCategory(newCategory.value.pageId, newCategory.value.name)
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
      await usePriceData().addSubcategory(newSubcategory.value.categoryId, newSubcategory.value.name)
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
      subCategoryId: subcategoryId
    }
  }
  
  const addItem = async () => {
    if (!newItem.value.name || !newItem.value.subCategoryId) return
    try {
      await usePriceData().addItem(newItem.value.subCategoryId, {
        name: newItem.value.name,
        unit: newItem.value.unit,
        price: newItem.value.price,
        subCategoryId: newItem.value.subCategoryId
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
      subCategoryId: 0
    }
  }
  
  // --- Детали ---
  const showAddDetail = (itemId: number) => {
    showAddDetailForm.value = itemId
    newDetail.value = {
      name: '',
      unit: 'м²',
      price: '',
      itemId
    }
  }
  
  const addDetail = async () => {
    if (!newDetail.value.name || !newDetail.value.itemId) return
    try {
      await usePriceData().addDetail(newDetail.value.itemId, {
        name: newDetail.value.name,
        unit: newDetail.value.unit,
        price: newDetail.value.price,
        itemId: newDetail.value.itemId
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
      itemId: 0
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
      itemId
    }
  }
  
  const addDopwork = async () => {
    if (!newDopwork.value.dopwork || !newDopwork.value.itemId) return
    try {
      await usePriceData().addDopwork(newDopwork.value.itemId, {
        label: newDopwork.value.label,
        dopwork: newDopwork.value.dopwork,
        unit: newDopwork.value.unit,
        price: newDopwork.value.price,
        itemId: newDopwork.value.itemId
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
      itemId: 0
    }
  }
  
  // ========================================
  // 🗑️ УДАЛЕНИЕ
  // ========================================
  
  const deleteCategory = async (id: number) => {
    if (!confirm('Удалить эту категорию и все её подкатегории?')) return
    try {
      await usePriceData().removeCategory(id)
    } catch (err) {
      console.error('Ошибка удаления категории:', err)
    }
  }
  
  const deleteSubcategory = async (id: number) => {
    if (!confirm('Удалить эту подкатегорию и все её работы?')) return
    try {
      await usePriceData().removeSubcategory(id)
    } catch (err) {
      console.error('Ошибка удаления подкатегории:', err)
    }
  }
  
  const deleteItem = async (id: number) => {
    if (!confirm('Удалить эту работу?')) return
    try {
      await usePriceData().removeItem(id)
    } catch (err) {
      console.error('Ошибка удаления работы:', err)
    }
  }
  
  const deleteDetail = async (id: number) => {
    if (!confirm('Удалить эту деталь?')) return
    try {
      await usePriceData().removeDetail(id)
    } catch (err) {
      console.error('Ошибка удаления детали:', err)
    }
  }
  
  const deleteDopwork = async (id: number) => {
    if (!confirm('Удалить эту доп. работу?')) return
    try {
      await usePriceData().removeDopwork(id)
    } catch (err) {
      console.error('Ошибка удаления доп. работы:', err)
    }
  }
  
  // ========================================
  // 🧹 ОЧИСТКА ВСЕХ СОСТОЯНИЙ
  // ========================================
  
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
  
  const context: PriceEditContext = {
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
    clearAllEditStates
  }
  
  provide(PRICE_EDIT_KEY, context)
  
  return context
}

// ========================================
// 📥 ХУК ДЛЯ ПОЛУЧЕНИЯ КОНТЕКСТА
// ========================================

export function usePriceEdit(): PriceEditContext {
  const context = inject<PriceEditContext>(PRICE_EDIT_KEY)
  if (!context) {
    throw new Error(
      'usePriceEdit: контекст не найден. ' +
      'Убедитесь, что providePriceEdit() вызван в родительском компоненте.'
    )
  }
  return context
}
