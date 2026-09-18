<!-- app/components/pages/public/remontPomescheniy/pageTypes/workTypes/ui/PriceCalculatorTabs.vue -->
<template>
  <section class="price-calculator">
    <div class="container">
      <h2 class="price-calculator__title" v-html="title" />
      <p class="price-calculator__subtitle" v-if="subtitle">{{ subtitle }}</p>

      <div v-if="mounted && loading" class="calculator-loading">
        <div class="loading-spinner">
          <Icon name="mdi:loading" size="32" class="spin" />
        </div>
        <p>Загружаем актуальные цены из прайс-листа...</p>
      </div>

      <template v-else>
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tabs__btn"
            :class="{ 'tabs__btn--active': activeTab === tab.id }"
            @click="switchTab(tab.id)"
          >
            <Icon v-if="tab.icon" :name="tab.icon" size="18" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <div class="calculator-body">
          <div class="calculator-works">
            <h3 class="calculator-works__title">Состав работ:</h3>
            
            <!-- Универсальные опции выбора -->
            <template v-for="optionGroup in optionGroups" :key="optionGroup.id">
              <div 
                v-if="optionGroup.options.length" 
                class="calculator-options"
                :class="`calculator-options--${optionGroup.type}`"
              >
                <h4>{{ optionGroup.label }}</h4>
                <div 
                  class="options-grid"
                  :class="`options-grid--${optionGroup.displayType || 'cards'}`"
                >
                  <label
                    v-for="option in optionGroup.options"
                    :key="option.id"
                    class="option-item"
                    :class="{ 
                      'option-item--selected': isSelected(optionGroup.id, option.id),
                      'option-item--disabled': option.price === 0
                    }"
                  >
                    <input
                      :type="optionGroup.multiple ? 'checkbox' : 'radio'"
                      :name="`${optionGroup.id}-${activeTab}`"
                      :value="option.id"
                      @change="toggleOption(optionGroup.id, option.id, optionGroup.multiple)"
                      :checked="isSelected(optionGroup.id, option.id)"
                      :disabled="option.price === 0"
                    />
                    <div class="option-item__content">
                      <div class="option-item__header">
                        <span class="option-item__name">{{ option.name }}</span>
                        <span 
                          v-if="option.recommended" 
                          class="option-item__badge"
                        >
                          {{ option.badge || 'Рекомендуем' }}
                        </span>
                      </div>
                      <div 
                        v-if="option.description" 
                        class="option-item__description"
                      >
                        {{ option.description }}
                      </div>
                      <div class="option-item__price">
                        <template v-if="option.price > 0">
                          {{ option.price.toLocaleString('ru-RU') }} ₽/{{ option.unit || 'м²' }}
                        </template>
                        <template v-else>
                          <span class="price-unavailable">Цена недоступна</span>
                        </template>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </template>

            <!-- Список работ -->
            <ul class="calculator-works__list" v-if="currentWorks.length">
              <li
                v-for="(work, index) in currentWorks"
                :key="index"
                class="calculator-works__item"
              >
                <Icon name="mdi:check-circle" size="18" class="work-icon" />
                <span class="work-name">{{ work.name }}</span>
                <span class="work-price">
                  <template v-if="work.price > 0">
                    {{ work.price.toLocaleString('ru-RU') }} ₽/{{ work.unit || 'м²' }}
                  </template>
                  <template v-else>—</template>
                </span>
              </li>
            </ul>

            <!-- Итого -->
            <div class="calculator-total">
              <div class="calculator-total__label">Итого за {{ currentUnit }}:</div>
              <div class="calculator-total__value">
                <span class="price">{{ totalPerUnit.toLocaleString('ru-RU') }} ₽</span>
                <span class="note">без материалов</span>
              </div>
            </div>

            <!-- Дополнительные опции -->
            <div class="calculator-extras" v-if="currentExtras?.length">
              <h4>Дополнительно:</h4>
              <div class="extras-list">
                <label
                  v-for="extra in currentExtras"
                  :key="extra.id"
                  class="extra-item"
                  :class="{ 'extra-item--disabled': extra.price === 0 }"
                >
                  <input
                    type="checkbox"
                    v-model="selectedExtras"
                    :value="extra.id"
                    :disabled="extra.price === 0"
                  />
                  <span class="extra-checkbox">
                    <Icon v-if="selectedExtras.includes(extra.id)" name="mdi:check" size="14" />
                  </span>
                  <span class="extra-name">{{ extra.name }}</span>
                  <span class="extra-price">
                    <template v-if="extra.price > 0">
                      +{{ extra.price.toLocaleString('ru-RU') }} ₽/{{ extra.unit || 'м²' }}
                    </template>
                    <template v-else>—</template>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- Боковая панель -->
          <aside class="calculator-side">
            <div class="side-card">
              <h3>Рассчитать для вашей площади</h3>
              <label class="side-label">
                Площадь, {{ currentUnit }}
                <div class="side-input-wrap">
                  <button @click="decreaseArea" :disabled="area <= minArea">
                    <Icon name="mdi:minus" size="18" />
                  </button>
                  <input
                    v-model="areaInput"
                    type="text"
                    inputmode="decimal"
                    @input="handleAreaInput"
                    @blur="clampArea"
                    @keydown="handleAreaKeydown"
                  />
                  <button @click="increaseArea" :disabled="area >= maxArea">
                    <Icon name="mdi:plus" size="18" />
                  </button>
                </div>
              </label>

              <div class="side-result">
                <span class="side-result__label">Предварительная стоимость:</span>
                <span class="side-result__value">{{ totalCost.toLocaleString('ru-RU') }} ₽</span>
                <span class="side-result__note">
                  Точная цена — после бесплатного замера
                </span>
              </div>

              <button class="side-cta" @click="openModal">
                <Icon name="mdi:send" size="18" />
                Вызвать замерщика
              </button>
            </div>
          </aside>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <UiFormsContactForm
        v-if="showModal"
        :source="sourceLabel"
        @close="closeModal"
        @form-submitted="handleFormSubmitted"
      />
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { CalculatorTab, BaseOption } from '../../workTypes/types'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    tabs: CalculatorTab[]
    defaultArea?: number
    minArea?: number
    maxArea?: number
    areaStep?: number
    loading?: boolean
  }>(),
  {
    defaultArea: 20,
    minArea: 1,
    maxArea: 500,
    areaStep: 5,
    loading: false,
  }
)

