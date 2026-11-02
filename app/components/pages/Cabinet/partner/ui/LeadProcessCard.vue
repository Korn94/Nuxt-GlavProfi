<!-- app/components/pages/Cabinet/partner/ui/LeadProcessCard.vue -->
 <template>
  <div :class="['lp-dash', { 'lp-dash--terminal': isTerminalStatus }]">
    <!-- Шапка в стиле терминала -->
    <div class="lp-dash__top">
      <!-- Точка-индикатор: цвет = состояние сделки, пульсация = «ждёт действия» -->
      <div
        :class="['lp-dash__dot', `lp-dash__dot--${stageTone}`, { 'lp-dash__dot--pulse': isStagePulsing }]"
        role="img"
        :aria-label="stageHint"
        :title="stageHint"
      />
      <div class="lp-dash__url">{{ lead.leadNumber }}</div>
      <div v-if="showActions" class="lp-dash__actions" @click.stop>
        <button class="lp-action-btn" title="Редактировать" @click="$emit('edit', lead)">
          <Icon name="mdi:pencil" size="14" />
        </button>
        <button class="lp-action-btn lp-action-btn--danger" title="Удалить" @click="$emit('delete', lead)">
          <Icon name="mdi:delete" size="14" />
        </button>
      </div>
    </div>

    <!-- Тело карточки -->
    <div class="lp-dash__body">
      <!-- Инфо о лиде -->
      <div class="lp-dash__lead">
        <div>
          <div class="lp-dash__lead-id">
            ЛИД {{ lead.leadNumber }}
            <span v-if="lead.createdAt"> · {{ formatDate(lead.createdAt) }}</span>
          </div>
          <div class="lp-dash__lead-title">{{ lead.clientName }}</div>
          <div class="lp-dash__lead-client">
            <template v-if="lead.objectAddress">
              Объект: {{ lead.objectAddress }}
              <template v-if="lead.objectArea"> · {{ lead.objectArea }} м²</template>
            </template>
            <template v-else>
              {{ lead.description || 'Адрес не указан' }}
            </template>
          </div>
          <div v-if="lead.clientPhone" class="lp-dash__lead-phone">
            <Icon name="mdi:phone" size="12" />
            <a :href="`tel:${lead.clientPhone}`">{{ lead.clientPhone }}</a>
          </div>
        </div>
        <div class="lp-dash__amount">
          <small>{{ isTerminalStatus ? 'СДЕЛКА' : 'ВОЗНАГРАЖДЕНИЕ' }}</small>
          {{ formatMoney(displayReward) }}
        </div>
      </div>

      <!-- Терминальный статус (rejected / cancelled) -->
      <div v-if="isTerminalStatus" class="lp-dash__terminal">
        <div class="lp-dash__terminal-icon">
          <Icon name="mdi:close-circle-outline" size="32" />
        </div>
        <div class="lp-dash__terminal-text">
          <b>{{ statusLabel }}</b>
          <span>Сделка не состоялась</span>
        </div>
      </div>

      <!-- Прогресс-бар шагов -->
      <div v-else class="lp-dash__steps">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          :class="['lp-dash__step', stepClass(index)]"
        >
          <div class="lp-dash__step-bar" />
          <div class="lp-dash__step-label">{{ step.label }}</div>
        </div>
      </div>

      <!-- Футер с деталями -->
      <div class="lp-dash__footer">
        <div class="lp-dash__footer-item">
          Статус<b>{{ statusLabel }}</b>
        </div>
        <div v-if="lead.contractAmount" class="lp-dash__footer-item">
          Сумма договора<b>{{ formatMoney(lead.contractAmount) }}</b>
        </div>
        <div v-if="rewardCategory" class="lp-dash__footer-item">
          Категория<b>{{ rewardCategory.name }} · {{ rewardCategory.range }}</b>
        </div>
        <div class="lp-dash__footer-item">
          Вознаграждение<b>{{ formatMoney(displayReward) }}</b>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  PARTNER_LEAD_STATUS_LABELS,
  getPartnerReward,
  getPartnerRewardCategory,
  type PartnerLeadStatus,
} from 'shared/constants/partners'
import type { PartnerLead } from '~/types/partners'

interface Props {
  lead: PartnerLead
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false,
})

defineEmits<{
  edit: [lead: PartnerLead]
  delete: [lead: PartnerLead]
}>()

