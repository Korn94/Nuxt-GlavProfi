<template>
  <section class="category-block" :id="'category-' + category.id">
    <header class="category-block__header">
      <div class="category-block__title-wrap">
        <span class="category-block__marker"></span>
        <input
          v-if="editStore.editingCategoryId === category.id"
          v-model="editStore.editingCategoryData.name"
          class="category-block__edit-input"
        />
        <h2 v-else class="category-block__title">{{ category.name }}</h2>
      </div>

      <div v-if="isAdmin" class="category-block__actions">
        <button
          class="icon-btn"
          :title="editStore.editingCategoryId === category.id ? 'Сохранить' : 'Редактировать'"
          @click.stop="
            editStore.editingCategoryId === category.id
              ? editStore.saveEditCategory()
              : editStore.startEditCategory(category)
          "
        >
          <Icon
            :name="
              editStore.editingCategoryId === category.id
                ? 'mdi:content-save-check-outline'
                : 'bx:edit'
            "
            size="16"
          />
        </button>
        <button
          class="icon-btn icon-btn--danger"
          title="Удалить"
          @click.stop="editStore.deleteCategory(category.id)"
        >
          <Icon name="mdi:delete-forever" size="16" />
        </button>
      </div>
    </header>

    <div ref="subcategoryListRef" class="category-block__list">
      <PagesPublicPricesPriceSubcategory
        v-for="subcategory in category.subcategories"
        :key="subcategory.id"
        :subcategory="subcategory"
        :is-admin="isAdmin"
        :search-query="searchQuery"
      />
    </div>

    <div v-if="isAdmin" class="category-block__admin">
      <button
        v-if="editStore.showAddSubcategoryForm !== category.id"
        class="dashed-btn"
        @click="editStore.showAddSubcategory(category.id)"
      >
        <Icon name="mdi:plus" size="16" />
        <span>Добавить подкатегорию</span>
      </button>

      <div v-else class="form">
        <input v-model="editStore.newSubcategory.name" placeholder="Название" />
        <button @click="editStore.addSubcategory">Сохранить</button>
        <button @click="editStore.cancelAddSubcategory">Отмена</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePriceEditStore } from 'stores/price'
import { usePriceSortable } from '~/composables/usePriceSortable'
import type { PriceCategory } from 'stores/price/types'

const props = defineProps<{
  category: PriceCategory
  isAdmin: boolean
  searchQuery: string
}>()

const editStore = usePriceEditStore()
const subcategoryListRef = ref<HTMLElement | null>(null)

usePriceSortable({
  el: subcategoryListRef,
  entity: 'subcategories',
  list: () => props.category.subcategories,
  isEnabled: () => props.isAdmin && !props.searchQuery.trim(),
  draggable: '.subcategory-block',
  handle: '.subcategory-sort-handle',
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.category-block {
  scroll-margin-top: 9em;
  margin-bottom: 24px;
  padding: 20px 22px;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 14px;
  transition: all 0.3s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    border-color: rgba(0, 195, 245, 0.35);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 768px) {
    padding: 16px 14px;
    border-radius: 12px;
    margin-bottom: 16px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1em;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  &__title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
  }

  &__marker {
    display: block;
    width: 4px;
    height: 26px;
    background: $blue-gradient;
    border-radius: 4px;
    flex-shrink: 0;
    box-shadow: 0 0 12px rgba(0, 195, 245, 0.4);
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: $text-dark;
    margin: 0;
    line-height: 1.3;

    @media (max-width: 768px) {
      font-size: 1.1rem;
    }
  }

  &__edit-input {
    width: 100%;
    max-width: 480px;
    padding: 8px 12px;
    border: 1.5px solid $blue;
    border-radius: 8px;
    font-size: 1rem;
    outline: none;
    box-shadow: 0 0 0 4px rgba(0, 195, 245, 0.12);
  }

  &__actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  // &__list {
    /* контейнер для sortable */
  // }

  &__admin {
    margin-top: 12px;
  }
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid $border-color;
  background: #fff;
  color: $text-gray;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $blue;
    color: $blue;
    background: rgba(0, 195, 245, 0.06);
  }

  &--danger:hover {
    border-color: #d32f2f;
    color: #d32f2f;
    background: rgba(211, 47, 47, 0.06);
  }
}

.dashed-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1.5px dashed $border-color;
  background: transparent;
  color: $text-gray;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    border-color: $blue;
    color: $blue;
    background: rgba(0, 195, 245, 0.04);
  }
}

.form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  input {
    flex: 1;
    min-width: 180px;
    padding: 8px 12px;
    border: 1px solid $border-color;
    border-radius: 8px;
    outline: none;

    &:focus {
      border-color: $blue;
    }
  }

  button {
    padding: 8px 14px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85rem;

    &:first-of-type {
      background: $blue;
      color: #fff;
    }
    &:last-of-type {
      background: #eef0f3;
      color: #333;
    }
  }
}
</style>

<style lang="scss">
.price-sort-ghost {
  opacity: 0.4;
  background: rgba(0, 195, 245, 0.08) !important;
}
.price-sort-chosen {
  border: 1.5px dashed #00c3f5 !important;
}
.price-sort-drag {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  background: #fff;
  cursor: grabbing;
  transform: rotate(0.5deg);
}
</style>