<!-- app\components\pages\public\prices\PriceCategory.vue -->
<template>
  <div class="category-block" :id="'category-' + category.id">
    <!-- Заголовок категории -->
    <div class="category-header">
      <div>
        <!-- Inline-редактирование названия категории -->
        <input
          v-if="editStore.editingCategoryId === category.id"
          v-model="editStore.editingCategoryData.name"
          style="width: 80%"
        />
        <h2 v-else>{{ category.name }}</h2>
      </div>

      <!-- Кнопки админа -->
      <div v-if="isAdmin" class="category-actions">
        <Icon
          v-if="editStore.editingCategoryId !== category.id"
          name="bx:edit"
          size="16"
          style="cursor: pointer; margin-right: 10px;"
          @click.stop="editStore.startEditCategory(category)"
        />
        <Icon
          v-else
          name="mdi:content-save-check-outline"
          size="16"
          style="cursor: pointer; margin-right: 10px;"
          @click.stop="editStore.saveEditCategory"
        />
        <Icon
          name="mdi:delete-forever"
          size="16"
          style="cursor: pointer;"
          @click.stop="editStore.deleteCategory(category.id)"
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
    />

    <!-- Кнопка добавления подкатегории (только админ) -->
    <div v-if="isAdmin">
      <button @click="editStore.showAddSubcategory(category.id)">
        + Добавить подкатегорию
      </button>
    </div>

    <!-- Форма добавления подкатегории -->
    <div v-if="editStore.showAddSubcategoryForm === category.id" class="form">
      <input
        v-model="editStore.newSubcategory.name"
        placeholder="Название"
      />
      <button @click="editStore.addSubcategory">Сохранить</button>
      <button @click="editStore.cancelAddSubcategory">Отмена</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePriceEditStore } from 'stores/price'
import type { PriceCategory } from 'stores/price/types'

// ========================================
// 📥 ПРОПСЫ (минимальный набор)
// ========================================
const props = defineProps<{
  category: PriceCategory
  isAdmin: boolean
  searchQuery: string
}>()

// ========================================
// 🏪 PINIA STORE (вместо inject usePriceEdit)
// ========================================
const editStore = usePriceEditStore()

// ui не нужен в этом компоненте — аккордеонами управляет PriceSubcategory
</script>

<style lang="scss" scoped>
.category-block {
  scroll-margin-top: 9em;
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