const steps = [
  { key: 'new', label: 'Лид зарегистрирован' },
  { key: 'contacted', label: 'Связались с клиентом' },
  { key: 'visit', label: 'Выезд на объект' },
  { key: 'contract', label: 'Договор подписан' },
  { key: 'payment', label: 'Первый платёж получен' },
  { key: 'reward', label: 'Вознаграждение выплачено' },
]

const terminalStatuses: PartnerLeadStatus[] = ['rejected', 'cancelled']

const isTerminalStatus = computed(() =>
  terminalStatuses.includes(props.lead.status)
)

// Маппинг статусов на индекс активного шага
const currentIndex = computed<number>(() => {
  if (isTerminalStatus.value) return -1
  switch (props.lead.status) {
    case 'new': return 0
    case 'contacted': return 1
    case 'visit_scheduled':
    case 'visit_done': return 2
    case 'contract_signed': return 3
    case 'first_payment': return 4
    case 'reward_paid': return 5
    default: return -1
  }
})

const statusLabel = computed(() =>
  PARTNER_LEAD_STATUS_LABELS[props.lead.status] || props.lead.status
)

// ── Индикатор состояния в шапке ──────────────────────────────────────
// Цвет кодирует состояние сделки, пульсация — «процесс ждёт/движется сейчас».
type StageTone = 'attention' | 'progress' | 'success' | 'failed'

const STAGE_TONES: Record<PartnerLeadStatus, StageTone> = {
  new: 'attention',          // ещё не взяли в работу — требует внимания
  contacted: 'progress',     // в работе
  visit_scheduled: 'progress',
  visit_done: 'progress',
  contract_signed: 'success', // сделка состоялась
  first_payment: 'success',
  reward_paid: 'success',    // закрыто окончательно
  rejected: 'failed',
  cancelled: 'failed',
}

// Статусы, где что-то активно ожидается — точка пульсирует
const PULSING_STATUSES: PartnerLeadStatus[] = ['new', 'first_payment']

const stageTone = computed<StageTone>(() => STAGE_TONES[props.lead.status] ?? 'progress')

const isStagePulsing = computed(() => PULSING_STATUSES.includes(props.lead.status))

const stageHint = computed(() => `Этап: ${statusLabel.value}`)

// Рассчитываем вознаграждение по сетке, если в БД оно пустое
const calculatedReward = computed(() => {
  if (!props.lead.contractAmount) return 0
  const num = Number(props.lead.contractAmount)
  if (!Number.isFinite(num)) return 0
  return getPartnerReward(num)
})

const displayReward = computed(() => {
  const fromDb = Number(props.lead.rewardAmount || 0)
  return fromDb > 0 ? fromDb : calculatedReward.value
})

const rewardCategory = computed(() => {
  if (!props.lead.contractAmount) return null
  const num = Number(props.lead.contractAmount)
  if (!Number.isFinite(num)) return null
  return getPartnerRewardCategory(num)
})

function stepClass(index: number): string {
  if (isTerminalStatus.value) return 'lp-dash__step--disabled'
  if (props.lead.status === 'reward_paid') return 'lp-dash__step--done'
  if (index < currentIndex.value) return 'lp-dash__step--done'
  if (index === currentIndex.value) return 'lp-dash__step--current'
  return ''
}

function formatMoney(value: string | number | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : value || 0
  if (Number.isNaN(num)) return '0 ₽'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(num) + ' ₽'
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<style lang="scss" scoped>
$accent: #4dd6ff;
$ink: #0f1114;
$surface: #1a1c1e;
$surface-2: #23262a;
$border: #2a2f33;
$text-muted: #7a8085;
$text-dim: #9aa0a4;
$warning: #febc2e;
$success: #28c840;
$danger: #ff5f57;

.lp-dash {
  background: $surface;
  border-radius: 18px;
  padding: 16px;
  position: relative;
  overflow: hidden;
  border: 1px solid $border;
  transition: border-color 0.2s ease;

  &:hover { border-color: rgba($accent, 0.4); }

  &--terminal {
    opacity: 0.75;
    .lp-dash__body { background: #15171a; }
    .lp-dash__amount { color: $text-muted; }
  }
}

.lp-dash__top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.lp-dash__dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  flex-shrink: 0;
  background: $text-muted;
  transition: background-color 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease;

  // Ждёт действия: сделка ещё не в работе
  &--attention {
    background: $warning;
    box-shadow: 0 0 0 3px rgba($warning, 0.12), 0 0 8px rgba($warning, 0.55);
  }

  // Идёт по плану
  &--progress {
    background: $warning;
    opacity: 0.55;
  }

  // Сделка есть / деньги
  &--success {
    background: $success;
    box-shadow: 0 0 0 3px rgba($success, 0.12), 0 0 8px rgba($success, 0.5);
  }

  // Провал
  &--failed {
    background: $danger;
    opacity: 0.5;
  }

  &--pulse {
    animation: lp-dash-pulse 2s ease-in-out infinite;
  }
}

@keyframes lp-dash-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@media (prefers-reduced-motion: reduce) {
  .lp-dash__dot--pulse { animation: none; }
}

.lp-dash__url {
  flex: 1;
  background: #12141a;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12px;
  color: $text-muted;
  margin-left: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lp-dash__actions { display: flex; gap: 4px; margin-left: 4px; }

.lp-action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: $text-muted;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: $surface-2;
    color: #fff;
    border-color: $border;
  }

  &--danger:hover {
    background: rgba(242, 95, 92, 0.12);
    border-color: rgba(242, 95, 92, 0.3);
    color: #f25f5c;
  }
}

