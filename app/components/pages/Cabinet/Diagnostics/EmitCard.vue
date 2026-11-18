<!-- app/components/pages/Cabinet/Diagnostics/EmitCard.vue -->
<!-- Блок «Тест событий»: быстрые socket-события + произвольный emit. -->
<template>
  <PagesCabinetDiagnosticsSharedCard title="Тест событий">
    <div class="event-grid">
      <button
        v-for="ev in events"
        :key="ev.label"
        :class="['btn', `btn--${ev.color}`]"
        :disabled="!connected || ev.disabled"
        @click="emit('fire', ev)"
      >{{ ev.label }}</button>
    </div>

    <div class="divider" />

    <div class="custom-event">
      <input v-model="customEvName" placeholder="event:name" class="input" />
      <textarea v-model="customEvData" placeholder='{ "key": "val" }' class="input textarea" rows="2" />
      <button class="btn btn--primary" :disabled="!connected || !customEvName" @click="fireCustomEvent">
        Отправить
      </button>
    </div>
  </PagesCabinetDiagnosticsSharedCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { QuickEvent } from './shared/types'

defineProps<{
  /** Кнопки быстрых событий (см. index.vue → quickEvents) */
  events: QuickEvent[]
  /** Сокет подключён — иначе всё disabled */
  connected: boolean
}>()

const emit = defineEmits<{
  fire: [ev: QuickEvent]
  'fire-custom': [payload: { name: string; data: string }]
}>()

// Локальное состояние формы произвольного события
const customEvName = ref('')
const customEvData = ref('')

function fireCustomEvent() {
  if (!customEvName.value) return
  emit('fire-custom', { name: customEvName.value, data: customEvData.value })
}
</script>

<style lang="scss" scoped>
@use './diagnostics.shared.scss' as *;

// ─── Event grid ──────────────────────────────────────────────────────
.event-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.custom-event {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
