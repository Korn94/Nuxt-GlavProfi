<!-- app/components/pages/Cabinet/Diagnostics/ServerLogsCard.vue -->
<!-- Блок «Логи сервера»: хвост файлов error/events/auth, поиск, фильтр уровня, очистка. -->
<template>
  <PagesCabinetDiagnosticsSharedCard title="Логи сервера" :badge="entries.length" badge-dim wide>
    <template #actions>
      <label class="toggle-label">
        <input v-model="pausedModel" type="checkbox" class="toggle-cb" />
        <span class="toggle-track" />
        Пауза
      </label>
      <button class="btn btn--sm" :disabled="loading" @click="emit('refresh')">↺</button>
      <button :class="['btn', 'btn--sm', 'btn--danger']" :disabled="clearing" @click="onClearClick">
        {{ confirmClear ? 'Точно?' : 'Очистить' }}
      </button>
    </template>

    <div class="tabs">
      <button
        v-for="s in sources"
        :key="s.key"
        :class="['tab', sourceModel === s.key && 'tab--active']"
        :title="`${s.hint} — ${s.file}`"
        @click="sourceModel = s.key"
      >{{ s.label }}</button>
      <span class="srvlog-meta">{{ lastUpdated }} · {{ sizeLabel }} · авто {{ autoRefreshSec }} c</span>
    </div>

    <div class="srvlog-filters">
      <input
        v-model="searchModel"
        class="input srvlog-search"
        type="search"
        placeholder="Поиск по тексту записи…"
      />
      <div class="srvlog-levels">
        <button
          v-for="lvl in levels"
          :key="lvl"
          :class="['srvlog-level', { 'srvlog-level--active': lvl === level }]"
          @click="levelModel = lvl"
        >{{ lvl === 'ALL' ? 'Все' : lvl }}</button>
      </div>
    </div>

    <div class="log">
      <div
        v-for="(entry, i) in entries"
        :key="`${entry.ts}-${i}`"
        :class="['log__row', `log__row--${levelMod(entry.level)}`]"
      >
        <span class="log__ts" :title="entry.ts">{{ formatTs(entry.ts) }}</span>
        <span class="log__source">{{ entry.level }}</span>
        <div class="log__msg">
          <span class="log__text">{{ entry.message }}</span>
          <span v-if="entry.details" class="log__details">{{ entry.details }}</span>
          <details v-if="entry.stack" class="log__stack">
            <summary>stack</summary>
            <pre>{{ entry.stack }}</pre>
          </details>
          <span v-if="entry.truncated" class="log__cut">обрезано</span>
        </div>
      </div>

      <div v-if="fetchError" class="empty log__empty">{{ fetchError }}</div>
      <div v-else-if="!exists" class="empty log__empty">
        Файл {{ currentFile }} ещё не создан — сервер не записал в него ни одной строки.
      </div>
      <div v-else-if="!total" class="empty log__empty">Файл пуст.</div>
      <div v-else-if="!entries.length" class="empty log__empty">Ничего не найдено по фильтру.</div>
    </div>
  </PagesCabinetDiagnosticsSharedCard>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import type { LogSourceKey } from 'shared/constants/logs'
import type { ServerLogEntry } from 'shared/types/logs'
import type { ServerLogLevelFilter } from './composables/useDiagnosticsServerLogs'

const props = defineProps<{
  /** Табы источников (из shared/constants/logs.ts) */
  sources: { key: LogSourceKey; label: string; hint: string; file: string }[]
  /** Активный источник (v-model:source) */
  source: LogSourceKey
  /** Записи после клиентских фильтров */
  entries: ServerLogEntry[]
  /** Всего записей в хвосте (до фильтров) */
  total: number
  /** Файл существует (false — показать «ещё не создан») */
  exists: boolean
  /** Идёт запрос */
  loading: boolean
  /** Пауза автообновления (v-model:paused) */
  paused: boolean
  /** Строка поиска (v-model:search) */
  search: string
  /** Фильтр по уровню (v-model:level) */
  level: ServerLogLevelFilter
  /** Доступные уровни (ALL + присутствующие в хвосте) */
  levels: ServerLogLevelFilter[]
  /** Ошибка чтения (403/500/сеть) */
  fetchError: string | null
  /** Размер файла для шапки */
  sizeLabel: string
  /** Время последнего успешного обновления */
  lastUpdated: string
  /** Идёт очистка */
  clearing: boolean
  /** Период автообновления, секунд */
  autoRefreshSec: number
}>()

