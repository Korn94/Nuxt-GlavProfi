<!-- app/components/ui/calculator/cards/FinishCardExtras.vue -->
<template>
  <section class="extras-section">
    <div class="extras-header">
      <h5 class="section-title">Дополнительные работы</h5>
      <button type="button" class="btn-add-extra" @click="showSelector = !showSelector">
        <Icon :name="showSelector ? 'material-symbols:close' : 'material-symbols:add'" size="18" />
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
        <p class="work-name">{{ extra.work.name }}</p>
        <div class="extra-controls">
          <button type="button" class="qty-btn" @click="updateQty(extra.itemId, -1)">
            <Icon name="material-symbols:remove" size="14" />
          </button>
          <input
            type="number"
            :value="extra.qty"
            @input="onQtyInput(extra.itemId, $event)"
            class="qty-input"
            min="1"
            step="1"
          >
          <button type="button" class="qty-btn" @click="updateQty(extra.itemId, 1)">
            <Icon name="material-symbols:add" size="14" />
          </button>
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
@use "@/assets/styles/variables" as *;

// === Секция доп. работ ===
.extras-section {
  margin-top: 1rem;
}

.extras-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.section-title {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba($text-light, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: 'Rubik', sans-serif;
}

// === Кнопка "Добавить / Скрыть" ===
.btn-add-extra {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: 1px dashed rgba(0, 195, 245, 0.4);
  color: $blue-light;
  padding: 0.3rem 0.8rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.8rem;
  font-family: 'Rubik', sans-serif;
  font-weight: 500;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(0, 195, 245, 0.08);
    border-color: $blue;
  }
}

// === Выпадающий список доступных допов ===
.extra-selector-dropdown {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0.3rem;
  margin-bottom: 1rem;
  overflow: hidden;
}

.selector-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.extra-option-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.8rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(0, 195, 245, 0.08);
  }

  .extra-name {
    font-size: 0.88rem;
    color: rgba($text-light, 0.9);
    line-height: 1.35;
    font-family: 'Rubik', sans-serif;
  }

  .extra-price {
    font-size: 0.82rem;
    color: $blue-light;
    font-weight: 600;
    white-space: nowrap;
    margin-left: 0.6rem;
    font-family: 'Rubik', sans-serif;
  }
}

.empty-selector,
.no-extras-hint {
  padding: 1rem;
  text-align: center;
  color: rgba($text-light, 0.4);
  font-size: 0.85rem;
  font-style: italic;
}

// === Список добавленных допов ===
.works-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
}

.extra-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.88rem;
  background: rgba(255, 255, 255, 0.02);
  transition: background 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
}

.work-name {
  flex: 1;
  font-weight: 500;
  color: rgba($text-light, 0.9);
  font-family: 'Rubik', sans-serif;
  min-width: 0;
  line-height: 1.35;
}

// === Контролы количества ===
.extra-controls {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;

  .qty-btn {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    border-radius: 6px;
    cursor: pointer;
    color: $blue-light;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 195, 245, 0.12);
      border-color: rgba(0, 195, 245, 0.3);
    }
  }

  .qty-input {
    width: 40px;
    height: 26px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 6px;
    font-size: 0.85rem;
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
}

.work-total {
  font-weight: 700;
  color: $blue-light;
  min-width: 65px;
  text-align: right;
  font-family: 'Rubik', sans-serif;
  flex-shrink: 0;
}

.remove-extra-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: none;
  color: rgba(#ff6b6b, 0.6);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: #ff6b6b;
    background: rgba(#ff6b6b, 0.12);
  }
}

// === Анимация раскрытия ===
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 400px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

// === Адаптив ===
@media (max-width: 640px) {
  .extra-item {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .work-name {
    flex-basis: 100%;
  }

  .extra-controls {
    order: 2;
  }

  .work-total {
    order: 3;
    margin-left: auto;
  }

  .remove-extra-btn {
    order: 4;
  }
}
</style>