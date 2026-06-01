// app/components/pages/public/prices/composables/usePriceActions.ts
import { ref, type Ref } from 'vue'
import type { PriceWorkItem, PriceDetailItem, PriceDopworkItem, PriceCategory } from './usePriceData'

// Типы для форм добавления
export interface NewCategory {
  name: string
  pageId: number | null
}

export interface NewSubItem {
  name: string
}

export interface NewWork {
  name: string
  unit: string
  price: string | number
  subCategoryId: number | null
}

export interface NewDetail {
  name: string
  unit: string
  price: string | number
  itemId: number | null
}

export interface NewDopwork {
  label: string
  dopwork: string
  unit: string
  price: string | number
  itemId: number | null
}

export function usePriceActions(
  works: Ref<PriceCategory[]>,
  refresh: () => Promise<void>
) {
  // === Состояния редактирования ===
  const editingCategoryId = ref<number | null>(null)
  const editingCategoryData = ref<Partial<PriceCategory>>({})
  
  const editingSubCategoryId = ref<number | null>(null)
  const editingSubCategoryData = ref<{ name?: string }>({})
  
  const editingItemId = ref<number | null>(null)
  const editingItemData = ref<Partial<PriceWorkItem>>({})
  
  const editingDetailId = ref<number | null>(null)
  const editingDetailData = ref<Partial<PriceDetailItem>>({})
  
  const editingDopworkId = ref<number | null>(null)
  const editingDopworkData = ref<Partial<PriceDopworkItem>>({})

  // === Состояния форм добавления ===
  const showCategoryForm = ref(false)
  const newCategory = ref<NewCategory>({ name: '', pageId: null })
  
  const openSubItemForms = ref<Record<number, boolean>>({})
  const newSubItem = ref<NewSubItem>({ name: '' })
  
  const showWorkFormFor = ref<number | null>(null)
  const newWorkForSubcategory = ref<Record<number, NewWork>>({})
  
  const showDetailFormFor = ref<number | null>(null)
  const newDetail = ref<NewDetail>({ name: '', unit: 'м²', price: '', itemId: null })
  
  const showDopworkFormFor = ref<number | null>(null)
  const newDopwork = ref<NewDopwork>({ label: '', dopwork: '', unit: 'м²', price: '', itemId: null })

  // === Утилиты ===
  
  const showAlert = (message: string) => {
    // Можно заменить на кастомные уведомления
    alert(message)
  }

  // === КАТЕГОРИИ ===
  
  const startEditingCategory = (category: PriceCategory) => {
    editingCategoryId.value = category.id
    editingCategoryData.value = { ...category }
  }

  const saveEditCategory = async (categoryId: number) => {
    try {
      await $fetch(`/api/price/categories/${categoryId}`, {
        method: 'PUT',
        body: editingCategoryData.value
      })
      editingCategoryId.value = null
      editingCategoryData.value = {}
      await refresh()
    } catch (error) {
      showAlert('Ошибка при сохранении категории')
      console.error(error)
    }
  }

  const deleteCategory = async (categoryId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return
    try {
      await $fetch(`/api/price/categories/${categoryId}`, { method: 'DELETE' })
      await refresh()
    } catch (error) {
      showAlert('Ошибка при удалении категории')
      console.error(error)
    }
  }

  const addNewCategory = async (activeCategory: string) => {
    const categoryToPageMap: Record<string, number> = {
      floor: 1, walls: 2, ceiling: 3,
      plumbing: 4, electricity: 5, other: 6
    }
    newCategory.value.pageId = categoryToPageMap[activeCategory] || null

    try {
      await $fetch('/api/price/categories', {
        method: 'POST',
        body: newCategory.value
      })
      showCategoryForm.value = false
      newCategory.value = { name: '', pageId: null }
      await refresh()
    } catch (error) {
      showAlert('Ошибка при добавлении категории')
      console.error(error)
    }
  }

  // === ПОДКАТЕГОРИИ ===
  
  const startEditingSubCategory = (subcategory: { id: number; name: string }) => {
    editingSubCategoryId.value = subcategory.id
    editingSubCategoryData.value = { ...subcategory }
  }

  const saveEditSubCategory = async (subcategoryId: number) => {
    try {
      await $fetch(`/api/price/subcategories/${subcategoryId}`, {
        method: 'PUT',
        body: editingSubCategoryData.value
      })
      editingSubCategoryId.value = null
      editingSubCategoryData.value = {}
      await refresh()
    } catch (error) {
      showAlert('Ошибка при сохранении подкатегории')
      console.error(error)
    }
  }

  const deleteSubCategory = async (subcategoryId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту подкатегорию?')) return
    try {
      await $fetch(`/api/price/subcategories/${subcategoryId}`, { method: 'DELETE' })
      await refresh()
    } catch (error) {
      showAlert('Ошибка при удалении подкатегории')
      console.error(error)
    }
  }

  const addNewSubItem = async (categoryId: number) => {
    if (!newSubItem.value.name || !categoryId) {
      showAlert('Заполните все поля')
      return
    }
    try {
      await $fetch('/api/price/subcategories', {
        method: 'POST',
        body: { categoryId, name: newSubItem.value.name }
      })
      openSubItemForms.value[categoryId] = false
      newSubItem.value.name = ''
      await refresh()
    } catch (error) {
      showAlert('Ошибка при добавлении подкатегории')
      console.error(error)
    }
  }

  // === РАБОТЫ ===
  
  const startEditingSubItem = (item: PriceWorkItem) => {
    editingItemId.value = item.id
    editingItemData.value = { ...item }
  }

  const saveEditSubItem = async () => {
    if (!editingItemId.value) return
    try {
      const updatedItem = await $fetch<PriceWorkItem>(`/api/price/items/${editingItemId.value}`, {
        method: 'PUT',
        body: editingItemData.value
      })

      // Обновляем локально для реактивности
      for (const category of works.value) {
        for (const subcat of category.subcategories) {
          const itemIndex = subcat.items.findIndex(i => i.id === updatedItem.id)
          if (itemIndex !== -1) {
            subcat.items[itemIndex] = { ...subcat.items[itemIndex], ...updatedItem }
            break
          }
        }
      }

      editingItemId.value = null
      editingItemData.value = {}
      await refresh()
    } catch (error) {
      showAlert('Ошибка при сохранении')
      console.error(error)
    }
  }

  const deleteSubItem = async (item: PriceWorkItem) => {
    if (!confirm(`Вы уверены, что хотите удалить "${item.name}"?`)) return
    try {
      await $fetch(`/api/price/items/${item.id}`, { method: 'DELETE' })
      showAlert('Работа успешно удалена')
      await refresh()
    } catch (error) {
      showAlert('Ошибка при удалении работы')
      console.error(error)
    }
  }

  const addNewWork = async (subcategoryId: number) => {
    const work = newWorkForSubcategory.value[subcategoryId]
    if (!work?.name || !work?.unit || work?.price === '') {
      showAlert('Заполните все поля!')
      return
    }
    try {
      await $fetch('/api/price/items', {
        method: 'POST',
        body: {
          name: work.name,
          unit: work.unit,
          price: parseFloat(String(work.price)).toString(),
          subCategoryId: work.subCategoryId
        }
      })
      showWorkFormFor.value = null
      await refresh()
    } catch (error) {
      showAlert('Ошибка при добавлении работы')
      console.error(error)
    }
  }

  // === ДЕТАЛИ ===
  
  const startEditingDetail = (detail: PriceDetailItem) => {
    editingDetailId.value = detail.id
    editingDetailData.value = { ...detail }
  }

  const saveEditDetail = async () => {
    if (!editingDetailId.value) return
    try {
      await $fetch(`/api/price/details/${editingDetailId.value}`, {
        method: 'PUT',
        body: editingDetailData.value
      })
      editingDetailId.value = null
      editingDetailData.value = {}
      await refresh()
    } catch (error) {
      showAlert('Ошибка при сохранении детали')
      console.error(error)
    }
  }

  const deleteDetail = async (detailId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту деталь?')) return
    try {
      await $fetch(`/api/price/details/${detailId}`, { method: 'DELETE' })
      await refresh()
    } catch (error) {
      showAlert('Ошибка при удалении детали')
      console.error(error)
    }
  }

  const addNewDetail = async (itemId: number) => {
    if (!newDetail.value.name || !newDetail.value.unit || !newDetail.value.price) {
      showAlert('Заполните все поля!')
      return
    }
    newDetail.value.itemId = itemId
    try {
      await $fetch('/api/price/details', {
        method: 'POST',
        body: newDetail.value
      })
      showDetailFormFor.value = null
      newDetail.value = { name: '', unit: 'м²', price: '', itemId: null }
      await refresh()
    } catch (error) {
      showAlert('Ошибка при добавлении детали')
      console.error(error)
    }
  }

  // === ДОП. РАБОТЫ ===
  
  const startEditingDopwork = (dopwork: PriceDopworkItem) => {
    editingDopworkId.value = dopwork.id
    editingDopworkData.value = { ...dopwork }
  }

  const saveEditDopwork = async () => {
    if (!editingDopworkId.value) return
    try {
      await $fetch(`/api/price/dopworks/${editingDopworkId.value}`, {
        method: 'PUT',
        body: editingDopworkData.value
      })
      editingDopworkId.value = null
      editingDopworkData.value = {}
      await refresh()
    } catch (error) {
      showAlert('Ошибка сохранения допработы')
      console.error(error)
    }
  }

  const deleteDopwork = async (id: number) => {
    if (!confirm('Вы уверены?')) return
    try {
      await $fetch(`/api/price/dopworks/${id}`, { method: 'DELETE' })
      await refresh()
    } catch (error) {
      showAlert('Ошибка удаления допработы')
      console.error(error)
    }
  }

  const addNewDopwork = async (itemId: number) => {
    newDopwork.value.itemId = itemId
    try {
      await $fetch('/api/price/dopworks', {
        method: 'POST',
        body: newDopwork.value
      })
      showDopworkFormFor.value = null
      newDopwork.value = { label: '', dopwork: '', unit: 'м²', price: '', itemId: null }
      await refresh()
    } catch (error) {
      showAlert('Ошибка при добавлении доп.работы')
      console.error(error)
    }
  }

  // === ОТМЕНА ===
  
  const handleCancel = (type: string) => {
    switch (type) {
      case 'category':
        showCategoryForm.value = false
        newCategory.value = { name: '', pageId: null }
        break
      case 'subcategory':
        editingSubCategoryId.value = null
        editingSubCategoryData.value = {}
        break
      case 'work':
        showWorkFormFor.value = null
        newWorkForSubcategory.value = {}
        break
      case 'detail':
        showDetailFormFor.value = null
        newDetail.value = { name: '', unit: '', price: '', itemId: null }
        break
      case 'dopwork':
        showDopworkFormFor.value = null
        newDopwork.value = { label: '', dopwork: '', unit: '', price: '', itemId: null }
        break
      case 'subitem':
        openSubItemForms.value = {}
        newSubItem.value = { name: '' }
        break
      case 'editWork':
        editingItemId.value = null
        editingItemData.value = {}
        break
      case 'editDetail':
        editingDetailId.value = null
        editingDetailData.value = {}
        break
      case 'editDopwork':
        editingDopworkId.value = null
        editingDopworkData.value = {}
        break
      default:
        console.warn('Неизвестный тип отмены:', type)
    }
  }

  // === КОПИРОВАНИЕ В БУФЕР ===
  
  const handleCopyClick = (item: PriceWorkItem | PriceDetailItem | PriceDopworkItem) => {
    let textToCopy = ''

    if ('name' in item && item.name) {
      textToCopy = item.name
    } else if ('dopwork' in item) {
      const dopItem = item as PriceDopworkItem
      textToCopy = [dopItem.label, dopItem.dopwork].filter(Boolean).join(' ')
    }

    if (!textToCopy) {
      showAlert('Нет текста для копирования')
      return
    }

    const markCopied = () => {
      item.isCopied = true
      setTimeout(() => { item.isCopied = false }, 5000)
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(markCopied)
        .catch(err => {
          console.error('Ошибка копирования:', err)
          fallbackCopy(textToCopy, item)
        })
    } else {
      fallbackCopy(textToCopy, item)
    }
  }

  const fallbackCopy = (text: string, item: PriceWorkItem | PriceDetailItem | PriceDopworkItem) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      item.isCopied = true
      setTimeout(() => { item.isCopied = false }, 5000)
    } catch (err) {
      console.error('Ошибка резервного копирования:', err)
      showAlert('Не удалось скопировать текст')
    } finally {
      document.body.removeChild(textArea)
    }
  }

  return {
    // Состояния редактирования
    editingCategoryId, editingCategoryData,
    editingSubCategoryId, editingSubCategoryData,
    editingItemId, editingItemData,
    editingDetailId, editingDetailData,
    editingDopworkId, editingDopworkData,
    
    // Состояния форм
    showCategoryForm, newCategory,
    openSubItemForms, newSubItem,
    showWorkFormFor, newWorkForSubcategory,
    showDetailFormFor, newDetail,
    showDopworkFormFor, newDopwork,
    
    // Методы
    startEditingCategory, saveEditCategory, deleteCategory, addNewCategory,
    startEditingSubCategory, saveEditSubCategory, deleteSubCategory, addNewSubItem,
    startEditingSubItem, saveEditSubItem, deleteSubItem, addNewWork,
    startEditingDetail, saveEditDetail, deleteDetail, addNewDetail,
    startEditingDopwork, saveEditDopwork, deleteDopwork, addNewDopwork,
    handleCancel, handleCopyClick
  }
}
