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
          <template v-if="pendingAgreements.length > 0">
            <span class="summary-card__divider">·</span>
            <span>
              Ожидает решения:
              <strong class="text-warn">
                {{ pendingAgreements.length }} ({{ formatCurrency(pendingTotalAmount) }})
              </strong>
            </span>
          </template>
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

    <!-- Секции (аккордеон) -->
    <div v-else class="agreements__sections">
      <section
        v-for="section in agreementSections"
        :key="section.key"
        class="agreement-section"
      >
        <div
          class="agreement-section__header"
          @click="toggleSection(section.key)"
        >
          <div class="agreement-section__title">
            <span
              class="agreement-section__dot"
              :style="{ background: section.color }"
            ></span>
            <span class="agreement-section__name">{{ section.title }}</span>
            <span class="agreement-section__count">{{ section.items.length }}</span>
          </div>
          <Icon
            name="mdi:chevron-down"
            size="20"
            :class="['agreement-section__chevron', { 'rotated': !isSectionOpen(section.key) }]"
          />
        </div>

        <div v-show="isSectionOpen(section.key)" class="agreement-section__body">
          <div class="agreements__list">
            <article
              v-for="agreement in section.items"
              :key="agreement.id"
              :class="[
                'agreement-card',
                `agreement-card--${section.key}`,
                {
                  'agreement-card--muted':
                    agreement.status === 'cancelled' ||
                    agreement.status === 'rejected' ||
                    (agreement.status === 'active' && agreement.isFullyAccepted)
                }
              ]"
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
                  <template v-if="agreement.unitPriceOnly">
                    {{ unitPrice(agreement) }}/{{ unitLabel(agreement) }}
                  </template>
                  <template v-else>
                    {{ formatCurrency(agreement.agreedAmount) }}
                  </template>
                </div>
              </div>

              <!-- Бейджи -->
              <div
                v-if="
                  agreement.unitPriceOnly ||
                  agreement.status === 'pending_review' ||
                  agreement.status === 'rejected' ||
                  agreement.parentTitle
                "
                class="agreement-card__badges"
              >
                <span v-if="agreement.unitPriceOnly" class="badge badge--price">
                  Цена за 1 ед. · объём укажет исполнитель
                </span>

                <span v-if="agreement.status === 'pending_review'" class="badge badge--pending">
                  Ожидает решения объёма
                </span>

                <span
                  v-if="agreement.parentTitle && agreement.status !== 'active'"
                  class="badge badge--parent"
                >
                  Заявка по «{{ agreement.parentTitle }}»
                </span>

                <span v-if="agreement.status === 'rejected'" class="badge badge--rejected">
                  Отклонено
                </span>
              </div>

              <!-- Объём и цена (для обычных карточек) -->
              <div v-if="!agreement.unitPriceOnly" class="agreement-card__volume">
                <template v-if="unitPrice(agreement)">
                  Цена: {{ unitPrice(agreement) }}/{{ unitLabel(agreement) }}
                </template>
              </div>

              <!-- Для прайс-карточек (unitPriceOnly) -->
              <div v-else class="agreement-card__volume agreement-card__volume--price">
                Цена: {{ unitPrice(agreement) }}/{{ unitLabel(agreement) }}
              </div>

              <div
                v-if="agreement.status === 'rejected' && agreement.rejectionReason"
                class="agreement-card__comment agreement-card__comment--admin"
              >
                Причина отклонения: {{ agreement.rejectionReason }}
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

              <div
                v-if="!agreement.unitPriceOnly && agreement.status !== 'pending_review'"
                class="agreement-card__progress"
              >
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
                <template v-if="agreement.status === 'pending_review'">
                  <button
                    v-if="canAccept"
                    :disabled="!isReady"
                    class="crm-btn crm-btn--primary crm-btn--sm"
                    @click="openConfirmModal(agreement)"
                  >
                    Подтвердить объём
                  </button>

                  <button
                    v-if="canAccept"
                    :disabled="!isReady"
                    class="crm-btn crm-btn--danger crm-btn--sm"
                    @click="openRejectModal(agreement)"
                  >
                    Отклонить
                  </button>
                </template>

                <template v-else>
                  <button
                    v-if="canEdit"
                    :disabled="!isReady"
                    class="crm-btn crm-btn--ghost crm-btn--sm"
                    @click="openEditModal(agreement)"
                  >
                    Редактировать
                  </button>

                  <button
                    v-if="canAccept && agreement.status === 'active' && !agreement.unitPriceOnly && !agreement.isFullyAccepted"
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
                </template>
              </div>
            </article>
          </div>
        </div>
      </section>
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
      :mode="acceptModalMode"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import { usePermissions } from '~/composables/usePermissions'
