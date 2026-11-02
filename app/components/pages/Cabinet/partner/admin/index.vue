<!-- app/components/pages/Cabinet/partner/admin/index.vue -->
<template>
  <div class="partner-detail">
    <PageTitle :title="partnerTitle" icon="mdi:handshake-outline" :badge="leads.length">
      <template #actions>
        <NuxtLink to="/cabinet/partners" class="btn btn--ghost btn--sm">
          <Icon name="mdi:chevron-left" size="14" />
          К партнёрам
        </NuxtLink>
        <button class="btn btn--primary btn--sm" @click="openCreateLead">
          <Icon name="mdi:plus" size="14" />
          Добавить сделку
        </button>
      </template>
    </PageTitle>

    <PartnerProfileBar :partner="partner" />

    <div class="leads-section">
      <div v-if="isLoading" class="state-block"><span class="spinner" /> Загрузка сделок...</div>
      <div v-else-if="leads.length === 0" class="state-block">
        <Icon name="mdi:file-document-outline" size="32" />
        <span>Сделок пока нет</span>
      </div>

      <div v-else class="lead-list">
        <div v-for="lead in leads" :key="lead.id" class="lead-wrapper">
          <!-- Смена статуса — над карточкой, для админа -->
          <div class="lead-status-row">
            <span class="lead-status-row__label">Этап:</span>
            <select
              :value="lead.status"
              class="status-select"
              :style="statusStyle(lead.status)"
              @change="changeStatus(lead, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="s in statuses" :key="s" :value="s">{{ statusLabel(s) }}</option>
            </select>
          </div>

          <LeadProcessCard
            :lead="lead"
            show-actions
            @edit="openEditLead"
            @delete="deleteLead"
          />
        </div>
      </div>
    </div>

    <LeadModal
      v-model:visible="isLeadModalOpen"
      :lead="editingLead"
      :partner-id="partnerId"
      @saved="loadLeads"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageTitle from '~/components/pages/Cabinet/ui/layout/PageTitle.vue'
import LeadProcessCard from '~/components/pages/Cabinet/partner/ui/LeadProcessCard.vue'
import PartnerProfileBar from './PartnerProfileBar.vue'
import LeadModal from './LeadModal.vue'
import { useApi } from '~/composables/useApi'
import { useNotifications } from '~/composables/useNotifications'
import {
  PARTNER_LEAD_STATUSES,
  PARTNER_LEAD_STATUS_LABELS,
  PARTNER_LEAD_STATUS_COLORS,
  isPartnerLeadStatus,
  type PartnerLeadStatus,
} from 'shared/constants/partners'
import type { Partner, PartnerLead } from '~/types/partners'

const route = useRoute()
const api = useApi()
const notifications = useNotifications()

const partnerId = Number(route.params.id)

const isLoading = ref(true)
const partner = ref<Partner | null>(null)
const leads = ref<PartnerLead[]>([])

const statuses = PARTNER_LEAD_STATUSES as readonly PartnerLeadStatus[]

const partnerTitle = computed(() =>
  partner.value?.companyName || partner.value?.contactPerson || 'Партнёр'
)

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

async function loadPartner() {
  try {
    partner.value = await api.get<Partner>(`/api/partners/${partnerId}`)
  } catch (e) {
    console.error('Ошибка загрузки партнёра:', e)
  }
}

async function loadLeads() {
  isLoading.value = true
  try {
    leads.value = await api.get<PartnerLead[]>(`/api/partners/${partnerId}/leads`) || []
  } catch (e) {
    console.error('Ошибка загрузки сделок:', e)
    leads.value = []
  } finally {
    isLoading.value = false
  }
}

async function changeStatus(lead: PartnerLead, newStatus: string) {
  if (!isPartnerLeadStatus(newStatus)) return
  const prev = lead.status
  lead.status = newStatus
  try {
    await api.put(`/api/partner-leads/${lead.id}`, { status: newStatus })
    notifications.success(`Этап изменён: ${statusLabel(newStatus)}`)
  } catch (e: any) {
    lead.status = prev
    notifications.error(e?.data?.statusMessage || 'Не удалось сменить этап')
  }
}

const isLeadModalOpen = ref(false)
const editingLead = ref<PartnerLead | null>(null)

function openCreateLead() {
  editingLead.value = null
  isLeadModalOpen.value = true
}

function openEditLead(lead: PartnerLead) {
  editingLead.value = lead
  isLeadModalOpen.value = true
}

async function deleteLead(lead: PartnerLead) {
  if (!window.confirm(`Удалить сделку ${lead.leadNumber} (${lead.clientName})?`)) return
  try {
    await api.delete(`/api/partner-leads/${lead.id}`)
    notifications.success('Сделка удалена')
    await loadLeads()
  } catch (e: any) {
    notifications.error(e?.data?.statusMessage || 'Ошибка удаления')
  }
}

onMounted(() => {
  loadPartner()
  loadLeads()
})
</script>

<style lang="scss" scoped>
.partner-detail {
  min-height: 100vh;
  background: var(--crm-bg-base);
  color: var(--crm-text-primary);
  padding-bottom: 40px;
}

.leads-section {
  padding: 16px 24px;
}

.lead-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lead-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lead-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-secondary);
    font-weight: 600;
  }
}

.status-select {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
  cursor: pointer;
  outline: none;
  background-color: transparent;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23666' d='M5 7L1 3h8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 24px;
  appearance: none;
}

.state-block {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 0;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-md);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--crm-border-hover);
  border-top-color: var(--crm-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border-hover);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  cursor: pointer;
  font-size: var(--crm-text-sm);
  font-weight: 500;
  transition: var(--crm-transition);

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    border-color: var(--crm-border-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover:not(:disabled) {
      background: rgba(0, 195, 245, 0.25);
    }
  }

  &--ghost {
    background: transparent;
    border-color: var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover:not(:disabled) {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-primary);
    }
  }

  &--sm {
    padding: 5px 10px;
    font-size: var(--crm-text-xs);
  }
}

@media (max-width: 767.98px) {
  .leads-section {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>

