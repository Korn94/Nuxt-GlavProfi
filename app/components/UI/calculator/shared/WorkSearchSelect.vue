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
  'select': [id: number]
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
  emit('select', item.id)
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
@use "@/assets/styles/variables" as *;

.work-search-select {
  position: relative;
  width: 100%;
}

// === Кнопка открытия (триггер) ===
.select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Rubik', sans-serif;
  font-size: 0.95rem;
  color: $text-light;
  transition: all 0.25s ease;
  text-align: left;

  &:hover {
    border-color: rgba(0, 195, 245, 0.4);
    background: rgba(0, 195, 245, 0.04);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.15);
    border-color: $blue;
  }

  .selected-text {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: $text-light;
  }

  .placeholder-text {
    flex: 1;
    color: rgba($text-light, 0.4);
  }
  
  .arrow-icon {
    transition: transform 0.25s ease, color 0.25s ease;
    color: rgba($text-light, 0.5);
    flex-shrink: 0;

    &.is-rotated {
      transform: rotate(180deg);
      color: $blue-light;
    }
  }
}

// === Выпадающая панель ===
.dropdown-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;
  background: #2a2b2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
  z-index: 100;
  overflow: hidden;
  backdrop-filter: blur(12px);
}

// === Поиск ===
.search-wrapper {
  position: relative;
  padding: 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  
  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: rgba($text-light, 0.45);
    pointer-events: none;
  }
  
  .search-input {
    width: 100%;
    padding: 0.6rem 2.2rem 0.6rem 2.5rem;
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    font-family: 'Rubik', sans-serif;
    font-size: 0.9rem;
    color: $text-light;
    transition: all 0.25s ease;

    &::placeholder {
      color: rgba($text-light, 0.35);
    }
    
    &:focus {
      outline: none;
      border-color: $blue;
      background: rgba(0, 195, 245, 0.06);
    }
  }

  .clear-btn {
    position: absolute;
    right: 0.9rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: rgba($text-light, 0.45);
    padding: 0.2rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;

    &:hover {
      color: #ff8c8c;
      background: rgba(255, 107, 107, 0.1);
    }
  }
}

// === Список опций ===
.options-list {
  max-height: 260px;
  overflow-y: auto;
  margin: 0;
  padding: 0.3rem 0;
  list-style: none;
  
  // Кастомный скроллбар для тёмной темы
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1rem;
  cursor: pointer;
  transition: background 0.15s ease;
  gap: 0.8rem;
  
  &:hover {
    background: rgba(0, 195, 245, 0.08);
  }
  
  .option-name {
    font-size: 0.9rem;
    color: rgba($text-light, 0.9);
    line-height: 1.35;
    flex: 1;
    min-width: 0;
  }
  
  .option-price {
    font-size: 0.85rem;
    font-weight: 600;
    color: $blue-light;
    white-space: nowrap;
    flex-shrink: 0;
    font-family: 'Rubik', sans-serif;
  }
}

.option-empty {
  padding: 1.5rem;
  text-align: center;
  color: rgba($text-light, 0.45);
  font-size: 0.9rem;
  font-style: italic;
}

// === Анимация появления/исчезновения ===
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top center;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scaleY(0.95);
}
</style>