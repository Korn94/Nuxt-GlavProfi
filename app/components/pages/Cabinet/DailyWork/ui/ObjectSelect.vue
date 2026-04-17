<!-- app\components\pages\cabinet\DailyWork\ui\ObjectSelect.vue -->
 <template>
  <div class="object-select">
    <!-- Пустое состояние -->
    <div v-if="objects.length === 0" class="object-select__empty">
      Нет активных объектов
    </div>

    <!-- Сетка кнопок -->
    <div v-else class="object-select__grid">
      <button
        v-for="obj in objects"
        :key="obj.id"
        :class="[
          'object-select__btn',
          { 'object-select__btn--selected': selectedIds.includes(obj.id) }
        ]"
        :disabled="isDisabled(obj.id)"
        @click="toggle(obj.id)"
      >
        <span class="object-select__btn-text" :title="obj.name">
          {{ obj.name }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ActiveObject } from '~/types/daily-assignments'

const props = withDefaults(defineProps<{
  objects: ActiveObject[]
  selectedIds: number[]
  maxObjects?: number
}>(), {
  maxObjects: 4
})

const emit = defineEmits<{
  'update:selectedIds': [ids: number[]]
}>()

/** Проверка, должна ли кнопка быть заблокирована */
function isDisabled(objectId: number): boolean {
  // Если объект уже выбран — разблокируем для возможности снятия
  if (props.selectedIds.includes(objectId)) return false
  // Если лимит достигнут — блокируем все остальные
  return props.selectedIds.length >= props.maxObjects
}

/** Переключение выбора */
function toggle(objectId: number): void {
  const idx = props.selectedIds.indexOf(objectId)
  let nextIds: number[]

  if (idx === -1) {
    nextIds = [...props.selectedIds, objectId]
  } else {
    nextIds = props.selectedIds.filter(id => id !== objectId)
  }

  emit('update:selectedIds', nextIds)
}
</script>

<style lang="scss" scoped>
.object-select {
  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__btn {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-md);
    padding: 10px 14px;
    color: var(--crm-text-secondary);
    font-size: var(--crm-text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: var(--crm-transition);
    min-width: 0; // важно для flex-обрезки текста
    max-width: 100%;
    -webkit-tap-highlight-color: transparent;

    &:hover:not(:disabled) {
      background: var(--crm-bg-overlay);
      border-color: var(--crm-border-hover);
      color: var(--crm-text-primary);
    }

    &:active:not(:disabled) {
      transform: scale(0.98);
    }

    &--selected {
      background: var(--crm-accent-dim);
      border-color: var(--crm-accent-border);
      color: var(--crm-accent);
      box-shadow: 0 0 0 1px var(--crm-accent-dim);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      background: var(--crm-bg-base);
    }

    &-text {
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none; // чтобы клик всегда проходил на button
    }
  }

  &__empty {
    color: var(--crm-text-muted);
    font-size: var(--crm-text-sm);
    padding: 16px;
    text-align: center;
    border: 1px dashed var(--crm-border);
    border-radius: var(--crm-radius-md);
    background: var(--crm-bg-elevated);
  }
}
</style>