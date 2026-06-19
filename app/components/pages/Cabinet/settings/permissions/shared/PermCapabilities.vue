<!-- app/components/pages/cabinet/settings/permissions/shared/PermCapabilities.vue -->
 <template>
  <div :class="['perm-capabilities', { 'perm-capabilities--compact': compact }]">
    <!-- Создание -->
    <span v-if="page.hasCreate" class="capability-tag create">
      <Icon v-if="!compact" name="mdi:plus-circle-outline" size="12" />
      <span>Создание</span>
    </span>

    <!-- Редактирование -->
    <span v-if="page.hasEdit" class="capability-tag edit">
      <Icon v-if="!compact" name="mdi:pencil-outline" size="12" />
      <span>Редактирование</span>
    </span>

    <!-- Удаление -->
    <span v-if="page.hasDelete" class="capability-tag delete">
      <Icon v-if="!compact" name="mdi:delete-outline" size="12" />
      <span>Удаление</span>
    </span>

    <!-- Спец. операции (приёмка/оплата/пересчёт и т.д.) -->
    <span v-if="page.hasSpecial" class="capability-tag special">
      <Icon v-if="!compact" name="mdi:lightning-bolt" size="12" />
      <span>{{ compact ? 'Спец.' : 'Спец. операции' }}</span>
    </span>

    <!-- Заглушка: только просмотр -->
    <span v-if="!hasAnyCapability" class="capability-tag none">
      <Icon v-if="!compact" name="mdi:eye-outline" size="12" />
      <span>Только просмотр</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ============================================
// ПРОПСЫ
// ============================================
const props = withDefaults(defineProps<{
  /** Объект страницы с флагами поддерживаемых действий */
  page: {
    hasCreate: boolean
    hasEdit: boolean
    hasDelete: boolean
    hasSpecial: boolean
  }
  /** Компактный режим: без иконок и короткими подписями */
  compact?: boolean
}>(), {
  compact: false,
})

// ============================================
// COMPUTED
// ============================================

/**
 * Есть ли у страницы хотя бы одно активное действие
 * (кроме просмотра, который есть у всех по умолчанию)
 */
const hasAnyCapability = computed(() => {
  return (
    props.page.hasCreate ||
    props.page.hasEdit ||
    props.page.hasDelete ||
    props.page.hasSpecial
  )
})
</script>

<style lang="scss" scoped>
.perm-capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;

  &--compact {
    gap: 0.25rem;

    .capability-tag {
      padding: 0.0625rem 0.375rem;
      font-size: 0.6875rem;
    }
  }
}

.capability-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  font-size: var(--crm-text-xs, 0.75rem);
  font-weight: 500;
  border-radius: 10px;
  white-space: nowrap;
  line-height: 1.4;

  // ── Создание (зелёный) ────────────────────────
  &.create {
    background: var(--crm-success-dim, rgba(61, 214, 140, 0.15));
    color: var(--crm-success, #3dd68c);
  }

  // ── Редактирование (синий) ────────────────────
  &.edit {
    background: var(--crm-info-dim, rgba(0, 195, 245, 0.15));
    color: var(--crm-info, #00c3f5);
  }

  // ── Удаление (красный) ────────────────────────
  &.delete {
    background: var(--crm-danger-dim, rgba(242, 95, 92, 0.15));
    color: var(--crm-danger, #f25f5c);
  }

  // ── Спец. операции (фиолетовый) ───────────────
  &.special {
    background: rgba(156, 39, 176, 0.15);
    color: #9c27b0;
  }

  // ── Только просмотр (серый) ───────────────────
  &.none {
    background: var(--crm-bg-overlay, rgba(0, 0, 0, 0.04));
    color: var(--crm-text-muted, #9aa0b8);
  }
}
</style>