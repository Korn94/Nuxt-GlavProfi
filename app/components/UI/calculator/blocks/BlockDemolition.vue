<!-- app/components/ui/calculator/blocks/BlockDemolition.vue -->
<template>
  <div class="block-demolition">
    <header class="block-header">
      <h3 class="block-title">🔨 Демонтаж и подготовка</h3>
      <p class="block-desc">Нажмите на работу из списка, чтобы сразу добавить её в смету.</p>
    </header>

    <!-- 1. Поиск и мгновенное добавление -->
    <div class="add-row">
      <WorkSearchSelect
        :model-value="null"
        :items="availableItems"
        placeholder="+ Нажмите, чтобы выбрать и добавить работу..."
        class="select-wrapper"
        @select="handleAdd"
      />
    </div>

    <!-- 2. Список выбранных работ -->
    <TransitionGroup name="list" tag="div" class="works-list">
      <div v-for="work in selectedWorks" :key="work.itemId" class="work-row">
        <div class="work-info">
          <span class="work-name">{{ getItemName(work.itemId) }}</span>
          <span class="work-unit-price">
            {{ formatPrice(getItemPrice(work.itemId)) }} ₽/{{ getUnitLabel(getItemUnit(work.itemId)) }}
          </span>
        </div>

        <div class="work-controls">
          <button type="button" class="qty-btn" @click="changeQty(work.itemId, -0.5)">
            <Icon name="material-symbols:remove" size="16" />
          </button>
          <input 
            type="number" 
            :value="work.quantity" 
            @input="onQtyInput(work.itemId, $event)" 
            class="qty-input" 
            min="0.5" 
            step="0.5"
          >
          <button type="button" class="qty-btn" @click="changeQty(work.itemId, 0.5)">
            <Icon name="material-symbols:add" size="16" />
          </button>
          <span class="row-total">
            {{ formatPrice(getItemPrice(work.itemId) * work.quantity) }} ₽
          </span>
          <button type="button" class="remove-btn" @click="emit('remove', work.itemId)" title="Удалить работу">
            <Icon name="material-symbols:delete-outline" size="20" />
          </button>
        </div>
      </div>
    </TransitionGroup>

    <!-- 3. Футер блока -->
    <footer v-if="selectedWorks.length" class="block-footer">
      <span>Итого за демонтаж:</span>
      <strong class="footer-total">{{ formatPrice(blockTotal) }} ₽</strong>
    </footer>

    <div v-else class="empty-state">
      <Icon name="mdi:construction-outline" size="48" class="empty-icon" />
      <p>Пока не выбрано ни одной работы.<br>Используйте поиск выше для добавления.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NormalizedWorkItem, WorkUnit } from '~/types/calculator'
import WorkSearchSelect from '~/components/ui/calculator/shared/WorkSearchSelect.vue'

// -----------------------------------------------------------------------------
// 1. Props & Emits
// -----------------------------------------------------------------------------
const props = defineProps<{
  availableItems: NormalizedWorkItem[]
  selectedWorks: Array<{ itemId: number; quantity: number }>
}>()

const emit = defineEmits<{
  'add': [itemId: number]
  'remove': [itemId: number]
  'update-qty': [itemId: number, qty: number]
}>()

// -----------------------------------------------------------------------------
// 2. Логика добавления
// -----------------------------------------------------------------------------
function handleAdd(itemId: number) {
  emit('add', itemId)
  console.log('✅ Добавлена работа демонтажа:', itemId)
}

// -----------------------------------------------------------------------------
// 3. Логика количества
// -----------------------------------------------------------------------------
function changeQty(itemId: number, delta: number) {
  const work = props.selectedWorks.find(w => w.itemId === itemId)
  if (work) emit('update-qty', itemId, Math.max(0.5, work.quantity + delta))
}

function onQtyInput(itemId: number, event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value)
  emit('update-qty', itemId, isNaN(val) || val < 0.5 ? 0.5 : val)
}

// Хелперы для поиска данных в availableItems
const findItem = (id: number) => props.availableItems.find(i => i.id === id)
const getItemName = (id: number) => findItem(id)?.name || 'Неизвестная работа'
const getItemPrice = (id: number) => findItem(id)?.pricePerUnit || 0
const getItemUnit = (id: number) => findItem(id)?.normalizedUnit || 'piece'

const blockTotal = computed(() => 
  props.selectedWorks.reduce((sum, w) => sum + (getItemPrice(w.itemId) * w.quantity), 0)
)

// -----------------------------------------------------------------------------
// 4. Утилиты
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

.block-demolition {
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: 12px;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
}

.block-header { margin-bottom: $spacing-md; }
.block-title { margin: 0 0 4px; font-size: 1.1rem; font-weight: 600; color: $text-primary; }
.block-desc { margin: 0; font-size: 0.85rem; color: $text-secondary; line-height: 1.4; }

.add-row { margin-bottom: $spacing-md; }
.select-wrapper { width: 100%; }

// Список работ
.works-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: $spacing-md; }

.work-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 12px; background: $bg-light; border-radius: 8px; border: 1px solid transparent; transition: all 0.2s;
  &:hover { border-color: rgba($primary, 0.2); background: rgba($primary, 0.02); }
  @include mobile { flex-direction: column; align-items: flex-start; gap: 8px; }
}

.work-info { display: flex; flex-direction: column; gap: 2px; }
.work-name { font-size: 0.9rem; font-weight: 500; color: $text-primary; line-height: 1.2; }
.work-unit-price { font-size: 0.75rem; color: $text-secondary; }

.work-controls { display: flex; align-items: center; gap: 6px; }
.qty-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: 1px solid $border-color; background: $bg-white;
  border-radius: 6px; cursor: pointer; color: $primary;
  &:hover { background: rgba($primary, 0.05); }
}
.qty-input {
  width: 48px; height: 28px; text-align: center; border: 1px solid $border-color;
  border-radius: 6px; font-size: 0.9rem; font-weight: 500; color: $text-primary;
  -moz-appearance: textfield; appearance: textfield;
  &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
}
.row-total { font-weight: 600; font-size: 0.95rem; color: $text-primary; min-width: 70px; text-align: right; margin-left: 4px; }
.remove-btn {
  display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;
  border: none; background: transparent; color: $danger; cursor: pointer; border-radius: 6px; opacity: 0.7;
  &:hover { opacity: 1; background: rgba($danger, 0.08); }
}

// Футер
.block-footer {
  display: flex; justify-content: space-between; align-items: center; padding-top: 12px;
  border-top: 1px dashed $border-color; font-size: 0.9rem; color: $text-secondary;
  .footer-total { font-size: 1.1rem; color: $primary; }
}

// Пустое состояние
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px 0; color: $text-muted; font-size: 0.9rem; text-align: center; gap: 8px;
  .empty-icon { opacity: 0.4; }
}

// Анимации
.list-enter-active, .list-leave-active { transition: all 0.25s ease; }
.list-enter-from { opacity: 0; transform: translateY(-8px); }
.list-leave-to { opacity: 0; transform: scale(0.98); }

span {
  color: unset;
}
</style>