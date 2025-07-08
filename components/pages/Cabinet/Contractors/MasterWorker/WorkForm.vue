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

<style scoped>
.add-work-form {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group .required {
  color: #dc3545;
  margin-left: 4px;
}

input, select, textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

input.error, select.error {
  border-color: #dc3545;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}

.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn.primary {
  background: #007bff;
  color: white;
  border: none;
}

.btn.primary:hover {
  background: #0069d9;
}
</style>