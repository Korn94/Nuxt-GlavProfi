<!-- app/components/pages/Cabinet/Diagnostics/SessionCard.vue -->
<!-- Блок «Сессия & Куки»: session_id, tabId, socketId, путь + значения кук. -->
<template>
  <PagesCabinetDiagnosticsSharedCard title="Сессия & Куки">
    <div class="kv-list">
      <div v-for="row in rows" :key="row.k" class="kv">
        <span class="kv__k">{{ row.k }}</span>
        <span :class="['kv__v', row.cls]">{{ row.v }}</span>
      </div>
    </div>

    <div class="divider" />

    <div class="kv-list">
      <div v-for="c in cookies" :key="c.name" class="kv">
        <span class="kv__k kv__k--cookie">{{ c.name }}</span>
        <span class="kv__v kv__v--mono kv__v--truncate">{{ c.value || '—' }}</span>
      </div>
    </div>
  </PagesCabinetDiagnosticsSharedCard>
</template>

<script setup lang="ts">
import type { KvRow } from './shared/types'

defineProps<{
  /** Строки сессии (см. index.vue → sessionRows) */
  rows: KvRow[]
  /** Куки: auth_token (обрезанный) и session_id */
  cookies: Array<{ name: string; value: string | null }>
}>()
</script>

<style lang="scss" scoped>
@use './diagnostics.shared.scss' as *;
</style>
