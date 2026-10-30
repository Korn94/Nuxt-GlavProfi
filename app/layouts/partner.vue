<!-- // app/layouts/partner.vue -->
<!-- Минималистичный layout личного кабинета партнёра (без CRM-сайдбара) -->
<template>
  <div class="partner-cabinet">
    <header class="pc-header">
      <div class="pc-header__inner">
        <div class="pc-header__brand">
          <Icon name="mdi:handshake-outline" size="22" />
          <span class="pc-header__title">Кабинет партнёра</span>
        </div>
        <div class="pc-header__user">
          <span class="pc-header__name">{{ displayName }}</span>
          <button class="pc-header__logout" type="button" @click="handleLogout" title="Выйти">
            <Icon name="mdi:logout" size="18" />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </header>

    <main class="pc-main">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const displayName = computed(() => authStore.user?.name || 'Партнёр')

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style lang="scss">
.partner-cabinet {
  min-height: 100vh;
  background: #f4f5f3;
  color: #0f1114;
  font-family: 'Rubik', sans-serif;
  display: flex;
  flex-direction: column;
}

.pc-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;

  &__inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 20px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #0f1114;

    .icon {
      color: #00c3f5;
    }
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__name {
    font-size: 14px;
    color: #4b5563;
  }

  &__logout {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    color: #6b7280;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s ease;

    &:hover {
      background: #fff1f0;
      border-color: #f2a9a7;
      color: #dc3545;
    }
  }
}

.pc-main {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px 20px 60px;
}
</style>