const emit = defineEmits<{
  'update:source': [value: LogSourceKey]
  'update:paused': [value: boolean]
  'update:search': [value: string]
  'update:level': [value: ServerLogLevelFilter]
  refresh: []
  clear: []
}>()

const sourceModel = computed({
  get: () => props.source,
  set: (value: LogSourceKey) => emit('update:source', value),
})

const pausedModel = computed({
  get: () => props.paused,
  set: (value: boolean) => emit('update:paused', value),
})

const searchModel = computed({
  get: () => props.search,
  set: (value: string) => emit('update:search', value),
})

const levelModel = computed({
  get: () => props.level,
  set: (value: ServerLogLevelFilter) => emit('update:level', value),
})

const currentFile = computed(
  () => props.sources.find(s => s.key === props.source)?.file || ''
)

/** Уровень → модификатор цвета строки (.log__row--err | --warn | --dim) */
const LEVEL_MOD: Record<string, string> = { ERROR: 'err', WARN: 'warn', INFO: 'info', DEBUG: 'dim' }

function levelMod(level: string): string {
  return LEVEL_MOD[level] || 'info'
}

function formatTs(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 19)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// ── Очистка в два клика (без window.confirm): второе нажатие в течение 3 с ──
const confirmClear = ref(false)
let confirmTimer: ReturnType<typeof setTimeout> | null = null

function onClearClick() {
  if (!confirmClear.value) {
    confirmClear.value = true
    confirmTimer = setTimeout(() => { confirmClear.value = false }, 3000)
    return
  }

  if (confirmTimer) clearTimeout(confirmTimer)
  confirmClear.value = false
  emit('clear')
}

onUnmounted(() => {
  if (confirmTimer) clearTimeout(confirmTimer)
})
</script>

<style lang="scss" scoped>
@use './diagnostics.shared.scss' as *;

// ─── Meta (шапка карточки) ───────────────────────────────────────────
.srvlog-meta {
  margin-left: auto;
  font-family: $mono;
  font-size: 10px;
  color: $muted;
  white-space: nowrap;
}

// ─── Filters ─────────────────────────────────────────────────────────
.srvlog-filters {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.srvlog-search {
  flex: 1;
  min-width: 150px;
  max-width: 320px;
}

.srvlog-levels {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.srvlog-level {
  background: none;
  border: 1px solid $border;
  border-radius: 4px;
  color: $muted;
  cursor: pointer;
  font-family: $mono;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 7px;
  transition: all .15s;

  &:hover {
    border-color: $border2;
    color: $text;
  }

  &--active {
    background: $bg3;
    border-color: $accent;
    color: $text;
  }
}

// ─── Log (локальные правки поверх общих .log/.log__*) ────────────────
.log {
  max-height: 320px;

  &__row {
    grid-template-columns: 92px 52px 1fr;
    align-items: start;
  }

  &__text {
    font-weight: 600;
  }

  &__details {
    display: block;
    color: $muted;
  }

  &__cut {
    display: block;
    color: $warn;
    font-size: 10px;
  }

  &__stack {
    margin-top: 2px;

    summary {
      color: $accent;
      cursor: pointer;
      font-size: 10px;
    }

    pre {
      margin: 4px 0 0;
      max-height: 160px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
      color: $muted;
      font-size: 10px;
    }
  }
}
</style>
