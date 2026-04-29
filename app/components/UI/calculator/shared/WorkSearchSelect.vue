<!-- app/components/ui/calculator/shared/WorkSearchSelect.vue -->
<template>
  <div class="work-search-select" ref="containerRef">
    <!-- 1. Кнопка-триггер (открывает список) -->
    <button 
      type="button" 
      class="select-trigger" 
      @click="toggleDropdown" 
      :aria-expanded="isOpen"
    >
      <span v-if="selectedItem" class="selected-text">
        {{ selectedItem.name }} — {{ formatPrice(selectedItem.pricePerUnit) }} ₽/{{ getUnitLabel(selectedItem.normalizedUnit) }}
      </span>
      <span v-else class="placeholder-text">{{ placeholder }}</span>
      <Icon name="material-symbols:expand-more" size="20" class="arrow-icon" :class="{ 'is-rotated': isOpen }" />
    </button>

    <!-- 2. Выпадающая панель -->
    <Transition name="slide-fade">
      <div v-if="isOpen" class="dropdown-panel">
        <!-- Поле поиска -->
        <div class="search-wrapper">
          <Icon name="material-symbols:search" size="18" class="search-icon" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Начните вводить название..."
            class="search-input"
            @input="onSearchInput"
          />
          <button v-if="searchQuery" type="button" class="clear-btn" @click="clearSearch">
            <Icon name="material-symbols:close" size="16" />
          </button>
        </div>

        <!-- Список опций -->
        <ul class="options-list" role="listbox">
          <li
            v-for="item in filteredItems"
            :key="item.id"
            class="option-item"
            role="option"
            @click="selectOption(item)"
          >
            <span class="option-name">{{ item.name }}</span>
            <!-- ✅ Обновлено: добавлена единица измерения (м², м.п., шт) -->
            <span class="option-price">{{ formatPrice(item.pricePerUnit) }} ₽/{{ getUnitLabel(item.normalizedUnit) }}</span>
          </li>
          <li v-if="filteredItems.length === 0" class="option-empty">
            Подходящие работы не найдены
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { NormalizedWorkItem } from '~/types/calculator'

// -----------------------------------------------------------------------------
// 1. Props & Emits
// -----------------------------------------------------------------------------
const props = defineProps<{
  modelValue: number | null
  items: NormalizedWorkItem[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'select': [id: number] // ✅ Новое событие: срабатывает сразу при клике
}>()

// -----------------------------------------------------------------------------
// 2. Состояние
// -----------------------------------------------------------------------------
const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

// -----------------------------------------------------------------------------
// 3. Вычисляемые свойства
// -----------------------------------------------------------------------------

/** Работа, соответствующая текущему выбранному ID */
const selectedItem = computed(() => 
  props.items.find(i => i.id === props.modelValue) || null
)

/** Фильтрация списка по поисковому запросу */
const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return props.items
  
  const query = searchQuery.value.toLowerCase().trim()
  return props.items.filter(item => 
    item.name.toLowerCase().includes(query)
  )
})

// -----------------------------------------------------------------------------
// 4. Логика
// -----------------------------------------------------------------------------

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => searchInput.value?.focus())
  } else {
    searchQuery.value = ''
  }
}

function selectOption(item: NormalizedWorkItem) {
  emit('update:modelValue', item.id)
  emit('select', item.id) // ✅ Мгновенная отправка ID в родитель
  isOpen.value = false
  searchQuery.value = ''
  console.log(`✅ Выбрана работа: "${item.name}" (ID: ${item.id})`)
}

function clearSearch() {
  searchQuery.value = ''
  searchInput.value?.focus()
}

function onSearchInput() {
  // Логика сброса или фильтрации при необходимости
}

/** Закрытие списка при клике вне компонента */
function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
    searchQuery.value = ''
  }
}

// -----------------------------------------------------------------------------
// 5. Хуки жизненного цикла
// -----------------------------------------------------------------------------
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

// -----------------------------------------------------------------------------
// 6. Утилиты
// -----------------------------------------------------------------------------
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(price))
}

function getUnitLabel(unit: NormalizedWorkItem['normalizedUnit']): string {
  switch (unit) {
    case 'm2': return 'м²'
    case 'linear': return 'м.п.'
    case 'piece': return 'шт'
    default: return unit
  }
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/calculator-vars.scss" as *;

.work-search-select {
  position: relative;
  width: 100%;
}

// Кнопка открытия
.select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  color: $text-primary;
  transition: all 0.2s;

  &:hover { border-color: $primary; }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba($primary, 0.15);
    border-color: $primary;
  }

  .placeholder-text { color: $text-secondary; }
  
  .arrow-icon {
    transition: transform 0.2s;
    color: $text-secondary;
    &.is-rotated { transform: rotate(180deg); }
  }
}

// Выпадающая панель
.dropdown-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 100;
  overflow: hidden;
}

// Поиск
.search-wrapper {
  position: relative;
  padding: 8px;
  border-bottom: 1px solid $border-light;
  background: $bg-light;
  
  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: $text-secondary;
    pointer-events: none;
  }
  
  .search-input {
    width: 100%;
    padding: 8px 32px 8px 36px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: $bg-white;
    font-size: 0.9rem;
    
    &:focus {
      outline: none;
      border-color: $primary;
    }
  }

  .clear-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: $text-secondary;
    &:hover { color: $danger; }
  }
}

// Список опций
.options-list {
  max-height: 240px;
  overflow-y: auto;
  margin: 0;
  padding: 4px 0;
  
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: $border-color; border-radius: 3px; }
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s;
  
  &:hover { background: rgba($primary, 0.05); }
  
  .option-name {
    font-size: 0.9rem;
    color: $text-primary;
    line-height: 1.3;
  }
  
  .option-price {
    font-size: 0.85rem;
    font-weight: 600;
    color: $primary;
    white-space: nowrap;
    margin-left: 8px;
  }
}

.option-empty {
  padding: 16px;
  text-align: center;
  color: $text-secondary;
  font-size: 0.9rem;
  font-style: italic;
}

// Анимация
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top center;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scaleY(0.95);
}

span {
  color: unset;
}
</style>