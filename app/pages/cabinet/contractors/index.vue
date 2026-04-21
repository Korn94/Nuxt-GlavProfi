<!-- app/pages/cabinet/contractors/index.vue -->
 <!-- Страница выбора типа контрагента -->
<template>
  <div class="contractors-index">

    <!-- Заголовок -->
    <PagesCabinetUiLayoutPageTitle 
      title="Контрагенты" 
      icon="mdi:account-multiple"
    >
      <template #actions>
        <button class="crm-btn crm-btn--accent" @click="showQuickAdd = true">
          <Icon name="mdi:plus" size="15" />
          Быстро добавить
        </button>
      </template>
    </PagesCabinetUiLayoutPageTitle>

    <!-- Контент -->
    <div class="contractors-index__content">

      <!-- Сетка типов контрагентов -->
      <div class="contractor-types">
        <NuxtLink 
          v-for="type in contractorTypes" 
          :key="type.value"
          :to="`/cabinet/contractors/${type.value}`"
          :class="['contractor-type-card', `contractor-type-card--${type.value}`]"
        >
          <div class="contractor-type-card__icon">
            <Icon :name="type.icon" size="32" />
          </div>
          <div class="contractor-type-card__content">
            <h3 class="contractor-type-card__title">{{ type.label }}</h3>
            <p class="contractor-type-card__description">{{ type.description }}</p>
          </div>
          <div class="contractor-type-card__count">
            {{ getCountByType(type.value) }}
          </div>
          <div class="contractor-type-card__arrow">
            <Icon name="mdi:chevron-right" size="20" />
          </div>
        </NuxtLink>
      </div>

      <!-- Общая статистика -->
      <div class="contractor-stats">
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--total">
            <Icon name="mdi:account-multiple-outline" size="24" />
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">Всего контрагентов</span>
            <span class="stat-card__value">{{ totalContractors }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--balance">
            <Icon name="mdi:wallet-outline" size="24" />
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">Общий баланс</span>
            <span :class="['stat-card__value', getTotalBalanceClass()]">
              {{ formatCurrency(totalBalance) }}
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--positive">
            <Icon name="mdi:trending-up" size="24" />
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">Должны вам</span>
            <span class="stat-card__value stat-card__value--positive">
              {{ formatCurrency(totalPositive) }}
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--negative">
            <Icon name="mdi:trending-down" size="24" />
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">Вы должны</span>
            <span class="stat-card__value stat-card__value--negative">
              {{ formatCurrency(Math.abs(totalNegative)) }}
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- Модальное окно быстрого добавления -->
    <PagesCabinetUiModal 
      :visible="showQuickAdd"
      title="Быстро добавить контрагента"
      size="sm"
      closable
      @close="showQuickAdd = false"
    >
      <div class="quick-add">
        <div class="quick-add__info">
          Выберите тип контрагента, который хотите добавить
        </div>
        <div class="quick-add__buttons">
          <button 
            v-for="type in contractorTypes"
            :key="type.value"
            class="quick-add__btn"
            @click="goToAddContractor(type.value)"
          >
            <Icon :name="type.icon" size="16" />
            {{ type.label }}
          </button>
        </div>
      </div>
    </PagesCabinetUiModal>

  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'
import { useRouter } from 'nuxt/app'
import { ref, computed, onMounted } from 'vue'
import { useContractors } from '~/composables/useContractors'
import type { ContractorType } from '~/types/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'

// ── Meta ───────────────────────────────────────────────────────────
definePageMeta({
  layout: 'cabinet',
  middleware: ['require-auth']
})

// ── Router ─────────────────────────────────────────────────────────
const router = useRouter()

// ── Состояние ──────────────────────────────────────────────────────
const { contractors, getByType, fetchAll } = useContractors()
const showQuickAdd = ref(false)

// ── Справочники ────────────────────────────────────────────────────
const contractorTypes: Array<{
  value: ContractorType
  label: string
  icon: string
  description: string
}> = [
  {
    value: 'master',
    label: 'Мастера',
    icon: 'mdi:hammer',
    description: 'Специалисты'
  },
  {
    value: 'worker',
    label: 'Рабочие',
    icon: 'mdi:wrench',
    description: 'Вспомогательный персонал'
  },
  {
    value: 'foreman',
    label: 'Прорабы',
    icon: 'mdi:clipboard-check',
    description: 'Руководители объектов'
  },
  {
    value: 'office',
    label: 'Офис',
    icon: 'mdi:office-building',
    description: 'Офис компании'
  }
]

// ── Computed ────────────────────────────────────────────────────────
function getCountByType(type: ContractorType): number {
  return getByType(type).length
}

const totalContractors = computed(() => {
  return CONTRACTOR_TYPES.reduce((sum, type) => sum + getCountByType(type), 0)
})

const totalBalance = computed(() => {
  return CONTRACTOR_TYPES.reduce((sum, type) => {
    const list = getByType(type)
    const typeSum = list.reduce((s, c) => s + (parseFloat(String(c.balance)) || 0), 0)
    return sum + typeSum
  }, 0)
})

const totalPositive = computed(() => {
  let sum = 0
  CONTRACTOR_TYPES.forEach(type => {
    getByType(type).forEach(c => {
      const balance = parseFloat(String(c.balance)) || 0
      if (balance > 0) sum += balance
    })
  })
  return sum
})

const totalNegative = computed(() => {
  let sum = 0
  CONTRACTOR_TYPES.forEach(type => {
    getByType(type).forEach(c => {
      const balance = parseFloat(String(c.balance)) || 0
      if (balance < 0) sum += balance
    })
  })
  return sum
})

// ── Вспомогательные функции ─────────────────────────────────────────
function formatCurrency(amount: number): string {
  return amount.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  })
}

