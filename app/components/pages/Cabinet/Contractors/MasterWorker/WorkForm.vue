<template>
  <div class="add-work-form">
    <h3>Добавить работу</h3>
    
    <div class="form-group">
      <label>Сумма мастеру <span class="required">*</span></label>
      <input 
        v-model.number="newWork.amount" 
        type="number" 
        step="0.01"
        :class="{ error: formErrors.amount }"
      />
      <div v-if="formErrors.amount" class="error-message">{{ formErrors.amount }}</div>
    </div>

    <div class="form-group">
      <label>Сумма сметы <span class="required">*</span></label>
      <input 
        v-model.number="newWork.clientAmount" 
        type="number" 
        step="0.01"
        :class="{ error: formErrors.clientAmount }"
      />
      <div v-if="formErrors.clientAmount" class="error-message">{{ formErrors.clientAmount }}</div>
    </div>

    <div class="form-group">
      <label>Объект <span class="required">*</span></label>
      <select 
        v-model="newWork.objectId"
        :class="{ error: formErrors.object }"
      >
        <option value="">Выберите объект</option>
        <option v-for="obj in objects" :key="obj.id" :value="obj.id">
          {{ obj.name }}
        </option>
      </select>
      <div v-if="formErrors.object" class="error-message">{{ formErrors.object }}</div>
    </div>

    <div class="form-group">
      <label>Вид работы <span class="required">*</span></label>
      <select 
        v-model="newWork.workType"
        :class="{ error: formErrors.workType }"
      >
        <option value="">Выберите вид работы</option>
        <option v-for="type in workTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
      <div v-if="formErrors.workType" class="error-message">{{ formErrors.workType }}</div>
    </div>

    <div class="form-group">
      <label>Комментарий</label>
      <textarea v-model="newWork.comment"></textarea>
    </div>

    <button @click="submitWork" class="btn primary">Добавить работу</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNuxtApp } from '#app'

const props = defineProps({
  objects: {
    type: Array,
    required: true
  },
  workTypes: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['add-work', 'error'])

const newWork = ref({
  amount: null,
  clientAmount: null,
  objectId: null,
  workType: '',
  comment: ''
})

const formErrors = ref({})

function validateForm() {
  formErrors.value = {}
  
  if (newWork.value.amount === null || newWork.value.amount <= 0) {
    formErrors.value.amount = 'Сумма мастеру обязательна и должна быть больше 0'
  }
  
  if (newWork.value.clientAmount === null || newWork.value.clientAmount <= 0) {
    formErrors.value.clientAmount = 'Сумма сметы обязательна и должна быть больше 0'
  }
  
  if (!newWork.value.objectId) {
    formErrors.value.object = 'Объект обязателен'
  }
  
  if (!newWork.value.workType) {
    formErrors.value.workType = 'Вид работы обязателен'
  }
  
  return Object.keys(formErrors.value).length === 0
}

async function submitWork() {
  if (!validateForm()) return

  try {
    const { $fetch } = useNuxtApp()
    
    const response = await $fetch('/api/works', {
      method: 'POST',
      body: {
        workerAmount: newWork.value.amount,
        customerAmount: newWork.value.clientAmount,
        objectId: newWork.value.objectId,
        workTypes: newWork.value.workType,
        comment: newWork.value.comment,
        contractorType: 'master', // или 'worker' - зависит от контекста
        contractorId: null, // должен передаваться извне
        accepted: false
      },
      credentials: 'include'
    })

    // Форматируем ответ под ожидаемый формат
    const formattedWork = {
      id: response.id,
      amount: parseFloat(response.workerAmount),
      clientAmount: parseFloat(response.customerAmount),
      comment: response.comment || '',
      contractorId: response.contractorId,
      contractorType: response.contractorType,
      workType: response.workTypes,
      objectId: response.objectId,
      paid: response.accepted,
      paymentDate: response.accepted ? response.acceptedDate : null,
      createdAt: response.createdAt
    }

    emit('add-work', formattedWork)
    resetForm()
  } catch (error) {
    console.error('Ошибка при добавлении работы:', error)
    emit('error', 'Не удалось добавить работу')
  }
}

function resetForm() {
  newWork.value = {
    amount: null,
    clientAmount: null,
    objectId: null,
    workType: '',
    comment: ''
  }
  formErrors.value = {}
}
</script>

<style lang="scss" scoped>
// ========================================
// Переменные
// ========================================
$color-primary: #007bff;
$color-success: #27ae60;
$color-danger: #dc3545;
$color-muted: #6c757d;
$color-bg: #f8f9fa;
$color-border: #ced4da;
$color-text: #2c3e50;

$shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);

$border-radius: 8px;
$border-radius-sm: 4px;

$spacing-xs: 0.25rem;
$spacing-sm: 0.5rem;
$spacing-md: 1rem;
$spacing-lg: 1.5rem;

$font-size-sm: 0.85rem;
$font-size-base: 0.95rem;
$font-size-lg: 1rem;

// ========================================
// Миксины
// ========================================
@mixin transition($props...) {
  transition: $props;
}

@mixin input-focus($color) {
  &:focus {
    outline: none;
    border-color: $color;
    box-shadow: 0 0 0 3px rgba($color, 0.15);
  }
}

@mixin button-primary() {
  background: $color-primary;
  color: #fff;
  border: none;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-sm;
  font-weight: 500;
  cursor: pointer;
  @include transition(all 0.2s ease);

  &:hover:not(:disabled) {
    background: #333;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// ========================================
// Основной блок формы
// ========================================
.add-work-form {
  margin-top: $spacing-lg;
  padding: $spacing-lg;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius;
  box-shadow: $shadow-sm;
  max-width: 600px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  h3 {
    margin-top: 0;
    margin-bottom: $spacing-lg;
    color: $color-text;
    font-size: $font-size-lg;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    svg {
      color: #666;
    }
  }
}

// ========================================
// Группы полей
// ========================================
.form-group {
  margin-bottom: $spacing-lg;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-weight: 500;
    color: $color-text;
    font-size: $font-size-base;
  }

  .required {
    color: $color-danger;
    font-weight: 600;
    margin-left: $spacing-xs;
  }
}

// ========================================
// Поля ввода
// ========================================
input,
select,
textarea {
  width: 100%;
  padding: $spacing-sm;
  border: 1px solid $color-border;
  border-radius: $border-radius-sm;
  font-size: $font-size-base;
  @include transition(border-color, box-shadow);

  @include input-focus($color-primary);

  &.error {
    border-color: $color-danger;
    @include input-focus($color-danger);
  }
}

textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

// ========================================
// Сообщения об ошибках
// ========================================
.error-message {
  display: block;
  margin-top: $spacing-xs;
  color: $color-danger;
  font-size: $font-size-sm;
  font-weight: 500;
  line-height: 1.3;
}

// ========================================
// Кнопка
// ========================================
.btn {
  &.primary {
    @include button-primary();
  }
}

// ========================================
// Адаптивность
// ========================================
@media (max-width: 576px) {
  .add-work-form {
    padding: $spacing-md;
    margin-top: $spacing-md;
    border-radius: $border-radius-sm;
  }

  .form-group {
    margin-bottom: $spacing-md;
  }

  input,
  select,
  textarea {
    font-size: $font-size-base;
    padding: $spacing-sm;
  }

  .btn.primary {
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-base;
    width: 100%;
  }
}
</style>