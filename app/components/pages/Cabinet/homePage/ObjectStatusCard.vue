<!-- app/components/pages/cabinet/homePage/ObjectStatusCard.vue -->
<template>
  <PagesCabinetUiCardsCard :loading="isLoading" title="Статусы объектов" flush>
    <template #icon>
      <Icon name="mdi:office-building-outline" size="18" />
    </template>

    <template #actions>
      <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="navigateTo('/cabinet/objects')">
        Все объекты
        <Icon name="mdi:arrow-right" size="14" />
      </button>
    </template>

    <div v-if="objectStats" class="obj">

      <!-- Статистика по статусам -->
      <div class="obj__stats">
        <div class="stat stat--active">
          <div class="stat__icon">
            <Icon name="mdi:play-circle-outline" size="20" />
          </div>
          <div class="stat__info">
            <span class="stat__value">{{ objectStats.active }}</span>
            <span class="stat__label">Активные</span>
          </div>
        </div>

        <div class="stat stat--waiting">
          <div class="stat__icon">
            <Icon name="mdi:clock-outline" size="20" />
          </div>
          <div class="stat__info">
            <span class="stat__value">{{ objectStats.waiting }}</span>
            <span class="stat__label">Ожидание</span>
          </div>
        </div>

        <div class="stat stat--done">
          <div class="stat__icon">
            <Icon name="mdi:check-circle-outline" size="20" />
          </div>
          <div class="stat__info">
            <span class="stat__value">{{ objectStats.completed }}</span>
            <span class="stat__label">Завершены</span>
          </div>
        </div>

        <div class="stat stat--docs">
          <div class="stat__icon">
            <Icon name="mdi:file-document-outline" size="20" />
          </div>
          <div class="stat__info">
            <span class="stat__value">{{ totalDocsIssues }}</span>
            <span class="stat__label">Проблем с документами</span>
          </div>
        </div>
      </div>

      <!-- Критические объекты -->
      <div v-if="criticalObjects.length" class="obj__critical">
        <div class="obj__critical-header">
          <span class="obj__critical-title">
            <Icon name="mdi:alert" size="14" />
            Просроченные объекты
          </span>
          <span class="obj__critical-count">{{ criticalObjects.length }}</span>
        </div>

        <div class="critical-list">
          <div v-for="obj in criticalObjects" :key="obj.id" class="critical-item">
            <div class="critical-item__left">
              <span class="critical-item__name">{{ obj.name }}</span>
              <span class="critical-item__address">{{ obj.address || 'Адрес не указан' }}</span>
            </div>
            <div class="critical-item__right">
              <span class="critical-item__foreman">{{ obj.foreman?.name || '—' }}</span>
              <span class="critical-item__days">
                +{{ getDaysOverdue(obj.plannedEndDate) }} дн.
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Документооборот -->
      <div class="obj__docs">
        <div class="obj__docs-header">
          <span class="obj__docs-title">Документооборот</span>
        </div>

        <div class="docs-grid">
          <!-- В работе -->
          <div class="docs-section">
            <div class="docs-section__label">
              В работе
              <span class="docs-section__count">{{ objectStats.inProgress }}</span>
            </div>
            <div class="docs-row">
              <div class="docs-item">
                <Icon name="mdi:file-sign" size="14" class="docs-item__icon" />
                <span class="docs-item__label">Неподписанные договоры</span>
                <span class="docs-item__value">{{ documentStats.inProgress.unsignedContracts }}</span>
              </div>
              <div class="docs-item">
                <Icon name="mdi:receipt" size="14" class="docs-item__icon" />
                <span class="docs-item__label">Неоплаченные счета</span>
                <span class="docs-item__value">{{ documentStats.inProgress.unpaidInvoices }}</span>
              </div>
              <div class="docs-item">
                <Icon name="mdi:file-clock-outline" size="14" class="docs-item__icon" />
                <span class="docs-item__label">Акты на подписание</span>
                <span class="docs-item__value">{{ documentStats.inProgress.actsToSign }}</span>
              </div>
            </div>
          </div>

          <!-- Завершены -->
          <div class="docs-section">
            <div class="docs-section__label">
              Завершённые
              <span class="docs-section__count">{{ objectStats.completed }}</span>
            </div>
            <div class="docs-row">
              <div class="docs-item">
                <Icon name="mdi:file-sign" size="14" class="docs-item__icon" />
                <span class="docs-item__label">Неподписанные договоры</span>
                <span class="docs-item__value">{{ documentStats.completed.unsignedContracts }}</span>
              </div>
              <div class="docs-item">
                <Icon name="mdi:receipt" size="14" class="docs-item__icon" />
                <span class="docs-item__label">Неоплаченные счета</span>
                <span class="docs-item__value">{{ documentStats.completed.unpaidInvoices }}</span>
              </div>
              <div class="docs-item">
                <Icon name="mdi:file-clock-outline" size="14" class="docs-item__icon" />
                <span class="docs-item__label">Акты на подписание</span>
                <span class="docs-item__value">{{ documentStats.completed.actsToSign }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="obj-state">
      <Icon name="mdi:alert-circle-outline" size="32" />
      <p>Не удалось загрузить данные</p>
      <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="fetchData">
        <Icon name="mdi:refresh" size="14" /> Повторить
      </button>
    </div>

    <!-- Пусто -->
    <div v-else class="obj-state">
      <Icon name="mdi:office-building-outline" size="32" />
      <p>Нет данных по объектам</p>
    </div>

    <template #footer>
      Обновлено: {{ updatedAt }}
    </template>
  </PagesCabinetUiCardsCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { navigateTo } from '#app'
import { useApi } from '~/composables/useApi' // 👈 Новый composable

const api = useApi() // 👈 Инициализация

// ── Типы ────────────────────────────────────────────────────────────
interface DocStats {
  unsignedContracts: number
  unpaidInvoices: number
  actsToSign: number
}

interface ObjectStats {
  active: number
  waiting: number
  completed: number
  inProgress: number
  total: number
}

// ── Состояние ───────────────────────────────────────────────────────
const objectStats = ref<ObjectStats | null>(null)
const criticalObjects = ref<any[]>([])
const documentStats = ref<{ inProgress: DocStats; completed: DocStats }>({
  inProgress: { unsignedContracts: 0, unpaidInvoices: 0, actsToSign: 0 },
  completed: { unsignedContracts: 0, unpaidInvoices: 0, actsToSign: 0 },
})
const isLoading = ref(true)
const error = ref<string | null>(null)
const updatedAt = ref('—')

let refreshTimer: ReturnType<typeof setInterval>

// ── Computed ────────────────────────────────────────────────────────
const totalDocsIssues = computed(() => {
  const ip = documentStats.value.inProgress
  const cp = documentStats.value.completed
  return ip.unsignedContracts + ip.unpaidInvoices + ip.actsToSign +
    cp.unsignedContracts + cp.unpaidInvoices + cp.actsToSign
})

// ── Вспомогательные ─────────────────────────────────────────────────
function getDaysOverdue(dateStr: string) {
  if (!dateStr) return 0
  const diff = Date.now() - new Date(dateStr).setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

// ── Загрузка ────────────────────────────────────────────────────────
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    // 👇 GET-запрос через useApi() — токен и credentials подставляются автоматически
    const data = await api.get<any[]>('/api/objects')

    const stats: ObjectStats = { active: 0, waiting: 0, completed: 0, inProgress: 0, total: data.length }
    const docs = {
      inProgress: { unsignedContracts: 0, unpaidInvoices: 0, actsToSign: 0 },
      completed: { unsignedContracts: 0, unpaidInvoices: 0, actsToSign: 0 },
    }
    const critical: any[] = []

    for (const obj of data) {
      if (obj.status === 'active') stats.active++
      if (obj.status === 'waiting') stats.waiting++
      if (obj.status === 'completed') stats.completed++

      const inProgress = obj.status === 'active' || obj.status === 'waiting'
      if (inProgress) stats.inProgress++

      const target = inProgress ? docs.inProgress : docs.completed
      if (obj.contract?.status !== 'signed') target.unsignedContracts++
      target.unpaidInvoices += (obj.invoiceStats?.total || 0) - (obj.invoiceStats?.signed || 0)
      target.actsToSign += (obj.actStats?.total || 0) - (obj.actStats?.signed || 0)

      if (obj.status === 'active' && obj.plannedEndDate && new Date(obj.plannedEndDate) < new Date()) {
        critical.push(obj)
      }
    }

    objectStats.value = stats
    documentStats.value = docs
    criticalObjects.value = critical
      .sort((a, b) => new Date(a.plannedEndDate).getTime() - new Date(b.plannedEndDate).getTime())
      .slice(0, 3)

    updatedAt.value = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  } catch (e: any) {
    // 👇 Ошибки 401/403 уже обработаны в useApi(), здесь — только локальная логика UI
    console.error('[Объекты] Ошибка загрузки:', e)
    error.value = e?.message || 'Ошибка загрузки'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
  refreshTimer = setInterval(fetchData, 5 * 60 * 1000)
})