import type { PageSlug } from 'shared/constants/permissions'

interface WorkAgreement {
  id: number
  objectId: number
  title: string
  workType: string
  volume: number | null
  unit: string
  unitCustom?: string | null
  priceMode: 'unit' | 'fixed'
  unitPriceOnly: boolean
  unitPrice?: string | number | null
  fixedTotal?: string | number | null
  agreedAmount: number
  acceptedVolume: number
  acceptedAmount: number
  remainingVolume: number | null
  remainingAmount: number
  percent: number
  isFullyAccepted: boolean
  contractorType?: 'master' | 'worker' | null
  contractorId?: number | null
  contractorName?: string | null
  publicComment?: string | null
  adminComment?: string | null
  status: 'active' | 'pending_review' | 'rejected' | 'cancelled'
  rejectionReason?: string | null
  parentAgreementId?: number | null
  parentTitle?: string | null
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

interface AgreementSection {
  key: string
  title: string
  items: WorkAgreement[]
  color: string
  defaultOpen: boolean
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

const acceptModalMode = ref<'accept' | 'confirm-proposal' | 'reject-proposal'>('accept')

const canCreate = computed(() => can(PERMISSION_PAGE, 'create'))
const canEdit = computed(() => can(PERMISSION_PAGE, 'edit'))
const canDelete = computed(() => can(PERMISSION_PAGE, 'delete'))
const canAccept = computed(() => can(PERMISSION_PAGE, 'special'))

const isAdmin = computed(() => hasRole('admin'))

// ── Состояние аккордеона ───────────────────────────────────────
const openSections = ref<Record<string, boolean>>({})

function toggleSection(key: string) {
  openSections.value[key] = !openSections.value[key]
}

function isSectionOpen(key: string): boolean {
  return openSections.value[key] ?? false
}

// ── Фильтры по категориям ─────────────────────────────────────
// Учитываются в сводке: только активные договорённости
const countedAgreements = computed(() =>
  agreements.value.filter(a => a.status === 'active')
)

// 1. Расценки (Прайс): только цена за единицу, активные
const priceAgreements = computed(() =>
  agreements.value.filter(a => a.unitPriceOnly && a.status === 'active')
)

// 2. В работе: активные, с объёмом, ещё не полностью приняты
const inWorkAgreements = computed(() =>
  agreements.value.filter(a =>
    a.status === 'active' &&
    !a.unitPriceOnly &&
    !a.isFullyAccepted
  )
)

// 3. Ожидают решения: заявки от исполнителей
const pendingAgreements = computed(() =>
  agreements.value.filter(a => a.status === 'pending_review')
)

// 4. Принятые: активные, полностью закрытые
const acceptedAgreements = computed(() =>
  agreements.value.filter(a =>
    a.status === 'active' &&
    !a.unitPriceOnly &&
    a.isFullyAccepted
  )
)

// 5. Отклонённые/Отменённые
const rejectedAgreements = computed(() =>
  agreements.value.filter(a =>
    a.status === 'rejected' || a.status === 'cancelled'
  )
)

// Формирование списка секций для аккордеона
const agreementSections = computed<AgreementSection[]>(() => [
  {
    key: 'prices',
    title: 'Расценки',
    items: priceAgreements.value,
    color: 'var(--color-primary)', // синий
    defaultOpen: true
  },
  {
    key: 'in-work',
    title: 'В работе',
    items: inWorkAgreements.value,
    color: 'var(--color-accent)', // жёлтый
    defaultOpen: true
  },
  {
    key: 'pending',
    title: 'Ожидают решения',
    items: pendingAgreements.value,
    color: 'var(--color-warning)', // оранжевый
    defaultOpen: true
  },
  {
    key: 'accepted',
    title: 'Принятые',
    items: acceptedAgreements.value,
    color: 'var(--color-success)', // зелёный
    defaultOpen: false
  },
  {
    key: 'rejected',
    title: 'Отклонённые',
    items: rejectedAgreements.value,
    color: 'var(--color-danger)', // красный
    defaultOpen: false
  }
].filter(s => s.items.length > 0))

// Автоматически раскрываем новые секции при появлении данных
watch(agreementSections, (sections) => {
  for (const section of sections) {
    if (openSections.value[section.key] === undefined) {
      openSections.value[section.key] = section.defaultOpen
    }
  }
}, { immediate: true })

// ── Сводка ─────────────────────────────────────────────────────
const totalAgreedAmount = computed(() =>
  countedAgreements.value.reduce((sum, a) => sum + Number(a.agreedAmount || 0), 0)
)

const totalAcceptedAmount = computed(() =>
  countedAgreements.value.reduce((sum, a) => sum + Number(a.acceptedAmount || 0), 0)
)

const totalRemainingAmount = computed(() =>
  totalAgreedAmount.value - totalAcceptedAmount.value
)

const pendingTotalAmount = computed(() =>
  pendingAgreements.value.reduce((sum, a) => sum + Number(a.agreedAmount || 0), 0)
)

const contractorBreakdown = computed<ContractorBreakdownItem[]>(() => {
  const map = new Map<string, ContractorBreakdownItem>()

  for (const a of countedAgreements.value) {
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

// ── API ────────────────────────────────────────────────────────
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

/**
 * Возвращает отформатированную цену за единицу.
 * Для прайс-карточек берёт unitPrice напрямую.
 * Для обычных — вычисляет из agreedAmount / volume.
 */
function unitPrice(agreement: WorkAgreement) {
  if (agreement.unitPrice != null && Number(agreement.unitPrice) > 0) {
    return formatCurrency(Number(agreement.unitPrice))
  }

  const volume = Number(agreement.volume || 0)
  if (volume <= 0) return null

  return formatCurrency(Number(agreement.agreedAmount || 0) / volume)
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
  acceptModalMode.value = 'accept'
  acceptModalOpen.value = true
}

function openConfirmModal(agreement: WorkAgreement) {
  selectedAgreement.value = agreement
  acceptModalMode.value = 'confirm-proposal'
  acceptModalOpen.value = true
}

function openRejectModal(agreement: WorkAgreement) {
  selectedAgreement.value = agreement
  acceptModalMode.value = 'reject-proposal'
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

  &__sections {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: stretch;
  }
}

// ── Секции (аккордеон) ─────────────────────────────────────────
.agreement-section {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--crm-bg-elevated);
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ease;

    &:hover {
      background: var(--crm-bg-overlay);
    }
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
  }

  &__name {
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__count {
    font-size: var(--crm-text-xs);
    font-weight: 700;
    color: var(--crm-text-muted);
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border);
    padding: 1px 8px;
    border-radius: 10px;
    line-height: 1.4;
  }

  &__chevron {
    color: var(--crm-text-muted);
    transition: transform 0.2s ease;

    &.rotated {
      transform: rotate(-90deg);
    }
  }

  &__body {
    padding: 12px;
    border-top: 1px solid var(--crm-border);
    background: var(--crm-bg-surface);
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
  border-left: 4px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  background: var(--crm-bg-surface);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  /* Адаптивная ширина для flex-wrap */
  flex: 1 1 220px;
  min-width: 300px;
  max-width: 650px;
  height: auto;
  min-height: 220px;

  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  // ── Цветовые модификаторы по категориям ──
  &--prices {
    border-left: 4px solid var(--color-primary);
    background: linear-gradient(
      to right,
      rgba(0, 195, 245, 0.04),
      var(--crm-bg-surface) 60%
    );
  }

  &--in-work {
    border-left-color: var(--color-accent);
    box-shadow: inset 1px 0 0 -1px var(--color-accent);
  }

  &--pending {
    border: 1px dashed var(--color-warning);
    border-left: 4px solid var(--color-warning);
    background: linear-gradient(
      to right,
      rgba(255, 193, 7, 0.05),
      var(--crm-bg-surface) 60%
    );
  }

  &--accepted {
    border-left-color: var(--color-success);
  }

  &--rejected {
    border-left-color: var(--color-danger);
  }

  // ── Модификатор приглушения ──
  &--muted {
    opacity: 0.6;
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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
    line-height: 1.3;
  }

  &__meta {
    margin-top: 2px;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    line-height: 1.3;
  }

  &__amount {
    font-size: var(--crm-text-md);
    font-weight: 700;
    color: var(--crm-text-primary);
    white-space: nowrap;
    flex-shrink: 0;
    text-align: right;
  }

  &__volume {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    line-height: 1.4;

    &--price {
      color: var(--color-primary);
      font-weight: 500;
    }
  }

  &__comment {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.4;

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

.text-warn {
  color: var(--crm-warning) !important;
}

// ── Бейджи карточек ────────────────────────────────────────────
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: var(--crm-text-xs);
  font-weight: 500;
  line-height: 1.3;

  &--price {
    color: var(--color-primary);
    background: rgba(0, 195, 245, 0.1);
    border: 1px solid rgba(0, 195, 245, 0.3);
  }

  &--pending {
    color: var(--color-warning);
    background: rgba(255, 193, 7, 0.1);
    border: 1px solid rgba(255, 193, 7, 0.35);
  }

  &--parent {
    color: var(--crm-text-muted);
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border);
  }

  &--rejected {
    color: var(--color-danger);
    background: rgba(166, 19, 0, 0.1);
    border: 1px solid rgba(166, 19, 0, 0.3);
  }
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