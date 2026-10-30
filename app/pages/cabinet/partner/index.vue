<!-- app/pages/cabinet/partner/index.vue -->
<template>
  <div class="partner-page">
    <div v-if="isLoading" class="pp-state">
      <span class="pp-spinner" />
      <span>Загрузка...</span>
    </div>

    <template v-else>
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
          <NuxtLink to="/" class="pp-profile__back">
            <Icon name="mdi:web" size="14" />
            На сайт
          </NuxtLink>
        </div>

        <div v-if="partner" class="pp-profile__meta">
          <span v-if="partner.phone"><Icon name="mdi:phone" size="14" /> {{ partner.phone }}</span>
          <span v-if="partner.email"><Icon name="mdi:email" size="14" /> {{ partner.email }}</span>
        </div>
      </section>

      <!-- Сводка -->
      <section class="pp-summary">
        <div class="pp-summary__card">
          <span class="pp-summary__label">Всего сделок</span>
          <span class="pp-summary__value">{{ leads.length }}</span>
        </div>
        <div class="pp-summary__card">
          <span class="pp-summary__label">Сумма договоров</span>
          <span class="pp-summary__value">{{ formatNumber(totalContract) }}</span>
        </div>
        <div class="pp-summary__card pp-summary__card--accent">
          <span class="pp-summary__label">Вознаграждение</span>
          <span class="pp-summary__value pp-summary__value--accent">{{ formatNumber(totalReward) }}</span>
        </div>
      </section>

      <!-- Сделки -->
      <section class="pp-leads">
        <h2 class="pp-leads__title">
          Мои сделки
          <span class="pp-leads__count">{{ leads.length }}</span>
        </h2>

        <div v-if="leads.length === 0" class="pp-empty">
          <Icon name="mdi:file-document-outline" size="32" />
          <p>Пока нет ни одной сделки. Мы свяжемся с вами, как только появится первая.</p>
        </div>

        <div v-else class="pp-lead-list">
          <div v-for="lead in leads" :key="lead.id" class="pp-lead">
            <div class="pp-lead__top">
              <div class="pp-lead__number">{{ lead.leadNumber }}</div>
              <span class="pp-lead__status" :style="statusStyle(lead.status)">
                {{ statusLabel(lead.status) }}
              </span>
            </div>

            <div class="pp-lead__client">
              <span class="pp-lead__client-name">{{ lead.clientName }}</span>
              <a v-if="lead.clientPhone" :href="`tel:${lead.clientPhone}`" class="pp-lead__phone">
                {{ lead.clientPhone }}
              </a>
            </div>

            <p v-if="lead.objectAddress" class="pp-lead__address">
              <Icon name="mdi:map-marker-outline" size="14" />
              {{ lead.objectAddress }}
              <span v-if="lead.objectArea"> · {{ lead.objectArea }} м²</span>
            </p>

            <p v-if="lead.description" class="pp-lead__desc">{{ lead.description }}</p>

            <div v-if="lead.objectName" class="pp-lead__object">
              <Icon name="mdi:office-building" size="14" />
              Объект: {{ lead.objectName }}
            </div>

            <div class="pp-lead__footer">
              <span v-if="lead.contractAmount" class="pp-lead__amount">
                Договор: {{ formatMoney(lead.contractAmount) }}
              </span>
              <span class="pp-lead__reward">
                Вознаграждение: {{ formatMoney(lead.rewardAmount) }}
              </span>
            </div>
          </div>
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
import {
  PARTNER_LEAD_STATUS_LABELS,
  PARTNER_LEAD_STATUS_COLORS,
  type PartnerLeadStatus,
} from 'shared/constants/partners'
import type { Partner, PartnerLead } from '~/types/partners'

definePageMeta({
  layout: 'partner',
  middleware: ['auth'],
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'ГлавПрофи — кабинет партнёра',
})

const authStore = useAuthStore()
const api = useApi()

const isLoading = ref(true)
const partner = ref<Partner | null>(null)
const leads = ref<PartnerLead[]>([])

function statusLabel(status: PartnerLeadStatus): string {
  return PARTNER_LEAD_STATUS_LABELS[status] || status
}

function statusStyle(status: PartnerLeadStatus) {
  const color = PARTNER_LEAD_STATUS_COLORS[status] || '#6c757d'
  return {
    backgroundColor: `${color}1a`,
    color,
    borderColor: `${color}4d`,
  }
}

function formatMoney(value: string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : value || 0
  if (Number.isNaN(num)) return '0 ₽'
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(num) + ' ₽'
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0 ₽'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽'
}

const totalContract = computed(() =>
  leads.value.reduce((sum, l) => sum + (Number.parseFloat(l.contractAmount || '0') || 0), 0)
)

const totalReward = computed(() =>
  leads.value.reduce((sum, l) => sum + (Number.parseFloat(l.rewardAmount || '0') || 0), 0)
)

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
  gap: 28px;
}

.pp-state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  font-size: 15px;
}

.pp-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: #00c3f5;
  border-radius: 50%;
  animation: pp-spin 0.8s linear infinite;
}

@keyframes pp-spin {
  to { transform: rotate(360deg); }
}

.pp-profile {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
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
  }

  &__sub {
    font-size: 14px;
    color: #6b7280;
    margin: 4px 0 0;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #6b7280;
    text-decoration: none;
    white-space: nowrap;

    &:hover { color: #00c3f5; }
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid #f0f1f3;

    span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #4b5563;
    }
  }
}

.pp-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;

  &__card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px 18px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;

    &--accent {
      border-color: rgba(0, 195, 245, 0.4);
      background: linear-gradient(180deg, #f0fbff 0%, #ffffff 100%);
    }
  }

  &__label {
    font-size: 13px;
    color: #6b7280;
  }

  &__value {
    font-size: 22px;
    font-weight: 700;
    color: #0f1114;

    &--accent {
      color: #28a745;
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
  }

  &__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 8px;
    background: #eef0f2;
    border-radius: 12px;
    font-size: 13px;
    color: #4b5563;
  }
}

.pp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 24px;
  background: #fff;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  color: #9aa0b8;
  text-align: center;

  p { margin: 0; font-size: 14px; max-width: 360px; }
}

.pp-lead-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pp-lead {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__number {
    font-family: monospace;
    font-weight: 600;
    font-size: 14px;
    color: #0f1114;
  }

  &__status {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid;
    white-space: nowrap;
  }

  &__client {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__client-name {
    font-size: 16px;
    font-weight: 500;
  }

  &__phone {
    font-size: 14px;
    color: #5b8def;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }

  &__address,
  &__desc,
  &__object {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #6b7280;
    margin: 0;
  }

  &__object {
    color: #28a745;
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding-top: 12px;
    border-top: 1px solid #f0f1f3;
    font-size: 13px;
    color: #4b5563;
  }

  &__reward {
    font-weight: 600;
    color: #28a745;
  }
}
</style>