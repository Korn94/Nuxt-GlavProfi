<!-- app/components/ui/calculator/cards/FinishCardExtras.vue -->
<template>
  <section class="extras-section">
    <div class="extras-header">
      <h5 class="section-title">Дополнительные работы</h5>
      <button type="button" class="btn-add-extra" @click="showSelector = !showSelector">
        <Icon name="material-symbols:add" size="18" /> 
        {{ showSelector ? 'Скрыть' : 'Добавить' }}
      </button>
    </div>

    <!-- Выпадающий список доступных допов -->
    <Transition name="slide">
      <div v-if="showSelector" class="extra-selector-dropdown">
        <div v-if="availableExtras.length" class="selector-list">
          <button
            v-for="item in availableExtras"
            :key="item.id"
            type="button"
            class="extra-option-btn"
            @click="handleAdd(item.id)"
          >
            <span class="extra-name">{{ item.name }}</span>
            <span class="extra-price">
              {{ formatPrice(item.pricePerUnit) }} ₽/{{ getUnitLabel(item.normalizedUnit) }}
            </span>
          </button>
        </div>
        <div v-else class="empty-selector">
          Все доступные для этого покрытия допы уже добавлены
        </div>
      </div>
    </Transition>

    <!-- Список добавленных допов -->
    <ul v-if="addedExtras.length" class="works-list">
      <li v-for="extra in addedExtras" :key="extra.itemId" class="work-item extra-item">
        <span class="work-name">{{ extra.work.name }}</span>
        <div class="extra-controls">
          <button type="button" class="qty-btn" @click="updateQty(extra.itemId, -1)">−</button>
          <input 
            type="number" 
            :value="extra.qty" 
            @input="onQtyInput(extra.itemId, $event)" 
            class="qty-input" 
            min="1" 
            step="1"
          >
          <button type="button" class="qty-btn" @click="updateQty(extra.itemId, 1)">+</button>
        </div>
        <span class="work-total">
          {{ formatPrice(extra.work.pricePerUnit * extra.qty) }} ₽
        </span>
        <button type="button" class="remove-extra-btn" @click="handleRemove(extra.itemId)" title="Удалить доп">
          <Icon name="material-symbols:close" size="16" />
        </button>
      </li>
    </ul>

    <div v-else class="no-extras-hint">Дополнительные работы не выбраны</div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FinishGroupConfig, NormalizedWorkItem, WorkUnit } from '~/types/calculator'

// -----------------------------------------------------------------------------
// 1. Props & Emits
// -----------------------------------------------------------------------------
const props = defineProps<{
  config: FinishGroupConfig | undefined
  allWorks: NormalizedWorkItem[]
  extras: Array<{ itemId: number; qty: number }>
}>()

const emit = defineEmits<{
  'add': [itemId: number]
  'remove': [itemId: number]
  'update-qty': [itemId: number, qty: number]
}>()

// -----------------------------------------------------------------------------
// 2. Состояние
// -----------------------------------------------------------------------------
const showSelector = ref(false)

// -----------------------------------------------------------------------------
// 3. Вычисляемые свойства
// -----------------------------------------------------------------------------

/** Доступные для добавления работы (фильтр по конфига + исключение уже добавленных) */
const availableExtras = computed(() => {
  if (!props.config?.extraItemIds?.length) return []
  const addedIds = new Set(props.extras.map(e => e.itemId))
  return props.allWorks.filter(w => 
    props.config!.extraItemIds.includes(w.id) && !addedIds.has(w.id)
  )
})

/** Полные данные для уже добавленных допов */
const addedExtras = computed(() => {
  return props.extras.map(e => ({
    ...e,
    work: props.allWorks.find(w => w.id === e.itemId)!
  })).filter(e => e.work)
})

// -----------------------------------------------------------------------------
// 4. Обработчики
// -----------------------------------------------------------------------------
function handleAdd(itemId: number) {
  emit('add', itemId)
  console.log(`➕ Добавлен доп к покрытию: ${itemId}`)
}

function handleRemove(itemId: number) {
  emit('remove', itemId)
}

function updateQty(itemId: number, delta: number) {
  const current = props.extras.find(e => e.itemId === itemId)
  if (current) emit('update-qty', itemId, Math.max(1, current.qty + delta))
}

function onQtyInput(itemId: number, event: Event) {
  const val = parseInt((event.target as HTMLInputElement).value, 10)
  if (!isNaN(val) && val > 0) emit('update-qty', itemId, val)
}

// -----------------------------------------------------------------------------
// 5. Утилиты
// -----------------------------------------------------------------------------
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(price))
}

function getUnitLabel(unit: WorkUnit): string {
  switch (unit) {
    case 'm2': return 'м²'
    case 'linear': return 'м.п.'
    default: return 'шт'
  }
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/calculator-vars.scss" as *;

.extras-section { margin-top: 16px; }

.extras-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: $text-primary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-add-extra {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px dashed $primary;
  color: $primary;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;

  &:hover { background: rgba($primary, 0.05); }
}

// Выпадающий список
.extra-selector-dropdown {
  background: $bg-light;
  border: 1px solid $border-color;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 12px;
  overflow: hidden;
}

.selector-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.extra-option-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  border-radius: 6px;
  transition: background 0.15s;

  &:hover { background: $bg-white; }

  .extra-name { font-size: 0.85rem; color: $text-primary; line-height: 1.3; }
  .extra-price { font-size: 0.8rem; color: $primary; font-weight: 600; white-space: nowrap; margin-left: 8px; }
}

.empty-selector, .no-extras-hint {
  padding: 12px;
  text-align: center;
  color: $text-muted;
  font-size: 0.85rem;
  font-style: italic;
}

// Список добавленных
.works-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid $border-light;
  border-radius: 8px;
  overflow: hidden;
}

.extra-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid $border-light;
  font-size: 0.85rem;
  background: $bg-white;

  &:last-child { border-bottom: none; }
}

.work-name { flex: 1; font-weight: 500; color: $text-primary; }

.extra-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  
  .qty-btn {
    width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid $border-color; background: $bg-white;
    border-radius: 4px; cursor: pointer; color: $primary;
    &:hover { background: rgba($primary, 0.1); }
  }
  
  .qty-input {
    width: 36px; height: 24px;
    text-align: center; border: 1px solid $border-color;
    border-radius: 4px; font-size: 0.85rem;
    -moz-appearance: textfield; appearance: textfield;
    &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  }
}

.work-total { font-weight: 600; color: $primary; min-width: 60px; text-align: right; }

.remove-extra-btn {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  background: transparent; border: none; color: $danger;
  cursor: pointer; border-radius: 4px; opacity: 0.6;
  &:hover { opacity: 1; background: rgba($danger, 0.08); }
}

// Анимация
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; max-height: 300px; overflow: hidden; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; }

span {
  color: unset;
}
</style>