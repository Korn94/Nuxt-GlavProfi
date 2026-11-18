<!-- app/components/pages/Cabinet/Diagnostics/SnapshotCard.vue -->
<!-- Блок «Store snapshot»: JSON-снимок сторов Auth / Socket / Online / Service. -->
<template>
  <PagesCabinetDiagnosticsSharedCard title="Store snapshot" wide>
    <template #actions>
      <button class="btn btn--sm" @click="emit('refresh')">↺ Refresh</button>
    </template>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['tab', activeTabModel === tab && 'tab--active']"
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
// Табы (.tabs/.tab) и .snapshot-pre — общие примитивы страницы
@use './diagnostics.shared.scss' as *;
</style>
