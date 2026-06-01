<!-- app/components/pages/public/prices/PriceSubcategory.vue -->
 <template>
  <div class="subcategory-block">
    <!-- Заголовок подкатегории -->
    <div class="subcategory-header">
      <h3 @click="emit('toggleSubcategory', subcategory.id)">
        {{ subcategory.name }}
        <Icon
          :name="isOpen ? 'mdi:keyboard-arrow-up' : 'mdi:keyboard-arrow-down'"
        />
      </h3>
      <div v-if="isAdmin" class="subcategory-actions">
        <Icon
          name="bx:edit"
          size="16"
          style="cursor: pointer; margin-right: 10px;"
          @click.stop="onStartEditingSubCategory"
        />
        <Icon
          name="mdi:delete-forever"
          size="16"
          style="cursor: pointer;"
          @click.stop="onDeleteSubCategory"
        />
      </div>
    </div>

    <!-- Форма редактирования подкатегории -->
    <div v-if="editingSubCategoryId === subcategory.id" class="form">
      <input v-model="editingSubCategoryData.name" placeholder="Название подкатегории" />
      <button @click="onSaveEditSubCategory">Сохранить</button>
      <button @click="onCancel('subcategory')">Отмена</button>
    </div>

    <!-- Список работ (v-show для SEO) -->
    <dl v-show="isOpen" class="works-list" :class="{ 'is-open': isOpen }">
      <PagesPublicPricesPriceWorkItem
        v-for="item in subcategory.items"
        :key="item.id"
        :item="item"
        :is-admin="isAdmin"
        :search-query="searchQuery"
        v-bind="workItemBindings"
        @toggle-sub-items="onToggleSubItems"
        @start-editing-sub-item="onStartEditingSubItem"
        @save-edit-sub-item="onSaveEditSubItem"
        @delete-sub-item="onDeleteSubItem"
        @handle-copy-click="onHandleCopyClick"
        @show-detail-form="onShowDetailForm"
        @show-dopwork-form="onShowDopworkForm"
        @show-work-form="onShowWorkForm"
        @start-editing-detail="onStartEditingDetail"
        @save-edit-detail="onSaveEditDetail"
        @delete-detail="onDeleteDetail"
        @start-editing-dopwork="onStartEditingDopwork"
        @save-edit-dopwork="onSaveEditDopwork"
        @delete-dopwork="onDeleteDopwork"
        @cancel="onCancel"
      />

      <!-- Кнопка добавления новой работы (только админ) -->
      <div v-if="isAdmin" class="add-work-button">
        <button @click="onShowWorkForm">+ Добавить работу</button>
        <div v-if="showWorkFormFor === subcategory.id" class="form add-form">
          <input v-model="newWorkForSubcategory[subcategory.id].name" placeholder="Название" />
          <PagesPublicPricesUiSelectOrInput v-model="newWorkForSubcategory[subcategory.id].unit" />
          <input v-model.number="newWorkForSubcategory[subcategory.id].price" placeholder="Цена" />
          <button @click="onAddNewWork">Сохранить</button>
          <button @click="onCancel('work')">Отмена</button>
        </div>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PriceSubcategory, PriceWorkItem, PriceDetailItem, PriceDopworkItem } from './composables/usePriceData'

const props = defineProps<{
  subcategory: PriceSubcategory
  isAdmin: boolean
  searchQuery: string
  
  // Состояния редактирования
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
  showDetailFormFor: number | null
  showDopworkFormFor: number | null
  showWorkFormFor: number | null
  newWorkForSubcategory: Record<number, any>
  newDetail: any
  newDopwork: any
}>()

const emit = defineEmits<{
  (e: 'toggleSubcategory', subcategoryId: number): void
  (e: 'startEditingSubCategory', subcategory: PriceSubcategory): void
  (e: 'saveEditSubCategory', subcategoryId: number): void
  (e: 'deleteSubCategory', subcategoryId: number): void
  (e: 'toggleSubItems', itemId: number): void
  (e: 'startEditingSubItem', item: PriceWorkItem): void
  (e: 'saveEditSubItem'): void
  (e: 'deleteSubItem', item: PriceWorkItem): void
  (e: 'handleCopyClick', item: PriceWorkItem | PriceDetailItem | PriceDopworkItem): void
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
  (e: 'cancel', type: string): void
}>()

// Вычисляемые свойства
const isOpen = computed(() => !!props.openSubcategories[props.subcategory.id])

// Биндинги для передачи в PriceWorkItem
const workItemBindings = computed(() => ({
  editingItemId: props.editingItemId,
  editingItemData: props.editingItemData,
  editingDetailId: props.editingDetailId,
  editingDetailData: props.editingDetailData,
  editingDopworkId: props.editingDopworkId,
  editingDopworkData: props.editingDopworkData,
  openSubItems: props.openSubItems,
  showDetailFormFor: props.showDetailFormFor,
  showDopworkFormFor: props.showDopworkFormFor,
  newDetail: props.newDetail,
  newDopwork: props.newDopwork,
}))

const onStartEditingSubCategory = () => {
  emit('startEditingSubCategory', props.subcategory)
}

const onSaveEditSubCategory = () => {
  emit('saveEditSubCategory', props.subcategory.id)
}

const onDeleteSubCategory = () => {
  emit('deleteSubCategory', props.subcategory.id)
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

const onHandleCopyClick = (item: PriceWorkItem | PriceDetailItem | PriceDopworkItem) => {
  emit('handleCopyClick', item)
}

const onShowDetailForm = (itemId: number) => {
  emit('showDetailForm', itemId)
}

const onShowDopworkForm = (itemId: number) => {
  emit('showDopworkForm', itemId)
}

const onShowWorkForm = () => {
  emit('showWorkForm', props.subcategory.id)
}

const onAddNewWork = () => {
  emit('addNewWork', props.subcategory.id)
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

const onCancel = (type: string) => {
  emit('cancel', type)
}
</script>

<style lang="scss" scoped>
.subcategory-block {
  margin-bottom: 15px;
}

.subcategory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  background: linear-gradient(to bottom, #ffffff, #f7f7f7);
  transition: border 1.3s ease, box-shadow 1.3s ease;
  border-radius: 5px;
  border: 1px solid $border-color;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

  &:hover {
    border: 1px solid #00c3f5;
    box-shadow: 0 4px 10px rgba(0, 195, 245, 0.2);
    transition: border 0.3s ease, box-shadow 0.3s ease;
  }

  h3 {
    cursor: pointer;
    font-size: 1rem;
    width: 100%;
    padding: 10px 15px;
    margin: 0;

    :deep(svg) {
      margin-left: 1em;
      width: 22px;
      height: 22px;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.2);
        color: #fff;
      }
    }
  }

  .subcategory-actions {
    display: flex;
    margin-right: 1em;

    :deep(svg) {
      cursor: pointer;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.2);
      }
    }
  }
}

/* SEO: Визуальное скрытие списка работ */
.works-list {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  margin: 0;
  padding: 0;
  transition: max-height 0.3s ease, opacity 0.3s ease, visibility 0.3s;

  &.is-open {
    max-height: 50000px;
    opacity: 1;
    visibility: visible;
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

.add-work-button {
  margin-top: 1em;
  text-align: center;

  .add-form {
    display: flex;
    gap: 1em;
    margin-top: 1em;
  }
}
</style>