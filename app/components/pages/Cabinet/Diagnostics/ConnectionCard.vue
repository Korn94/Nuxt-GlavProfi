<!-- app/components/pages/Cabinet/Diagnostics/ConnectionCard.vue -->
<!-- Блок «Соединение»: статус сокета, транспорт, ping + контролы reconnect/drop. -->
<template>
  <PagesCabinetDiagnosticsSharedCard title="Соединение">
    <template #actions>
      <button class="btn btn--sm btn--primary" :disabled="connecting" @click="emit('reconnect')">
        {{ connecting ? '···' : '⟳ Reconnect' }}
      </button>
      <button class="btn btn--sm btn--danger" :disabled="!connected" @click="emit('disconnect')">
        ✕ Drop
      </button>
    </template>

    <div class="kv-list">
      <div v-for="row in rows" :key="row.k" class="kv">
        <span class="kv__k">{{ row.k }}</span>
        <span :class="['kv__v', row.cls]">{{ row.v }}</span>
      </div>
    </div>

    <div class="ping-bar">
      <span class="ping-bar__label">Ping</span>
      <div class="ping-bar__track">
        <div class="ping-bar__fill" :style="{ width: pingBarWidth }" />
      </div>
      <span :class="['ping-bar__ms', pingMsClass]">{{ pingMs !== null ? pingMs + ' ms' : '—' }}</span>
    </div>
  </PagesCabinetDiagnosticsSharedCard>
</template>

<script setup lang="ts">
import type { KvRow } from './shared/types'

defineProps<{
  /** Готовые строки статуса соединения (см. index.vue → connectionRows) */
  rows: KvRow[]
  connected: boolean
  connecting: boolean
  pingMs: number | null
  pingBarWidth: string
  pingMsClass: string
}>()

const emit = defineEmits<{
  reconnect: []
  disconnect: []
}>()
</script>

<style lang="scss" scoped>
@use './diagnostics.shared.scss' as *;

// ─── Ping bar ────────────────────────────────────────────────────────
.ping-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 2px;

  &__label {
    font-size: 11px;
    color: $muted;
    width: 28px;
  }

  &__track {
    flex: 1;
    height: 4px;
    background: $bg3;
    border-radius: 2px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: $ok;
    border-radius: 2px;
    transition: width .4s ease;
  }

  &__ms {
    font-family: $mono;
    font-size: 11px;
    min-width: 44px;
    text-align: right;
    color: $muted;

    &.kv__v--ok {
      color: $ok;
    }

    &.kv__v--warn {
      color: $warn;
    }

    &.kv__v--err {
      color: $err;
    }
  }
}
</style>
