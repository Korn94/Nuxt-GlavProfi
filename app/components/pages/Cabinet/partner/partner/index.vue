<!-- app/components/pages/Cabinet/partner/partner/index.vue -->
<template>
  <div class="pp">
    <header class="pp-head">
      <div>
        <h1 class="pp-head__title">Сделки</h1>
        <p class="pp-head__sub">Текущие сделки и партнёрское вознаграждение</p>
      </div>
      <NuxtLink to="/" class="pp-head__link">
        <Icon name="mdi:web" size="15" />
        На сайт
      </NuxtLink>
    </header>

    <div v-if="isLoading" class="pp-state">
      <span class="pp-spinner" />
      <span>Загрузка...</span>
    </div>

    <template v-else>
      <section v-if="partner" class="pp-profile">
        <div class="pp-profile__avatar">{{ profileInitials }}</div>
        <div class="pp-profile__body">
          <h2 class="pp-profile__name">
            {{ partner.companyName || partner.contactPerson || 'Добро пожаловать!' }}
          </h2>
          <p v-if="partner.contactPerson && partner.companyName" class="pp-profile__sub">
            {{ partner.contactPerson }}
          </p>
          <div class="pp-profile__meta">
            <span v-if="partner.phone"><Icon name="mdi:phone" size="14" /> {{ partner.phone }}</span>
            <span v-if="partner.email"><Icon name="mdi:email" size="14" /> {{ partner.email }}</span>
          </div>
        </div>
      </section>

      <section class="pp-leads">
        <div class="pp-leads__head">
          <h2 class="pp-leads__title">Мои сделки</h2>
          <span class="pp-leads__count">Всего сделок: {{ leads.length }}</span>
        </div>

        <div v-if="leads.length === 0" class="pp-empty">
          <Icon name="mdi:file-document-outline" size="32" />
          <p>Пока нет ни одной сделки. Мы свяжемся с вами, как только появится первая.</p>
        </div>

        <div v-else class="pp-lead-list">
          <LeadProcessCard v-for="lead in leads" :key="lead.id" :lead="lead" />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useAuthStore } from 'stores/auth'
import { useApi } from '~/composables/useApi'
import LeadProcessCard from '~/components/pages/Cabinet/partner/ui/LeadProcessCard.vue'
import type { Partner, PartnerLead } from '~/types/partners'

const authStore = useAuthStore()
const api = useApi()

const isLoading = ref(true)
const partner = ref<Partner | null>(null)
const leads = ref<PartnerLead[]>([])

const profileInitials = computed(() => {
  const name = partner.value?.companyName || partner.value?.contactPerson || ''
  const parts = name.split(' ').filter(Boolean)
  if (!parts.length) return 'П'
  return parts.slice(0, 2).map((w) => w[0]).join('').toUpperCase()
})

onMounted(async () => {
  if (authStore.isChecking) {
    await authStore.init().catch(() => {})
  }

  if (authStore.user?.role !== 'partner') {
    await navigateTo('/cabinet')
    return
  }

  try {
    const data = await api.get<{ partner: Partner | null; leads: PartnerLead[] }>('/api/partner/me')
    partner.value = data.partner
    leads.value = data.leads || []
  } catch (error) {
    console.error('Ошибка загрузки кабинета партнёра:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
$ink: #0f1114;
$surface: #ffffff;
$border: #e5e7eb;
$muted: #8a8f94;
$accent: #00c3f5;

.pp {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pp-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;

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

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border-radius: 10px;
    background: $surface;
    border: 1px solid $border;
    color: #5a5e61;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.15s ease;

    &:hover { border-color: $accent; color: $ink; }
  }
}

.pp-state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: $muted;
  font-size: 14px;
  padding: 32px 0;
}

.pp-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid $border;
  border-top-color: $accent;
  border-radius: 50%;
  animation: pp-spin 0.8s linear infinite;
}

@keyframes pp-spin {
  to { transform: rotate(360deg); }
}

.pp-profile {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: $surface;
  border: 1px solid $border;
  border-radius: 18px;
  padding: 20px 22px;

  &__avatar {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 195, 245, 0.12);
    color: #00b2e0;
    font-size: 20px;
    font-weight: 800;
  }

  &__body { flex: 1; min-width: 0; }

  &__name {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: $ink;
  }

  &__sub {
    margin: 2px 0 0;
    font-size: 14px;
    color: $muted;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid $border;

    span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #5a5e61;
    }
  }
}

.pp-leads {
  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__title {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
    color: $ink;
  }

  &__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 10px;
    background: #fff;
    border: 1px solid $border;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: $muted;
  }
}

.pp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
  background: $surface;
  border: 1px dashed #d5d9db;
  border-radius: 18px;
  color: $muted;

  p {
    margin: 0;
    font-size: 14px;
    max-width: 380px;
    line-height: 1.6;
  }
}

.pp-lead-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

@media (max-width: 640px) {
  .pp-head { flex-direction: column; align-items: flex-start; }
  .pp-head__title { font-size: 24px; }
}
</style>
