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
@use './diagnostics.shared.scss' as *;

// ─── Log ─────────────────────────────────────────────────────────────
.log {
  flex: 1;
  overflow-y: auto;
  font-family: $mono;
  font-size: 11px;
  line-height: 1.6;
  max-height: 260px;
  scrollbar-width: thin;
  scrollbar-color: $bg3 transparent;

  &__row {
    display: grid;
    grid-template-columns: 68px 130px 1fr;
    gap: 8px;
    padding: 2px 4px;
    border-radius: 3px;

    &:hover {
      background: $bg2;
    }

    &--ok {
      .log__source {
        color: $ok;
      }
    }

    &--warn {
      .log__source {
        color: $warn;
      }
    }

    &--err {
      .log__source {
        color: $err;
      }

      .log__msg {
        color: color.mix($err, $text, 30%);
      }
    }

    &--dim .log__source {
      color: $muted;
    }
  }

  &__ts {
    color: $muted;
    opacity: .7;
  }

  &__source {
    color: $accent;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__msg {
    color: $text;
    opacity: .8;
    word-break: break-all;
  }

  &__empty {
    padding: 20px 0;
  }
}
</style>