const emit = defineEmits<{
  (e: 'order-estimate', data: any): void
}>()

const activeTab = ref(props.tabs[0]?.id || '')
const showModal = ref(false)
const mounted = ref(false)

// Ввод площади
const areaInput = ref(String(props.defaultArea))
const area = computed(() => {
  const num = parseFloat(areaInput.value.replace(',', '.'))
  return isNaN(num) ? props.minArea : num
})

// Универсальное хранилище выбранных опций
const selectedOptions = ref<Record<string, string | string[]>>({})
const selectedExtras = ref<string[]>([])

onMounted(() => {
  mounted.value = true
  initSelections()
})

// === Вычисляемые свойства ===

const currentTab = computed(() =>
  props.tabs.find((t) => t.id === activeTab.value) || props.tabs[0]
)

const currentWorks = computed(() => currentTab.value.works || [])
const currentExtras = computed(() => currentTab.value.extras || [])

/**
 * Универсальные группы опций для отображения
 * Объединяет tileSizeOptions, zatirkaOptions, baseOptions в единую структуру
 */
const optionGroups = computed(() => {
  const groups: Array<{
    id: string
    label: string
    type: 'tileSize' | 'zatirka' | 'base'
    displayType?: 'cards' | 'compact'
    multiple?: boolean
    options: BaseOption[]
  }> = []

  const tab = currentTab.value

  // 1. Размер плитки (если есть)
  if (tab.tileSizeOptions?.length) {
    groups.push({
      id: 'tileSize',
      label: 'Размер плитки',
      type: 'tileSize',
      displayType: 'cards',
      multiple: false,
      options: tab.tileSizeOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        price: opt.price,
        unit: opt.unit,
        recommended: opt.recommended,
        description: opt.description,
        badge: 'Популярный'
      }))
    })
  }

  // 2. Базовые варианты (для ГКЛ и др.)
  if (tab.baseOptions?.length) {
    groups.push({
      id: 'baseOption',
      label: tab.baseOptionsLabel || 'Вариант исполнения',
      type: 'base',
      displayType: 'cards',
      multiple: false,
      options: tab.baseOptions
    })
  }

  // 3. Тип затирки (если есть)
  if (tab.zatirkaOptions?.length) {
    groups.push({
      id: 'zatirka',
      label: 'Тип затирки',
      type: 'zatirka',
      displayType: 'compact',
      multiple: false,
      options: tab.zatirkaOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        price: opt.price,
        unit: opt.unit,
        recommended: opt.recommended,
        description: opt.description,
        badge: 'Рекомендуем'
      }))
    })
  }

  return groups
})

