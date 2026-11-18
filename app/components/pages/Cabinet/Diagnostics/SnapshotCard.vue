<!-- app/components/pages/Cabinet/Diagnostics/SnapshotCard.vue -->
<!-- Блок «Store snapshot»: JSON-снимок сторов Auth / Socket / Online / Service. -->
<template>
  <PagesCabinetDiagnosticsSharedCard title="Store snapshot" wide>
    <template #actions>
      <button class="btn btn--sm" @click="emit('refresh')">↺ Refresh</button>
    </template>

    <div class="snapshot-tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['snap-tab', activeTabModel === tab && 'snap-tab--active']"
        @click="activeTabModel = tab"
      >{{ tab }}</button>
    </div>

    <pre class="snapshot-pre">{{ content }}</pre>
  </PagesCabinetDiagnosticsSharedCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Доступные табы снимка */
  tabs: string[]
  /** Активный таб (v-model:active-tab) */
  activeTab: string
  /** JSON-снимок активного таба */
  content: string
}>()

const emit = defineEmits<{
  'update:activeTab': [value: string]
  refresh: []
}>()

const activeTabModel = computed({
  get: () => props.activeTab,
  set: (value: string) => emit('update:activeTab', value),
})
</script>

<style lang="scss" scoped>
@use './diagnostics.shared.scss' as *;

// ─── Snapshot ────────────────────────────────────────────────────────
.snapshot-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.snap-tab {
  background: none;
  border: 1px solid $border;
  border-radius: 4px;
  color: $muted;
  font-size: 11px;
  padding: 3px 10px;
  cursor: pointer;
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
</style>
