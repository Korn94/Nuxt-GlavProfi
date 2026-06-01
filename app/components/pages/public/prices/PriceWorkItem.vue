<template>
  <dl class="work-item" itemscope itemtype="https://schema.org/Service">
    <!-- Название услуги (dt) -->
    <dt class="work-title-wrapper" itemprop="name">
      <!-- Иконка копирования -->
      <Icon
        :name="item.isCopied ? 'solar:copy-bold-duotone' : 'solar:copy-linear'"
        class="pointer ico"
        @click="onHandleCopyClick"
      />

      <!-- Название (кликабельное) -->
      <span class="work-title pointer" @click="onToggleSubItems">
        <span v-if="editingItemId !== item.id">
          <span
            v-for="(part, index) in splitText(item.name)"
            :key="index"
            :class="{ highlight: part.isMatch }"
          >
            {{ part.text }}
          </span>
        </span>
        <input
          v-else
          v-model="editingItemData.name"
          class="edit-input"
          style="width: 80%"
        />
      </span>
    </dt>

    <!-- Цена и единица (dd) -->
    <dd class="work-meta" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
      <span v-if="editingItemId !== item.id">
        <span class="work-price" itemprop="price" :content="String(item.price)">
          {{ Math.round(Number(item.price)) }} ₽ /
        </span>
        <meta itemprop="priceCurrency" content="RUB" />
        <span class="work-unit">{{ item.unit }}</span>
      </span>

      <!-- Поля редактирования -->
      <template v-else>
        <input v-model="editingItemData.unit" class="edit-input edit-unit" style="width: 50px" />
        <input v-model.number="editingItemData.price" class="edit-input edit-price" style="width: 70px" />
      </template>
    </dd>

    <!-- Кнопки сохранения (при редактировании) -->
    <div v-if="editingItemId === item.id" class="edit-buttons">
      <button @click="onSaveEditSubItem">Сохранить</button>
      <button @click="onCancel('editWork')">Отмена</button>
    </div>

    <!-- Кнопки админа -->
    <div class="work-actions" v-if="isAdmin">
      <Icon name="bx:edit" size="16" @click.stop="onStartEditingSubItem" />
      <Icon name="mdi:delete-forever" size="16" @click.stop="onDeleteSubItem" />
    </div>

    <!-- Форма добавления детали -->
    <div v-if="isAdmin" class="add-detail-button">
      <button @click="onShowDetailForm">+ Добавить деталь</button>
      <div v-if="showDetailFormFor === item.id" class="form">
        <input v-model="newDetail.name" placeholder="Название" />
        <PagesPublicPricesUiSelectOrInput v-model="newDetail.unit" />
        <input v-model.number="newDetail.price" placeholder="Цена" />
        <button @click="onAddNewDetail">Сохранить</button>
        <button @click="onCancel('detail')">Отмена</button>
      </div>
    </div>

    <!-- Форма добавления доп. работы -->
    <div v-if="isAdmin" class="add-dopwork-button">
      <button @click="onShowDopworkForm">+ Добавить доп. работу</button>
      <div v-if="showDopworkFormFor === item.id" class="form">
        <input v-model="newDopwork.label" placeholder="Метка" />
        <input v-model="newDopwork.dopwork" placeholder="Название работы" />
        <PagesPublicPricesUiSelectOrInput v-model="newDopwork.unit" />
        <input v-model.number="newDopwork.price" placeholder="Цена" />
        <button @click="onAddNewDopwork">Сохранить</button>
        <button @click="onCancel('dopwork')">Отмена</button>
      </div>
    </div>

    <!-- === ВЛОЖЕННЫЕ ЭЛЕМЕНТЫ === -->
    <dd class="work-nested" v-show="isSubItemsOpen">
      <!-- ДЕТАЛИ РАБОТ -->
      <dl v-if="item.details && item.details.length > 0" class="sub-items">
        <dl
          v-for="detail in item.details"
          :key="detail.id"
          class="sub-work-item"
          itemscope
          itemtype="https://schema.org/Service"
        >
          <dt class="work-title-wrapper" itemprop="name">
            <Icon
              :name="detail.isCopied ? 'solar:copy-line-duotone' : 'solar:copy-broken'"
              class="pointer ico"
              @click="onHandleCopyClickDetail(detail)"
            />
            <span class="work-title">
              <span v-if="editingDetailId !== detail.id">{{ detail.name }}</span>
              <input
                v-else
                v-model="editingDetailData.name"
                class="edit-input"
                style="width: 80%"
              />
            </span>
          </dt>
          <dd class="work-meta" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <span v-if="editingDetailId !== detail.id">
              <span class="work-price" itemprop="price" :content="String(detail.price)">
                {{ Math.round(Number(detail.price)) }} ₽
              </span>
              <meta itemprop="priceCurrency" content="RUB" />
              <span class="work-unit">{{ detail.unit || item.unit }}</span>
            </span>
            <template v-else>
              <input v-model="editingDetailData.unit" class="edit-input" style="width: 50px" />
              <input v-model.number="editingDetailData.price" class="edit-input" style="width: 70px" />
            </template>
          </dd>
          <div v-if="editingDetailId === detail.id" class="edit-buttons">
            <button @click="onSaveEditDetail">Сохранить</button>
            <button @click="onCancel('editDetail')">Отмена</button>
          </div>
          <div class="work-actions" v-if="isAdmin">
            <Icon name="bx:edit" size="16" @click.stop="onStartEditingDetail(detail)" />
            <Icon name="mdi:delete-forever" size="16" @click.stop="onDeleteDetail(detail.id)" />
          </div>
        </dl>
      </dl>

      <!-- ДОП. РАБОТЫ -->
      <dl v-if="item.dopworks && item.dopworks.length > 0" class="sub-items">
        <p class="dop-work-title">Доп. работы</p>
        <dl
          v-for="dopwork in item.dopworks"
          :key="dopwork.id"
          class="sub-work-item"
          itemscope
          itemtype="https://schema.org/Service"
        >
          <dt class="work-title-wrapper" itemprop="name">
            <Icon
              :name="dopwork.isCopied ? 'solar:copy-line-duotone' : 'solar:copy-broken'"
              class="pointer ico"
              @click="onHandleCopyClickDopwork(dopwork)"
            />
            <span class="work-title">
              <span v-if="editingDopworkId !== dopwork.id">
                {{ dopwork.label }} {{ dopwork.dopwork }}
              </span>
              <template v-else>
                <input v-model="editingDopworkData.label" class="edit-input" style="width: 40%" />
                <input v-model="editingDopworkData.dopwork" class="edit-input" style="width: 40%" />
              </template>
            </span>
          </dt>
          <dd class="work-meta" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <span v-if="editingDopworkId !== dopwork.id">
              <span class="work-price" itemprop="price" :content="String(dopwork.price)">
                {{ Math.round(Number(dopwork.price)) }} ₽
              </span>
              <meta itemprop="priceCurrency" content="RUB" />
              <span class="work-unit">{{ dopwork.unit || item.unit }}</span>
            </span>
            <template v-else>
              <input v-model="editingDopworkData.unit" class="edit-input" style="width: 50px" />
              <input v-model.number="editingDopworkData.price" class="edit-input" style="width: 70px" />
            </template>
          </dd>
          <div v-if="editingDopworkId === dopwork.id" class="edit-buttons">
            <button @click="onSaveEditDopwork">Сохранить</button>
            <button @click="onCancel('editDopwork')">Отмена</button>
          </div>
          <div class="work-actions" v-if="isAdmin">
            <Icon name="bx:edit" size="16" @click.stop="onStartEditingDopwork(dopwork)" />
            <Icon name="mdi:delete-forever" size="16" @click.stop="onDeleteDopwork(dopwork.id)" />
          </div>
        </dl>
      </dl>
    </dd>
  </dl>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PriceWorkItem, PriceDetailItem, PriceDopworkItem } from './composables/usePriceData'

