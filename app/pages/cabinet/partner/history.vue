<!-- app/pages/cabinet/partner/history.vue -->
<template>
  <div class="stub">
    <header class="stub-head">
      <h1 class="stub-head__title">История</h1>
      <p class="stub-head__sub">Раздел в разработке</p>
    </header>

    <section class="stub-card">
      <Icon name="mdi:history" size="40" />
      <p>Здесь скоро появится история ваших сделок и действий в партнёрском кабинете.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useAuthStore } from 'stores/auth'

definePageMeta({
  layout: 'partner',
  middleware: ['auth'],
})

const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.isChecking) {
    await authStore.init().catch(() => {})
  }
  if (authStore.user?.role !== 'partner') {
    await navigateTo('/cabinet')
  }
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'ГлавПрофи — история партнёра',
})
</script>

<style lang="scss" scoped>
$ink: #0f1114;
$surface: #ffffff;
$muted: #8a8f94;
$accent: #00c3f5;

.stub {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stub-head {
  &__title {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: $ink;
  }

  &__sub {
    margin: 6px 0 0;
    font-size: 14px;
    color: $muted;
  }
}

.stub-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 56px 24px;
  text-align: center;
  background: $surface;
  border: 1px dashed #d5d9db;
  border-radius: 18px;
  color: $muted;

  .icon { color: $accent; }

  p {
    margin: 0;
    font-size: 14px;
    max-width: 380px;
    line-height: 1.6;
  }
}
</style>
