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

    <!-- Сводка по суммам и контрагентам -->
    <div v-if="!loading && agreements.length > 0" class="agreements__summary">
      <div class="summary-card">
        <div class="summary-card__header">Общая сумма работ</div>
        <div class="summary-card__total">
          {{ formatCurrency(totalAgreedAmount) }}
        </div>
        <div class="summary-card__sub">
          <span>
            Принято: <strong class="text-pos">{{ formatCurrency(totalAcceptedAmount) }}</strong>
          </span>
          <span class="summary-card__divider">·</span>
          <span>
            Осталось: <strong class="text-neg">{{ formatCurrency(totalRemainingAmount) }}</strong>
          </span>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-card__header">Расшифровка по контрагентам</div>

        <div v-if="contractorBreakdown.length === 0" class="summary-card__empty">
          Исполнители не назначены
        </div>

        <div v-else class="contractor-list">
          <div
            v-for="item in contractorBreakdown"
            :key="item.key"
            class="contractor-item"
          >
            <div class="contractor-item__info">
              <span class="contractor-item__name">{{ item.name }}</span>
              <span class="contractor-item__type">{{ item.typeLabel }}</span>
            </div>
            <div class="contractor-item__amounts">
              <span class="contractor-item__agreed">
                {{ formatCurrency(item.agreed) }}
              </span>
              <span class="contractor-item__accepted">
                принято: {{ formatCurrency(item.accepted) }}
              </span>
            </div>
          </div>
        </div>
      </div>
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

interface ContractorBreakdownItem {
  key: string
  name: string
  typeLabel: string
  agreed: number
  accepted: number
  remaining: number
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

// ── Сводка ────────────────────────────────────────────────────────
const totalAgreedAmount = computed(() =>
  agreements.value.reduce((sum, a) => sum + Number(a.agreedAmount || 0), 0)
)

const totalAcceptedAmount = computed(() =>
  agreements.value.reduce((sum, a) => sum + Number(a.acceptedAmount || 0), 0)
)

const totalRemainingAmount = computed(() =>
  totalAgreedAmount.value - totalAcceptedAmount.value
)

const contractorBreakdown = computed<ContractorBreakdownItem[]>(() => {
  const map = new Map<string, ContractorBreakdownItem>()

  for (const a of agreements.value) {
    const contractorType = a.contractorType
    const contractorId = a.contractorId
    const contractorName = a.contractorName

    let key: string
    let name: string
    let typeLabel: string

    if (contractorType && contractorId) {
      key = `${contractorType}-${contractorId}`
      name = contractorName || (contractorType === 'master' ? 'Мастер' : 'Рабочий')
      typeLabel = contractorType === 'master' ? 'Мастер' : 'Рабочий'
    } else {
      key = 'unassigned'
      name = 'Без исполнителя'
      typeLabel = '—'
    }

    const agreed = Number(a.agreedAmount || 0)
    const accepted = Number(a.acceptedAmount || 0)

    if (map.has(key)) {
      const item = map.get(key)!
      item.agreed += agreed
      item.accepted += accepted
      item.remaining += agreed - accepted
    } else {
      map.set(key, {
        key,
        name,
        typeLabel,
        agreed,
        accepted,
        remaining: agreed - accepted
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.agreed - a.agreed)
})

// ── API ───────────────────────────────────────────────────────────
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

  &__summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 900px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }
}

// ── Сводка ─────────────────────────────────────────────────────
.summary-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__header {
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
    text-transform: uppercase;
    letter-spacing: .06em;
  }

  &__total {
    font-size: 24px;
    font-weight: 700;
    color: var(--crm-text-primary);
    line-height: 1;
  }

  &__sub {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    strong {
      font-weight: 600;
    }
  }

  &__divider {
    color: var(--crm-text-disabled);
  }

  &__empty {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
    padding: 8px 0;
  }
}

.contractor-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--crm-bg-elevated);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--crm-border-hover);
    border-radius: 3px;
  }
}

.contractor-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-md);
  border: 1px solid var(--crm-border);

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  &__name {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__type {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__amounts {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex-shrink: 0;
  }

  &__agreed {
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__accepted {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }
}

// ── Карточка договорённости ────────────────────────────────────
.agreement-card {
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  background: var(--crm-bg-surface);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 220px;

  &--done {
    opacity: 0.65;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__title-block {
    min-width: 0;
    flex: 1;
  }

  &__title {
    margin: 0;
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    margin-top: 2px;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__amount {
    font-size: var(--crm-text-md);
    font-weight: 700;
    color: var(--crm-text-primary);
    white-space: nowrap;
    flex-shrink: 0;
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
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;

    &--admin {
      color: var(--crm-warning);
    }
  }

  &__progress {
    margin-top: auto;
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
    padding-top: 4px;
    border-top: 1px solid var(--crm-border);
    margin-top: 4px;
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

// ── Цветовые акценты ──────────────────────────────────────────
.text-pos {
  color: var(--crm-success) !important;
}

.text-neg {
  color: var(--crm-danger) !important;
}

// ── Кнопки ────────────────────────────────────────────────────
.crm-btn--danger {
  background: var(--crm-danger-dim);
  border: 1px solid rgba(242, 95, 92, 0.3);
  color: var(--crm-danger);

  &:hover {
    background: var(--crm-danger);
    color: white;
  }
}

.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--crm-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  white-space: nowrap;

  padding: 8px 14px;
  font-size: var(--crm-text-sm);

  &:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--crm-success-dim);
    border: 1px solid rgba(61, 214, 140, .35);
    color: var(--crm-success);

    &:hover:not(:disabled) {
      background: rgba(61, 214, 140, .25);
    }
  }

  &--ghost {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-primary);
    }
  }
}

@media (max-width: 600px) {
  .agreements__summary {
    grid-template-columns: 1fr;
  }

  .summary-card__total {
    font-size: 20px;
  }
}
</style>