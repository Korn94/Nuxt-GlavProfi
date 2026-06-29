<!-- app\components\pages\cabinet\dashboards\admin\RecentOperationsCard.vue -->
 <template>
  <PagesCabinetUiCardsCard :loading="isLoading" title="Последние операции" flush>
    <template #icon>
      <Icon name="mdi:history" size="18" />
    </template>

    <template #actions>
      <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="navigateTo('/cabinet/operation')">
        Все операции
        <Icon name="mdi:arrow-right" size="14" />
      </button>
    </template>

    <!-- Список операций -->
    <div v-if="operations.length" class="ops">
      <div v-for="op in operations" :key="op.id" :class="['op', `op--${op.type}`]">
        <!-- Иконка типа -->
        <div class="op__icon">
          <Icon :name="op.type === 'income' ? 'mdi:arrow-bottom-left' : 'mdi:arrow-top-right'" size="16" />
        </div>

        <!-- Основная инфо -->
        <div class="op__body">
          <div class="op__top">
            <span class="op__type">{{ op.type === 'income' ? 'Приход' : 'Расход' }}</span>
            <span :class="['op__amount', `op__amount--${op.type}`]">
              {{ op.type === 'income' ? '+' : '−' }}{{ formatCurrency(op.amount) }}
            </span>
          </div>
          <div class="op__bottom">
            <span v-if="op.objectName" class="op__meta">
              <Icon name="mdi:map-marker-outline" size="12" />
              {{ op.objectName }}
            </span>
            <span v-if="op.comment" class="op__meta">
              <Icon name="mdi:comment-outline" size="12" />
              {{ op.comment }}
            </span>
            <span class="op__date">{{ formatDate(op.operationDate) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="ops-state">
      <Icon name="mdi:alert-circle-outline" size="32" />
      <p>Не удалось загрузить операции</p>
      <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="fetchData">
        <Icon name="mdi:refresh" size="14" /> Повторить
      </button>
    </div>

    <!-- Пусто -->
    <div v-else class="ops-state">
      <Icon name="mdi:history" size="32" />
      <p>Нет операций</p>
    </div>

    <template #footer>
      Показаны последние {{ operations.length }} операции
    </template>
  </PagesCabinetUiCardsCard>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { navigateTo } from '#app'
import { useApi } from '~/composables/useApi'

const api = useApi()

interface Operation {
  id: number
  type: 'income' | 'expense'
  amount: number
  operationDate: string
  comment?: string
  objectName?: string
}

const operations = ref<Operation[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
let refreshTimer: ReturnType<typeof setInterval>

// ── Форматирование ───────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  Math.abs(amount).toLocaleString('ru-RU', {
    style: 'currency', currency: 'RUB', minimumFractionDigits: 0
  })

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

// ── Загрузка ────────────────────────────────────────────────────────
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const [comings, expenses] = await Promise.all([
      api.get<any[]>('/api/comings'),
      api.get<any[]>('/api/expenses'),
    ])

    const all: Operation[] = [
      ...(comings || []).map(op => ({ ...op, type: 'income' as const, amount: parseFloat(op.amount), objectName: op.objectName || op.object?.name })),
      ...(expenses || []).map(op => ({ ...op, type: 'expense' as const, amount: parseFloat(op.amount), objectName: op.objectName || op.object?.name })),
    ]

    operations.value = all
      .sort((a, b) => new Date(b.operationDate).getTime() - new Date(a.operationDate).getTime())
      .slice(0, 8)

  } catch (e: any) {
    console.error('[Операции] Ошибка загрузки:', e)
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
.ops {
  display: flex;
  flex-direction: column;
}

.op {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--crm-border);
  transition: var(--crm-transition);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--crm-bg-elevated);
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &--income .op__icon {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--expense .op__icon {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__type {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-secondary);
  }

  &__amount {
    font-size: var(--crm-text-md);
    font-weight: 700;
    flex-shrink: 0;

    &--income {
      color: var(--crm-success);
    }

    &--expense {
      color: var(--crm-danger);
    }
  }

  &__bottom {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__date {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-disabled);
    margin-left: auto;
    flex-shrink: 0;
  }
}

.ops-state {
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