<!-- app/components/pages/Cabinet/Diagnostics/EventLogCard.vue -->
<!-- Блок «Лог событий»: журнал socket-событий, ping, emit и API-проб (пауза/очистка). -->
<template>
  <PagesCabinetDiagnosticsSharedCard title="Лог событий" :badge="entries.length" badge-dim wide tall>
    <template #actions>
      <label class="toggle-label">
        <input v-model="pausedModel" type="checkbox" class="toggle-cb" />
        <span class="toggle-track" />
        Пауза
      </label>
      <button class="btn btn--sm" @click="emit('clear')">Очистить</button>
    </template>

    <div class="log">
      <div v-for="(entry, i) in entries" :key="i" :class="['log__row', `log__row--${entry.level}`]">
        <span class="log__ts">{{ entry.ts }}</span>
        <span class="log__source">{{ entry.source }}</span>
        <span class="log__msg">{{ entry.msg }}</span>
      </div>
      <div v-if="!entries.length" class="empty log__empty">События появятся здесь...</div>
    </div>
  </PagesCabinetDiagnosticsSharedCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LogEntry } from './composables/useDiagnosticsLog'

const props = defineProps<{
  /** Записи журнала (новые сверху) */
  entries: LogEntry[]
  /** Пауза: новые записи не добавляются */
  paused: boolean
}>()

const emit = defineEmits<{
  'update:paused': [value: boolean]
  clear: []
}>()

const pausedModel = computed({
  get: () => props.paused,
  set: (value: boolean) => emit('update:paused', value),
})
</script>

<style lang="scss" scoped>
// .log / .log__* — общие примитивы страницы (diagnostics.shared.scss)
@use './diagnostics.shared.scss' as *;
</style>
