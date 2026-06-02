<!-- app/components/pages/public/prices/PriceSubcategory.vue -->
<template>
  <div class="subcategory-block">
    <!-- Заголовок подкатегории -->
    <div class="subcategory-header">
      <h3 @click="ui.toggleSubcategory(subcategory.id)">
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
          @click.stop="edit.startEditSubcategory(subcategory)"
        />
        <Icon
          name="mdi:delete-forever"
          size="16"
          style="cursor: pointer;"
          @click.stop="edit.deleteSubcategory(subcategory.id)"
        />
      </div>
    </div>

    <!-- Форма редактирования подкатегории -->
    <div v-if="edit.editingSubcategoryId.value === subcategory.id" class="form">
      <input
        v-model="edit.editingSubcategoryData.value.name"
        placeholder="Название подкатегории"
      />
      <button @click="edit.saveEditSubcategory">Сохранить</button>
      <button @click="edit.cancelEditSubcategory">Отмена</button>
    </div>

    <!-- Список работ (ИСПРАВЛЕНО: убран v-show, только CSS-класс is-open) -->
    <dl class="works-list" :class="{ 'is-open': isOpen }">
      <PagesPublicPricesPriceWorkItem
        v-for="item in subcategory.items"
        :key="item.id"
        :item="item"
        :is-admin="isAdmin"
        :search-query="searchQuery"
      />

      <!-- Кнопка добавления новой работы (только админ) -->
      <div v-if="isAdmin" class="add-work-button">
        <button @click="edit.showAddItem(subcategory.id)">+ Добавить работу</button>
        
        <!-- Форма добавления работы -->
        <div v-if="edit.showAddItemForm.value === subcategory.id" class="form add-form">
          <input
            v-model="edit.newItem.value.name"
            placeholder="Название"
          />
          <PagesPublicPricesUiSelectOrInput
            v-model="edit.newItem.value.unit"
          />
          <input
            v-model.number="edit.newItem.value.price"
            placeholder="Цена"
          />
          <button @click="edit.addItem">Сохранить</button>
          <button @click="edit.cancelAddItem">Отмена</button>
        </div>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePriceEdit, usePriceUI, type PriceSubcategory } from './composables'

// ========================================
// 📥 ПРОПСЫ (минимальный набор)
// ========================================

const props = defineProps<{
  subcategory: PriceSubcategory
  isAdmin: boolean
  searchQuery: string
}>()

// ========================================
// 🪝 ИНЖЕКТ КОНТЕКСТОВ
// ========================================

const edit = usePriceEdit()
const ui = usePriceUI()

// ========================================
// 🧮 ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
// ========================================

/**
 * Открыта ли подкатегория.
 * Берём значение из UI-контекста.
 */
const isOpen = computed(() => !!ui.openSubcategories.value[props.subcategory.id])
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

/* SEO: Анимация раскрытия списка работ */
/* ИСПРАВЛЕНО: убран v-show, теперь только CSS-класс is-open управляет видимостью */
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