<!-- app/components/pages/cabinet/settings/permissions/shared/PermCheckboxes.vue -->
 <template>
  <div :class="['perm-checkboxes', { 'perm-checkboxes--compact': compact }]">
    <!-- Просмотр (базовое право, всегда показывается) -->
    <label class="action-checkbox action-checkbox--view">
      <input
        type="checkbox"
        :checked="localPermissions.canView"
        :disabled="disabled"
        @change="onViewToggle"
      />
      <span class="checkmark"></span>
      <Icon name="mdi:eye-outline" size="16" />
      <span>Просмотр</span>
    </label>

    <!-- Создание (только если страница поддерживает) -->
    <label v-if="page.hasCreate" class="action-checkbox action-checkbox--create">
      <input
        type="checkbox"
        :checked="localPermissions.canCreate"
        :disabled="disabled || !localPermissions.canView"
        @change="onActionToggle('canCreate')"
      />
      <span class="checkmark"></span>
      <Icon name="mdi:plus-circle-outline" size="16" />
      <span>Создание</span>
    </label>

    <!-- Редактирование (только если страница поддерживает) -->
    <label v-if="page.hasEdit" class="action-checkbox action-checkbox--edit">
      <input
        type="checkbox"
        :checked="localPermissions.canEdit"
        :disabled="disabled || !localPermissions.canView"
        @change="onActionToggle('canEdit')"
      />
      <span class="checkmark"></span>
      <Icon name="mdi:pencil-outline" size="16" />
      <span>Редактирование</span>
    </label>

    <!-- Удаление (только если страница поддерживает) -->
    <label v-if="page.hasDelete" class="action-checkbox action-checkbox--delete">
      <input
        type="checkbox"
        :checked="localPermissions.canDelete"
        :disabled="disabled || !localPermissions.canView"
        @change="onActionToggle('canDelete')"
      />
      <span class="checkmark"></span>
      <Icon name="mdi:delete-outline" size="16" />
      <span>Удаление</span>
    </label>

    <!-- Спец. операции (только если страница поддерживает) -->
    <label v-if="page.hasSpecial" class="action-checkbox action-checkbox--special">
      <input
        type="checkbox"
        :checked="localPermissions.canSpecial"
        :disabled="disabled || !localPermissions.canView"
        @change="onActionToggle('canSpecial')"
      />
      <span class="checkmark"></span>
      <Icon name="mdi:lightning-bolt" size="16" />
      <span>Спец. операции</span>
    </label>

    <!-- Подсказка когда просмотр выключен -->
    <p
      v-if="!localPermissions.canView && hasAnyActionCapability"
      class="perm-checkboxes__hint"
    >
      <Icon name="mdi:information-outline" size="14" />
      Включите просмотр, чтобы активировать остальные права
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ============================================
// ТИПЫ
// ============================================
interface PagePermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canSpecial: boolean
}

interface PageCapabilities {
  hasCreate: boolean
  hasEdit: boolean
  hasDelete: boolean
  hasSpecial: boolean
}

type PermissionAction = 'canCreate' | 'canEdit' | 'canDelete' | 'canSpecial'

// ============================================
// ПРОПСЫ
// ============================================
const props = withDefaults(defineProps<{
  /** Объект прав (v-model для двусторонней связи) */
  modelValue: PagePermissions
  /** Возможности страницы (определяют какие чекбоксы показывать) */
  page: PageCapabilities
  /** Компактный режим (для плотной верстки) */
  compact?: boolean
  /** Глобальное отключение всех чекбоксов */
  disabled?: boolean
}>(), {
  compact: false,
  disabled: false,
})

// ============================================
// ЭМИТТЫ
// ============================================
const emit = defineEmits<{
  'update:modelValue': [value: PagePermissions]
}>()

// ============================================
// COMPUTED
// ============================================

/**
 * Локальная копия прав для работы внутри компонента
 */
const localPermissions = computed(() => props.modelValue)

/**
 * Есть ли у страницы хотя бы одно действие (кроме просмотра)
 * Используется для показа подсказки "включите просмотр"
 */
const hasAnyActionCapability = computed(() => {
  return (
    props.page.hasCreate ||
    props.page.hasEdit ||
    props.page.hasDelete ||
    props.page.hasSpecial
  )
})

// ============================================
// ОБРАБОТЧИКИ
// ============================================

/**
 * Переключение права просмотра
 *
 * Логика:
 * - При выключении canView — сбрасываем все остальные действия
 * - При включении canView — ничего не делаем (пользователь сам выберет действия)
 */
function onViewToggle(event: Event) {
  const target = event.target as HTMLInputElement
  const newCanView = target.checked

  if (!newCanView) {
    // Сбрасываем все действия если просмотр выключен
    emit('update:modelValue', {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSpecial: false,
    })
  } else {
    // Просто включаем просмотр, остальные действия не трогаем
    emit('update:modelValue', {
      ...localPermissions.value,
      canView: true,
    })
  }
}

/**
 * Переключение конкретного действия (create/edit/delete/special)
 */
function onActionToggle(action: PermissionAction) {
  const current = localPermissions.value
  const newValue = !current[action]

  emit('update:modelValue', {
    ...current,
    [action]: newValue,
  })
}
</script>

<style lang="scss" scoped>
.perm-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  position: relative;

  &--compact {
    gap: 0.375rem;

    .action-checkbox {
      padding: 0.25rem 0.5rem;
      font-size: var(--crm-text-xs);
    }

    .action-checkbox svg {
      width: 14px;
      height: 14px;
    }
  }

  &__hint {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin: 0.25rem 0 0;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    padding-left: 2px;

    svg {
      color: var(--crm-info);
      flex-shrink: 0;
    }
  }
}

// ── ЧЕКБОКС ДЕЙСТВИЯ ──────────────────────────────────
.action-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
  cursor: pointer;
  user-select: none;
  transition: all var(--crm-transition);

  &:hover:not(:has(input:disabled)) {
    border-color: var(--crm-border-hover);
    color: var(--crm-text-primary);
  }

  // Скрываем нативный чекбокс
  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    width: 0;
    height: 0;

    // Состояние: checked
    &:checked ~ .checkmark {
      background: var(--crm-accent);
      border-color: var(--crm-accent);

      &::after {
        opacity: 1;
      }
    }

    // Состояние: disabled
    &:disabled {
      & ~ .checkmark {
        opacity: 0.4;
        cursor: not-allowed;
      }

      & ~ * {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  // Кастомный чекбокс
  .checkmark {
    position: relative;
    width: 14px;
    height: 14px;
    border: 1.5px solid var(--crm-border-hover);
    border-radius: 3px;
    transition: all var(--crm-transition);
    flex-shrink: 0;

    &::after {
      content: '';
      position: absolute;
      left: 4px;
      top: 1px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 1.5px 1.5px 0;
      transform: rotate(45deg);
      opacity: 0;
      transition: opacity var(--crm-transition);
    }
  }

  // Подсветка иконки при checked
  &:has(input:checked) {
    svg {
      color: var(--crm-accent);
    }
  }

  // ── ВАРИАНТЫ ПО ТИПУ ДЕЙСТВИЯ ───────────────────
  &--view:has(input:checked) svg {
    color: var(--crm-text-primary);
  }

  &--create:has(input:checked) svg {
    color: var(--crm-success);
  }

  &--edit:has(input:checked) svg {
    color: var(--crm-info);
  }

  &--delete:has(input:checked) svg {
    color: var(--crm-danger);
  }

  &--special:has(input:checked) svg {
    color: #9c27b0;
  }
}
</style>