// app/components/pages/cabinet/MasterDashboard/StatsCard.vue
<template>
  <div class="stats-card">
    <!-- Заголовок -->
    <div class="stats-card__header">
      <div class="stats-card__title">
        <Icon name="mdi:chart-box-outline" size="20" />
        <span>Статистика</span>
      </div>
    </div>

    <!-- Статистика -->
    <div v-if="loading" class="stats-card__skeleton">
      <div v-for="i in 3" :key="i" class="stat-skeleton">
        <div class="skel skel--value" />
        <div class="skel skel--label" />
      </div>
    </div>

    <div v-else class="stats-card__content">
      <div class="stat-block">
        <div class="stat-block__value">{{ stats.totalWorks }}</div>
        <div class="stat-block__label">Всего работ</div>
        <Icon name="mdi:clipboard-text-outline" size="24" class="stat-block__icon" />
      </div>

      <div class="stat-block">
        <div class="stat-block__value">{{ stats.completedWorks }}</div>
        <div class="stat-block__label">Завершено</div>
        <Icon name="mdi:check-circle-outline" size="24" class="stat-block__icon stat-block__icon--success" />
      </div>

      <div class="stat-block">
        <div class="stat-block__value">{{ stats.thisMonth }}</div>
        <div class="stat-block__label">В этом месяце</div>
        <Icon name="mdi:calendar-month-outline" size="24" class="stat-block__icon stat-block__icon--accent" />
      </div>
    </div>

    <!-- Прогресс -->
    <div v-if="!loading && stats.totalWorks > 0" class="stats-card__progress">
      <div class="progress-label">
        <span>Прогресс выполнения</span>
        <span>{{ getCompletionPercent() }}%</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-bar__fill"
          :style="{ width: getCompletionPercent() + '%' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue';

interface Stats {
  totalWorks: number
  completedWorks: number
  thisMonth: number
}

defineProps<{
  stats: Stats
  loading?: boolean
}>()

function getCompletionPercent(): number {
  const props = getCurrentInstance()?.props as any
  if (!props || props.stats.totalWorks === 0) return 0
  return Math.round((props.stats.completedWorks / props.stats.totalWorks) * 100)
}
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
  align-items: center;
  justify-content: space-between;
}

.stats-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--crm-text-lg);
  font-weight: 600;
  color: var(--crm-text-primary);
}

.stats-card__skeleton {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  .stat-skeleton {
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

      &--value {
        height: 32px;
        width: 60px;
      }

      &--label {
        height: 14px;
        width: 80px;
      }
    }
  }
}

.stats-card__content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-block {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-md);
  border: 1px solid var(--crm-border);
  overflow: hidden;

  &__value {
    font-size: 28px;
    font-weight: 700;
    font-family: var(--crm-font-mono);
    color: var(--crm-text-primary);
  }

  &__label {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
  }

  &__icon {
    position: absolute;
    top: 12px;
    right: 12px;
    color: var(--crm-text-disabled);
    opacity: 0.3;

    &--success {
      color: var(--crm-success);
      opacity: 0.2;
    }

    &--accent {
      color: var(--crm-accent);
      opacity: 0.2;
    }
  }
}

.stats-card__progress {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
}

.progress-bar {
  height: 8px;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-sm);
  overflow: hidden;

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, var(--crm-accent) 0%, var(--crm-success) 100%);
    transition: width 0.3s ease;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .stats-card__content {
    grid-template-columns: 1fr;
  }

  .stat-block__value {
    font-size: 24px;
  }
}
</style>