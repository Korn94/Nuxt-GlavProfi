<!-- app/components/pages/public/offers/kp/blocks/KpCallout.vue -->
<template>
  <section class="kp-section kp-section--schedule">
    <div class="kp-container">
      <div class="kp-schedule">
        <div class="kp-schedule__content">
          <div v-if="icon" class="kp-schedule__icon">
            <Icon :name="icon" />
          </div>
          <div class="kp-schedule__text">
            <h3 v-if="title">{{ title }}</h3>
            <p v-if="text">{{ text }}</p>
          </div>
        </div>

        <a v-if="ctaText" class="kp-schedule__btn" :href="ctaHref">
          <Icon :name="ctaIcon" />
          {{ ctaText }}
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/** Тёмный баннер-акцент: «готовы приступить», «свободные даты» и т.п. */
withDefaults(defineProps<{
  title?: string
  text?: string
  icon?: string
  ctaText?: string
  ctaHref?: string
  ctaIcon?: string
}>(), {
  title: '',
  text: '',
  icon: 'material-symbols:rocket-launch-outline',
  ctaText: '',
  ctaHref: 'tel:+79109096947',
  ctaIcon: 'material-symbols:calendar-month-outline',
})
</script>
