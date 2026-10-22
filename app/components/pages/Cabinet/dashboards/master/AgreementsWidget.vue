<!-- app/components/Pages/Cabinet/dashboards/master/AgreementsWidget.vue -->
<template>
  <div class="agreements-widget">
    <!-- Заголовок -->
    <div class="agreements-widget__header">
      <div class="agreements-widget__title">
        <Icon name="mdi:handshake-outline" size="20" />
        <span>Мои договорённости</span>
      </div>
      <div class="agreements-widget__controls">
        <button
          class="crm-btn crm-btn--sm crm-btn--ghost"
          @click="loadAgreements"
          :disabled="loading"
          title="Обновить"
        >
          <Icon name="mdi:refresh" size="16" :class="{ spin: loading }" />
        </button>
      </div>
    </div>

    <!-- Сводка -->
    <div v-if="!loading && agreements.length > 0" class="agreements-widget__summary">
      <div class="summary-item">
        <span class="summary-item__label">Договорено</span>
        <strong class="summary-item__value">{{ formatCurrency(totalAgreed) }}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-item__label">Сдано</span>
        <strong class="summary-item__value summary-item__value--pos">{{ formatCurrency(totalAccepted) }}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-item__label">Осталось</span>
        <strong class="summary-item__value summary-item__value--neg">{{ formatCurrency(totalRemaining) }}</strong>
      </div>
      <div v-if="totalPending > 0" class="summary-item">
        <span class="summary-item__label">Ожидает приёмки</span>
        <strong class="summary-item__value summary-item__value--pending">{{ formatCurrency(totalPending) }}</strong>
      </div>
      <div v-if="pendingProposals.length > 0" class="summary-item">
        <span class="summary-item__label">Заявки на проверке</span>
        <strong class="summary-item__value summary-item__value--pending">{{ pendingProposals.length }}</strong>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="agreements-widget__empty">
      <Icon name="mdi:loading" size="24" class="spin" />
      <span>Загрузка договорённостей...</span>
    </div>

    <!-- Пусто -->
    <div v-else-if="agreements.length === 0" class="agreements-widget__empty">
      <Icon name="mdi:inbox-outline" size="40" />
      <span>Договорённостей пока нет</span>
    </div>

    <!-- Группировка по объектам (с внутренним аккордеоном по статусам) -->
    <div v-else class="agreements-widget__objects">
      <section
        v-for="group in groupedByObject"
        :key="group.objectId"
        class="object-group"
      >
        <div
          class="object-group__header"
          @click="toggleObject(group.objectId)"
        >
          <div class="object-group__title-row">
            <Icon name="mdi:map-marker-outline" size="16" />
            <span>{{ group.objectName }}</span>
            <span class="object-group__count">{{ group.items.length }}</span>
          </div>
          <Icon
            name="mdi:chevron-down"
            size="20"
            :class="['object-group__chevron', { 'rotated': !isObjectOpen(group.objectId) }]"
          />
        </div>

        <div v-show="isObjectOpen(group.objectId)" class="object-group__body">
          <div
            v-for="section in group.sections"
            :key="section.key"
            class="agreement-section"
          >
            <div
              class="agreement-section__header"
              @click="toggleSection(group.objectId, section.key)"
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
                size="18"
                :class="[
                  'agreement-section__chevron',
                  { 'rotated': !isSectionOpen(group.objectId, section.key) }
                ]"
              />
            </div>

            <div
              v-show="isSectionOpen(group.objectId, section.key)"
              class="agreement-section__body"
            >
              <div class="agreements-widget__list">
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
                      <h4 class="agreement-card__title">{{ agreement.title }}</h4>
                      <div class="agreement-card__meta">
                        {{ agreement.workType }}
                        <span v-if="agreement.status === 'cancelled'">· отменена</span>
                        <span v-else-if="agreement.status === 'rejected'">· отклонена</span>
                        <span v-else-if="agreement.status === 'pending_review'">· на проверке</span>
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
                      agreement.status === 'rejected'
                    "
                    class="agreement-card__badges"
                  >
                    <span v-if="agreement.unitPriceOnly" class="wbadge wbadge--price">
                      Цена за 1 ед.
                    </span>

                    <span v-if="agreement.status === 'pending_review'" class="wbadge wbadge--pending">
                      Ожидает решения руководителя
                    </span>

                    <span
                      v-if="agreement.status === 'pending_review' && agreement.parentTitle"
                      class="wbadge wbadge--parent"
                    >
                      по «{{ agreement.parentTitle }}»
                    </span>
                  </div>

                  <!-- Объём и цена (для прайса объём не показываем) -->
                  <div v-if="!agreement.unitPriceOnly" class="agreement-card__volume">
                    Объём: {{ agreement.volume }} {{ unitLabel(agreement) }}
                    <template v-if="unitPrice(agreement) !== null && !agreement.unitPriceOnly">
                      · Цена: {{ unitPrice(agreement) }}/{{ unitLabel(agreement) }}
                    </template>
                    <span
                      v-if="Number(agreement.remainingVolume || 0) > 0"
                      class="agreement-card__remaining"
                    >
                      · осталось {{ agreement.remainingVolume }} {{ unitLabel(agreement) }}
                    </span>
                  </div>

                  <div v-else class="agreement-card__volume">
                    Цена: {{ unitPrice(agreement) }}/{{ unitLabel(agreement) }}
                    · можно подать объем
                  </div>

                  <!-- Комментарий заявки / причина отклонения -->
                  <div
                    v-if="agreement.status === 'rejected' && agreement.rejectionReason"
                    class="agreement-card__comment agreement-card__comment--reject"
                  >
                    Причина отклонения: {{ agreement.rejectionReason }}
                  </div>

                  <div v-if="agreement.publicComment" class="agreement-card__comment">
                    {{ agreement.publicComment }}
                  </div>

                  <!-- Прогресс только для карточек с согласованным объёмом -->
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
                      Сдано {{ agreement.acceptedVolume }} / {{ agreement.volume }}
                      {{ unitLabel(agreement) }} · {{ agreement.percent }}%
                    </div>
                  </div>

                  <div
                    v-if="agreement.pendingCount > 0"
                    class="agreement-card__pending"
                  >
                    <Icon name="mdi:clock-outline" size="15" />
                    <span>
                      Ожидает приёмки:
                      {{ agreement.pendingVolume }} {{ unitLabel(agreement) }}
                      <template v-if="agreement.pendingAmount > 0">
                        · {{ formatCurrency(agreement.pendingAmount) }}
                      </template>
                    </span>
                  </div>

                  <div class="agreement-card__actions">
                    <button
                      v-if="canSubmit(agreement)"
                      :disabled="loading"
                      class="crm-btn crm-btn--primary crm-btn--sm"
                      @click="openSubmitModal(agreement)"
                    >
                      Сдать
                    </button>

                    <button
                      v-if="canPropose(agreement)"
                      :disabled="loading"
                      class="crm-btn crm-btn--primary crm-btn--sm"
                      @click="openProposeModal(agreement)"
                    >
                      Предложить объём
                    </button>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Модалка сдачи/предложения объёма -->
    <PagesCabinetObjectsAgreementAcceptModal
      v-model="submitModalOpen"
      :agreement="selectedAgreement"
      :mode="modalMode"
      :fixed-contractor="{ contractorType, contractorId }"
      @saved="handleSaved"
    />
  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useApi } from '~/composables/useApi'

