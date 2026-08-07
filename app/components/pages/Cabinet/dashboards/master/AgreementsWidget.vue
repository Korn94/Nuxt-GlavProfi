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

    <!-- Группировка по объектам -->
    <div v-else class="agreements-widget__objects">
      <section
        v-for="group in groupedByObject"
        :key="group.objectId"
        class="object-group"
      >
        <div class="object-group__header">
          <Icon name="mdi:map-marker-outline" size="16" />
          <span>{{ group.objectName }}</span>
          <span class="object-group__count">{{ group.items.length }}</span>
        </div>

        <div class="object-group__list">
          <article
            v-for="agreement in group.items"
            :key="agreement.id"
            class="agreement-card"
            :class="{ 'agreement-card--done': agreement.isFullyAccepted || agreement.status === 'cancelled' }"
          >
            <div class="agreement-card__header">
              <div class="agreement-card__title-block">
                <h4 class="agreement-card__title">{{ agreement.title }}</h4>
                <div class="agreement-card__meta">
                  {{ agreement.workType }}
                  <span v-if="agreement.status === 'cancelled'">· отменена</span>
                </div>
              </div>
              <div class="agreement-card__amount">
                {{ formatCurrency(agreement.agreedAmount) }}
              </div>
            </div>

            <div class="agreement-card__volume">
              Объём: {{ agreement.volume }} {{ unitLabel(agreement) }}
              <span v-if="agreement.remainingVolume > 0" class="agreement-card__remaining">
                · осталось {{ agreement.remainingVolume }} {{ unitLabel(agreement) }}
              </span>
            </div>

            <div v-if="agreement.publicComment" class="agreement-card__comment">
              {{ agreement.publicComment }}
            </div>

            <div class="agreement-card__progress">
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

            <div class="agreement-card__actions">
              <button
                v-if="canSubmit(agreement)"
                :disabled="loading"
                class="crm-btn crm-btn--primary crm-btn--sm"
                @click="openSubmitModal(agreement)"
              >
                Сдать
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- Модалка сдачи объёма -->
    <PagesCabinetObjectsAgreementAcceptModal
      v-model="submitModalOpen"
      :agreement="selectedAgreement"
      mode="submit"
      :fixed-contractor="{ contractorType, contractorId }"
      @saved="handleSaved"
    />
  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'

interface WorkAgreement {
  id: number
  objectId: number
  objectName: string
  title: string
  workType: string
  volume: number
  unit: string
  unitCustom?: string | null
  agreedAmount: number
  acceptedVolume: number
  acceptedAmount: number
  remainingVolume: number
  remainingAmount: number
  percent: number
  isFullyAccepted: boolean
  publicComment?: string | null
  status: 'active' | 'cancelled'
}

interface ObjectGroup {
  objectId: number
  objectName: string
  items: WorkAgreement[]
}

const props = defineProps<{
  contractorId: number
  contractorType: 'master' | 'worker'
}>()

const api = useApi()

const agreements = ref<WorkAgreement[]>([])
const loading = ref(false)

const submitModalOpen = ref(false)
const selectedAgreement = ref<WorkAgreement | null>(null)

// ── Группировка по объектам ───────────────────────────────────────
const groupedByObject = computed<ObjectGroup[]>(() => {
  const map = new Map<number, ObjectGroup>()

  for (const a of agreements.value) {
    let group = map.get(a.objectId)

    if (!group) {
      group = { objectId: a.objectId, objectName: a.objectName || 'Объект', items: [] }
      map.set(a.objectId, group)
    }

    group.items.push(a)
  }

  return Array.from(map.values())
})

// ── Сводка ─────────────────────────────────────────────────────────
const totalAgreed = computed(() =>
  agreements.value.reduce((sum, a) => sum + Number(a.agreedAmount || 0), 0)
)

const totalAccepted = computed(() =>
  agreements.value.reduce((sum, a) => sum + Number(a.acceptedAmount || 0), 0)
)

const totalRemaining = computed(() => totalAgreed.value - totalAccepted.value)

// ── API ────────────────────────────────────────────────────────────
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

// ── Хелперы ────────────────────────────────────────────────────────
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

function canSubmit(agreement: WorkAgreement) {
  return (
    agreement.status === 'active' &&
    !agreement.isFullyAccepted &&
    agreement.remainingVolume > 0
  )
}

function openSubmitModal(agreement: WorkAgreement) {
  selectedAgreement.value = agreement
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
    gap: 18px;
  }
}

// ── Сводка ─────────────────────────────────────────────────────────
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
  }
}

// ── Группа объекта ─────────────────────────────────────────────────
.object-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-secondary);
    padding-bottom: 6px;
    border-bottom: 1px solid var(--crm-border);
  }

  &__count {
    margin-left: auto;
    font-size: var(--crm-text-xs);
    font-weight: 500;
    color: var(--crm-text-muted);
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border);
    border-radius: 999px;
    padding: 1px 8px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

// ── Карточка договорённости ───────────────────────────────────────
.agreement-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  background: var(--crm-bg-elevated);
  transition: var(--crm-transition);

  &--done {
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
    padding-top: 4px;
    border-top: 1px solid var(--crm-border);
    margin-top: 4px;
  }
}

// ── Прогресс ───────────────────────────────────────────────────────
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

// ── Кнопки ─────────────────────────────────────────────────────────
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
