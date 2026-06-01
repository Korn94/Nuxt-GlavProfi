<!-- app/components/pages/public/prices/PriceCategory.vue -->
<template>
  <div class="category-block">
    <!-- Заголовок категории -->
    <div class="category-header">
      <div>
        <input
          v-if="editingCategoryId === category.id"
          v-model="editingCategoryData.name"
          style="width: 80%"
        />
        <h2 v-else>{{ category.title }}</h2>
      </div>
      <div v-if="isAdmin" class="category-actions">
        <Icon
          v-if="editingCategoryId !== category.id"
          name="bx:edit"
          size="16"
          style="cursor: pointer; margin-right: 10px;"
          @click.stop="onStartEditingCategory"
        />
        <Icon
          v-else
          name="mdi:content-save-check-outline"
          size="16"
          style="cursor: pointer; margin-right: 10px;"
          @click.stop="onSaveEditCategory"
        />
        <Icon
          name="mdi:delete-forever"
          size="16"
          style="cursor: pointer;"
          @click.stop="onDeleteCategory"
        />
      </div>
    </div>

    <!-- Список подкатегорий -->
    <PagesPublicPricesPriceSubcategory
      v-for="subcategory in category.subcategories"
      :key="subcategory.id"
      :subcategory="subcategory"
      :is-admin="isAdmin"
      :search-query="searchQuery"
      v-bind="subcategoryBindings"
      @toggle-subcategory="onToggleSubcategory"
      @handle-copy-click="onHandleCopyClick"
      @start-editing-sub-category="onStartEditingSubCategory"
      @save-edit-sub-category="onSaveEditSubCategory"
      @delete-sub-category="onDeleteSubCategory"
      @toggle-sub-items="onToggleSubItems"
      @start-editing-sub-item="onStartEditingSubItem"
      @save-edit-sub-item="onSaveEditSubItem"
      @delete-sub-item="onDeleteSubItem"
      @show-detail-form="onShowDetailForm"
      @show-dopwork-form="onShowDopworkForm"
      @show-work-form="onShowWorkForm"
      @add-new-work="onAddNewWork"
      @start-editing-detail="onStartEditingDetail"
      @save-edit-detail="onSaveEditDetail"
      @delete-detail="onDeleteDetail"
      @start-editing-dopwork="onStartEditingDopwork"
      @save-edit-dopwork="onSaveEditDopwork"
      @delete-dopwork="onDeleteDopwork"
      @cancel="onCancel"
    />

    <!-- Кнопка добавления подкатегории (только админ) -->
    <div v-if="isAdmin">
      <button @click="openSubItemForm">+ Добавить подкатегорию</button>
    </div>
    <div v-if="openSubItemForms[category.id]" class="form">
      <input v-model="newSubItem.name" placeholder="Название" />
      <button @click="onAddNewSubItem">Сохранить</button>
      <button @click="onCancel('subitem')">Отмена</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PriceCategory, PriceSubcategory, PriceWorkItem, PriceDetailItem, PriceDopworkItem } from './composables/usePriceData'

const props = defineProps<{
  category: PriceCategory
  isAdmin: boolean
  searchQuery: string
  
  // Состояния редактирования
  editingCategoryId: number | null
  editingCategoryData: { name?: string }
  editingSubCategoryId: number | null
  editingSubCategoryData: { name?: string }
  editingItemId: number | null
  editingItemData: Partial<PriceWorkItem>
  editingDetailId: number | null
  editingDetailData: Partial<PriceDetailItem>
  editingDopworkId: number | null
  editingDopworkData: Partial<PriceDopworkItem>
  
  // Состояния UI
  openSubcategories: Record<number, boolean>
  openSubItems: Record<number, boolean>
  openSubItemForms: Record<number, boolean>
  newSubItem: { name: string }
  showDetailFormFor: number | null
  showDopworkFormFor: number | null
  showWorkFormFor: number | null
  newWorkForSubcategory: Record<number, any>
  newDetail: any
  newDopwork: any
}>()

const emit = defineEmits<{
  (e: 'startEditingCategory', category: PriceCategory): void
  (e: 'saveEditCategory', categoryId: number): void
  (e: 'deleteCategory', categoryId: number): void
  (e: 'openSubItemForm', categoryId: number): void
  (e: 'addNewSubItem', categoryId: number): void
  (e: 'cancel', type: string): void
  (e: 'toggleSubcategory', subcategoryId: number): void
  (e: 'handleCopyClick', item: PriceWorkItem | PriceDetailItem | PriceDopworkItem): void
  (e: 'startEditingSubCategory', subcategory: PriceSubcategory): void
  (e: 'saveEditSubCategory', subcategoryId: number): void
  (e: 'deleteSubCategory', subcategoryId: number): void
  (e: 'toggleSubItems', itemId: number): void
  (e: 'startEditingSubItem', item: PriceWorkItem): void
  (e: 'saveEditSubItem'): void
  (e: 'deleteSubItem', item: PriceWorkItem): void
  (e: 'showDetailForm', itemId: number): void
  (e: 'showDopworkForm', itemId: number): void
  (e: 'showWorkForm', subcategoryId: number): void
  (e: 'addNewWork', subcategoryId: number): void
  (e: 'startEditingDetail', detail: PriceDetailItem): void
  (e: 'saveEditDetail'): void
  (e: 'deleteDetail', detailId: number): void
  (e: 'startEditingDopwork', dopwork: PriceDopworkItem): void
  (e: 'saveEditDopwork'): void
  (e: 'deleteDopwork', dopworkId: number): void
}>()

