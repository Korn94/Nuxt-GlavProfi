<!-- app/components/pages/Cabinet/Online/Analytics.vue -->
<template>
  <div class="online-card stats-card">
    <div class="online-card__header">
      <span class="online-card__title">
        <Icon name="mdi:chart-box-outline" size="14" />
        Аналитика сайта
      </span>
      <div class="online-card__actions">
        <select :value="statsDays" class="stats-select" @change="onDaysChange">
          <option :value="1">Сегодня</option>
          <option :value="7">7 дней</option>
          <option :value="30">30 дней</option>
          <option :value="90">90 дней</option>
        </select>
        <button class="crm-btn crm-btn--ghost crm-btn--sm" :disabled="loading" @click="emit('refresh')">
          <Icon name="mdi:refresh" size="14" :class="{ spin: loading }" />
        </button>
      </div>
    </div>

    <div v-if="error && !stats" class="online-state online-state--error">
      <span>{{ error }}</span>
    </div>

    <template v-else-if="stats">
      <div class="stats-block">
        <div class="stats-block__title">Источники трафика</div>
        <div v-if="!stats.channels.length" class="stats-empty">Пока нет данных за период</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Источник</th><th>Визиты</th><th>Посетители</th><th>Обращения</th>
                <th>Конверсия</th><th>Отказы</th><th>Время</th><th>Страниц</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in stats.channels" :key="row.channel">
                <td>{{ row.channelLabel }}</td>
                <td>{{ row.visits }}</td>
                <td>{{ row.visitors }}</td>
                <td :class="{ 'stats-ok': row.conversions > 0 }">{{ row.conversions }}</td>
                <td>{{ row.conversionRate }}%</td>
                <td :class="{ 'stats-warn': row.bounceRate >= 60 }">{{ row.bounceRate }}%</td>
                <td>{{ formatSeconds(row.avgSeconds) }}</td>
                <td>{{ row.avgPages }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="stats-block">
        <div class="stats-block__title">Страницы</div>
        <div v-if="!stats.pages.length" class="stats-empty">Пока нет данных за период</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th>Страница</th><th>Просмотры</th><th>Время</th><th>Скролл</th><th>Выходы</th></tr>
            </thead>
            <tbody>
              <tr v-for="row in stats.pages" :key="row.path">
                <td class="stats-path" :title="row.path">{{ row.path }}</td>
                <td>{{ row.views }}</td>
                <td>{{ formatSeconds(row.avgSeconds) }}</td>
                <td :class="{ 'stats-warn': row.avgScroll < 25 }">{{ row.avgScroll }}%</td>
                <td :class="{ 'stats-warn': row.exitRate >= 60 }">{{ row.exits }} ({{ row.exitRate }}%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="stats-block">
        <div class="stats-block__title">
          Обращения
          <span v-for="t in stats.eventTypes" :key="t.type" class="stats-chip">{{ eventLabel(t.type) }}: {{ t.total }}</span>
        </div>
        <div v-if="!stats.conversions.length" class="stats-empty">Обращений за период нет</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th>Когда</th><th>Действие</th><th>Источник</th><th>Кампания</th><th>Визит №</th><th>Страниц</th><th>Вход</th><th>Город</th></tr>
            </thead>
            <tbody>
              <tr v-for="row in stats.conversions" :key="row.id">
                <td>{{ formatFullDateTime(row.createdAt) }}</td>
                <td>{{ eventLabel(row.type) }}</td>
                <td>{{ row.channelLabel }}<span v-if="row.referrerHost" class="stats-sub"> · {{ row.referrerHost }}</span></td>
                <td class="stats-path">{{ row.utmCampaign || '—' }}</td>
                <td>{{ row.visitNumber }}</td>
                <td>{{ row.pagesCount }}</td>
                <td class="stats-path" :title="row.landingPath || ''">{{ row.landingPath || '—' }}</td>
                <td>{{ row.city || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="stats-block">
        <div class="stats-block__title">История визитов</div>
        <div v-if="!stats.visits.length" class="stats-empty">Визитов за период нет</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th>Начало</th><th>Источник</th><th>Вход → выход</th><th>Страниц</th><th>Время</th><th>Устройство</th><th>Итог</th></tr>
            </thead>
            <tbody>
              <tr v-for="row in stats.visits" :key="row.id">
                <td>{{ formatFullDateTime(row.startedAt) }}</td>
                <td>{{ row.channelLabel }}<span v-if="row.visitNumber > 1" class="stats-sub"> · визит №{{ row.visitNumber }}</span></td>
                <td class="stats-path" :title="`${row.landingPath || ''} → ${row.exitPath || ''}`">{{ row.landingPath || '—' }} → {{ row.exitPath || '—' }}</td>
                <td>{{ row.pagesCount }}</td>
                <td>{{ formatSeconds(row.activeSeconds) }}</td>
                <td>{{ row.browser || '—' }}<span class="stats-sub"> · {{ deviceLabels[row.deviceType] || row.deviceType }}</span></td>
                <td>
                  <span v-if="row.converted" class="stats-ok">обращение</span>
                  <span v-else-if="row.isBounce" class="stats-warn">отказ</span>
                  <span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-else class="online-state">
      <Icon name="mdi:loading" size="24" class="spin" />
      <span>Загрузка аналитики...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VisitorStatsResponse } from '~/types'
import { useOnlineFormatters } from './composables/useOnlineFormatters'

defineProps<{
  stats: VisitorStatsResponse | null
  statsDays: number
  loading: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'update:statsDays': [value: number]
  refresh: []
}>()

const { formatSeconds, formatFullDateTime, eventLabel, deviceLabels } = useOnlineFormatters()

function onDaysChange(e: Event) {
  emit('update:statsDays', Number((e.target as HTMLSelectElement).value))
}
</script>

<style lang="scss" scoped>
@use './online.shared.scss';

.stats-card { gap: 14px; }
.stats-select {
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-xs);
  padding: 3px 6px;
}
.stats-block {
  display: flex; flex-direction: column; gap: 6px;
  &__title {
    font-size: var(--crm-text-xs); font-weight: 600; color: var(--crm-text-muted);
    display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
  }
}
.stats-chip {
  font-weight: 400; background: var(--crm-bg-overlay); border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm); padding: 0 6px; color: var(--crm-text-secondary);
}
.stats-empty { font-size: var(--crm-text-xs); color: var(--crm-text-disabled); padding: 4px 0; }
.stats-table-wrap { overflow-x: auto; }
.stats-table {
  width: 100%; border-collapse: collapse; font-size: var(--crm-text-xs);
  th, td { padding: 5px 8px; text-align: left; white-space: nowrap; border-bottom: 1px solid var(--crm-border); }
  th { color: var(--crm-text-muted); font-weight: 600; }
  td { color: var(--crm-text-secondary); font-family: var(--crm-font-mono); }
  tbody tr:hover { background: var(--crm-bg-overlay); }
}
.stats-path { max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
.stats-sub { color: var(--crm-text-muted); }
.stats-ok { color: var(--crm-success); font-weight: 600; }
.stats-warn { color: var(--crm-warning); }
</style>