.lp-dash__body {
  background: $ink;
  border-radius: 14px;
  padding: 20px;
  color: #fff;
}

.lp-dash__lead {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.lp-dash__lead-id {
  font-size: 11px;
  color: $text-muted;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
  font-weight: 700;
  text-transform: uppercase;
}

.lp-dash__lead-title {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
  line-height: 1.25;
}

.lp-dash__lead-client {
  font-size: 13px;
  color: $text-dim;
  margin-top: 6px;
  line-height: 1.5;
}

.lp-dash__lead-phone {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  font-size: 13px;
  color: $accent;

  a {
    color: inherit;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}

.lp-dash__amount {
  font-size: 22px;
  font-weight: 900;
  color: $accent;
  text-align: right;
  letter-spacing: -0.02em;
  white-space: nowrap;

  small {
    display: block;
    font-size: 10px;
    color: $text-muted;
    font-weight: 700;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
    text-transform: uppercase;
  }
}

.lp-dash__terminal {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(242, 95, 92, 0.08);
  border: 1px solid rgba(242, 95, 92, 0.25);
  border-radius: 12px;
  margin-bottom: 16px;

  &-icon { color: #f25f5c; flex-shrink: 0; }
  &-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    b { color: #fff; font-size: 15px; font-weight: 700; }
    span { color: $text-dim; font-size: 13px; }
  }
}

.lp-dash__steps {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-bottom: 16px;
}

.lp-dash__step {
  &--done .lp-dash__step-bar { background: $accent; }
  &--done .lp-dash__step-label { color: #c4c8cb; }
  &--current .lp-dash__step-bar {
    background: linear-gradient(90deg, $accent 60%, $surface-2 60%);
  }
  &--current .lp-dash__step-label { color: $accent; font-weight: 700; }
  &--disabled .lp-dash__step-bar { background: $surface-2; opacity: 0.5; }
  &--disabled .lp-dash__step-label { color: $text-muted; opacity: 0.5; }
}

.lp-dash__step-bar {
  height: 4px;
  border-radius: 100px;
  background: $surface-2;
  margin-bottom: 10px;
  overflow: hidden;
}

.lp-dash__step-label {
  font-size: 11px;
  color: $text-muted;
  line-height: 1.35;
}

.lp-dash__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid $border;
  flex-wrap: wrap;
  gap: 12px;
}

.lp-dash__footer-item {
  font-size: 11px;
  color: $text-muted;
  line-height: 1.4;
  letter-spacing: 0.02em;

  b {
    display: block;
    color: #fff;
    font-size: 14px;
    margin-top: 3px;
    font-weight: 700;
  }
}

@media (max-width: 900px) {
  .lp-dash__steps { grid-template-columns: repeat(3, 1fr); gap: 10px; }
}

@media (max-width: 640px) {
  .lp-dash__steps { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .lp-dash__lead { flex-direction: column; gap: 12px; }
  .lp-dash__amount { text-align: left; }
  .lp-dash__footer { flex-direction: column; align-items: flex-start; gap: 10px; }
}

@media (max-width: 480px) {
  .lp-dash { padding: 12px; }
  .lp-dash__body { padding: 14px; }
  .lp-dash__lead-title { font-size: 17px; }
  .lp-dash__amount { font-size: 19px; }
}
</style>