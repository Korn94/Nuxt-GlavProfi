<!-- app\components\pages\cabinet\Contractors\ContractorList.vue -->
<!-- Список контрагентов -->
<template>
  <div class="contractor-list">

    <!-- ═══════════════════════════ HEADER ════════════════════════════ -->
    <div class="contractor-list__header">
      <div class="contractor-list__title-group">
        <h2 class="contractor-list__title">
          <Icon :name="getTypeIcon(type)" size="18" />
          {{ getTypeLabel(type) }}
        </h2>
        <span class="contractor-list__count">{{ contractorsList.length }}</span>
      </div>

      <div class="contractor-list__controls">
        <!-- Поиск -->
        <div class="search-box">
          <Icon name="mdi:magnify" size="14" class="search-box__icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            class="search-box__input" 
            placeholder="Поиск по имени или номеру..."
            @keydown.enter="focusFirstResult"
          />
          <button 
            v-if="searchQuery" 
            class="search-box__clear" 
            @click="searchQuery = ''"
            title="Очистить"
          >
            <Icon name="mdi:close" size="14" />
          </button>
        </div>

        <!-- Кнопка добавления -->
        <button class="crm-btn crm-btn--accent" @click="$emit('add-contractor')" title="Добавить контрагента">
          <Icon name="mdi:plus" size="15" />
          Добавить
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════ CONTENT ═══════════════════════════ -->
    
    <!-- Загрузка -->
    <div v-if="loading" class="contractor-list__skeleton">
      <div v-for="i in 4" :key="i" class="contractor-card-skeleton">
        <div class="skel skel--avatar" />
        <div class="skel-info">
          <div class="skel skel--title" />
          <div class="skel skel--text" />
        </div>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="contractor-list__state contractor-list__state--error">
      <Icon name="mdi:alert-circle-outline" size="32" />
      <div class="contractor-list__state-text">{{ error }}</div>
      <button class="crm-btn crm-btn--sm crm-btn--ghost" @click="$emit('retry')">
        <Icon name="mdi:refresh" size="13" />
        Повторить
      </button>
    </div>

    <!-- Пусто -->
    <div v-else-if="filteredContractors.length === 0" class="contractor-list__state">
      <Icon name="mdi:account-multiple-outline" size="32" />
      <div class="contractor-list__state-text">
        {{ searchQuery ? 'Контрагентов не найдено' : 'Нет контрагентов' }}
      </div>
      <button 
        v-if="!searchQuery"
        class="crm-btn crm-btn--sm crm-btn--accent" 
        @click="$emit('add-contractor')"
      >
        <Icon name="mdi:plus" size="13" />
        Создать первого
      </button>
    </div>

    <!-- Сетка контрагентов -->
    <div v-else class="contractor-list__grid">
      <PagesCabinetContractorsContractorCard 
        v-for="contractor in filteredContractors" 
        :key="contractor.id"
        :contractor="contractor"
        :type="type"
        @contractor-deleted="handleDeleted"
      />
    </div>

    <!-- ═══════════════════════════ FOOTER ═══════════════════════════ -->
    <div v-if="contractorsList.length > 0" class="contractor-list__footer">
      <span class="contractor-list__footer-text">
        Показано {{ filteredContractors.length }} из {{ contractorsList.length }}
      </span>
      <div class="contractor-list__footer-stats">
        <div class="stat">
          <span class="stat__label">Всего баланс</span>
          <span :class="['stat__value', getTotalBalanceClass()]">
            {{ formatCurrency(totalBalance) }}
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useContractors } from '~/composables/useContractors';
import type { ContractorType, ContractorDTO } from '~/types/contractors'

const props = defineProps<{
  type: ContractorType
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'add-contractor': []
  'retry': []
}>()

// ✅ Исправить: используем getByType вместо contractors напрямую
const { getByType, fetchAll } = useContractors()
const searchQuery = ref('')

// ── Данные ───────────────────────────────────��──────────────────────
// ✅ Получаем массив контрагентов конкретного типа
const contractorsList = computed(() => getByType(props.type))

const filteredContractors = computed(() => {
  if (!searchQuery.value.trim()) return contractorsList.value

  const query = searchQuery.value.toLowerCase()
  return contractorsList.value.filter(c =>
    c.name.toLowerCase().includes(query) ||
    (c.phone && c.phone.includes(query)) ||
    (c.comment && c.comment.toLowerCase().includes(query))
  )
})

const totalBalance = computed(() => {
  return contractorsList.value.reduce((sum, c) => {
    const balance = parseFloat(String(c.balance)) || 0
    return sum + balance
  }, 0)
})