const props = defineProps<{
  item: PriceWorkItem
  isAdmin: boolean
  searchQuery: string

  // Состояния редактирования
  editingItemId: number | null
  editingItemData: Partial<PriceWorkItem>
  editingDetailId: number | null
  editingDetailData: Partial<PriceDetailItem>
  editingDopworkId: number | null
  editingDopworkData: Partial<PriceDopworkItem>

  // Состояния UI
  openSubItems: Record<number, boolean>
  showDetailFormFor: number | null
  showDopworkFormFor: number | null
  newDetail: any
  newDopwork: any
}>()

const emit = defineEmits<{
  (e: 'toggleSubItems', itemId: number): void
  (e: 'startEditingSubItem', item: PriceWorkItem): void
  (e: 'saveEditSubItem'): void
  (e: 'deleteSubItem', item: PriceWorkItem): void
  (e: 'handleCopyClick', item: PriceWorkItem | PriceDetailItem | PriceDopworkItem): void
  (e: 'showDetailForm', itemId: number): void
  (e: 'showDopworkForm', itemId: number): void
  (e: 'addNewDetail', itemId: number): void
  (e: 'addNewDopwork', itemId: number): void
  (e: 'startEditingDetail', detail: PriceDetailItem): void
  (e: 'saveEditDetail'): void
  (e: 'deleteDetail', detailId: number): void
  (e: 'startEditingDopwork', dopwork: PriceDopworkItem): void
  (e: 'saveEditDopwork'): void
  (e: 'deleteDopwork', dopworkId: number): void
  (e: 'cancel', type: string): void
}>()

// Вычисляемое свойство: открыты ли вложенные элементы
const isSubItemsOpen = computed(() => !!props.openSubItems[props.item.id])

