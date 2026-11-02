<!-- app/components/Layout/Cabinet/ImpersonationBanner.vue -->
<template>
  <div v-if="authStore.isImpersonating" class="impersonation-banner">
    <div class="impersonation-banner__icon">
      <Icon name="mdi:eye" size="18" />
    </div>

    <div class="impersonation-banner__text">
      <span class="impersonation-banner__title">
        Вы просматриваете кабинет как
        <strong>{{ targetName }}</strong>
        <span class="impersonation-banner__role">{{ roleLabel }}</span>
      </span>
      <span class="impersonation-banner__hint">
        Режим только для чтения — изменения заблокированы.
        <template v-if="authStore.impersonator">
          Вернётесь в аккаунт «{{ authStore.impersonator.name || authStore.impersonator.login }}».
        </template>
      </span>
    </div>

    <button class="impersonation-banner__btn" :disabled="exiting" @click="exit">
      <Icon name="mdi:logout" size="16" />
      {{ exiting ? 'Возврат…' : 'Вернуться' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from 'stores/auth'

const authStore = useAuthStore()
const exiting = ref(false)

const targetName = computed(() => authStore.user?.name || '…')

const roleLabels: Record<string, string> = {
  admin: 'Админ',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий',
  partner: 'Партнёр'
}

const roleLabel = computed(() => {
  const role = authStore.user?.role
  return role ? roleLabels[role] || role : ''
})

async function exit() {
  if (exiting.value) return
  exiting.value = true
  try {
    await authStore.exitImpersonation()
  } finally {
    exiting.value = false
  }
}
</script>

<style lang="scss" scoped>
.impersonation-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: linear-gradient(90deg, #7c3aed 0%, #5b21b6 100%);
  color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.18);
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    strong {
      font-weight: 700;
    }
  }

  &__role {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 8px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.22);
    font-size: 11px;
    font-weight: 600;
  }

  &__hint {
    font-size: 12px;
    opacity: 0.85;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: #fff;
    color: #5b21b6;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background: #f3e8ff;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

@media (max-width: 767.98px) {
  .impersonation-banner {
    flex-wrap: wrap;
    gap: 8px;

    &__hint {
      display: none;
    }

    &__btn {
      margin-left: auto;
    }
  }
}
</style>
