<!-- app\components\pages\cabinet\Contractors\ContractorModal.vue -->
 <!-- Модальное окно контрагента -->
<template>
  <PagesCabinetUiModal 
    :visible="isOpen" 
    :title="isEdit ? `Редактировать ${getTypeLabel(type)}` : `Новый ${getTypeLabel(type).toLowerCase()}`"
    size="md"
    closable
    @close="handleClose"
  >
    <!-- Форма -->
    <PagesCabinetContractorsContractorForm 
      ref="formRef"
      :contractor="contractor"
      :type="type"
      :available-users="availableUsers"
      :show-user-select="showUserSelect"
      @update:form="formData = $event"
      @submit="handleSubmit"
    />

    <!-- Footer с кнопками -->
    <template #footer>
      <button 
        class="crm-btn crm-btn--ghost" 
        @click="handleClose" 
        :disabled="loading"
      >
        Отмена
      </button>
      <button 
        class="crm-btn crm-btn--accent" 
        @click="submitForm" 
        :disabled="loading"
      >
        <Icon v-if="loading" name="mdi:loading" class="spin" size="14" />
        {{ loading ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать') }}
      </button>
    </template>
  </PagesCabinetUiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useContractors } from '~/composables/useContractors';
import type { ContractorType, ContractorDTO, ContractorCreateInput, ContractorUpdateInput } from '~/types/contractors'

const props = defineProps<{
  isOpen: boolean
  type: ContractorType
  contractor?: ContractorDTO | null
  availableUsers?: Array<{ id: number; name: string; login: string }>
  showUserSelect?: boolean
}>()

const emit = defineEmits<{
  'close': []
  'contractor-created': [contractor: ContractorDTO]
  'contractor-updated': [contractor: ContractorDTO]
}>()

const { create, update } = useContractors()

// ✅ Типизировать ref правильно
const formRef = ref<{
  validate: () => boolean
  resetForm: () => void
  handleSubmit: () => void
} | null>(null)

const loading = ref(false)
const formData = ref<ContractorCreateInput | ContractorUpdateInput | null>(null)

// ── Computed ────────────────────────────────────────────────────────
const isEdit = computed(() => !!props.contractor?.id)

function getTypeLabel(type: ContractorType): string {
  const labels: Record<ContractorType, string> = {
    master: 'Мастер',
    worker: 'Рабочий',
    foreman: 'Прораб',
    office: 'Офис'
  }
  return labels[type] || type
}

// ── Обработчики ────────────────────────────────────────────────────
async function submitForm() {
  if (!formRef.value) return

  // Валидация через ref
  if (!formRef.value.validate()) return

  loading.value = true
  try {
    let result: ContractorDTO

    if (isEdit.value && props.contractor) {
      // Редактирование
      result = await update(props.type, props.contractor.id, formData.value as ContractorUpdateInput)
      emit('contractor-updated', result)
    } else {
      // Создание
      result = await create(props.type, formData.value as ContractorCreateInput)
      emit('contractor-created', result)
    }

    handleClose()
  } catch (error: any) {
    console.error('[ContractorModal] Ошибка:', error)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  if (formRef.value) {
    formRef.value.resetForm()
  }
  emit('close')
}

// Сброс формы при открытии
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && formRef.value) {
    formRef.value.resetForm()
  }
})
</script>

<style lang="scss" scoped>
// ── Кнопки ────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-md);
  font-weight: 600;
  cursor: pointer;
  transition: var(--crm-transition);
  border: none;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--ghost {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover:not(:disabled) {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-primary);
    }
  }

  &--accent {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover:not(:disabled) {
      background: rgba(0, 195, 245, 0.25);
    }
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>