interface WorkAgreement {
  id: number
  objectId: number
  objectName: string
  title: string
  workType: string
  volume: number | null
  unit: string
  unitCustom?: string | null
  priceMode?: 'unit' | 'fixed'
  unitPriceOnly: boolean
  unitPrice?: string | number | null
  agreedAmount: number
  acceptedVolume: number
  acceptedAmount: number
  remainingVolume: number | null
  remainingAmount: number
  percent: number
  isFullyAccepted: boolean
  publicComment?: string | null
  status: 'active' | 'pending_review' | 'rejected' | 'cancelled'
  rejectionReason?: string | null
  parentAgreementId?: number | null
  parentTitle?: string | null
  pendingVolume: number
  pendingAmount: number
  pendingCount: number
}

interface AgreementSection {
  key: string
  title: string
  items: WorkAgreement[]
  color: string
  defaultOpen: boolean
}

interface ObjectGroup {
  objectId: number
  objectName: string
  items: WorkAgreement[]
  sections: AgreementSection[]
}

const props = defineProps<{
  contractorId: number
  contractorType: 'master' | 'worker'
}>()

const api = useApi()

const agreements = ref<WorkAgreement[]>([])
const loading = ref(false)

const submitModalOpen = ref(false)
const modalMode = ref<'submit' | 'propose'>('submit')
const selectedAgreement = ref<WorkAgreement | null>(null)

