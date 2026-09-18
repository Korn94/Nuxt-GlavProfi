<template>
  <div class="subcategory-block">
    <header
      class="subcategory-block__header"
      :class="{ 'is-open': isOpen }"
      @click="uiStore.toggleSubcategory(subcategory.id)"
    >
      <Icon
        name="mdi:chevron-right"
        size="20"
        class="subcategory-block__chevron"
        :class="{ 'is-open': isOpen }"
      />
      <h3 class="subcategory-block__title">{{ subcategory.name }}</h3>

      <div v-if="isAdmin" class="subcategory-block__actions" @click.stop>
        <button
          v-if="!searchQuery.trim()"
          class="icon-btn subcategory-sort-handle"
          title="Перетащить"
        >
          <Icon name="mdi:drag" size="16" />
        </button>
        <button
          class="icon-btn"
          title="Редактировать"
          @click.stop="editStore.startEditSubcategory(subcategory)"
        >
          <Icon name="bx:edit" size="15" />
        </button>
        <button
          class="icon-btn icon-btn--danger"
          title="Удалить"
          @click.stop="editStore.deleteSubcategory(subcategory.id)"
        >
          <Icon name="mdi:delete-forever" size="15" />
        </button>
      </div>
    </header>

    <div v-if="editStore.editingSubcategoryId === subcategory.id" class="form">
      <input
        v-model="editStore.editingSubcategoryData.name"
        placeholder="Название подкатегории"
      />
      <button @click="editStore.saveEditSubcategory">Сохранить</button>
      <button @click="editStore.cancelEditSubcategory">Отмена</button>
    </div>

    <Transition name="accordion">
      <dl
        v-show="isOpen"
        ref="worksListRef"
        class="works-list"
      >
        <PagesPublicPricesPriceWorkItem
          v-for="item in subcategory.items"
          :key="item.id"
          :item="item"
          :is-admin="isAdmin"
          :search-query="searchQuery"
        />

        <div v-if="isAdmin" class="add-work-button">
          <button
            v-if="editStore.showAddItemForm !== subcategory.id"
            class="dashed-btn"
            @click="editStore.showAddItem(subcategory.id)"
          >
            <Icon name="mdi:plus" size="16" />
            <span>Добавить работу</span>
          </button>

          <div v-else class="form form--stack">
            <input v-model="editStore.newItem.name" placeholder="Название" />
            <PagesPublicPricesUiSelectOrInput v-model="editStore.newItem.unit" />
            <input
              v-model.number="editStore.newItem.price"
              placeholder="Цена"
            />
            <div class="form__buttons">
              <button @click="editStore.addItem">Сохранить</button>
              <button @click="editStore.cancelAddItem">Отмена</button>
            </div>
          </div>
        </div>
      </dl>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePriceUIStore, usePriceEditStore } from 'stores/price'
import { usePriceSortable } from '~/composables/usePriceSortable'
import type { PriceSubcategory } from 'stores/price/types'

const props = defineProps<{
  subcategory: PriceSubcategory
  isAdmin: boolean
  searchQuery: string
}>()

const uiStore = usePriceUIStore()
const editStore = usePriceEditStore()

const isOpen = computed(() => !!uiStore.openSubcategories[props.subcategory.id])

const worksListRef = ref<HTMLElement | null>(null)

usePriceSortable({
  el: worksListRef,
  entity: 'items',
  list: () => props.subcategory.items,
  isEnabled: () => props.isAdmin && !props.searchQuery.trim(),
  draggable: '.work-item',
  handle: '.item-sort-handle',
  filter: '.add-work-button',
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.subcategory-block {
  margin-bottom: 10px;
  border: 1px solid $border-color;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    border-color: rgba(0, 195, 245, 0.4);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    cursor: pointer;
    background: linear-gradient(180deg, #fbfcfd 0%, #f5f7fa 100%);
    user-select: none;
    transition: background 0.2s ease;

    &:hover {
      background: linear-gradient(180deg, #f5f9fc 0%, #eef5fa 100%);
    }

    &.is-open {
      background: linear-gradient(180deg, #f0f8fd 0%, #e9f5fc 100%);
      border-bottom: 1px solid rgba(0, 195, 245, 0.2);
    }
  }

  &__chevron {
    color: $text-gray;
    flex-shrink: 0;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease;

    &.is-open {
      transform: rotate(90deg);
      color: $blue;
    }
  }

  &__title {
    flex: 1;
    font-size: 0.95rem;
    font-weight: 600;
    color: $text-dark;
    margin: 0;
    line-height: 1.4;

    @media (max-width: 768px) {
      font-size: 0.88rem;
    }
  }

  &__actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: $text-gray;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 195, 245, 0.12);
    color: $blue;
  }

  &--danger:hover {
    background: rgba(211, 47, 47, 0.1);
    color: #d32f2f;
  }
}

.subcategory-sort-handle {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.works-list {
  margin: 0;
  padding: 6px 8px;
  background: #fff;
  overflow: hidden;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.25s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  max-height: 8000px;
  opacity: 1;
}

.form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 14px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 195, 245, 0.15);

  &--stack {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    padding: 12px 8px 4px;

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }

  input {
    flex: 1;
    min-width: 120px;
    padding: 7px 10px;
    border: 1px solid $border-color;
    border-radius: 7px;
    font-size: 0.85rem;
    outline: none;

    &:focus {
      border-color: $blue;
      box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.1);
    }
  }

  &__buttons {
    display: flex;
    gap: 8px;
    grid-column: 1 / -1;

    button {
      padding: 7px 14px;
      border: none;
      border-radius: 7px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;

      &:first-child {
        background: $blue;
        color: #fff;
      }
      &:last-child {
        background: #eef0f3;
        color: #333;
      }
    }
  }
}

.add-work-button {
  padding: 10px 6px;

  .dashed-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border: 1.5px dashed $border-color;
    background: transparent;
    color: $text-gray;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 600;
    transition: all 0.2s ease;

    &:hover {
      border-color: $blue;
      color: $blue;
      background: rgba(0, 195, 245, 0.04);
    }
  }
}
</style>