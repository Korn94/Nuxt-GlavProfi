<!-- // app/layouts/partner.vue -->
<!-- Layout личного кабинета партнёра: светлая тема + боковое меню -->
<template>
  <div class="pc">
    <!-- Мобильная шапка -->
    <header class="pc-topbar">
      <button
        class="pc-topbar__burger"
        type="button"
        aria-label="Открыть меню"
        @click="sidebarOpen = true"
      >
        <Icon name="mdi:menu" size="22" />
      </button>
      <div class="pc-topbar__brand">
        <Icon name="mdi:handshake-outline" size="20" />
        <span>Кабинет партнёра</span>
      </div>
    </header>

    <!-- Затемнение на мобильных -->
    <transition name="pc-fade">
      <div v-if="sidebarOpen" class="pc-overlay" @click="sidebarOpen = false" />
    </transition>

    <!-- Боковое меню -->
    <aside class="pc-sidebar" :class="{ 'pc-sidebar--open': sidebarOpen }">
      <div class="pc-sidebar__brand" @click="sidebarOpen = false">
        <Icon name="mdi:handshake-outline" size="22" />
        <span>Кабинет партнёра</span>
      </div>

      <nav class="pc-nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="pc-nav__link"
          :class="{ 'pc-nav__link--active': isActive(item.to) }"
          @click="sidebarOpen = false"
        >
          <span class="pc-nav__icon"><Icon :name="item.icon" size="18" /></span>
          <span class="pc-nav__label">{{ item.title }}</span>
        </NuxtLink>
      </nav>

      <div class="pc-sidebar__foot">
        <div class="pc-sidebar__user">
          <div class="pc-sidebar__avatar">{{ userInitials }}</div>
          <div class="pc-sidebar__info">
            <span class="pc-sidebar__name">{{ displayName }}</span>
            <span class="pc-sidebar__role">Партнёр</span>
          </div>
        </div>
        <button class="pc-sidebar__logout" type="button" @click="handleLogout" title="Выйти">
          <Icon name="mdi:logout" size="18" />
        </button>
      </div>
    </aside>

    <!-- Контент -->
    <main class="pc-main">
      <div class="pc-main__inner">
        <NuxtPage />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const sidebarOpen = ref(false)

const navItems = [
  { to: '/cabinet/partner', title: 'Главная', icon: 'mdi:home-outline' },
  { to: '/cabinet/partner/check-phone', title: 'Проверить клиента', icon: 'mdi:phone-search-outline' },
  { to: '/cabinet/partner/payouts', title: 'Выплаты', icon: 'mdi:wallet-outline' },
  { to: '/cabinet/partner/history', title: 'История', icon: 'mdi:history' },
]

function isActive(to: string): boolean {
  return route.path === to
}

const displayName = computed(() => authStore.user?.name || 'Партнёр')

const userInitials = computed(() => {
  const name = authStore.user?.name || ''
  const parts = name.split(' ').filter(Boolean)
  if (!parts.length) return 'П'
  return parts.slice(0, 2).map((w) => w[0]).join('').toUpperCase()
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style lang="scss">
$pc-bg: #f4f5f3;
$pc-ink: #0f1114;
$pc-surface: #ffffff;
$pc-border: #e5e7eb;
$pc-muted: #8a8f94;
$pc-accent: #00c3f5;

.pc {
  min-height: 100vh;
  background: $pc-bg;
  color: $pc-ink;
  font-family: 'Rubik', sans-serif;
  line-height: 1.45;
}

.pc-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 250px;
  background: $pc-surface;
  border-right: 1px solid $pc-border;
  display: flex;
  flex-direction: column;
  z-index: 120;

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 20px 18px;
    font-size: 16px;
    font-weight: 700;
    color: $pc-ink;
    border-bottom: 1px solid #f0f1ef;
    cursor: pointer;

    .icon { color: $pc-accent; }
  }

  &__foot {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-top: 1px solid #f0f1ef;
    margin-top: auto;
  }

  &__user { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }

  &__avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 195, 245, 0.12);
    color: #00b2e0;
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
  }

  &__info { display: flex; flex-direction: column; min-width: 0; }

  &__name {
    font-size: 13px;
    font-weight: 600;
    color: $pc-ink;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__role { font-size: 12px; color: $pc-muted; }

  &__logout {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    color: $pc-muted;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s ease;

    &:hover { background: #fff1f0; border-color: #f2a9a7; color: #dc3545; }
  }
}

.pc-nav {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow-y: auto;

  &__link {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 12px;
    border-radius: 10px;
    color: #5a5e61;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.15s ease, color 0.15s ease;

    &:hover { background: $pc-bg; color: $pc-ink; }

    &--active {
      background: rgba(0, 195, 245, 0.12);
      color: #00b2e0;
      font-weight: 600;

      .pc-nav__icon { color: #00b2e0; }
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: #a3a8ac;
    flex-shrink: 0;
    transition: color 0.15s ease;
  }

  &__label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}

.pc-main {
  margin-left: 250px;
  padding: 32px 28px 80px;

  &__inner { max-width: 1080px; margin: 0 auto; }
}

.pc-topbar {
  display: none;
  position: sticky;
  top: 0;
  z-index: 110;
  height: 56px;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: $pc-surface;
  border-bottom: 1px solid $pc-border;

  &__burger {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid $pc-border;
    border-radius: 9px;
    color: $pc-ink;
    cursor: pointer;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 700;
    color: $pc-ink;

    .icon { color: $pc-accent; }
  }
}

.pc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 17, 20, 0.5);
  z-index: 115;
  backdrop-filter: blur(2px);
}

.pc-fade-enter-active,
.pc-fade-leave-active { transition: opacity 0.2s ease; }
.pc-fade-enter-from,
.pc-fade-leave-to { opacity: 0; }

@media (max-width: 767.98px) {
  .pc-topbar { display: flex; }

  .pc-sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;

    &--open { transform: translateX(0); }
  }

  .pc-main { margin-left: 0; padding: 24px 16px 60px; }
}
</style>