// ── Состояние аккордеонов ─────────────────────────────────────
const openObjects = ref<Record<number, boolean>>({})
const openSections = ref<Record<string, boolean>>({})

function makeSectionKey(objectId: number, sectionKey: string): string {
  return `${objectId}:${sectionKey}`
}

function toggleObject(objectId: number) {
  openObjects.value[objectId] = !(openObjects.value[objectId] ?? true)
}

function isObjectOpen(objectId: number): boolean {
  return openObjects.value[objectId] ?? true
}

function toggleSection(objectId: number, sectionKey: string) {
  const key = makeSectionKey(objectId, sectionKey)
  openSections.value[key] = !(openSections.value[key] ?? getDefaultOpen(sectionKey))
}

function isSectionOpen(objectId: number, sectionKey: string): boolean {
  const key = makeSectionKey(objectId, sectionKey)
  return openSections.value[key] ?? getDefaultOpen(sectionKey)
}

function getDefaultOpen(sectionKey: string): boolean {
  return ['prices', 'in-work', 'pending'].includes(sectionKey)
}

// ── Построение секций по статусам ─────────────────────────────
function buildSections(items: WorkAgreement[]): AgreementSection[] {
  const prices = items.filter(a => a.unitPriceOnly && a.status === 'active')
  const inWork = items.filter(a =>
    a.status === 'active' &&
    !a.unitPriceOnly &&
    !a.isFullyAccepted
  )
  const pending = items.filter(a => a.status === 'pending_review')
  const accepted = items.filter(a =>
    a.status === 'active' &&
    !a.unitPriceOnly &&
    a.isFullyAccepted
  )
  const rejected = items.filter(a =>
    a.status === 'rejected' || a.status === 'cancelled'
  )

  return [
    {
      key: 'prices',
      title: 'Расценки',
      items: prices,
      color: 'var(--color-primary)',
      defaultOpen: true
    },
    {
      key: 'in-work',
      title: 'В работе',
      items: inWork,
      color: 'var(--color-accent)',
      defaultOpen: true
    },
    {
      key: 'pending',
      title: 'Ожидают решения',
      items: pending,
      color: 'var(--color-warning)',
      defaultOpen: true
    },
    {
      key: 'accepted',
      title: 'Принятые',
      items: accepted,
      color: 'var(--color-success)',
      defaultOpen: false
    },
    {
      key: 'rejected',
      title: 'Отклонённые',
      items: rejected,
      color: 'var(--color-danger)',
      defaultOpen: false
    }
  ].filter(s => s.items.length > 0)
}

