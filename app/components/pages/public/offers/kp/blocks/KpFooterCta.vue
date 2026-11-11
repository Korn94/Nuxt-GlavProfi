<!-- app/components/pages/public/offers/kp/blocks/KpFooterCta.vue -->
<template>
  <footer class="kp-footer">
    <div class="kp-container kp-footer__inner">
      <div>
        <h3>{{ title }}</h3>
        <p>{{ text }}</p>
      </div>

      <a class="kp-footer__btn" :href="href">
        <Icon :name="icon" />
        {{ ctaText }}
      </a>
    </div>
  </footer>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  text?: string
  ctaText?: string
  href?: string
  icon?: string
}>(), {
  title: 'Готовы приступить к работам',
  text: 'Свяжитесь с нами, чтобы согласовать смету, график и этапы реализации проекта.',
  ctaText: 'Обсудить проект',
  href: 'tel:+79109096947',
  icon: 'material-symbols:call-outline',
})
</script>
