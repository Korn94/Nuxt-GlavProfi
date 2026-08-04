<!-- app/components/Pages/Cabinet/Objects/Agreements.vue -->
<template>
  <div class="agreements">
    <div class="agreements__toolbar">
      <div class="agreements__title">
        Договорённости
      </div>

      <button
        v-if="canCreate"
        :disabled="!isReady"
        class="crm-btn crm-btn--primary crm-btn--sm"
        @click="openCreateModal"
      >
        Добавить договорённость
      </button>
    </div>

    <div v-if="loading" class="agreements__empty">
      Загрузка...
    </div>

    <div v-else-if="!agreements.length" class="agreements__empty">
      Договорённостей пока нет
    </div>

    <div v-else class="agreements__list">
      <article
        v-for="agreement in agreements"
        :key="agreement.id"
        class="agreement-card"
        :class="{
          'agreement-card--done': agreement.isFullyAccepted || agreement.status === 'cancelled'
        }"
      >
        <div class="agreement-card__header">
          <div class="agreement-card__title-block">
            <h3 class="agreement-card__title">
              {{ agreement.title }}
            </h3>

            <div class="agreement-card__meta">
              {{ agreement.workType }}
              <span v-if="contractorLabel(agreement)">
                · {{ contractorLabel(agreement) }}
              </span>
            </div>
          </div>

          <div class="agreement-card__amount">
            {{ formatCurrency(agreement.agreedAmount) }}
          </div>
        </div>

        <div class="agreement-card__volume">
          Объём:
          {{ agreement.volume }} {{ unitLabel(agreement) }}
        </div>

        <div v-if="agreement.publicComment" class="agreement-card__comment">
          {{ agreement.publicComment }}
        </div>

        <div
          v-if="isAdmin && agreement.adminComment"
          class="agreement-card__comment agreement-card__comment--admin"
        >
          {{ agreement.adminComment }}
        </div>

        <div class="agreement-card__progress">
          <div class="progress">
            <div
              class="progress__fill"
              :style="{ width: agreement.percent + '%' }"
            />
          </div>

          <div class="agreement-card__progress-text">
            {{ agreement.acceptedVolume }} /
            {{ agreement.volume }} {{ unitLabel(agreement) }}
            · {{ agreement.percent }}%
          </div>
        </div>

        <div class="agreement-card__actions">
          <button
            v-if="canEdit"
            :disabled="!isReady"
            class="crm-btn crm-btn--ghost crm-btn--sm"
            @click="openEditModal(agreement)"
          >
            Редактировать
          </button>

          <button
            v-if="canAccept && agreement.status === 'active' && !agreement.isFullyAccepted"
            :disabled="!isReady"
            class="crm-btn crm-btn--primary crm-btn--sm"
            @click="openAcceptModal(agreement)"
          >
            Принять
          </button>

          <button
            v-if="canDelete && agreement.acceptedVolume === 0"
            :disabled="!isReady"
            class="crm-btn crm-btn--danger crm-btn--sm"
            @click="removeAgreement(agreement)"
          >
            Удалить
          </button>
        </div>
      </article>
    </div>

    <PagesCabinetObjectsAgreementFormModal
      v-model="formModalOpen"
      :object-id="objectId"
      :agreement="selectedAgreement"
      @saved="handleSaved"
    />

    <PagesCabinetObjectsAgreementAcceptModal
      v-model="acceptModalOpen"
      :agreement="selectedAgreement"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { usePermissions } from '~/composables/usePermissions'
import type { PageSlug } from 'shared/constants/permissions'

interface WorkAgreement {
  id: number
  objectId: number
  title: string
  workType: string
  volume: number
  unit: string
  unitCustom?: string | null
  priceMode: 'unit' | 'fixed'
  unitPrice?: string | number | null
  fixedTotal?: string | number | null
  agreedAmount: number
  acceptedVolume: number
  acceptedAmount: number
  remainingVolume: number
  remainingAmount: number
  percent: number
  isFullyAccepted: boolean
  contractorType?: 'master' | 'worker' | null
  contractorId?: number | null
  contractorName?: string | null
  publicComment?: string | null
  adminComment?: string | null
  status: 'active' | 'cancelled'
  createdAt: string
  updatedAt: string
}