function getTotalBalanceClass(): string {
  if (totalBalance.value > 0) return 'stat-card__value--positive'
  if (totalBalance.value < 0) return 'stat-card__value--negative'
  return 'stat-card__value--neutral'
}

function goToAddContractor(type: ContractorType) {
  showQuickAdd.value = false
  router.push(`/cabinet/contractors/${type}`)
}

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(() => {
  // Загрузить всех контрагентов
  CONTRACTOR_TYPES.forEach(type => {
    if (getByType(type).length === 0) {
      fetchAll(type).catch(err => console.error(`Error loading ${type}:`, err))
    }
  })
})
</script>

<style lang="scss" scoped>
.contractors-index {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.contractors-index__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 24px;
  flex: 1;
}

// ── Сетка типов ────────────────────────────────────────────────────
.contractor-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

// ── Карточка типа контрагента ──────────────────────────────────────
.contractor-type-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  text-decoration: none;
  transition: var(--crm-transition);
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: currentColor;
    transition: var(--crm-transition);
  }

  &:hover {
    border-color: var(--crm-border-hover);
    background: var(--crm-bg-elevated);
    transform: translateY(-2px);
  }

  &--master {
    color: #f5a623;
  }

  &--worker {
    color: #3dd68c;
  }

  &--foreman {
    color: #5b8def;
  }

  &--office {
    color: #00c3f5;
  }
}

.contractor-type-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--crm-radius-md);
  background: var(--crm-bg-overlay);
  color: inherit;
  flex-shrink: 0;
}

.contractor-type-card__content {
  flex: 1;
  min-width: 0;
}

.contractor-type-card__title {
  font-size: var(--crm-text-md);
  font-weight: 600;
  color: var(--crm-text-primary);
  margin: 0 0 4px;
}

.contractor-type-card__description {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  margin: 0;
}

.contractor-type-card__count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  background: var(--crm-bg-overlay);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-md);
  font-weight: 700;
  color: var(--crm-text-secondary);
  flex-shrink: 0;
}

.contractor-type-card__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--crm-text-muted);
  flex-shrink: 0;
  transition: var(--crm-transition);
}

.contractor-type-card:hover .contractor-type-card__arrow {
  color: var(--crm-text-primary);
  transform: translateX(4px);
}

// ── Статистика ────────────────────────────────────────────────────
.contractor-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
}

.stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--crm-radius-md);
  flex-shrink: 0;

  &--total {
    background: var(--crm-info-dim);
    color: var(--crm-info);
  }

  &--balance {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }

  &--positive {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--negative {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }
}

.stat-card__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-card__label {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
}

.stat-card__value {
  font-size: var(--crm-text-lg);
  font-weight: 700;
  color: var(--crm-text-primary);
  font-family: var(--crm-font-mono);

  &--positive {
    color: var(--crm-success);
  }

  &--negative {
    color: var(--crm-danger);
  }

  &--neutral {
    color: var(--crm-text-primary);
  }
}

// ── Быстрое добавление ─────────────────────────────────────────────
.quick-add {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-add__info {
  font-size: var(--crm-text-md);
  color: var(--crm-text-secondary);
  text-align: center;
}

.quick-add__buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.quick-add__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border-hover);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);
  }
}

// ── Кнопка ────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--crm-transition);
  border: none;
  white-space: nowrap;

  &--accent {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover {
      background: rgba(0, 195, 245, 0.25);
    }
  }
}

// ── Responsive ────────────────────────────────────────────────────
@media (max-width: 700px) {
  .contractors-index__content {
    padding: 16px;
  }

  .contractor-stats {
    grid-template-columns: 1fr;
  }
}
</style>