// ── Вспомогательные функции ─────────────────────────────────────────
function getTypeLabel(type: ContractorType): string {
  const labels: Record<ContractorType, string> = {
    master: 'Мастера',
    worker: 'Рабочие',
    foreman: 'Прорабы',
    office: 'Офисы'
  }
  return labels[type] || type
}

function getTypeIcon(type: ContractorType): string {
  const icons: Record<ContractorType, string> = {
    master: 'mdi:hammer',
    worker: 'mdi:wrench',
    foreman: 'mdi:clipboard-check',
    office: 'mdi:office-building'
  }
  return icons[type] || 'mdi:account'
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  })
}

function getTotalBalanceClass(): string {
  if (totalBalance.value > 0) return 'stat__value--positive'
  if (totalBalance.value < 0) return 'stat__value--negative'
  return 'stat__value--neutral'
}

function focusFirstResult() {
  // При нажатии Enter сфокусируемся на первый результат
  // (можно добавить прокрутку, если нужно)
}

function handleDeleted(id: number) {
  // После удаления карточка должна исчезнуть автоматически
  // благодаря reactive state в composable
}

// ── Lifecycle ───────────────────────────────────────────────────────
onMounted(() => {
  if (contractorsList.value.length === 0) {
    fetchAll(props.type)
  }
})

// Перезагружаем при смене типа контрагента
watch(() => props.type, () => {
  fetchAll(props.type)
})
</script>

<style lang="scss" scoped>
.contractor-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ── Заголовок ───────────────────────────────────────────────────────
.contractor-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 700px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.contractor-list__title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.contractor-list__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--crm-text-lg);
  font-weight: 700;
  color: var(--crm-text-primary);
  margin: 0;
}

.contractor-list__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  font-weight: 700;
  color: var(--crm-text-muted);
}

.contractor-list__controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 300px;

  @media (max-width: 700px) {
    flex-direction: column;
    min-width: auto;
    width: 100%;
  }
}

// ── Поиск ────────────────────────────────────────────────────────────
.search-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;

  &__icon {
    position: absolute;
    left: 12px;
    color: var(--crm-text-muted);
    pointer-events: none;
  }

  &__input {
    width: 100%;
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-primary);
    font-size: var(--crm-text-sm);
    font-family: var(--crm-font-sans);
    padding: 8px 12px 8px 36px;
    outline: none;
    transition: var(--crm-transition);

    &::placeholder {
      color: var(--crm-text-disabled);
    }

    &:focus {
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px var(--crm-accent-dim);
    }
  }

  &__clear {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    color: var(--crm-text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: var(--crm-transition);
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-primary);
    }
  }
}

// ── Кнопка добавления ───────────────────────────────────────────────
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

  &--ghost {
    background: transparent;
    border: 1px solid var(--crm-border);
    color: var(--crm-text-secondary);

    &:hover {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }

  &--sm {
    padding: 6px 12px;
    font-size: var(--crm-text-xs);
  }
}

// ── Сетка контрагентов ──────────────────────────────────────────────
.contractor-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 12px;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
}

// ── Скелетон ────────────────────────────────────────────────────────
.contractor-list__skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 12px;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
}

.contractor-card-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
}

.skel {
  border-radius: var(--crm-radius-md);
  background: linear-gradient(90deg,
      var(--crm-bg-elevated) 25%,
      var(--crm-bg-overlay) 50%,
      var(--crm-bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;

  &--avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &--title {
    height: 16px;
    width: 140px;
  }

  &--text {
    height: 12px;
    width: 100px;
    margin-top: 4px;
  }
}

.skel-info {
  flex: 1;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// ── Состояния ───────────────────────────────────────────────────────
.contractor-list__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 40px;
  background: var(--crm-bg-surface);
  border: 1px dashed var(--crm-border-hover);
  border-radius: var(--crm-radius-lg);
  color: var(--crm-text-muted);
  text-align: center;

  &--error {
    color: var(--crm-danger);
    border-style: solid;
  }
}

.contractor-list__state-text {
  font-size: var(--crm-text-md);
  color: inherit;
}

// ── Подвал ──────────────────────────────────────────────────────────
.contractor-list__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 700px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.contractor-list__footer-text {
  font-size: var(--crm-text-sm);
  color: var(--crm-text-muted);
}

.contractor-list__footer-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 8px;

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__value {
    font-size: var(--crm-text-md);
    font-weight: 700;
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
}

// ── Responsive ──────────────────────────────────────────────────────
@media (max-width: 700px) {
  .contractor-list__controls {
    width: 100%;
  }

  .search-box {
    width: 100%;
  }

  .contractor-list__state {
    padding: 40px 24px;
  }
}
</style>