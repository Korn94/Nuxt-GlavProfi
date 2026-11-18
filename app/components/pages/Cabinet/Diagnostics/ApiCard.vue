<!-- app/components/pages/Cabinet/Diagnostics/ApiCard.vue -->
<!-- Блок «API запросы»: ручной вызов ключевых эндпоинтов + последний ответ. -->
<template>
  <PagesCabinetDiagnosticsSharedCard title="API запросы">
    <div class="api-list">
      <div v-for="api in tests" :key="api.path" class="api-row">
        <button class="btn btn--sm" @click="emit('run', api)">▶</button>
        <span class="api-row__method">{{ api.method }}</span>
        <span class="api-row__path">{{ api.path }}</span>
        <span :class="['api-row__status', api.statusClass]">{{ api.status }}</span>
      </div>
    </div>

    <pre v-if="lastResult" class="snapshot-pre snapshot-pre--sm">{{ lastResult }}</pre>
  </PagesCabinetDiagnosticsSharedCard>
</template>

<script setup lang="ts">
import type { ApiTest } from './composables/useDiagnosticsApi'

defineProps<{
  /** Список проб с их текущими статусами */
  tests: ApiTest[]
  /** Последний JSON-ответ (обрезанный) */
  lastResult: string | null
}>()

const emit = defineEmits<{
  run: [api: ApiTest]
}>()
</script>

<style lang="scss" scoped>
@use './diagnostics.shared.scss' as *;

// ─── API list ────────────────────────────────────────────────────────
.api-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.api-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  background: $bg2;
  border-radius: 5px;
  border: 1px solid $border;

  &__method {
    font-family: $mono;
    font-size: 10px;
    font-weight: 700;
    color: $accent;
    min-width: 28px;
  }

  &__path {
    flex: 1;
    font-family: $mono;
    font-size: 11px;
    color: $muted;
  }

  &__status {
    font-family: $mono;
    font-size: 11px;
    color: $muted;

    &--ok {
      color: $ok;
    }

    &--err {
      color: $err;
    }
  }
}
</style>