const props = defineProps<{
  objectId: number
}>()

const emit = defineEmits<{
  changed: []
}>()

const api = useApi()

const { can, hasRole, isReady } = usePermissions()

const PERMISSION_PAGE: PageSlug = 'objects'

const agreements = ref<WorkAgreement[]>([])
const loading = ref(false)

const formModalOpen = ref(false)
const acceptModalOpen = ref(false)
const selectedAgreement = ref<WorkAgreement | null>(null)

const canCreate = computed(() => can(PERMISSION_PAGE, 'create'))
const canEdit = computed(() => can(PERMISSION_PAGE, 'edit'))
const canDelete = computed(() => can(PERMISSION_PAGE, 'delete'))
const canAccept = computed(() => can(PERMISSION_PAGE, 'special'))

const isAdmin = computed(() => hasRole('admin'))

async function loadAgreements() {
  loading.value = true

  try {
    agreements.value = await api.get<WorkAgreement[]>(
      '/api/works/agreements',
      {
        params: {
          objectId: props.objectId
        }
      }
    )
  } catch (error) {
    console.error('[Договорённости] Ошибка загрузки списка:', error)
  } finally {
    loading.value = false
  }
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('ru-RU').format(Number(value || 0)) + ' ₽'
}

function unitLabel(agreement: WorkAgreement) {
  if (agreement.unit === 'custom') {
    return agreement.unitCustom || 'ед.'
  }

  const labels: Record<string, string> = {
    m2: 'м²',
    m3: 'м³',
    m: 'м',
    pcs: 'шт',
    hour: 'ч',
    shift: 'смена',
    service: 'услуга'
  }

  return labels[agreement.unit] || agreement.unit
}

function contractorLabel(agreement: WorkAgreement) {
  if (agreement.contractorName) {
    return agreement.contractorName
  }

  if (agreement.contractorType === 'master') {
    return 'Мастер'
  }

  if (agreement.contractorType === 'worker') {
    return 'Рабочий'
  }

  return 'Исполнитель не назначен'
}

function openCreateModal() {
  selectedAgreement.value = null
  formModalOpen.value = true
}

function openEditModal(agreement: WorkAgreement) {
  selectedAgreement.value = agreement
  formModalOpen.value = true
}

function openAcceptModal(agreement: WorkAgreement) {
  selectedAgreement.value = agreement
  acceptModalOpen.value = true
}

async function removeAgreement(agreement: WorkAgreement) {
  const confirmed = window.confirm(
    'Удалить договорённость? Это действие нельзя отменить.'
  )

  if (!confirmed) {
    return
  }

  try {
    await api.delete(`/api/works/agreements/${agreement.id}`)

    await loadAgreements()
    emit('changed')
  } catch (error) {
    console.error('[Договорённости] Ошибка удаления:', error)
  }
}

async function handleSaved() {
  await loadAgreements()
  emit('changed')
}

onMounted(() => {
  loadAgreements()
})
</script>

<style lang="scss" scoped>
.agreements {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__title {
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__empty {
    padding: 24px;
    text-align: center;
    color: var(--crm-text-muted);
    border: 1px dashed var(--crm-border);
    border-radius: var(--crm-radius-lg);
    background: var(--crm-bg-surface);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.agreement-card {
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  background: var(--crm-bg-surface);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &--done {
    opacity: 0.65;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__title {
    margin: 0;
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__meta {
    margin-top: 2px;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__amount {
    font-size: var(--crm-text-md);
    font-weight: 700;
    color: var(--crm-text-primary);
    white-space: nowrap;
  }

  &__volume {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
  }

  &__comment {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    white-space: pre-wrap;
    word-break: break-word;

    &--admin {
      color: var(--crm-warning);
    }
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__progress-text {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.progress {
  height: 8px;
  border-radius: 99px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  overflow: hidden;

  &__fill {
    height: 100%;
    background: var(--crm-accent);
    transition: width 0.2s ease;
  }
}

.crm-btn--danger {
  background: var(--crm-danger-dim);
  border: 1px solid rgba(242, 95, 92, 0.3);
  color: var(--crm-danger);

  &:hover {
    background: var(--crm-danger);
    color: white;
  }
}
</style>