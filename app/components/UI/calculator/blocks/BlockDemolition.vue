<!-- app/components/ui/calculator/blocks/BlockDemolition.vue -->
<template>
  <div class="block-demolition">
    <header class="block-header">
      <h3 class="block-title">
        <Icon name="mdi:hammer-wrench" size="22" class="block-title__icon" />
        Демонтаж и подготовка
        <span class="section-badge">
          <Icon :name="sectionMeta.icon" size="16" />
          {{ sectionMeta.label }}
        </span>
      </h3>
      <p class="block-desc">Нажмите на работу из списка, чтобы сразу добавить её в смету.</p>
    </header>

    <!-- 1. Поиск и мгновенное добавление -->
    <div class="add-row">
      <WorkSearchSelect
        :model-value="null"
        :items="availableItems"
        placeholder="+ Нажмите, чтобы выбрать и добавить работу..."
        :exclude-item-ids="selectedWorks.map(w => w.itemId)"
        class="select-wrapper"
        @select="handleAdd"
      />
    </div>

    <!-- 2. Список выбранных работ -->
    <TransitionGroup name="list" tag="div" class="works-list">
      <div v-for="work in selectedWorks" :key="work.itemId" class="work-row">
        <div class="work-info">
          <p class="work-name">{{ getItemName(work.itemId) }}</p>
          <p class="work-unit-price">
            {{ formatPrice(getItemPrice(work.itemId)) }} ₽/{{ getUnitLabel(getItemUnit(work.itemId)) }}
          </p>
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
          <p class="row-total">
            {{ formatPrice(getItemPrice(work.itemId) * work.quantity) }} ₽
          </p>
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
import type { CalculatorSection, NormalizedWorkItem, WorkUnit } from '~/types/calculator'
import WorkSearchSelect from '~/components/ui/calculator/shared/WorkSearchSelect.vue'

// -----------------------------------------------------------------------------
// 1. Props & Emits
// -----------------------------------------------------------------------------
const props = defineProps<{
  availableItems: NormalizedWorkItem[]
  selectedWorks: Array<{ itemId: number; quantity: number }>
  allWorks?: NormalizedWorkItem[]
  section: CalculatorSection // ← новый пропс
}>()

// Маппинг секции → русское название + иконка
const SECTION_META: Record<CalculatorSection, { label: string; icon: string }> = {
  walls:   { label: 'стены',    icon: 'mdi:wall' },
  floor:   { label: 'пол',      icon: 'material-symbols:floor' },
  ceiling: { label: 'потолок',  icon: 'material-symbols:roofing' },
  partitions: { label: 'перегородки',  icon: 'material-symbols:roofing' },
}

const sectionMeta = computed(() => SECTION_META[props.section] || SECTION_META.walls)

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
  // console.log('✅ Добавлена работа демонтажа:', itemId)
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

// Хелперы для поиска данных: сначала в availableItems, затем во allWorks
const findItem = (id: number) => props.availableItems.find(i => i.id === id) || props.allWorks?.find(i => i.id === id)
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
@use "@/assets/styles/variables" as *;

// === Контейнер блока (тёмная карточка) ===
.block-demolition {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 1.8rem;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

// === Заголовок блока ===
.block-header {
  margin-bottom: 1.5rem;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 0.4rem;
  font-family: 'Rubik', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: $text-light;
  line-height: 1.3;

  &__icon {
    color: $blue-light;
    flex-shrink: 0;
  }
}

.block-desc {
  margin: 0;
  font-size: 0.88rem;
  color: rgba($text-light, 0.6);
  line-height: 1.5;
}

// === Строка поиска ===
.add-row {
  margin-bottom: 1.5rem;
}

.select-wrapper {
  width: 100%;
}

// === Список работ ===
.works-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}

// === Строка работы ===
.work-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.1rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.25s ease;

  &:hover {
    border-color: rgba(0, 195, 245, 0.25);
    background: rgba(0, 195, 245, 0.04);
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }
}

// === Информация о работе ===
.work-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  flex: 1;
}

.work-name {
  font-size: 0.92rem;
  font-weight: 500;
  color: rgba($text-light, 0.95);
  line-height: 1.3;
  font-family: 'Rubik', sans-serif;
}

.work-unit-price {
  font-size: 0.78rem;
  color: rgba($text-light, 0.5);
}

// === Контролы количества ===
.work-controls {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.qty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  cursor: pointer;
  color: $blue-light;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 195, 245, 0.12);
    border-color: rgba(0, 195, 245, 0.3);
  }
}

.qty-input {
  width: 52px;
  height: 30px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Rubik', sans-serif;
  color: $text-light;
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;

  -moz-appearance: textfield;
  appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    outline: none;
    border-color: $blue;
    background: rgba(0, 195, 245, 0.06);
  }
}

.row-total {
  font-weight: 700;
  font-size: 0.95rem;
  color: $blue-light;
  min-width: 75px;
  text-align: right;
  margin-left: 0.3rem;
  font-family: 'Rubik', sans-serif;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: rgba(#ff6b6b, 0.7);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: #ff6b6b;
    background: rgba(#ff6b6b, 0.12);
  }
}

// === Футер блока ===
.block-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.12);
  font-size: 0.92rem;
  color: rgba($text-light, 0.65);
  font-family: 'Rubik', sans-serif;

  .footer-total {
    font-size: 1.2rem;
    font-weight: 700;
    color: $blue-light;
  }
}

// === Пустое состояние ===
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
  color: rgba($text-light, 0.4);
  font-size: 0.92rem;
  text-align: center;
  gap: 0.8rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 12px;

  .empty-icon {
    opacity: 0.35;
    color: rgba($text-light, 0.5);
  }

  p {
    color: $text-gray;
    margin: 0;
    line-height: 1.5;
  }
}

// === Анимации списка ===
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

.list-move {
  transition: transform 0.3s ease;
}

// === Бейдж текущей секции в заголовке ===
.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-left: 0.5rem;
  padding: 0.2rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: $blue-light;
  background: rgba(0, 195, 245, 0.12);
  border: 1px solid rgba(0, 195, 245, 0.25);
  border-radius: 50px;
  text-transform: lowercase;
  font-family: 'Rubik', sans-serif;
  letter-spacing: 0.02em;
  vertical-align: middle;
  transition: all 0.25s ease;
}

// Плавная смена при переключении секции
.block-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
}
</style>