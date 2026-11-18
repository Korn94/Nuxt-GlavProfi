<!-- app/components/pages/Cabinet/Diagnostics/shared/Card.vue -->
<!--
  Примитив карточки диагностики: заголовок + бейдж + слот actions + контент.
  Убирает дублирование разметки .card__head в каждом блоке страницы.

  Использование:
  <PagesCabinetDiagnosticsSharedCard title="Соединение" wide tall>
    <template #actions>…</template>
    …контент…
  </PagesCabinetDiagnosticsSharedCard>
-->
<template>
  <div :class="['card', { 'card--wide': wide, 'card--tall': tall }]">
    <div v-if="title || $slots.actions" class="card__head">
      <span class="card__title">
        {{ title }}
        <span v-if="badge !== undefined" :class="['badge', { 'badge--dim': badgeDim }]">{{ badge }}</span>
      </span>
      <div v-if="$slots.actions" class="card__actions">
        <slot name="actions" />
      </div>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** Заголовок карточки (uppercase, приглушённый) */
  title?: string
  /** Бейдж-счётчик рядом с заголовком (не показывается без значения) */
  badge?: string | number
  /** Приглушённый вариант бейджа (.badge--dim) */
  badgeDim?: boolean
  /** Карточка на 2 колонки в .diag-grid */
  wide?: boolean
  /** Ограничение высоты 360px (для списков со скроллом) */
  tall?: boolean
}>()
</script>

<style lang="scss" scoped>
@use '../diagnostics.shared.scss' as *;
</style>
