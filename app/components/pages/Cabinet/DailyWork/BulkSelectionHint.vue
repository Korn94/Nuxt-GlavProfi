<!-- app\components\pages\cabinet\DailyWork\BulkSelectionHint.vue -->
 <template>
  <Transition name="hint-fade">
    <div v-if="visible" class="bulk-hint">
      <span class="bulk-hint__icon">👆</span>
      <span class="bulk-hint__text">{{ text }}</span>
      <button type="button" class="bulk-hint__close" @click="$emit('close')" aria-label="Закрыть подсказку">
        ✕
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  text?: string
}>()

defineEmits<{
  close: []
}>()
</script>

<style lang="scss" scoped>
.bulk-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: var(--crm-info-dim);
  border: 1px solid var(--crm-info-border, var(--crm-info-dim));
  border-radius: var(--crm-radius-md);
  color: var(--crm-info);
  font-size: var(--crm-text-xs);
  line-height: 1.3;
}

.bulk-hint__icon {
  font-size: 14px;
  flex-shrink: 0;
}

.bulk-hint__text {
  flex: 1;
}

.bulk-hint__close {
  background: transparent;
  border: none;
  color: var(--crm-info);
  opacity: 0.7;
  cursor: pointer;
  padding: 4px;
  font-size: 12px;
  transition: var(--crm-transition);

  &:hover {
    opacity: 1;
  }
}

// Анимация Vue Transition
.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>