onBeforeUnmount(() => clearInterval(refreshTimer))
</script>

<style lang="scss" scoped>
.obj {
  display: flex;
  flex-direction: column;
}

// ── Статистика ───────────────────────────────────────────────────────
.obj__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid var(--crm-border);

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-right: 1px solid var(--crm-border);

  &:last-child {
    border-right: none;
  }

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: var(--crm-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__value {
    font-size: var(--crm-text-xl);
    font-weight: 700;
    color: var(--crm-text-primary);
    line-height: 1;
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &--active .stat__icon {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }

  &--waiting .stat__icon {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }

  &--done .stat__icon {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--docs .stat__icon {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }
}

// ── Критические объекты ─────────────────────────────────────────────
.obj__critical {
  padding: 14px 16px;
  border-bottom: 1px solid var(--crm-border);
  display: flex;
  flex-direction: column;
  gap: 10px;

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &-title {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-warning);
  }

  &-count {
    font-size: var(--crm-text-xs);
    font-weight: 700;
    padding: 1px 7px;
    background: var(--crm-warning-dim);
    border: 1px solid rgba(245, 166, 35, 0.3);
    border-radius: 10px;
    color: var(--crm-warning);
  }
}

.critical-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.critical-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: var(--crm-warning-dim);
  border: 1px solid rgba(245, 166, 35, 0.2);
  border-radius: var(--crm-radius-md);

  &__left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__name {
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__address {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex-shrink: 0;
  }

  &__foreman {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__days {
    font-size: var(--crm-text-sm);
    font-weight: 700;
    color: var(--crm-danger);
  }
}

// ── Документооборот ─────────────────────────────────────────────────
.obj__docs {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &-header {
    margin-bottom: 2px;
  }

  &-title {
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-secondary);
  }
}

.docs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.docs-section {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
    text-transform: uppercase;
    letter-spacing: .05em;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--crm-border);
  }

  &__count {
    font-size: var(--crm-text-xs);
    padding: 1px 6px;
    background: var(--crm-bg-overlay);
    border-radius: 10px;
    color: var(--crm-text-muted);
  }
}

.docs-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.docs-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-md);

  &__icon {
    color: var(--crm-text-muted);
    flex-shrink: 0;
  }

  &__label {
    flex: 1;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-secondary);
  }

  &__value {
    font-size: var(--crm-text-sm);
    font-weight: 700;
    color: var(--crm-text-primary);
    flex-shrink: 0;
  }
}

// ── Пустые состояния ────────────────────────────────────────────────
.obj-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 20px;
  color: var(--crm-text-muted);

  p {
    margin: 0;
    font-size: var(--crm-text-sm);
  }
}

// ── Кнопки ──────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--crm-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  white-space: nowrap;

  &--sm {
    padding: 6px 12px;
    font-size: var(--crm-text-sm);
  }

  &--ghost {
    background: transparent;
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }
}
</style>