/**
 * Единица измерения для расчётов
 */
const currentUnit = computed(() => {
  for (const group of optionGroups.value) {
    const selectedId = selectedOptions.value[group.id]
    if (Array.isArray(selectedId)) continue
    
    const option = group.options.find(opt => opt.id === selectedId)
    if (option?.unit) return option.unit
  }

  const firstWork = currentWorks.value[0]
  if (firstWork?.unit) return firstWork.unit

  const firstExtra = currentExtras.value[0]
  return firstExtra?.unit || 'м²'
})

const sourceLabel = computed(() => {
  const tabName = currentTab.value?.label || ''
  return tabName
    ? `Калькулятор стоимости (${tabName})`
    : 'Калькулятор стоимости'
})

// === Методы работы с опциями ===

const isSelected = (groupId: string, optionId: string): boolean => {
  const selected = selectedOptions.value[groupId]
  if (Array.isArray(selected)) {
    return selected.includes(optionId)
  }
  return selected === optionId
}

const toggleOption = (groupId: string, optionId: string, multiple = false) => {
  if (multiple) {
    const current = selectedOptions.value[groupId] || []
    const selected = Array.isArray(current) ? current : []
    
    if (selected.includes(optionId)) {
      selectedOptions.value[groupId] = selected.filter(id => id !== optionId)
    } else {
      selectedOptions.value[groupId] = [...selected, optionId]
    }
  } else {
    selectedOptions.value[groupId] = optionId
  }
}

/**
 * Инициализация выбранных опций по умолчанию
 */
const initSelections = () => {
  selectedOptions.value = {}
  selectedExtras.value = []

  optionGroups.value.forEach(group => {
    const defaultOption = group.options.find(opt => opt.recommended) || group.options[0]
    if (defaultOption) {
      selectedOptions.value[group.id] = group.multiple ? [defaultOption.id] : defaultOption.id
    }
  })
}

// === Расчёт стоимости ===

const baseTotal = computed(() => {
  let total = 0

  // Суммируем выбранные опции из всех групп
  optionGroups.value.forEach(group => {
    const selected = selectedOptions.value[group.id]
    
    if (Array.isArray(selected)) {
      selected.forEach(id => {
        const option = group.options.find(opt => opt.id === id)
        total += option?.price || 0
      })
    } else if (selected) {
      const option = group.options.find(opt => opt.id === selected)
      total += option?.price || 0
    }
  })

  // Работы из списка works
  currentWorks.value.forEach(work => {
    total += work.price || 0
  })

  return total
})

const extrasTotal = computed(() =>
  selectedExtras.value.reduce((sum, id) => {
    const extra = currentExtras.value.find((e) => e.id === id)
    return sum + (extra?.price || 0)
  }, 0)
)

const totalPerUnit = computed(() => baseTotal.value + extrasTotal.value)
const totalCost = computed(() => totalPerUnit.value * area.value)

// === Обработчики событий ===

const switchTab = (tabId: string) => {
  activeTab.value = tabId
}

watch(activeTab, () => {
  initSelections()
})

// === Логика ввода площади ===

const handleAreaInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value
  
  value = value.replace(',', '.')
  value = value.replace(/[^0-9.]/g, '')
  
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }
  
  if (parts.length === 2 && parts[1].length > 1) {
    value = parts[0] + '.' + parts[1].substring(0, 1)
  }
  
  areaInput.value = value
}

const handleAreaKeydown = (event: KeyboardEvent) => {
  const allowedKeys = [
    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 
    'Tab', 'Home', 'End'
  ]
  
  if (allowedKeys.includes(event.key)) return
  if (/^[0-9]$/.test(event.key)) return
  if ((event.key === '.' || event.key === ',') && !areaInput.value.includes('.')) return
  if (event.ctrlKey || event.metaKey) return
  
  event.preventDefault()
}

const clampArea = () => {
  let num = parseFloat(areaInput.value.replace(',', '.'))
  
  if (isNaN(num) || num < props.minArea) {
    num = props.minArea
  }
  if (num > props.maxArea) {
    num = props.maxArea
  }
  
  num = Math.round(num * 10) / 10
  
  if (Number.isInteger(num)) {
    areaInput.value = String(num)
  } else {
    areaInput.value = num.toFixed(1)
  }
}

