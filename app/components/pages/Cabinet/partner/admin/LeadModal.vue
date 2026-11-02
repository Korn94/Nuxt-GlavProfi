<!-- app/components/pages/Cabinet/partner/admin/LeadModal.vue -->
<template>
  <Modal :visible="visible" :title="modalTitle" size="md" @update:visible="onClose">
    <form @submit.prevent="save" class="lead-form">
      <div class="field-row">
        <label class="field">
          <span>Имя клиента *</span>
          <input v-model="form.clientName" type="text" class="input" />
        </label>
        <label class="field">
          <span>Телефон клиента *</span>
          <input v-model="form.clientPhone" type="text" class="input" />
        </label>
      </div>
      <label class="field">
        <span>Адрес объекта</span>
        <input v-model="form.objectAddress" type="text" class="input" />
      </label>
      <div class="field-row">
        <label class="field">
          <span>Площадь (м²)</span>
          <input v-model="form.objectArea" type="number" class="input" />
        </label>
        <label class="field">
          <span>Этап сделки</span>
          <select v-model="form.status" class="input select">
            <option v-for="s in statuses" :key="s" :value="s">{{ statusLabel(s) }}</option>
          </select>
        </label>
      </div>
      <div class="field-row">
        <label class="field">
          <span>Сумма договора (₽)</span>
          <input v-model="form.contractAmount" type="number" min="0" class="input" />
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
        <textarea v-model="form.description" rows="2" class="input" />
      </label>
      <p v-if="error" class="error-msg">{{ error }}</p>
    </form>
    <template #footer>
      <button class="btn btn--sm" @click="onClose">Отмена</button>
      <button class="btn btn--sm btn--primary" @click="save" :disabled="isSaving">
        {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '~/components/pages/Cabinet/ui/Modal.vue'
import { useApi } from '~/composables/useApi'
import { useNotifications } from '~/composables/useNotifications'
import {
  PARTNER_LEAD_STATUSES,
  PARTNER_LEAD_STATUS_LABELS,
  getPartnerReward,
  getPartnerRewardCategory,
  type PartnerLeadStatus,
} from 'shared/constants/partners'
import type { PartnerLead } from '~/types/partners'

const props = defineProps<{
  visible: boolean
  lead: PartnerLead | null
  partnerId: number
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

const api = useApi()
const notifications = useNotifications()

const statuses = PARTNER_LEAD_STATUSES as readonly PartnerLeadStatus[]

const isSaving = ref(false)
const error = ref('')

function statusLabel(status: PartnerLeadStatus): string {
  return PARTNER_LEAD_STATUS_LABELS[status] || status
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0 ₽'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽'
}

function emptyForm() {
  return {
    clientName: '',
    clientPhone: '',
    objectAddress: '',
    objectArea: '' as string | number,
    status: 'new' as PartnerLeadStatus,
    contractAmount: '' as string | number,
    description: '',
  }
}

const form = ref(emptyForm())

const modalTitle = computed(() => (props.lead ? 'Редактировать сделку' : 'Новая сделка'))

const calculatedReward = computed(() => {
  const raw = form.value.contractAmount
  if (raw === '' || raw === null || raw === undefined) return 0
  const num = Number(raw)
  if (!Number.isFinite(num)) return 0
  return getPartnerReward(num)
})

const calculatedCategory = computed(() => {
  const raw = form.value.contractAmount
  if (raw === '' || raw === null || raw === undefined) return null
  const num = Number(raw)
  if (!Number.isFinite(num)) return null
  return getPartnerRewardCategory(num)
})

// Синхронизация формы при каждом открытии модалки
watch(() => props.visible, (open) => {
  if (!open) return
  error.value = ''
  if (props.lead) {
    form.value = {
      clientName: props.lead.clientName,
      clientPhone: props.lead.clientPhone,
      objectAddress: props.lead.objectAddress || '',
      objectArea: props.lead.objectArea ?? '',
      status: props.lead.status,
      contractAmount: props.lead.contractAmount ?? '',
      description: props.lead.description || '',
    }
  } else {
    form.value = emptyForm()
  }
})

function onClose() {
  emit('update:visible', false)
}

async function save() {
  if (isSaving.value) return
  error.value = ''
  if (!form.value.clientName.trim() || !form.value.clientPhone.trim()) {
    error.value = 'Имя и телефон клиента обязательны'
    return
  }

  isSaving.value = true
  try {
    const payload = {
      clientName: form.value.clientName,
      clientPhone: form.value.clientPhone,
      objectAddress: form.value.objectAddress,
      objectArea: form.value.objectArea === '' ? null : form.value.objectArea,
      status: form.value.status,
      contractAmount: form.value.contractAmount === '' ? null : form.value.contractAmount,
      description: form.value.description,
    }

    if (props.lead) {
      await api.put(`/api/partner-leads/${props.lead.id}`, payload)
      notifications.success('Сделка обновлена')
    } else {
      await api.post(`/api/partners/${props.partnerId}/leads`, payload)
      notifications.success('Сделка создана')
    }
    emit('update:visible', false)
    emit('saved')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Ошибка сохранения'
  } finally {
    isSaving.value = false
  }
}
</script>

<style lang="scss" scoped>
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

  &--sm {
    padding: 5px 10px;
    font-size: var(--crm-text-xs);
  }
}

@media (max-width: 767.98px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>

