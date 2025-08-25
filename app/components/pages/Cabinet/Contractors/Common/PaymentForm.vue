<template>
  <div class="add-payment-form">
    <h3>Добавить оплату</h3>
    
    <div class="form-group">
      <label>Сумма <span class="required">*</span></label>
      <input 
        v-model.number="newPayment.amount" 
        type="number" 
        step="0.01"
        :class="{ error: formErrors.amount }"
      />
      <div v-if="formErrors.amount" class="error-message">{{ formErrors.amount }}</div>
    </div>

    <div class="form-group">
      <label>Объект (необязательно)</label>
      <select v-model="newPayment.objectId">
        <option value="">Без привязки</option>
        <option v-for="obj in objects" :key="obj.id" :value="obj.id">
          {{ obj.name }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label>Комментарий</label>
      <textarea v-model="newPayment.comment"></textarea>
    </div>

    <div class="form-group">
      <label>Дата оплаты</label>
      <input 
        v-model="newPayment.paymentDate" 
        type="date"
      />
    </div>

    <button @click="submitPayment" class="btn primary">Добавить оплату</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNuxtApp } from '#app'

const props = defineProps({
  objects: {
    type: Array,
    required: true,
    default: () => []
  },
  contractorType: {
    type: String,
    required: true,
    validator: value => ['master', 'worker', 'foreman', 'office'].includes(value)
  },
  contractorId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['add-payment', 'error'])

const newPayment = ref({
  amount: null,
  objectId: null,
  comment: '',
  paymentDate: new Date().toISOString().split('T')[0]
})

const formErrors = ref({})

function validateForm() {
  formErrors.value = {}
  
  if (newPayment.value.amount === null || newPayment.value.amount <= 0) {
    formErrors.value.amount = 'Сумма обязательна и должна быть больше 0'
  }
  
  return Object.keys(formErrors.value).length === 0
}

async function submitPayment() {
  if (!validateForm()) return

  try {
    const { $fetch } = useNuxtApp()
    
    const response = await $fetch('/api/expenses', {
      method: 'POST',
      body: {
        amount: newPayment.value.amount,
        objectId: newPayment.value.objectId,
        comment: newPayment.value.comment,
        paymentDate: newPayment.value.paymentDate,
        contractorType: props.contractorType,
        contractorId: parseInt(props.contractorId),
        operationDate: new Date().toISOString()
      },
      credentials: 'include'
    })

    // Форматируем ответ под ожидаемый формат
    const formattedPayment = {
      id: response.id,
      amount: parseFloat(response.amount),
      objectId: response.objectId,
      comment: response.comment || '',
      paymentDate: response.paymentDate,
      createdAt: response.createdAt
    }

    emit('add-payment', formattedPayment)
    resetForm()
  } catch (error) {
    console.error('Ошибка при добавлении оплаты:', error)
    emit('error', 'Не удалось добавить оплату')
  }
}

function resetForm() {
  newPayment.value = {
    amount: null,
    objectId: null,
    comment: '',
    paymentDate: new Date().toISOString().split('T')[0]
  }
  formErrors.value = {}
}
</script>

<style scoped>
.add-payment-form {
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