const increaseArea = () => {
  let current = parseFloat(areaInput.value.replace(',', '.')) || props.minArea
  current = Math.min(props.maxArea, current + props.areaStep)
  current = Math.round(current * 10) / 10
  
  if (Number.isInteger(current)) {
    areaInput.value = String(current)
  } else {
    areaInput.value = current.toFixed(1)
  }
}

const decreaseArea = () => {
  let current = parseFloat(areaInput.value.replace(',', '.')) || props.minArea
  current = Math.max(props.minArea, current - props.areaStep)
  current = Math.round(current * 10) / 10
  
  if (Number.isInteger(current)) {
    areaInput.value = String(current)
  } else {
    areaInput.value = current.toFixed(1)
  }
}

const openModal = () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleFormSubmitted = (formData: unknown) => {
  console.log('[Калькулятор] Форма заявки отправлена:', formData)
  emit('order-estimate', {
    tab: currentTab.value,
    selectedOptions: selectedOptions.value,
    selectedExtras: selectedExtras.value,
    area: area.value,
    totalCost: totalCost.value,
    ...formData
  })
  closeModal()
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.price-calculator {
  @include section-padding;
  background: $background-light;
  color: $text-dark;
  width: 100%; // Гарантируем ширину 100% от родителя
  overflow-x: hidden;

  .container {
    @include section-container;
    overflow-x: hidden;
  }

  &__title {
    @include section-title;
    word-wrap: break-word;
  }

  &__subtitle {
    @include section-subtitle;
    color: $text-gray;
  }

  button,
  label,
  input {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
}

.calculator-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: $text-gray;
  gap: 1rem;

  @media (max-width: 600px) {
    padding: 3rem 1rem;
  }

  .loading-spinner { color: $blue; }
  .spin { animation: spin 1s linear infinite; }
  p { font-size: 0.95rem; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid $border-color;
  flex-wrap: wrap;

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.9rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: $text-gray;
    font-family: 'Rubik', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover { color: $blue; }

    &--active {
      color: $blue;
      border-bottom-color: $blue;
    }

    @media (max-width: 600px) {
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      gap: 0.4rem;
    }
  }
}

.calculator-body {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 2.5rem;
  min-width: 0;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.calculator-works {
  min-width: 0;
  max-width: 100%;

  &__title {
    font-size: 1.2rem;
    font-weight: 600;
    color: $text-dark;
    margin: 0 0 1rem;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: $border-radius;
    margin-bottom: 0.5rem;
    transition: background 0.2s ease;
    min-width: 0;

    @media (max-width: 600px) {
      padding: 0.8rem;
      gap: 0.6rem;
    }

    &:hover { background: #f0f2f5; }

    .work-icon { color: $green; flex-shrink: 0; }
    .work-name {
      flex: 1;
      color: $text-dark;
      font-size: 0.98rem;
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .work-price {
      font-weight: 700;
      color: $blue;
      font-size: 1rem;
      white-space: nowrap;
      flex-shrink: 0;
    }
  }
}

.calculator-options {
  margin-bottom: 1.5rem;
  min-width: 0;

  h4 {
    font-size: 1rem;
    color: $text-dark;
    margin: 0 0 0.8rem;

    @media (max-width: 600px) {
      font-size: 0.95rem;
    }
  }
}

.options-grid {
  display: grid;
  gap: 0.8rem;
  min-width: 0;

  &--cards {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));

    @media (max-width: 600px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 400px) {
      grid-template-columns: 1fr;
    }
  }

  &--compact {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));

    @media (max-width: 600px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 400px) {
      grid-template-columns: 1fr;
    }
  }
}