// ── Группировка по объектам + секции внутри ───────────────────
const groupedByObject = computed<ObjectGroup[]>(() => {
  const map = new Map<number, WorkAgreement[]>()

  for (const a of agreements.value) {
    const list = map.get(a.objectId) || []
    list.push(a)
    map.set(a.objectId, list)
  }

  return Array.from(map.entries()).map(([objectId, items]) => ({
    objectId,
    objectName: items[0]?.objectName || 'Объект',
    items,
    sections: buildSections(items)
  }))
})

// Автоматически инициализируем состояние секций при появлении данных
watch(groupedByObject, (groups) => {
  for (const group of groups) {
    for (const section of group.sections) {
      const key = makeSectionKey(group.objectId, section.key)
      if (openSections.value[key] === undefined) {
        openSections.value[key] = section.defaultOpen
      }
    }
  }
}, { immediate: true })

// ── Сводка ─────────────────────────────────────────────────────
const activeAgreements = computed(() =>
  agreements.value.filter(a => a.status === 'active')
)

const totalAgreed = computed(() =>
  activeAgreements.value.reduce((sum, a) => sum + Number(a.agreedAmount || 0), 0)
)

const totalAccepted = computed(() =>
  activeAgreements.value.reduce((sum, a) => sum + Number(a.acceptedAmount || 0), 0)
)

const totalRemaining = computed(() => totalAgreed.value - totalAccepted.value)

const totalPending = computed(() =>
  agreements.value.reduce((sum, a) => sum + Number(a.pendingAmount || 0), 0)
)

const pendingProposals = computed(() =>
  agreements.value.filter(a => a.status === 'pending_review')
)

// ── API ────────────────────────────────────────────────────────
async function loadAgreements() {
  loading.value = true

  try {
    const response = await api.get<{ agreements: WorkAgreement[] }>(
      '/api/works/agreements/mine'
    )
    agreements.value = response?.agreements || []
  } catch (error) {
    console.error('[Договорённости] Ошибка загрузки своих договорённостей:', error)
  } finally {
    loading.value = false
  }
}

// ── Хелперы ────────────────────────────────────────────────────
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

function unitPrice(agreement: WorkAgreement) {
  if (agreement.unitPrice != null && Number(agreement.unitPrice) > 0) {
    return formatCurrency(Number(agreement.unitPrice))
  }

  const volume = Number(agreement.volume || 0)
  if (volume <= 0) return null
  return formatCurrency(Number(agreement.agreedAmount || 0) / volume)
}

function canSubmit(agreement: WorkAgreement) {
  return (
    agreement.status === 'active' &&
    !agreement.unitPriceOnly &&
    !agreement.isFullyAccepted &&
    Number(agreement.remainingVolume || 0) > 0
  )
}

function canPropose(agreement: WorkAgreement) {
  if (!agreement.unitPriceOnly || agreement.status !== 'active') {
    return false
  }

  return !agreements.value.some(
    a =>
      a.parentAgreementId === agreement.id &&
      a.status === 'pending_review'
  )
}

function openSubmitModal(agreement: WorkAgreement) {
  selectedAgreement.value = agreement
  modalMode.value = 'submit'
  submitModalOpen.value = true
}

function openProposeModal(agreement: WorkAgreement) {
  selectedAgreement.value = agreement
  modalMode.value = 'propose'
  submitModalOpen.value = true
}

async function handleSaved() {
  await loadAgreements()
}

onMounted(() => {
  loadAgreements()
})
</script>

<style lang="scss" scoped>
.agreements-widget {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 20px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: var(--crm-text-lg);
    font-weight: 700;
    color: var(--crm-text-primary);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__summary {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    padding: 12px 14px;
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-md);
    background: var(--crm-bg-elevated);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 40px 16px;
    color: var(--crm-text-muted);
    font-size: var(--crm-text-sm);
    text-align: center;
  }

  &__objects {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

// ── Сводка ─────────────────────────────────────────────────────
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__value {
    font-size: var(--crm-text-md);
    font-weight: 700;
    font-family: var(--crm-font-mono);
    color: var(--crm-text-primary);

    &--pos {
      color: var(--crm-success);
    }

    &--neg {
      color: var(--crm-danger);
    }

    &--pending {
      color: var(--crm-warning);
    }
  }
}

