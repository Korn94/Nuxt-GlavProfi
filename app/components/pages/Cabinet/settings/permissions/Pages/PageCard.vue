<!-- app/components/pages/cabinet/settings/permissions/Pages/PageCard.vue -->
 <template>
  <div
    :class="['page-card', { inactive: !page.isActive }]"
  >
    <div class="page-card-main">
      <!-- Порядок (стрелки) — только для админа -->
      <div v-if="isAdmin" class="page-order">
        <button
          class="btn-icon"
          :disabled="index === 0"
          @click="$emit('move-up', page)"
          title="Переместить вверх"
        >
          <Icon name="mdi:chevron-up" size="18" />
        </button>
        <span class="order-number">{{ page.order + 1 }}</span>
        <button
          class="btn-icon"
          :disabled="index === total - 1"
          @click="$emit('move-down', page)"
          title="Переместить вниз"
        >
          <Icon name="mdi:chevron-down" size="18" />
        </button>
      </div>

      <!-- Иконка -->
      <div class="page-icon-wrapper">
        <Icon :name="page.icon || 'mdi:file-outline'" size="24" />
      </div>

      <!-- Информация -->
      <div class="page-info">
        <div class="page-title">
          <h3>{{ page.name }}</h3>
          <code class="page-slug">{{ page.slug }}</code>
        </div>
        <p v-if="page.description" class="page-description">{{ page.description }}</p>

        <!-- Возможности страницы (используем shared компонент) -->
        <PermissionsSharedPermCapabilities :page="page" />
      </div>
    </div>

    <!-- Действия — только для админа -->
    <div v-if="isAdmin" class="page-card-actions">
      <button class="btn btn-ghost btn-sm" @click="$emit('edit', page)">
        <Icon name="mdi:pencil" size="14" />
        Редактировать
      </button>
      <button
        v-if="page.isActive"
        class="btn btn-ghost btn-sm"
        @click="$emit('toggle-active', page, false)"
        title="Скрыть раздел (мягкое удаление)"
      >
        <Icon name="mdi:eye-off" size="14" />
        Скрыть
      </button>
      <button
        v-else
        class="btn btn-ghost btn-sm"
        @click="$emit('toggle-active', page, true)"
        title="Показать раздел"
      >
        <Icon name="mdi:eye" size="14" />
        Показать
      </button>
      <button
        class="btn btn-ghost btn-sm btn-danger-text"
        @click="$emit('delete', page, true)"
        title="Полное удаление с CASCADE (опасно!)"
      >
        <Icon name="mdi:delete-forever" size="14" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SystemPage } from '~/composables/usePermissionsApi'

// ============================================
// ПРОПСЫ
// ============================================
defineProps<{
  /** Данные страницы */
  page: SystemPage
  /** Индекс страницы в списке (для определения доступности стрелок) */
  index: number
  /** Общее количество страниц в списке */
  total: number
  /** Является ли текущий пользователь админом */
  isAdmin: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================
defineEmits<{
  /** Открыть модалку редактирования */
  (e: 'edit', page: SystemPage): void
  /** Переключить активность (скрыть/показать) */
  (e: 'toggle-active', page: SystemPage, newActive: boolean): void
  /** Открыть модалку удаления */
  (e: 'delete', page: SystemPage, hard: boolean): void
  /** Переместить вверх */
  (e: 'move-up', page: SystemPage): void
  /** Переместить вниз */
  (e: 'move-down', page: SystemPage): void
}>()
</script>

<style lang="scss" scoped>
.page-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  transition: all var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
    box-shadow: var(--crm-shadow-sm);
  }

  &.inactive {
    opacity: 0.6;
    background: var(--crm-bg-elevated);

    .page-icon-wrapper {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-muted);
    }
  }
}

.page-card-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.page-order {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;

  .order-number {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    font-weight: 500;
  }
}

.page-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--crm-accent-dim);
  color: var(--crm-accent);
  border-radius: var(--crm-radius-md);
  flex-shrink: 0;
}

.page-info {
  flex: 1;
  min-width: 0;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  h3 {
    margin: 0;
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  .page-slug {
    padding: 0.125rem 0.5rem;
    background: var(--crm-bg-overlay);
    color: var(--crm-text-muted);
    font-size: var(--crm-text-xs);
    border-radius: var(--crm-radius-sm);
    font-family: var(--crm-font-mono);
  }
}

.page-description {
  margin: 0.25rem 0 0.5rem;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
}

.page-card-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

// ── КНОПКИ ──────────────────────────────────────────────
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: var(--crm-text-sm);
  font-weight: 500;
  font-family: var(--crm-font-sans);
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  border: 1px solid transparent;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.btn-sm {
    padding: 0.375rem 0.625rem;
    font-size: var(--crm-text-xs);
  }
}

.btn-ghost {
  background: transparent;
  color: var(--crm-text-secondary);

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }
}

.btn-danger-text {
  color: var(--crm-danger);

  &:hover:not(:disabled) {
    background: var(--crm-danger-dim);
  }
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  color: var(--crm-text-muted);
  border: 1px solid transparent;
  border-radius: var(--crm-radius-sm);
  cursor: pointer;
  transition: all var(--crm-transition);

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

// ── АДАПТИВНОСТЬ ────────────────────────────────────────
@media (max-width: 768px) {
  .page-card {
    flex-direction: column;
    align-items: stretch;
  }

  .page-card-main {
    flex-wrap: wrap;
  }

  .page-order {
    flex-direction: row;
    gap: 0.5rem;
  }

  .page-card-actions {
    justify-content: flex-end;
    flex-wrap: wrap;
    padding-top: 0.75rem;
    border-top: 1px solid var(--crm-border);
  }
}
</style>