// Подсветка текста при поиске
const splitText = (text: string) => {
  if (!text || !props.searchQuery.trim()) return [{ text, isMatch: false }]

  const query = props.searchQuery.trim().toLowerCase()
  const parts: Array<{ text: string; isMatch: boolean }> = []
  let lastIndex = 0

  while (lastIndex < text.length) {
    const index = text.toLowerCase().indexOf(query, lastIndex)
    if (index === -1) {
      parts.push({ text: text.slice(lastIndex), isMatch: false })
      break
    }

    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index), isMatch: false })
    }

    parts.push({ text: text.slice(index, index + query.length), isMatch: true })
    lastIndex = index + query.length
  }

  return parts
}

// Обработчики событий
const onToggleSubItems = () => {
  emit('toggleSubItems', props.item.id)
}

const onStartEditingSubItem = () => {
  emit('startEditingSubItem', props.item)
}

const onSaveEditSubItem = () => {
  emit('saveEditSubItem')
}

const onDeleteSubItem = () => {
  emit('deleteSubItem', props.item)
}

const onHandleCopyClick = () => {
  emit('handleCopyClick', props.item)
}

const onHandleCopyClickDetail = (detail: PriceDetailItem) => {
  emit('handleCopyClick', detail)
}

const onHandleCopyClickDopwork = (dopwork: PriceDopworkItem) => {
  emit('handleCopyClick', dopwork)
}

const onShowDetailForm = () => {
  emit('showDetailForm', props.item.id)
}

const onShowDopworkForm = () => {
  emit('showDopworkForm', props.item.id)
}

const onAddNewDetail = () => {
  emit('addNewDetail', props.item.id)
}

const onAddNewDopwork = () => {
  emit('addNewDopwork', props.item.id)
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
span {
  color: unset;
}

.pointer {
  cursor: pointer;
}

/* === Основная работа === */
.work-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid $border-color;
  transition: all 0.3s ease;
  margin: 0;

  &:hover {
    background: $sub-item-bg;
  }

  .work-title-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    flex: 1;
    min-width: 0;

    .ico {
      margin-right: 1em;
      transition: transform 0.3s ease;
      flex-shrink: 0;
      color: $blue;

      &:hover {
        transform: scale(1.2);
      }
    }

    .work-title {
      flex: 1;
      white-space: pre-wrap;
      font-size: 1rem;
      color: $text-dark;
      display: flex;
      align-items: center;
      gap: 8px;

      .highlight {
        background-color: $blue;
        color: white;
        font-weight: bold;
        padding: 2px 5px;
        border-radius: 3px;
      }

      @media (max-width: 768px) {
        font-size: 0.8rem;
      }
    }
  }

  .work-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 110px;
    justify-content: flex-end;
    text-align: right;
    margin: 0;

    .work-unit,
    .work-price {
      display: inline-flex;
      align-items: center;
      width: auto;
      margin: 0 2px;
      font-size: 0.9rem;
      color: #555;
    }
  }

  .work-actions {
    display: flex;
    gap: 10px;
    margin-top: 5px;
    width: 100%;

    :deep(svg) {
      cursor: pointer;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.2);
      }
    }
  }

  .edit-buttons {
    display: flex;
    gap: 10px;
    margin-top: 5px;
    width: 100%;

    button {
      padding: 6px 12px;
      font-size: 0.8rem;
      border-radius: 4px;
      cursor: pointer;
      border: none;

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

  .edit-input {
    padding: 4px 8px;
    border: 1px solid $border-color;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .work-nested {
    width: 100%;
    padding-left: 20px;
    background: $sub-item-bg;
    margin-top: 1em;
    border-radius: 5px;
    margin-left: 0;

    .dop-work-title {
      text-align: center;
      font-weight: 600;
      margin: 10px 0;
    }
  }
}

/* === Вложенные работы === */
.sub-items {
  padding: 5px 0;
  margin: 0;
}

.sub-work-item {
  display: flex;
  flex-wrap: wrap;
  padding: 5px 0;
  border-bottom: 1px solid $border-color;
  gap: 4px;
  margin: 0;

  &:last-child {
    border-bottom: none;
  }

  .work-title-wrapper {
    .work-title {
      font-weight: normal;
      color: #555;
      font-size: 0.9rem;

      @media (max-width: 768px) {
        font-size: 0.8rem;
      }
    }
  }

  .work-meta {
    .work-unit,
    .work-price {
      font-size: 0.85rem;
    }
  }

  .work-actions {
    gap: 10px;
    margin-top: 4px;
  }
}

/* Формы добавления */
.add-detail-button,
.add-dopwork-button {
  margin-top: 0.5em;
  width: 100%;

  button {
    padding: 4px 10px;
    font-size: 0.8rem;
    border: 1px dashed $border-color;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: #666;

    &:hover {
      border-color: $blue;
      color: $blue;
    }
  }
}

.form {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  input {
    padding: 6px 8px;
    border: 1px solid $border-color;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;

    &:first-of-type {
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