// ── Группа объекта (верхний уровень аккордеона) ───────────────
.object-group {
  display: flex;
  flex-direction: column;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 16px;
    cursor: pointer;
    user-select: none;
    background: var(--crm-bg-elevated);
    transition: background 0.15s ease;

    &:hover {
      background: var(--crm-bg-overlay);
    }
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-warning);
    min-width: 0;
    flex: 1;

    span:nth-child(2) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__count {
    font-size: var(--crm-text-xs);
    font-weight: 700;
    color: var(--crm-text-muted);
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border);
    border-radius: 999px;
    padding: 1px 8px;
    flex-shrink: 0;
  }

  &__chevron {
    color: var(--crm-text-muted);
    transition: transform 0.2s ease;
    flex-shrink: 0;

    &.rotated {
      transform: rotate(-90deg);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-top: 1px solid var(--crm-border);
    background: var(--crm-bg-surface);
  }
}

// ── Секции статусов (вложенный аккордеон) ─────────────────────
.agreement-section {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
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
    gap: 8px;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
  }

  &__name {
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__count {
    font-size: var(--crm-text-xs);
    font-weight: 700;
    color: var(--crm-text-muted);
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border);
    padding: 1px 7px;
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
    padding: 10px;
    border-top: 1px solid var(--crm-border);
    background: var(--crm-bg-surface);
  }
}

// ── Карточка договорённости ────────────────────────────────────
.agreement-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--crm-border);
  border-left: 4px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  background: var(--crm-bg-elevated);
  transition: var(--crm-transition);

  // ── Цветовые модификаторы по категориям ──
  &--prices {
    border-left: 4px solid var(--color-primary);
    background: linear-gradient(
      to right,
      rgba(0, 195, 245, 0.04),
      var(--crm-bg-elevated) 60%
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
      var(--crm-bg-elevated) 60%
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
    opacity: 0.65;

    .agreement-card__title {
      text-decoration: line-through;
    }
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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
    flex-shrink: 0;
  }

  &__volume {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
  }

  &__remaining {
    color: var(--crm-warning);
  }

  &__comment {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    white-space: pre-wrap;
    word-break: break-word;

    &--reject {
      color: var(--crm-danger);
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

  &__pending {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    padding: 5px 10px;
    font-size: var(--crm-text-xs);
    font-weight: 500;
    color: var(--crm-warning);
    background: var(--crm-bg-elevated);
    border: 1px solid rgba(240, 173, 78, 0.35);
    border-radius: var(--crm-radius-md);
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

// ── Бейджи карточек ───────────────────────────────────────────
.wbadge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: var(--crm-text-xs);
  font-weight: 500;
  line-height: 1.3;

  &--price {
    color: var(--crm-accent);
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
  }

  &--pending {
    color: var(--crm-warning);
    background: var(--crm-bg-elevated);
    border: 1px solid rgba(240, 173, 78, 0.35);
  }

  &--parent {
    color: var(--crm-text-muted);
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border);
  }
}

// ── Прогресс ──────────────────────────────────────────────────
.progress {
  height: 8px;
  border-radius: 99px;
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border);
  overflow: hidden;

  &__fill {
    height: 100%;
    background: var(--crm-accent);
    transition: width 0.2s ease;
  }
}

// ── Кнопки ────────────────────────────────────────────────────
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
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--crm-success-dim);
    border: 1px solid rgba(61, 214, 140, 0.35);
    color: var(--crm-success);

    &:hover:not(:disabled) {
      background: rgba(61, 214, 140, 0.25);
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

  &--sm {
    padding: 6px 12px;
    font-size: var(--crm-text-sm);
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .agreements-widget__summary {
    flex-direction: column;
    gap: 12px;
  }
}
</style>