// Биндинги для передачи в PriceSubcategory
const subcategoryBindings = computed(() => ({
  editingSubCategoryId: props.editingSubCategoryId,
  editingSubCategoryData: props.editingSubCategoryData,
  editingItemId: props.editingItemId,
  editingItemData: props.editingItemData,
  editingDetailId: props.editingDetailId,
  editingDetailData: props.editingDetailData,
  editingDopworkId: props.editingDopworkId,
  editingDopworkData: props.editingDopworkData,
  openSubcategories: props.openSubcategories,
  openSubItems: props.openSubItems,
  showDetailFormFor: props.showDetailFormFor,
  showDopworkFormFor: props.showDopworkFormFor,
  showWorkFormFor: props.showWorkFormFor,
  newWorkForSubcategory: props.newWorkForSubcategory,
  newDetail: props.newDetail,
  newDopwork: props.newDopwork,
}))

// Обработчики для категории
const onStartEditingCategory = () => {
  emit('startEditingCategory', props.category)
}

const onSaveEditCategory = () => {
  emit('saveEditCategory', props.category.id)
}

const onDeleteCategory = () => {
  emit('deleteCategory', props.category.id)
}

const openSubItemForm = () => {
  emit('openSubItemForm', props.category.id)
}

const onAddNewSubItem = () => {
  emit('addNewSubItem', props.category.id)
}

const onCancel = (type: string) => {
  emit('cancel', type)
}

// Обработчики для подкатегорий (пробрасываем события дальше)
const onToggleSubcategory = (subcategoryId: number) => {
  emit('toggleSubcategory', subcategoryId)
}

const onHandleCopyClick = (item: PriceWorkItem | PriceDetailItem | PriceDopworkItem) => {
  emit('handleCopyClick', item)
}

const onStartEditingSubCategory = (subcategory: PriceSubcategory) => {
  emit('startEditingSubCategory', subcategory)
}

const onSaveEditSubCategory = (subcategoryId: number) => {
  emit('saveEditSubCategory', subcategoryId)
}

const onDeleteSubCategory = (subcategoryId: number) => {
  emit('deleteSubCategory', subcategoryId)
}

const onToggleSubItems = (itemId: number) => {
  emit('toggleSubItems', itemId)
}

const onStartEditingSubItem = (item: PriceWorkItem) => {
  emit('startEditingSubItem', item)
}

const onSaveEditSubItem = () => {
  emit('saveEditSubItem')
}

const onDeleteSubItem = (item: PriceWorkItem) => {
  emit('deleteSubItem', item)
}

const onShowDetailForm = (itemId: number) => {
  emit('showDetailForm', itemId)
}

const onShowDopworkForm = (itemId: number) => {
  emit('showDopworkForm', itemId)
}

const onShowWorkForm = (subcategoryId: number) => {
  emit('showWorkForm', subcategoryId)
}

const onAddNewWork = (subcategoryId: number) => {
  emit('addNewWork', subcategoryId)
}

const onStartEditingDetail = (detail: PriceDetailItem) => {
  emit('startEditingDetail', detail)
}

const onSaveEditDetail = () => {
  emit('saveEditDetail')
}

const onDeleteDetail = (detailId: number) => {
  emit('deleteDetail', detailId)
}

const onStartEditingDopwork = (dopwork: PriceDopworkItem) => {
  emit('startEditingDopwork', dopwork)
}

const onSaveEditDopwork = () => {
  emit('saveEditDopwork')
}

const onDeleteDopwork = (dopworkId: number) => {
  emit('deleteDopwork', dopworkId)
}
</script>

<style lang="scss" scoped>
.category-block {
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;

  &:last-child {
    border-bottom: none;
  }
}

.category-header {
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  gap: 1em;

  h2 {
    font-size: 1.5rem;
    color: $text-dark;

    @media (max-width: 768px) {
      font-size: 1.2rem;
    }
  }

  input {
    padding: 8px;
    border: 1px solid $border-color;
    border-radius: 4px;
    font-size: 1rem;
  }
}

.category-actions {
  display: flex;
  margin-top: 0.5em;
  gap: 10px;

  .ico,
  :deep(svg) {
    cursor: pointer;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.2);
    }
  }
}

.form {
  margin-top: 10px;
  display: flex;
  gap: 10px;

  input {
    padding: 8px;
    margin-bottom: 5px;
    border: 1px solid $border-color;
    border-radius: 4px;
  }

  button {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:first-child {
      background: $blue;
      color: white;
    }

    &:last-child {
      background: #ddd;
      color: #333;
    }
  }
}
</style>