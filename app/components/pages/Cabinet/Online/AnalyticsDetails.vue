<!-- app/components/pages/Cabinet/Online/AnalyticsDetails.vue -->
<template>
  <PagesCabinetUiModal
    :visible="visible"
    size="xl"
    :title="modalTitle"
    @update:visible="onVisibleChange"
    @close="onVisibleChange(false)"
  >
    <div class="details-shell">
      <div class="details-top">
        <div class="details-breadcrumbs">
          <button
            v-if="stack.length > 1"
            class="details-crumb__back"
            title="Назад"
            @click="emit('pop')"
          >
            <Icon name="mdi:arrow-left" size="14" />
          </button>

          <template v-for="(step, index) in stack" :key="`${step.kind}-${step.id}`">
            <span v-if="index > 0" class="details-crumb__sep">/</span>
            <button
              v-if="index < stack.length - 1"
              class="details-crumb__btn"
              @click="emit('goto', index)"
            >
              {{ stepLabel(step) }}
            </button>
            <span v-else class="details-crumb__current">{{ stepLabel(step) }}</span>
          </template>
        </div>
      </div>

      <PagesCabinetOnlineAnalyticsPageDetails
        v-if="current?.kind === 'page'"
        :path="current.id"
        :days="days"
        @open-visitor="openVisitor"
        @open-session="openSession"
      />

      <PagesCabinetOnlineAnalyticsVisitorDetails
        v-else-if="current?.kind === 'visitor'"
        :visitor-id="current.id"
        @open-session="openSession"
      />

      <PagesCabinetOnlineAnalyticsSessionDetails
        v-else-if="current?.kind === 'session'"
        :session-id="current.id"
        @open-visitor="openVisitor"
      />
    </div>
  </PagesCabinetUiModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  shortSessionId,
  shortVisitorId,
  type AnalyticsStep
} from './composables/useAnalyticsRoute'

const props = defineProps<{
  visible: boolean
  /** Стек навигации: страница → посетитель → визит */
  stack: AnalyticsStep[]
  /** Период аналитики из карточки (дней) */
  days: number
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  push: [step: AnalyticsStep]
  pop: []
  goto: [index: number]
}>()

const current = computed<AnalyticsStep | null>(() => props.stack[props.stack.length - 1] || null)

const modalTitle = computed(() => {
  const step = current.value
  if (!step) return 'Детали аналитики'
  if (step.kind === 'page') return `Страница ${step.id}`
  if (step.kind === 'visitor') return shortVisitorId(step.id)
  return `Визит ${shortSessionId(step.id)}`
})

function stepLabel(step: AnalyticsStep): string {
  if (step.kind === 'page') return step.title || step.id
  if (step.kind === 'visitor') return step.title || shortVisitorId(step.id)
  return step.title || `Визит ${shortSessionId(step.id)}`
}

function onVisibleChange(value: boolean) {
  emit('update:visible', value)
}

function openVisitor(visitorId: string) {
  emit('push', { kind: 'visitor', id: visitorId, title: shortVisitorId(visitorId) })
}

function openSession(sessionId: string, visitorId?: string) {
  // Из детализации страницы переходим сразу к визиту — добавляем уровень
  // посетителя, чтобы крошки были полными.
  const hasVisitor = props.stack.some(step => step.kind === 'visitor')
  if (visitorId && !hasVisitor) {
    emit('push', { kind: 'visitor', id: visitorId, title: shortVisitorId(visitorId) })
  }
  emit('push', { kind: 'session', id: sessionId, title: `Визит ${shortSessionId(sessionId)}` })
}
</script>

<style lang="scss" scoped>
.details-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.details-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.details-breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
  font-size: var(--crm-text-xs);
}

.details-crumb {
  &__back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-right: 4px;
    background: transparent;
    border: 1px solid var(--crm-border-hover);
    border-radius: var(--crm-radius-sm);
    color: var(--crm-text-secondary);
    cursor: pointer;
    transition: var(--crm-transition);

    &:hover {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-primary);
    }
  }

  &__btn {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: var(--crm-accent);
    cursor: pointer;
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover { text-decoration: underline; }
  }

  &__current {
    color: var(--crm-text-primary);
    font-weight: 600;
    max-width: 360px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__sep {
    color: var(--crm-text-disabled);
  }
}
</style>