.option-item {
  display: block;
  padding: 1rem;
  background: #fff;
  border: 2px solid $border-color;
  border-radius: $border-radius;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  box-sizing: border-box;
  min-width: 0;

  @media (max-width: 600px) {
    padding: 0.8rem;
  }

  &:hover:not(&--disabled) {
    border-color: $blue;
    background: rgba(0, 195, 245, 0.02);
  }

  &--selected {
    border-color: $blue;
    background: rgba(0, 195, 245, 0.05);
    box-shadow: 0 2px 8px rgba(0, 195, 245, 0.15);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input { display: none; }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  &__name {
    font-weight: 700;
    color: $text-dark;
    font-size: 1.1rem;
    word-break: break-word;

    @media (max-width: 600px) {
      font-size: 1rem;
    }
  }

  &__badge {
    background: $green;
    color: #fff;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  &__description {
    color: $text-gray;
    font-size: 0.8rem;
    line-height: 1.3;
  }

  &__price {
    color: $blue;
    font-weight: 700;
    font-size: 0.95rem;
    margin-top: 0.2rem;
  }
}

.price-unavailable {
  color: $text-gray;
  font-size: 0.8rem;
  font-style: italic;
}

.calculator-total {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: rgba(0, 195, 245, 0.08);
  border: 1px solid rgba(0, 195, 245, 0.25);
  border-left: 4px solid $blue;
  border-radius: $border-radius;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  &__label {
    font-size: 1.05rem;
    color: $text-dark;
    font-weight: 500;
  }

  &__value {
    text-align: right;

    @media (max-width: 600px) {
      text-align: left;
      width: 100%;
    }

    .price {
      display: block;
      font-family: 'Rubik', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      color: $blue;
      line-height: 1;

      @media (max-width: 600px) {
        font-size: 1.75rem;
      }
    }
    .note {
      display: block;
      font-size: 0.82rem;
      color: $text-gray;
      margin-top: 0.2rem;
    }
  }
}

.calculator-extras {
  margin-top: 1.5rem;
  min-width: 0;

  h4 {
    font-size: 1rem;
    color: $text-dark;
    margin: 0 0 0.8rem;
  }
}

.extras-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.extra-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.8rem 1rem;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  cursor: pointer;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  min-width: 0;

  @media (max-width: 600px) {
    padding: 0.7rem;
  }

  &:hover:not(&--disabled) { border-color: $blue; }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input { display: none; }

  .extra-checkbox {
    width: 20px;
    height: 20px;
    border: 1.5px solid $border-color;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  input:checked + .extra-checkbox {
    background: $blue-gradient;
    border-color: transparent;
  }

  .extra-name {
    flex: 1;
    color: $text-dark;
    font-size: 0.95rem;
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .extra-price {
    color: $text-gray;
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

.side-card {
  position: sticky;
  top: 120px;
  padding: 2rem;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  max-width: 100%;
  min-width: 0;

  @media (max-width: 900px) {
    position: static;
    top: auto;
  }

  @media (max-width: 600px) {
    padding: 1.5rem;
  }

  h3 {
    font-family: 'Rubik', sans-serif;
    font-size: 1.2rem;
    color: $text-dark;
    margin: 0 0 1.5rem;
    word-break: break-word;
  }
}

.side-label {
  display: block;
  font-size: 0.9rem;
  color: $text-gray;
  margin-bottom: 0.5rem;
}

.side-input-wrap {
  display: flex;
  align-items: stretch;
  background: #f8f9fa;
  border: 1.5px solid $border-color;
  border-radius: 10px;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;

  button {
    width: 42px;
    min-width: 42px;
    flex-shrink: 0;
    background: transparent;
    border: none;
    color: $blue;
    cursor: pointer;
    transition: background 0.2s ease;
    &:hover:not(:disabled) { background: rgba(0, 195, 245, 0.1); }
    &:disabled { opacity: 0.3; cursor: not-allowed; }
  }

  input {
    flex: 1 1 0;
    background: transparent;
    border: none;
    text-align: center;
    font-family: 'Rubik', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: $text-dark;
    outline: none;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
  }
}

.side-result {
  margin: 1.5rem 0;
  padding: 1.2rem;
  background: rgba(0, 195, 245, 0.06);
  border-radius: 10px;
  text-align: center;
  box-sizing: border-box;
  overflow: hidden;

  &__label {
    display: block;
    font-size: 0.88rem;
    color: $text-gray;
    margin-bottom: 0.3rem;
  }
  &__value {
    display: block;
    font-family: 'Rubik', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: $blue;
    line-height: 1.1;
    word-break: break-word;

    @media (max-width: 600px) {
      font-size: 1.75rem;
    }
  }
  &__note {
    display: block;
    font-size: 0.78rem;
    color: $text-gray;
    margin-top: 0.3rem;
    font-style: italic;
  }
}

.side-cta {
  @include btn-primary;
  width: 100%;
  padding: 1rem;
  box-sizing: border-box;
}
</style>