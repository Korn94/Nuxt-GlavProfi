<!-- app/components/pages/public/partnerLanding/index.vue -->
<template>
  <div class="partner">
    <PartnerHero />
    <PartnerValue />
    <PartnerCalculator />
    <PartnerClosing />
  </div>
</template>

<script setup lang="ts">
import PartnerHero from './PartnerHero.vue'
import PartnerValue from './PartnerValue.vue'
import PartnerCalculator from './PartnerCalculator.vue'
import PartnerClosing from './PartnerClosing.vue'
</script>

<style lang="scss" scoped>
$bg: #f4f5f3;
$ink: #0f1114;

.partner {
  min-height: 100vh;
  background: $bg;
  color: $ink;
  font-family: 'Rubik', sans-serif;
  line-height: 1.45;
  overflow-x: hidden;
}
</style>