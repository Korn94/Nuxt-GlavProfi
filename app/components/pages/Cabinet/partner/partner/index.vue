<!-- app/components/pages/Cabinet/partner/partner/index.vue -->
<template>
  <div class="partner-page">
    <PageTitle
      title="Кабинет партнёра"
      icon="mdi:handshake-outline"
      :badge="leads.length"
    >
      <template #actions>
        <NuxtLink to="/" class="crm-btn crm-btn--ghost crm-btn--sm">
          <Icon name="mdi:web" size="14" />
          На сайт
        </NuxtLink>
      </template>
    </PageTitle>

    <div v-if="isLoading" class="pp-state">
      <span class="pp-spinner" />
      <span>Загрузка...</span>
    </div>

    <div v-else class="pp-content">
      <!-- Профиль партнёра -->
      <section class="pp-profile">
        <div class="pp-profile__head">
          <div>
            <h1 class="pp-profile__title">
              {{ partner?.companyName || partner?.contactPerson || 'Добро пожаловать!' }}
            </h1>
            <p v-if="partner?.contactPerson && partner?.companyName" class="pp-profile__sub">
              {{ partner.contactPerson }}
            </p>
          </div>
        </div>

        <div v-if="partner" class="pp-profile__meta">
          <span v-if="partner.phone"><Icon name="mdi:phone" size="14" /> {{ partner.phone }}</span>
          <span v-if="partner.email"><Icon name="mdi:email" size="14" /> {{ partner.email }}</span>
        </div>
      </section>

      <!-- Сделки -->
      <section class="pp-leads">
        <h2 class="pp-leads__title">
          Мои сделки
          <span class="pp-leads__count">Всего сделок: {{ leads.length }}</span>
        </h2>

        <div v-if="leads.length === 0" class="pp-empty">
          <Icon name="mdi:file-document-outline" size="32" />
          <p>Пока нет ни одной сделки. Мы свяжемся с вами, как только появится первая.</p>
        </div>

        <div v-else class="pp-lead-list">
          <LeadProcessCard
            v-for="lead in leads"
            :key="lead.id"
            :lead="lead"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useAuthStore } from 'stores/auth'
import { useApi } from '~/composables/useApi'
import PageTitle from '~/components/pages/Cabinet/ui/layout/PageTitle.vue'
import LeadProcessCard from '~/components/pages/Cabinet/partner/ui/LeadProcessCard.vue'
import type { Partner, PartnerLead } from '~/types/partners'

const authStore = useAuthStore()
const api = useApi()

const isLoading = ref(true)
const partner = ref<Partner | null>(null)
const leads = ref<PartnerLead[]>([])

onMounted(async () => {
  if (authStore.isChecking) {
    await authStore.init().catch(() => {})
  }

  // Только партнёр имеет доступ к этому кабинету
  if (authStore.user?.role !== 'partner') {
    await navigateTo('/cabinet')
    return
  }

  try {
    const data = await api.get<{ partner: Partner | null, leads: PartnerLead[] }>('/api/partner/me')
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
.partner-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--crm-bg-base);
  color: var(--crm-text-primary);
}

.pp-content {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 24px;

  @media (max-width: 767.98px) {
    padding: 16px;
  }
}

.pp-state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-md);
  padding: 24px;

  @media (max-width: 767.98px) {
    padding: 16px;
  }
}

.pp-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--crm-border-hover);
  border-top-color: var(--crm-accent);
  border-radius: 50%;
  animation: pp-spin 0.8s linear infinite;
}

@keyframes pp-spin {
  to { transform: rotate(360deg); }
}

.pp-profile {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-xl);
  padding: 20px 24px;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  &__title {
    font-size: 22px;
    font-weight: 600;
    margin: 0;
    color: var(--crm-text-primary);
  }

  &__sub {
    font-size: var(--crm-text-md);
    color: var(--crm-text-secondary);
    margin: 4px 0 0;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--crm-border);

    span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: var(--crm-text-md);
      color: var(--crm-text-secondary);
    }
  }
}

.pp-leads {
  &__title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px;
    color: var(--crm-text-primary);
  }

  &__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 10px;
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border-hover);
    border-radius: 12px;
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-secondary);
  }
}

.pp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 24px;
  background: var(--crm-bg-surface);
  border: 1px dashed var(--crm-border-hover);
  border-radius: var(--crm-radius-xl);
  color: var(--crm-text-muted);
  text-align: center;

  p { margin: 0; font-size: var(--crm-text-md); max-width: 360px; }
}

.pp-lead-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
