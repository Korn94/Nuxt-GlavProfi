<!-- app/components/pages/public/offers/kp/blocks/KpNotes.vue -->
<template>
  <section v-if="items.length" class="kp-section kp-section--notes">
    <div class="kp-container">
      <h2 v-if="title" class="kp-h2">{{ title }}</h2>

      <div class="kp-notes">
        <article
          v-for="(note, index) in items"
          :key="`${index}-${note.title || ''}`"
          class="kp-note"
        >
          <div v-if="note.icon" class="kp-note__icon">
            <Icon :name="note.icon" />
          </div>
          <h4 v-if="note.title">{{ note.title }}</h4>
          <!-- Текст примечаний пишется в data-файле (авторский контент), поэтому v-html допустим -->
          <p v-html="note.text" />
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { KpNote } from '../types'

withDefaults(defineProps<{
  items: KpNote[]
  title?: string
}>(), {
  title: 'Важные примечания',
})
</script>
