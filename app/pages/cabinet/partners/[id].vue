<!-- app/pages/cabinet/partners/[id].vue -->
<template>
  <div class="partner-detail">
    <PageTitle :title="partnerTitle" icon="mdi:handshake-outline" :badge="leads.length">
      <template #actions>
        <NuxtLink to="/cabinet/partners" class="btn btn--ghost btn--sm">
          <Icon name="mdi:chevron-left" size="14" />
          К партнёрам
        </NuxtLink>
        <button class="btn btn--primary btn--sm" @click="openLeadModal()">
          <Icon name="mdi:plus" size="14" />
          Добавить сделку
        </button>
      </template>
    </PageTitle>

    <div v-if="partner" class="profile-bar">
      <div class="avatar" :style="{ backgroundColor: avatarColor }">{{ initials }}</div>
      <div class="profile-bar__info">
        <div class="profile-bar__name">
          {{ partner.companyName || partner.contactPerson || `Партнёр #${partner.id}` }}
          <span v-if="!partner.isActive" class="archive-badge">Архив</span>
        </div>
        <div class="profile-bar__meta">
          <span v-if="partner.contactPerson && partner.companyName">{{ partner.contactPerson }}</span>
          <span v-if="partner.phone"><Icon name="mdi:phone" size="13" /> {{ partner.phone }}</span>
          <span v-if="partner.email"><Icon name="mdi:email" size="13" /> {{ partner.email }}</span>
          <span v-if="partner.login"><Icon name="mdi:account-key" size="13" /> @{{ partner.login }}</span>
        </div>
        <p v-if="partner.comment" class="profile-bar__comment">{{ partner.comment }}</p>
      </div>
    </div>

    <div class="leads-section">
      <div v-if="isLoading" class="state-block"><span class="spinner" /> Загрузка сделок...</div>
      <div v-else-if="leads.length === 0" class="state-block">
        <Icon name="mdi:file-document-outline" size="32" />
        <span>Сделок пока нет</span>
      </div>

      <div v-else class="lead-list">
        <div v-for="lead in leads" :key="lead.id" class="lead-card">
          <div class="lead-card__top">
            <span class="lead-card__number">{{ lead.leadNumber }}</span>
            <select :value="lead.status" class="status-select" :style="statusStyle(lead.status)"
              @change="changeStatus(lead, ($event.target as HTMLSelectElement).value)">
              <option v-for="s in statuses" :key="s" :value="s">{{ statusLabel(s) }}</option>
            </select>
          </div>

          <div class="lead-card__client">
            <span class="lead-card__client-name">{{ lead.clientName }}</span>
            <a v-if="lead.clientPhone" :href="`tel:${lead.clientPhone}`" class="lead-card__phone">{{ lead.clientPhone }}</a>
          </div>

          <p v-if="lead.objectAddress" class="lead-card__line">
            <Icon name="mdi:map-marker-outline" size="14" />
            {{ lead.objectAddress }}<span v-if="lead.objectArea"> · {{ lead.objectArea }} м²</span>
          </p>

          <p v-if="lead.description" class="lead-card__desc">{{ lead.description }}</p>

          <div v-if="lead.objectName" class="lead-card__object">
            <Icon name="mdi:office-building" size="14" />
            Объект: {{ lead.objectName }}
          </div>

          <div class="lead-card__footer">
            <span v-if="lead.contractAmount">Договор: {{ formatMoney(lead.contractAmount) }}</span>
            <span class="lead-card__reward">Вознаграждение: {{ formatMoney(lead.rewardAmount) }}</span>
            <div class="lead-card__actions">
              <button class="action-btn" title="Редактировать" @click="openLeadModal(lead)">
                <Icon name="mdi:pencil" size="15" />
              </button>
              <button class="action-btn action-btn--danger" title="Удалить" @click="deleteLead(lead)">
                <Icon name="mdi:delete" size="15" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка сделки -->
    <Modal :visible="isLeadModalOpen" :title="leadModalTitle" size="md" @update:visible="closeLeadModal">
      <form @submit.prevent="saveLead" class="lead-form">
        <div class="field-row">
          <label class="field">
            <span>Имя клиента *</span>
            <input v-model="leadForm.clientName" type="text" class="input" />
          </label>
          <label class="field">
            <span>Телефон клиента *</span>
            <input v-model="leadForm.clientPhone" type="text" class="input" />
          </label>
        </div>
        <label class="field">
          <span>Адрес объекта</span>
          <input v-model="leadForm.objectAddress" type="text" class="input" />
        </label>
        <div class="field-row">
          <label class="field">
            <span>Площадь (м²)</span>
            <input v-model="leadForm.objectArea" type="number" class="input" />
          </label>
          <label class="field">
            <span>Этап сделки</span>
            <select v-model="leadForm.status" class="input select">
              <option v-for="s in statuses" :key="s" :value="s">{{ statusLabel(s) }}</option>
            </select>
          </label>
        </div>
        <div class="field-row">
          <label class="field">
            <span>Сумма договора (₽)</span>
            <input v-model="leadForm.contractAmount" type="number" min="0" class="input" />
          </label>
          <div class="reward-preview">
            <span class="reward-preview__label">Вознаграждение партнёра (по сетке)</span>
            <span class="reward-preview__value">{{ formatNumber(calculatedReward) }}</span>
            <span v-if="calculatedCategory" class="reward-preview__category">
              Категория «{{ calculatedCategory.name }}» · {{ calculatedCategory.range }}
            </span>
          </div>
        </div>
        <label class="field">
          <span>Описание</span>
          <textarea v-model="leadForm.description" rows="2" class="input" />
        </label>
        <p v-if="leadError" class="error-msg">{{ leadError }}</p>
      </form>
      <template #footer>
        <button class="btn btn--sm" @click="closeLeadModal">Отмена</button>
        <button class="btn btn--sm btn--primary" @click="saveLead" :disabled="isSavingLead">
          {{ isSavingLead ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </template>
    </Modal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageTitle from '~/components/pages/Cabinet/ui/layout/PageTitle.vue'
import Modal from '~/components/pages/Cabinet/ui/Modal.vue'
import { useApi } from '~/composables/useApi'
import { useNotifications } from '~/composables/useNotifications'
import {
  PARTNER_LEAD_STATUSES,
  PARTNER_LEAD_STATUS_LABELS,
  PARTNER_LEAD_STATUS_COLORS,
  isPartnerLeadStatus,
  getPartnerReward,
  getPartnerRewardCategory,
  type PartnerLeadStatus,
} from 'shared/constants/partners'
import type { Partner, PartnerLead } from '~/types/partners'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin'],
})

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

