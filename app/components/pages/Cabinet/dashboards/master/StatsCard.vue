// app/components/pages/cabinet/dashboards/master/StatsCard.vue
<template>
  <div class="stats-card">
    <!-- Заголовок -->
    <div class="stats-card__header">
      <div class="stats-card__title">
        <Icon name="mdi:calendar-clock" size="20" />
        <span>Подневка</span>
      </div>
      <div class="stats-card__subtitle">Последние 3 месяца</div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="stats-card__skeleton">
      <div v-for="i in 3" :key="i" class="month-skeleton">
        <div class="skel skel--month" />
        <div class="skel skel--days" />
      </div>
    </div>

    <!-- Контент -->
    <div v-else class="stats-card__content">
      <div 
        v-for="month in stats" 
        :key="month.month"
        class="month-block"
      >
        <div class="month-block__header">
          <div class="month-block__name">{{ month.monthName }}</div>
          <div class="month-block__year">{{ month.year }}</div>
        </div>
        <div class="month-block__value">
          <span class="month-block__days">{{ formatDays(month.days) }}</span>
          <span class="month-block__label">{{ getDaysLabel(month.days) }}</span>
        </div>
        
        <!-- Подсказка: уникальных дней -->
        <div v-if="month.uniqueDays > 0" class="month-block__hint">
          <Icon name="mdi:calendar-outline" size="11" />
          {{ month.uniqueDays }} {{ getDaysLabel(month.uniqueDays, true) }} в календаре
        </div>
        
        <div class="month-block__visual">
          <div 
            class="month-block__bar"
            :style="{ width: getBarWidth(month.days) + '%' }"
          />
        </div>
      </div>
    </div>

    <!-- Итого -->
    <div v-if="!loading && stats.length > 0" class="stats-card__footer">
      <div class="total-info">
        <Icon name="mdi:information-outline" size="14" />
        <span>
          Всего за 3 месяца: 
          <strong>{{ formatDays(totalDays) }}</strong> 
          {{ getDaysLabel(totalDays) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface MonthStats {
  month: string
  monthName: string
  year: number
  days: number        // сумма "человеко-дней" (может быть дробным: 4.5)
  uniqueDays: number  // количество уникальных календарных дней
}

const props = defineProps<{
  stats: MonthStats[]
  loading?: boolean
}>()

/**
 * Правильное склонение слова "день"
 * Для дробных чисел (1.5, 2.5) — всегда "дня"
 */
function getDaysLabel(days: number, isInteger: boolean = false): string {
  // Для дробных чисел — всегда "дня"
  if (!Number.isInteger(days)) return 'дня'
  
  const intDays = isInteger ? Math.floor(days) : days
  const lastDigit = intDays % 10
  const lastTwoDigits = intDays % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'дней'
  if (lastDigit === 1) return 'день'
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня'
  return 'дней'
}

/**
 * Форматирование дней: целые без дроби, дробные с одной цифрой после точки
 */
function formatDays(days: number): string {
  if (Number.isInteger(days)) return String(days)
  // Округляем до 1 знака после запятой
  return (Math.round(days * 10) / 10).toString().replace('.', ',')
}

/**
 * Ширина прогресс-бара
 * Максимум — примерное количество рабочих дней в месяце (22)
 * Но показываем до 100% если больше
 */
function getBarWidth(days: number): number {
  const maxDays = 22 // среднее количество рабочих дней в месяце
  return Math.min((days / maxDays) * 100, 100)
}

// Общее количество "человеко-дней" за 3 месяца
const totalDays = computed(() => {
  return props.stats.reduce((sum, month) => sum + month.days, 0)
})
</script>

<style lang="scss" scoped>
.stats-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.stats-card__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stats-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--crm-text-lg);
  font-weight: 600;
  color: var(--crm-text-primary);
}

.stats-card__subtitle {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  margin-left: 30px;
}

.stats-card__skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .month-skeleton {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: var(--crm-bg-elevated);
    border-radius: var(--crm-radius-md);

    .skel {
      border-radius: var(--crm-radius-sm);
      background: linear-gradient(90deg,
          var(--crm-bg-elevated) 25%,
          var(--crm-bg-overlay) 50%,
          var(--crm-bg-elevated) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.6s infinite;

      &--month {
        height: 20px;
        width: 120px;
      }

      &--days {
        height: 32px;
        width: 80px;
      }
    }
  }
}

.stats-card__content {
  display: flex;
  // flex-direction: column;
  gap: 12px;
}

.month-block {
  padding: 16px;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-md);
  border: 1px solid var(--crm-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;

  &__header {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  &__name {
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__year {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  &__days {
    font-size: 28px;
    font-weight: 700;
    font-family: var(--crm-font-mono);
    color: var(--crm-accent);
    line-height: 1;
  }

  &__label {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
  }

  &__hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    font-style: italic;
  }

  &__visual {
    margin-top: 4px;
  }

  &__bar {
    height: 6px;
    background: linear-gradient(90deg, var(--crm-accent) 0%, var(--crm-success) 100%);
    border-radius: var(--crm-radius-sm);
    transition: width 0.3s ease;
  }
}

.stats-card__footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--crm-border);
}

.total-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);

  strong {
    color: var(--crm-accent);
    font-weight: 700;
    font-family: var(--crm-font-mono);
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .month-block__days {
    font-size: 24px;
  }
}
</style>