const initials = computed(() => {
  const name = partnerTitle.value
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?'
})

const avatarColor = computed(() => {
  const colors = ['#00c3f5', '#3dd68c', '#f5a623', '#5b8def', '#f25f5c', '#8e44ad']
  return colors[(partner.value?.id || 0) % colors.length] || '#00c3f5'
})

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
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(num) + ' ₽'
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0 ₽'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽'
}

const calculatedReward = computed(() => {
  const raw = leadForm.value.contractAmount
  if (raw === '' || raw === null || raw === undefined) return 0
  const num = Number(raw)
  if (!Number.isFinite(num)) return 0
  return getPartnerReward(num)
})

const calculatedCategory = computed(() => {
  const raw = leadForm.value.contractAmount
  if (raw === '' || raw === null || raw === undefined) return null
  const num = Number(raw)
  if (!Number.isFinite(num)) return null
  return getPartnerRewardCategory(num)
})

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
const isSavingLead = ref(false)
const leadError = ref('')

const emptyLeadForm = () => ({
  clientName: '',
  clientPhone: '',
  objectAddress: '',
  objectArea: '' as string | number,
  status: 'new' as PartnerLeadStatus,
  contractAmount: '' as string | number,
  description: '',
})
const leadForm = ref(emptyLeadForm())

const leadModalTitle = computed(() => (editingLead.value ? 'Редактировать сделку' : 'Новая сделка'))

function openLeadModal(lead?: PartnerLead) {
  editingLead.value = lead || null
  leadError.value = ''
  if (lead) {
    leadForm.value = {
      clientName: lead.clientName,
      clientPhone: lead.clientPhone,
      objectAddress: lead.objectAddress || '',
      objectArea: lead.objectArea ?? '',
      status: lead.status,
      contractAmount: lead.contractAmount ?? '',
      description: lead.description || '',
    }
  } else {
    leadForm.value = emptyLeadForm()
  }
  isLeadModalOpen.value = true
}

function closeLeadModal() {
  isLeadModalOpen.value = false
  editingLead.value = null
}

async function saveLead() {
  if (isSavingLead.value) return
  leadError.value = ''
  if (!leadForm.value.clientName.trim() || !leadForm.value.clientPhone.trim()) {
    leadError.value = 'Имя и телефон клиента обязательны'
    return
  }

  isSavingLead.value = true
  try {
    const payload = {
      clientName: leadForm.value.clientName,
      clientPhone: leadForm.value.clientPhone,
      objectAddress: leadForm.value.objectAddress,
      objectArea: leadForm.value.objectArea === '' ? null : leadForm.value.objectArea,
      status: leadForm.value.status,
      contractAmount: leadForm.value.contractAmount === '' ? null : leadForm.value.contractAmount,
      description: leadForm.value.description,
    }

    if (editingLead.value) {
      await api.put(`/api/partner-leads/${editingLead.value.id}`, payload)
      notifications.success('Сделка обновлена')
    } else {
      await api.post(`/api/partners/${partnerId}/leads`, payload)
      notifications.success('Сделка создана')
    }
    closeLeadModal()
    await loadLeads()
  } catch (e: any) {
    leadError.value = e?.data?.statusMessage || e?.message || 'Ошибка сохранения'
  } finally {
    isSavingLead.value = false
  }
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

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'CRM — Партнёр',
})
</script>

<style lang="scss" scoped>
.partner-detail {
  min-height: 100vh;
  background: var(--crm-bg-base);
  color: var(--crm-text-primary);
  padding-bottom: 40px;
}

.profile-bar {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 24px;
  background: var(--crm-bg-surface);
  border-bottom: 1px solid var(--crm-border);

  &__info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  &__name {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: var(--crm-text-lg);
    font-weight: 600;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 13px;
    color: var(--crm-text-secondary);

    span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
  }

  &__comment {
    margin: 0;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
  }
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: var(--crm-text-md);
  flex-shrink: 0;
}

.archive-badge {
  padding: 1px 6px;
  background: var(--crm-warning-dim);
  border: 1px solid rgba(245, 166, 35, 0.3);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  color: var(--crm-warning);
  text-transform: uppercase;
}

.leads-section {
  padding: 16px 24px;
}

.lead-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lead-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  transition: var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__number {
    font-family: var(--crm-font-mono, monospace);
    font-weight: 600;
    font-size: var(--crm-text-md);
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
    font-size: var(--crm-text-sm);
    color: #5b8def;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }

  &__line,
  &__desc,
  &__object {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--crm-text-secondary);
    margin: 0;
  }

  &__object {
    color: var(--crm-success);
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    padding-top: 10px;
    border-top: 1px solid var(--crm-border);
    font-size: 13px;
    color: var(--crm-text-secondary);
  }

  &__reward {
    font-weight: 600;
    color: var(--crm-success);
  }

  &__actions {
    margin-left: auto;
    display: flex;
    gap: 4px;
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

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-secondary);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
    border-color: var(--crm-border-hover);
  }

  &--danger:hover {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);
    color: var(--crm-danger);
  }
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

.lead-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-secondary);
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.reward-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-secondary);
  }

  &__value {
    font-size: var(--crm-text-lg);
    font-weight: 700;
    color: var(--crm-success);
  }

  &__category {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }
}

.input {
  padding: 10px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-md);
  outline: none;
  transition: var(--crm-transition);

  &:focus {
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
  }

  &.select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239aa0b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }
}

.error-msg {
  margin: 0;
  padding: 8px 12px;
  background: var(--crm-danger-dim);
  border: 1px solid rgba(242, 95, 92, 0.3);
  border-radius: var(--crm-radius-md);
  color: var(--crm-danger);
  font-size: var(--crm-text-sm);
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
  .profile-bar,
  .leads-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>




